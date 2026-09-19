import { ChevronRight } from 'lucide-react'
import { formatDistance } from '../../lib/distance/format-distance'
import { wasteTypes } from '../../data/waste-types'
import type { LocatedPoint } from '../../domain/point-query'
import { disposalObjectLabel } from '../../domain/disposal-object'
import { pointCity } from '../../domain/collection-point'

const attendanceLabel = { fixed_dropoff: 'Ponto fixo', pickup_service: 'Retirada', temporary_campaign: 'Campanha' } as const

export function PointList({ points, numbers, selectedId, distanceReference, onSelect }: { points: LocatedPoint[]; numbers: ReadonlyMap<string, number>; selectedId?: string | null; distanceReference?: string | null; onSelect?: (id: string) => void }) {
  return <ol className="point-list" aria-label="Destinos de descarte">
    {points.map(point => <li key={point.id} data-point-id={point.id} data-distance={point.distanceKm ?? undefined}>
      <button className="point-card" aria-label={`Ver detalhes de ${point.name}`} aria-pressed={selectedId === point.id} onClick={() => onSelect?.(point.id)}>
        {numbers.has(point.id) && <span className="point-number" aria-hidden="true">{numbers.get(point.id)}</span>}
        <span className="point-summary"><span className="attendance-badge">{attendanceLabel[point.attendance.type]}</span><strong>{point.name}</strong><span className="point-city">{[point.address?.district, pointCity(point)].filter(Boolean).join(' · ')}</span>
          {point.address && <span className="point-street">{point.address.street}{point.address.number ? `, ${point.address.number}` : ''}</span>}
          {point.attendance.type === 'pickup_service' && <span className="point-street">{point.attendance.serviceArea.description}</span>}
          <span className="materials">{point.accepts.map(id => wasteTypes.find(w => w.id === id)?.shortLabel).join(' · ')}</span>
          <span className="material-scope">Confirmado: {point.practicalInfo.acceptedItemIds.map(disposalObjectLabel).join(', ')}.</span>
          {point.distanceKm !== null && <span className="distance">{formatDistance(point.distanceKm)} <span>em linha reta {distanceReference ?? ''}</span></span>}
          <span className="details-link">Ver detalhes <ChevronRight size={15} aria-hidden="true" /></span>
        </span>
      </button>
    </li>)}
  </ol>
}
