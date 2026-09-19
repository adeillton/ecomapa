import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, LocateFixed, MapPin, ShieldCheck } from 'lucide-react'
import { BrandMark } from '../components/ui/BrandMark'
import { formatDistance } from '../lib/distance/format-distance'
import { useGeolocation } from '../hooks/useGeolocation'
import { useFilteredPoints } from '../hooks/useFilteredPoints'
import { LocationPermissionDialog } from '../components/location/LocationPermissionDialog'
import { WasteTypeFilter } from '../components/filters/WasteTypeFilter'
import { PointList } from '../components/points/PointList'
import { PointDetails } from '../components/points/PointDetails'
import { EmptyState } from '../components/ui/EmptyState'
import type { SelectedWasteType } from '../domain/waste-type'
import { collectionPoints } from '../data/collection-points'
import { isDestinationAvailable, type MapBounds } from '../domain/point-query'
import { isMappablePoint, pointCity, type AttendanceType } from '../domain/collection-point'
import { pointNumbers } from '../domain/point-numbering'
import { resolveDisposalSearch } from '../domain/disposal-object'
import { MapBoundary } from '../components/map/MapBoundary'
import { ConnectionStatus } from '../components/ui/ConnectionStatus'
import { buildPointLink, pointSlugFromHash } from '../lib/maps/point-link'
import { ObjectSearch } from '../components/filters/ObjectSearch'
import { useCurrentDate } from '../hooks/useCurrentDate'
import './app.css'

// A lista e os controles podem abrir enquanto o módulo WebGL é carregado.
const EcoMap = lazy(() => import('../components/map/EcoMap'))
const cities = [...new Set(collectionPoints.map(pointCity))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
const attendanceLabels: Record<AttendanceType, string> = {
  fixed_dropoff: 'Ponto fixo de entrega', pickup_service: 'Serviço de retirada', temporary_campaign: 'Campanha temporária',
}
function linkedPoint() {
  const slug = pointSlugFromHash(window.location.hash)
  return collectionPoints.find(point => point.slug === slug && isDestinationAvailable(point))
}
function clearPointLink() {
  if (!window.location.hash.startsWith('#ponto=')) return
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}

export default function App() {
  const geo = useGeolocation()
  const today = useCurrentDate()
  const [initialPoint] = useState(linkedPoint)
  const [dialog, setDialog] = useState(!initialPoint)
  const [mapAttempt, setMapAttempt] = useState(0)
  const [recenter, setRecenter] = useState(0)
  const [waste, setWaste] = useState<SelectedWasteType>('all')
  const [city, setCity] = useState(initialPoint ? pointCity(initialPoint) : 'all')
  const [search, setSearch] = useState('')
  const [attendance, setAttendance] = useState<AttendanceType | 'all'>('all')
  const [manualReferenceId, setManualReferenceId] = useState('')
  const [areaBounds, setAreaBounds] = useState<MapBounds | null>(null)
  const [pendingBounds, setPendingBounds] = useState<MapBounds | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(initialPoint?.id ?? null)
  const [expanded, setExpanded] = useState(!!initialPoint)
  const [invalidLink, setInvalidLink] = useState(window.location.hash.startsWith('#ponto=') && !initialPoint)
  // Critério de interface: acima de 1 km, não apresentar uma ordem precisa.
  const approximate = !!geo.location && geo.location.accuracy > 1000
  const manualReferenceCandidate = collectionPoints.find(point => point.id === manualReferenceId)
  const manualReference = manualReferenceCandidate && isMappablePoint(manualReferenceCandidate) ? manualReferenceCandidate : null
  const distanceLocation = manualReference?.coordinates ?? (approximate ? null : geo.location)
  const distanceReference = manualReference ? `da referência ${manualReference.name}` : geo.location && !approximate ? 'da sua localização' : null
  const points = useFilteredPoints({ waste, location: distanceLocation, city, search, attendance, bounds: areaBounds, today })
  const mapPoints = points.filter(isMappablePoint)
  // Numeração única: o mapa mostra só quem tem coordenada, mas o número vem do resultado completo.
  const numbers = useMemo(() => pointNumbers(points), [points])
  const selected = points.find(point => point.id === selectedId)
  const searchResult = resolveDisposalSearch(search)
  const availableAttendance = [...new Set(collectionPoints.filter(point => isDestinationAvailable(point, today)).map(point => point.attendance.type))]
  const fixedReferences = collectionPoints.filter(point => isDestinationAvailable(point, today) && isMappablePoint(point))
  const listRef = useRef<HTMLElement>(null)
  const locationButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function restoreLink() {
      const point = linkedPoint()
      setSelectedId(point?.id ?? null)
      setInvalidLink(window.location.hash.startsWith('#ponto=') && !point)
      if (point) { setCity(pointCity(point)); setWaste('all'); setExpanded(true); setDialog(false) }
    }
    window.addEventListener('popstate', restoreLink)
    window.addEventListener('hashchange', restoreLink)
    return () => { window.removeEventListener('popstate', restoreLink); window.removeEventListener('hashchange', restoreLink) }
  }, [])
  const selectPoint = useCallback((id: string) => {
    const point = collectionPoints.find(item => item.id === id)
    if (!point) return
    setSelectedId(id); setExpanded(true); setInvalidLink(false)
    window.history.pushState(null, '', buildPointLink(window.location.href, point.slug))
  }, [])
  const closeDetails = useCallback(() => {
    const id = selectedId
    setSelectedId(null)
    clearPointLink()
    requestAnimationFrame(() => {
      listRef.current?.querySelector<HTMLButtonElement>(`li[data-point-id="${id}"] button`)?.focus()
    })
  }, [selectedId])
  function closeDialog() {
    if (geo.loading) geo.clear()
    setDialog(false)
    requestAnimationFrame(() => locationButton.current?.focus())
  }
  async function requestLocation() {
    if (await geo.request()) {
      setManualReferenceId('')
      setAreaBounds(null)
      setPendingBounds(null)
      setDialog(false)
      requestAnimationFrame(() => locationButton.current?.focus())
    }
  }
  function locate() {
    setSelectedId(null)
    clearPointLink()
    if (geo.location) setRecenter(n => n + 1)
    else void requestLocation()
  }
  const locationStatus = geo.loading ? 'Obtendo localização…' : geo.error
    || (manualReference ? `Referência manual: ${manualReference.name}. As distâncias são em linha reta a partir deste ponto; sua localização não foi usada.`
      : geo.location ? approximate
      ? `Localização aproximada. Margem informada de ${formatDistance(geo.location.accuracy / 1000)}. O ponto azul pode estar longe de você.`
      : `Localização obtida. Precisão informada de ${formatDistance(geo.location.accuracy / 1000)}. Sua posição não é salva.`
      : 'Localização desativada. Escolha uma referência manual ou a localidade.')

  return <div className="app-shell">
    <a className="skip-link" href="#points-panel" onClick={() => setExpanded(true)}>Ir para a lista de destinos</a>
    <header className="app-header">
      <div className="brand"><span className="brand-symbol"><BrandMark /></span><div><h1>EcoMapa</h1><p className="brand-caption">Descarte no Agreste</p></div></div>
      <div className="search-filters">
        <WasteTypeFilter value={waste} onChange={value => { setWaste(value); setSelectedId(null); clearPointLink() }} />
        <div className="waste-filter city-filter"><label htmlFor="city">Localidade</label><select id="city" value={city} onChange={event => { setCity(event.target.value); setAreaBounds(null); setPendingBounds(null); setSelectedId(null); clearPointLink() }}>
          <option value="all">Todas as localidades</option>{cities.map(name => <option key={name} value={name}>{name}</option>)}
        </select></div>
      </div>
      <button ref={locationButton} className="location-button" onClick={locate} disabled={geo.loading} aria-label={geo.location ? 'Recentralizar na minha localização' : 'Usar minha localização'}>
        <LocateFixed size={20} aria-hidden="true" /><span>{geo.loading ? 'Localizando…' : geo.location ? 'Minha localização' : 'Usar minha localização'}</span>
      </button>
    </header>
    <main className="main-map">
      <MapBoundary><Suspense fallback={<section className="map-area"><p className="map-status" role="status">Carregando mapa…</p></section>}>
        <EcoMap key={mapAttempt} points={mapPoints} numbers={numbers} city={city} expanded={expanded} location={geo.location}
          manualReference={manualReference ? { ...manualReference.coordinates, label: manualReference.name } : null}
          recenter={recenter} selectedId={selectedId} areaLimited={!!areaBounds} onSelect={selectPoint}
          onViewportChange={setPendingBounds} areaSearchAvailable={!!pendingBounds}
          onSearchArea={() => { if (!pendingBounds) return; setCity('all'); setAreaBounds(pendingBounds); setPendingBounds(null); setSelectedId(null); clearPointLink() }}
          onRetry={() => setMapAttempt(value => value + 1)} />
      </Suspense></MapBoundary>
      <aside id="points-panel" ref={listRef} tabIndex={-1} className={`points-panel ${expanded ? 'expanded' : ''}`} aria-label="Consulta de destinos" onKeyDown={event => {
        if (event.key === 'Escape' && !selected) { setExpanded(false); locationButton.current?.focus() }
      }}>
        <button className="sheet-toggle" aria-expanded={expanded} aria-controls="panel-content" onClick={() => { if (selected) closeDetails(); setExpanded(value => !value) }}>
          <span className="sheet-handle" aria-hidden="true" />{expanded ? 'Recolher lista' : 'Ampliar lista'}{expanded ? <ChevronDown size={17} aria-hidden="true" /> : <ChevronUp size={17} aria-hidden="true" />}
        </button>
        <div className="panel-scroll" id="panel-content">
          <ConnectionStatus />
          {invalidLink && <p className="connection-status" role="status">Este link não corresponde a um destino disponível. Consulte a lista.</p>}
          {!selected && <div className="query-tools">
            <ObjectSearch value={search} onChange={value => { setSearch(value); setSelectedId(null); clearPointLink() }} />
            <div className="query-tool-row">
              <div><label htmlFor="attendance-type">Tipo de atendimento</label><select id="attendance-type" value={attendance} onChange={event => { setAttendance(event.target.value as AttendanceType | 'all'); setAreaBounds(null); setPendingBounds(null); setSelectedId(null); clearPointLink() }}>
                <option value="all">Todos os tipos disponíveis</option>
                {availableAttendance.map(type => <option key={type} value={type}>{attendanceLabels[type]}</option>)}
              </select></div>
              <div><label htmlFor="manual-reference">Referência manual</label><select id="manual-reference" value={manualReferenceId} onChange={event => {
                const id = event.target.value
                setManualReferenceId(id); geo.clear(); setAreaBounds(null); setPendingBounds(null); setSelectedId(null); clearPointLink()
                const point = collectionPoints.find(item => item.id === id)
                if (point) setCity(pointCity(point))
              }}>
                <option value="">Nenhuma (usar localidade)</option>
                {fixedReferences.map(point => <option key={point.id} value={point.id}>{point.name}</option>)}
              </select></div>
            </div>
            {areaBounds && <p className="area-filter-status" role="status">Mostrando apenas destinos na área escolhida. <button onClick={() => setAreaBounds(null)}>Remover limite da área</button></p>}
            {searchResult.kind === 'object' && <p className="search-explanation" role="status">{points.length
              ? `Resultados com confirmação específica para ${searchResult.object.label.toLocaleLowerCase('pt-BR')}.`
              : `Ainda não há confirmação específica para ${searchResult.object.label.toLocaleLowerCase('pt-BR')}. Pontos da categoria não são exibidos sem evidência para este objeto.`}</p>}
            {searchResult.kind === 'unknown' && <p className="search-explanation" role="status">Não encontramos esse termo no catálogo local. Tente o nome do objeto ou escolha uma categoria.</p>}
          </div>}
          {!selected && <div className="location-status"><LocateFixed size={17} aria-hidden="true" /><p role="status" aria-live="polite">{locationStatus}</p>
            {geo.error && <button className="retry-button" disabled={geo.loading} onClick={() => void requestLocation()}>Tentar novamente</button>}
            {geo.loading && <button className="retry-button" onClick={geo.clear}>Cancelar localização</button>}
            {(geo.location || manualReference) && <div className="location-actions">
              <button disabled={geo.loading} onClick={() => void requestLocation()}>Atualizar localização</button>
              <button disabled={geo.loading} onClick={() => { geo.clear(); setManualReferenceId('') }}>Usar só o município</button>
            </div>}
            {approximate && <p className="accuracy-help">Não é onde você está? Atualize a localização ou escolha o município. Em computadores, a posição fornecida pelo navegador pode ser imprecisa.</p>}
          </div>}
          {selected ? <PointDetails key={selected.id} point={selected} distanceReference={distanceReference} onClose={closeDetails} /> : <>
            <div className="list-heading"><div><p className="eyebrow"><MapPin size={13} aria-hidden="true" />{city === 'all' ? 'Busca no Agreste' : `Busca em ${city}`}</p><h2>Destinos de descarte</h2></div><span className="count" aria-label={`${points.length} destinos`}>{points.length}</span></div>
            <p className="list-order">{distanceReference ? `Distância em linha reta ${distanceReference}` : approximate ? 'Ordem alfabética. Precisão insuficiente para comparar distâncias.' : 'Em ordem alfabética'}</p>
            {distanceLocation && city !== 'all' && <button className="region-button" onClick={() => setCity('all')}>Comparar em todas as localidades</button>}
            <p className="sr-only" role="status">{points.length} destinos verificados encontrados.</p>
            {points.some(point => point.attendance.type === 'pickup_service') && <p className="service-map-note">Serviços de retirada atendem por endereço e, por isso, aparecem na lista sem marcador artificial no mapa. Seus números não aparecem entre os marcadores.</p>}
            {points.length ? <PointList points={points} numbers={numbers} selectedId={selectedId} distanceReference={distanceReference} onSelect={selectPoint} /> : <EmptyState waste={waste} search={search} areaLimited={!!areaBounds} canExpand={city !== 'all'} onClearArea={() => setAreaBounds(null)} onExpand={() => { setCity('all'); setAreaBounds(null) }} onReset={() => { setWaste('all'); setSearch(''); setAttendance('all'); setAreaBounds(null) }} />}
            <footer className="panel-footer"><ShieldCheck size={19} aria-hidden="true" /><p>Cadastro com verificação documental.<br /><span>Cobertura parcial do Agreste. Confira os materiais e as orientações antes de levar seu descarte.</span></p></footer>
          </>}
        </div>
      </aside>
    </main>
    <LocationPermissionDialog open={dialog} loading={geo.loading} onRequest={() => void requestLocation()} onClose={closeDialog} />
  </div>
}
