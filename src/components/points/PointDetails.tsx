import { useEffect, useRef } from 'react'
import { ArrowLeft, CircleCheck, ExternalLink, MapPin, Navigation } from 'lucide-react'
import type { LocatedPoint } from '../../domain/point-query'
import { sourceRegistry } from '../../data/source-registry'
import { wasteTypes } from '../../data/waste-types'
import { formatDistance } from '../../lib/distance/format-distance'
import { buildGoogleMapsDirectionsUrl } from '../../lib/maps/google-maps-url'
import { buildPointLink } from '../../lib/maps/point-link'
import { disposalObjectLabel } from '../../domain/disposal-object'
import { isMappablePoint } from '../../domain/collection-point'
import { CopyButton } from '../ui/CopyButton'
import { DisposalGuide } from './DisposalGuide'

const attendanceLabel = { fixed_dropoff: 'Ponto fixo de entrega', pickup_service: 'Serviço de retirada', temporary_campaign: 'Campanha temporária' } as const
const verificationMethodLabel = {
  official_online_registry: 'Cadastro oficial on-line',
  official_service_portal: 'Portal oficial do serviço',
  documentary_cross_check: 'Conferência documental de fontes',
  direct_confirmation: 'Confirmação direta',
} as const

export function PointDetails({ point, distanceReference, onClose }: { point: LocatedPoint; distanceReference?: string | null; onClose: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [point.id])
  return <section className="point-details" aria-labelledby="point-title" onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); onClose() } }}>
    <button className="back-button" onClick={onClose}><ArrowLeft size={18} aria-hidden="true" />Voltar aos destinos</button>
    <span className="verified"><CircleCheck size={16} aria-hidden="true" />Verificação documental</span>
    <span className="attendance-detail">{attendanceLabel[point.attendance.type]}</span>
    <h2 id="point-title" ref={heading} tabIndex={-1}>{point.name}</h2>
    {point.distanceKm !== null && <p className="distance">{formatDistance(point.distanceKm)} <span>em linha reta {distanceReference ?? ''}</span></p>}
    <h3>Itens confirmados pela fonte</h3>
    <ul className="accepted-materials">{point.practicalInfo.acceptedItemIds.map(id => <li key={id}>{disposalObjectLabel(id)}</li>)}</ul>
    <h3>Categorias cadastradas</h3>
    <ul className="accepted-materials">{point.accepts.map(id => <li key={id}>{wasteTypes.find(w => w.id === id)?.label}</li>)}</ul>
    {point.verification.notes && <p className="material-note">{point.verification.notes}</p>}
    {point.address && <p className="point-address"><MapPin size={20} aria-hidden="true" />{point.address.formatted}</p>}
    {point.attendance.type === 'pickup_service' && <div className="service-area"><h3>Área atendida</h3><p>{point.attendance.serviceArea.description}</p><p>{point.attendance.channelInstructions}</p></div>}
    {point.attendance.type === 'temporary_campaign' && <div className="service-area"><h3>Período da campanha</h3><p><time dateTime={point.attendance.startsAt}>{point.attendance.startsAt.split('-').reverse().join('/')}</time> a <time dateTime={point.attendance.endsAt}>{point.attendance.endsAt.split('-').reverse().join('/')}</time>.</p></div>}
    <h3>Antes de sair</h3>
    <dl className="practical-grid">
      <div><dt>Itens recusados</dt><dd>{point.practicalInfo.refusedItems?.join(', ') ?? 'Não informados pela fonte.'}</dd></div>
      <div><dt>Limite de tamanho</dt><dd>{point.practicalInfo.sizeLimit ?? 'Não informado pela fonte.'}</dd></div>
      <div><dt>Limite de quantidade</dt><dd>{point.practicalInfo.quantityLimit ?? 'Não informado pela fonte.'}</dd></div>
      <div><dt>Acesso ou preparo</dt><dd>{point.practicalInfo.accessInstructions ?? 'Local do coletor e instruções não informados pela fonte.'}</dd></div>
      <div><dt>Horário de recebimento</dt><dd>{point.practicalInfo.receivingHours ?? 'Não informado pela fonte; não confundir com horário comercial.'}</dd></div>
      <div><dt>Agendamento</dt><dd>{point.practicalInfo.appointment === 'required' ? 'Necessário.' : point.practicalInfo.appointment === 'not_required' ? 'Dispensado segundo a fonte.' : 'Não informado pela fonte.'}</dd></div>
      <div><dt>Custo</dt><dd>{point.practicalInfo.cost ? `${point.practicalInfo.cost.kind === 'free' ? 'Gratuito' : point.practicalInfo.cost.kind === 'paid' ? 'Pago' : 'Condicional'}${point.practicalInfo.cost.note ? ` — ${point.practicalInfo.cost.note}` : ''}.` : 'Não informado pela fonte.'}</dd></div>
    </dl>
    <div className="verification-info"><h3>Última verificação</h3><time dateTime={point.verification.verifiedAt}>{point.verification.verifiedAt.split('-').reverse().join('/')}</time>
      <h3>Método</h3><p>{verificationMethodLabel[point.practicalInfo.verificationMethod]}</p>
      <h3>Fonte da informação</h3>
      {point.verification.sources.map(id => {
        const source = sourceRegistry.find(s => s.id === id)!
        return <p key={id}><a tabIndex={0} href={source.url} target="_blank" rel="noopener noreferrer">{source.name}<ExternalLink size={14} aria-hidden="true" /><span className="sr-only"> (abre em nova aba)</span></a></p>
      })}
    </div>
    {point.openingHoursNote && <p>Horário: {point.openingHoursNote}</p>}
    {point.contact?.phone && <p>Telefone: {point.contact.phone}</p>}
    {isMappablePoint(point) && <a tabIndex={0} className="primary route-button" href={buildGoogleMapsDirectionsUrl(point.coordinates.latitude, point.coordinates.longitude)} target="_blank" rel="noopener noreferrer"><Navigation size={18} aria-hidden="true" />Como chegar<span className="sr-only"> (Google Maps, abre em nova aba)</span></a>}
    {point.attendance.type === 'pickup_service' && <a tabIndex={0} className="primary route-button" href={point.attendance.actionUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={18} aria-hidden="true" />Abrir canal oficial<span className="sr-only"> (abre em nova aba)</span></a>}
    <p className="disclaimer">Os materiais aceitos podem mudar. Consulte a fonte ou o estabelecimento em caso de dúvida.</p>
    {!point.practicalInfo.receivingHours && point.attendance.type !== 'pickup_service' && <p className="disclaimer">Horários de recebimento não confirmados. Consulte o estabelecimento antes de sair.</p>}
    <div className="point-actions">
      {point.address && <CopyButton label="Copiar endereço" text={point.address.formatted} />}
      <CopyButton label="Copiar link do ponto" text={buildPointLink(window.location.href, point.slug)} />
    </div>
    <DisposalGuide accepts={point.accepts} />
  </section>
}
