import { useEffect, useRef, useState } from 'react'
import { Map, Marker, NavigationControl, LngLatBounds } from 'maplibre-gl'
import { collectionPoints } from '../../data/collection-points'
import '../../lib/maplibre/setup-maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { isMappablePoint, pointCity, type MappableCollectionPoint } from '../../domain/collection-point'
import type { MapBounds } from '../../domain/point-query'
import type { UserLocation } from '../../services/geolocation/types'
import { UserLocationMarker } from './UserLocationMarker'
import { ManualReferenceMarker, type ManualMapReference } from './ManualReferenceMarker'
import { MapPointGroup } from './MapPointGroup'
import { groupMarkers } from '../../lib/maps/group-markers'
import { groupMarkerLabel, groupMarkerText, type PanelArea } from '../../lib/maps/group-panel'
import { transformMapRequest } from '../../lib/maplibre/map-request'

const coverage = collectionPoints.filter(isMappablePoint)
const longitudes = coverage.map(point => point.coordinates.longitude)
const latitudes = coverage.map(point => point.coordinates.latitude)
/** Centro da cobertura publicada; o enquadramento exato vem de fitBounds assim que o mapa existe. */
const REGION_CENTER: [number, number] = [
  (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
  (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
]
const REGION_ZOOM = 7.5

function coverageBounds() {
  const bounds = new LngLatBounds()
  coverage.forEach(point => bounds.extend([point.coordinates.longitude, point.coordinates.latitude]))
  return bounds
}

interface OpenGroup {
  key: string
  ids: string[]
  anchor: { x: number; y: number }
  area: PanelArea
}

/** Faixa do mapa livre do cabeçalho e do painel, que se sobrepõem ao mapa no celular. */
function panelArea(container: HTMLElement | null): PanelArea {
  const box = container?.getBoundingClientRect() ?? new DOMRect(0, 0, 0, 0)
  const overlay = window.matchMedia('(max-width: 767px) and (min-height: 600px)').matches
  const header = document.querySelector('.app-header')?.getBoundingClientRect().bottom ?? box.top
  const panel = document.getElementById('points-panel')?.getBoundingClientRect().top ?? box.bottom
  const top = overlay ? Math.min(Math.max(header - box.top, 0), box.height) : 0
  const bottom = overlay ? Math.max(Math.min(panel - box.top, box.height), top) : box.height
  return { width: box.width, height: box.height, top, bottom }
}

/** Um número no mapa é sempre o identificador do destino; quantidade só aparece escrita no grupo. */
function applyMarkerSelection(root: HTMLElement | null, points: MappableCollectionPoint[], selectedId?: string | null) {
  const selectedName = points.find(point => point.id === selectedId)?.name ?? null
  root?.querySelectorAll<HTMLButtonElement>('.point-marker').forEach(element => {
    if (element.dataset.pointId) {
      const current = element.dataset.pointId === selectedId
      element.setAttribute('aria-pressed', String(current))
      element.style.zIndex = current ? '2' : '1'
      return
    }
    const ids = element.dataset.groupIds?.split(' ') ?? []
    const holdsSelected = !!selectedId && ids.includes(selectedId)
    element.classList.toggle('holds-selected', holdsSelected)
    element.setAttribute('aria-label', groupMarkerLabel(ids.length, holdsSelected ? selectedName : null))
    element.style.zIndex = holdsSelected ? '2' : '1'
  })
}

interface Props {
  points: MappableCollectionPoint[]
  numbers: ReadonlyMap<string, number>
  city: string
  expanded: boolean
  location?: UserLocation | null
  manualReference?: ManualMapReference | null
  recenter?: number
  selectedId?: string | null
  areaSearchAvailable: boolean
  areaLimited: boolean
  onSelect?: (id: string) => void
  onViewportChange: (bounds: MapBounds) => void
  onSearchArea: () => void
  onRetry: () => void
}
export default function EcoMap({ points, numbers, city, expanded, location = null, manualReference = null, recenter = 0, selectedId, areaSearchAvailable, areaLimited, onSelect, onViewportChange, onSearchArea, onRetry }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const [status, setStatus] = useState('loading')
  const [mapInstance, setMapInstance] = useState<Map | null>(null)
  const [openGroup, setOpenGroup] = useState<OpenGroup | null>(null)
  const selectRef = useRef(onSelect)
  const viewportRef = useRef(onViewportChange)
  const selectedRef = useRef(selectedId)
  useEffect(() => { selectedRef.current = selectedId }, [selectedId])
  // Abertura regional: a primeira câmera enquadra toda a cobertura, não uma localidade.
  const regionFitted = useRef(false)
  useEffect(() => {
    if (!mapInstance || regionFitted.current) return
    regionFitted.current = true
    if (selectedId || location || manualReference || areaLimited || city !== 'all') return
    const area = panelArea(container.current)
    const overlay = area.top > 0 || area.bottom < area.height
    mapInstance.fitBounds(coverageBounds(), { maxZoom: 12, duration: 0,
      padding: overlay ? { top: area.top + 24, bottom: area.height - area.bottom + 24, left: 28, right: 72 } : 56 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapInstance])
  const previousCity = useRef(city)
  useEffect(() => {
    if (!mapInstance || previousCity.current === city) return
    previousCity.current = city
    if (areaLimited) return
    const localPoints = collectionPoints.filter(isMappablePoint).filter(point => city === 'all' || pointCity(point) === city)
    if (!localPoints.length) return
    const bounds = new LngLatBounds()
    localPoints.forEach(point => bounds.extend([point.coordinates.longitude, point.coordinates.latitude]))
    const mobile = window.matchMedia('(max-width: 767px)').matches
    const panelTop = document.getElementById('points-panel')?.getBoundingClientRect().top ?? window.innerHeight
    mapInstance.fitBounds(bounds, { maxZoom: 14, padding: mobile ? { top: 160, bottom: window.innerHeight - panelTop + 20, left: 30, right: 70 } : 60, duration: 0 })
  }, [city, mapInstance, areaLimited])
  const previousExpanded = useRef(expanded)
  useEffect(() => {
    if (!mapInstance || previousExpanded.current === expanded) return
    previousExpanded.current = expanded
    if (selectedId || location || !window.matchMedia('(max-width: 767px)').matches) return
    const localPoints = collectionPoints.filter(isMappablePoint).filter(point => city === 'all' || pointCity(point) === city)
    if (!localPoints.length) return
    const bounds = new LngLatBounds()
    localPoints.forEach(point => bounds.extend([point.coordinates.longitude, point.coordinates.latitude]))
    const panelTop = document.getElementById('points-panel')!.getBoundingClientRect().top
    mapInstance.fitBounds(bounds, { maxZoom: 14, duration: 0,
      padding: { top: 165, bottom: window.innerHeight - panelTop + 30, left: 30, right: 85 } })
  }, [expanded, mapInstance, city, selectedId, location])
  useEffect(() => { selectRef.current = onSelect }, [onSelect])
  useEffect(() => { viewportRef.current = onViewportChange }, [onViewportChange])
  useEffect(() => {
    if (!container.current) return
    let map: Map
    let failed = false
    let contextLost = false
    let styleAvailable = false
    let movedByUser = false
    let markControlNavigation: ((event: MouseEvent) => void) | undefined
    const timeout = window.setTimeout(() => setStatus(current => current === 'loading' ? 'slow' : current), 20000)
    try {
      map = new Map({ container: container.current, style: 'https://tiles.openfreemap.org/styles/liberty',
        transformRequest: transformMapRequest,
        center: REGION_CENTER, zoom: REGION_ZOOM, dragRotate: false, pitchWithRotate: false, touchPitch: false,
        locale: { 'NavigationControl.ZoomIn': 'Aumentar zoom', 'NavigationControl.ZoomOut': 'Diminuir zoom', 'AttributionControl.ToggleAttribution': 'Mostrar créditos do mapa' },
      })
      map.touchZoomRotate.disableRotation()
      map.keyboard.disableRotation()
      map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
      // A posição e a câmera não precisam esperar todos os tiles da região.
      map.on('style.load', () => {
        styleAvailable = true
        if (failed && !contextLost) setStatus('partial')
      })
      map.on('load', () => { clearTimeout(timeout); if (!failed && !contextLost) setStatus('ready') })
      map.on('error', () => {
        clearTimeout(timeout)
        failed = true
        setStatus(styleAvailable ? 'partial' : 'error')
      })
      map.on('webglcontextlost', () => { contextLost = true; setStatus('error') })
      map.on('idle', () => { if (!failed && !contextLost && map.isStyleLoaded() && map.areTilesLoaded()) setStatus('ready') })
      map.on('dragstart', () => { movedByUser = true })
      map.on('zoomstart', event => { if (event.originalEvent) movedByUser = true })
      markControlNavigation = (event: MouseEvent) => {
        const target = event.target
        if (target instanceof Element && target.closest('.maplibregl-ctrl-zoom-in, .maplibregl-ctrl-zoom-out')) movedByUser = true
      }
      map.getContainer().addEventListener('click', markControlNavigation, true)
      map.getCanvas().addEventListener('pointerdown', () => { movedByUser = true })
      map.getCanvas().addEventListener('wheel', () => { movedByUser = true }, { passive: true })
      map.getCanvas().addEventListener('keydown', event => { if (event.key.startsWith('Arrow')) movedByUser = true })
      const reportVisibleBounds = () => {
        if (!movedByUser) return
        const bounds = map.getBounds()
        viewportRef.current({ west: bounds.getWest(), south: bounds.getSouth(), east: bounds.getEast(), north: bounds.getNorth() })
        movedByUser = false
      }
      map.on('moveend', reportVisibleBounds)
      map.on('dragend', reportVisibleBounds)
      map.on('zoomend', reportVisibleBounds)
      mapRef.current = map
      // Marcadores HTML e câmera funcionam antes do download do estilo.
      // oxlint-disable-next-line react/set-state-in-effect
      setMapInstance(map)
    } catch {
      clearTimeout(timeout)
      // Falha síncrona de WebGL precisa aparecer no fallback da integração externa.
      // oxlint-disable-next-line react/set-state-in-effect
      setStatus('error')
    }
    return () => {
      clearTimeout(timeout)
      if (markControlNavigation) map?.getContainer().removeEventListener('click', markControlNavigation, true)
      mapRef.current = null
      map?.remove()
    }
  }, [])
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current
    let markers: Marker[] = []
    function rebuild() {
      const focused = document.activeElement as HTMLElement | null
      const focusedId = focused?.dataset.pointId
      const focusedGroup = focused?.dataset.groupKey
      markers.forEach(marker => marker.remove())
      const groups = groupMarkers(points, point => map.project([point.coordinates.longitude, point.coordinates.latitude]))
      markers = groups.map(group => {
        const element = document.createElement('button')
        element.type = 'button'
        element.className = 'point-marker'
        element.dataset.pointCount = String(group.length)
        const longitude = group.reduce((sum, p) => sum + p.coordinates.longitude, 0) / group.length
        const latitude = group.reduce((sum, p) => sum + p.coordinates.latitude, 0) / group.length
        if (group.length === 1) {
          const point = group[0]
          element.textContent = String(numbers.get(point.id) ?? '')
          element.setAttribute('aria-label', `Ver detalhes de ${point.name}, número ${numbers.get(point.id)} do resultado`)
          element.dataset.pointId = point.id
          element.addEventListener('click', () => selectRef.current?.(point.id))
        } else {
          const ids = group.map(point => point.id)
          element.classList.add('point-cluster')
          element.dataset.groupIds = ids.join(' ')
          element.dataset.groupKey = [...ids].sort().join(' ')
          element.textContent = groupMarkerText(group.length)
          element.setAttribute('aria-haspopup', 'dialog')
          element.setAttribute('aria-expanded', 'false')
          // Consultar um grupo não movimenta a câmera: os membros aparecem por nome e número.
          element.addEventListener('click', () => setOpenGroup({
            key: element.dataset.groupKey!, ids, anchor: map.project([longitude, latitude]), area: panelArea(container.current),
          }))
        }
        return new Marker({ element }).setLngLat([longitude, latitude]).addTo(map)
      })
      applyMarkerSelection(container.current, points, selectedRef.current)
      const restore = focusedId ? `[data-point-id="${focusedId}"]` : focusedGroup ? `[data-group-key="${focusedGroup}"]` : null
      if (restore) container.current?.querySelector<HTMLButtonElement>(restore)?.focus({ preventScroll: true })
    }
    function closeOnMove() { setOpenGroup(null) }
    rebuild()
    map.on('moveend', rebuild)
    map.on('resize', rebuild)
    map.on('movestart', closeOnMove)
    map.on('resize', closeOnMove)
    return () => {
      map.off('moveend', rebuild); map.off('resize', rebuild)
      map.off('movestart', closeOnMove); map.off('resize', closeOnMove)
      markers.forEach(marker => marker.remove())
    }
  }, [points, numbers])
  useEffect(() => {
    applyMarkerSelection(container.current, points, selectedId)
  }, [selectedId, points])
  useEffect(() => {
    container.current?.querySelectorAll<HTMLButtonElement>('.point-cluster').forEach(element => {
      element.setAttribute('aria-expanded', String(!!openGroup && element.dataset.groupKey === openGroup.key))
    })
  }, [openGroup, points])
  useEffect(() => {
    const point = collectionPoints.find(p => p.id === selectedId)
    if (!mapInstance || !point || !isMappablePoint(point)) return
    const mobile = window.matchMedia('(max-width: 767px)').matches
    const mapBox = container.current!.getBoundingClientRect()
    const top = document.querySelector('.app-header')?.getBoundingClientRect().bottom ?? 138
    const bottom = document.getElementById('points-panel')?.getBoundingClientRect().top ?? window.innerHeight
    const offsetY = mobile ? (top + bottom) / 2 - mapBox.top - mapBox.height / 2 : 0
    mapInstance.flyTo({ center: [point.coordinates.longitude, point.coordinates.latitude], zoom: 17,
      offset: [0, offsetY],
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500 })
    // Filtrar não deve movimentar a câmera nem restaurar um zoom antigo.
  }, [selectedId, mapInstance])
  useEffect(() => {
    if (!mapInstance || !location || selectedId) return
    const mobile = window.matchMedia('(max-width: 767px)').matches
    const mapBox = container.current!.getBoundingClientRect()
    const top = document.querySelector('.app-header')?.getBoundingClientRect().bottom ?? 138
    const bottom = document.getElementById('points-panel')?.getBoundingClientRect().top ?? window.innerHeight
    const offsetY = mobile ? (top + bottom) / 2 - mapBox.top - mapBox.height / 2 : 0
    mapInstance.flyTo({ center: [location.longitude, location.latitude], zoom: 14,
      offset: [0, offsetY],
      padding: { top: 0, bottom: 0, left: 0, right: 0 },
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 700 })
  }, [mapInstance, location, recenter, expanded, selectedId])
  useEffect(() => {
    if (!mapInstance || !manualReference || selectedId) return
    mapInstance.flyTo({ center: [manualReference.longitude, manualReference.latitude], zoom: 14,
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500 })
  }, [mapInstance, manualReference, expanded, selectedId])
  // Na ordem do resultado: a lista do grupo usa os mesmos números, em sequência crescente.
  // Se um filtro retirar qualquer membro, a lista aberta é descartada em vez de exibir dado obsoleto.
  const groupPoints = openGroup ? points.filter(point => openGroup.ids.includes(point.id)) : []
  const groupIntact = !!openGroup && groupPoints.length === openGroup.ids.length
  function closeGroup() {
    const key = openGroup?.key
    setOpenGroup(null)
    requestAnimationFrame(() => container.current?.querySelector<HTMLButtonElement>(`[data-group-key="${key}"]`)?.focus({ preventScroll: true }))
  }
  function zoomToGroup() {
    if (!mapInstance || groupPoints.length < 2) return
    const bounds = new LngLatBounds()
    groupPoints.forEach(point => bounds.extend([point.coordinates.longitude, point.coordinates.latitude]))
    const area = panelArea(container.current)
    const overlay = window.matchMedia('(max-width: 767px) and (min-height: 600px)').matches
    setOpenGroup(null)
    mapInstance.fitBounds(bounds, { maxZoom: 18, duration: 0,
      padding: overlay ? { top: area.top + 30, bottom: area.height - area.bottom + 30, left: 40, right: 85 } : 90 })
    requestAnimationFrame(() => container.current?.querySelector<HTMLButtonElement>('.point-marker')?.focus({ preventScroll: true }))
  }
  return <section className="map-area" aria-label="Mapa de pontos de descarte" data-map-status={status}>
    <div ref={container} className="map-canvas" />
    <UserLocationMarker map={mapInstance} location={location} />
    <ManualReferenceMarker map={mapInstance} reference={manualReference} />
    {openGroup && groupIntact && <MapPointGroup key={openGroup.key} points={groupPoints} numbers={numbers}
      selectedId={selectedId} anchor={openGroup.anchor} area={openGroup.area} onZoom={zoomToGroup} onClose={closeGroup}
      onSelect={id => { setOpenGroup(null); selectRef.current?.(id) }} />}
    {areaSearchAvailable && <button className="area-search-button" onClick={onSearchArea}>Buscar nesta área</button>}
    {status !== 'ready' && <div className="map-status"><p role="status">{status === 'loading' ? 'Carregando mapa…'
      : status === 'slow' ? 'O mapa está demorando para carregar. Você pode consultar os pontos pela lista enquanto aguarda.'
      : status === 'partial' ? 'Parte do mapa não carregou. A consulta por localização e a lista continuam disponíveis.'
      : 'Não foi possível carregar o mapa agora. Os pontos continuam disponíveis na lista.'}</p>
      {status !== 'loading' && <button onClick={onRetry}>Tentar carregar o mapa</button>}
    </div>}
  </section>
}
