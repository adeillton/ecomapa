import { useEffect, useRef } from 'react'
import { X, ZoomIn } from 'lucide-react'
import { pointCity, type MappableCollectionPoint } from '../../domain/collection-point'
import { groupPanelHeight, placeGroupPanel, type PanelArea } from '../../lib/maps/group-panel'

interface Props {
  points: MappableCollectionPoint[]
  numbers: ReadonlyMap<string, number>
  selectedId?: string | null
  anchor: { x: number; y: number }
  area: PanelArea
  onSelect: (id: string) => void
  onZoom: () => void
  onClose: () => void
}

/** Lista os pontos sobrepostos de um marcador de grupo; escolher um membro não exige aproximar. */
export function MapPointGroup({ points, numbers, selectedId, anchor, area, onSelect, onZoom, onClose }: Props) {
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    panel.current?.querySelector<HTMLButtonElement>('.group-member')?.focus({ preventScroll: true })
  }, [])
  const placement = placeGroupPanel(anchor, area, groupPanelHeight(points.length))
  return <div ref={panel} className="point-group-panel" role="dialog" aria-labelledby="point-group-title"
    style={{ left: placement.left, top: placement.top, bottom: placement.bottom, width: placement.width, maxHeight: placement.maxHeight }}
    onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); onClose() } }}>
    <div className="point-group-head">
      <h2 id="point-group-title">{points.length} pontos neste local</h2>
      <button type="button" className="point-group-close" aria-label="Fechar lista do grupo" onClick={onClose}><X size={18} aria-hidden="true" /></button>
    </div>
    <ul className="point-group-list">
      {points.map(point => <li key={point.id}>
        <button type="button" className="group-member" data-point-id={point.id} aria-pressed={selectedId === point.id}
          aria-label={`Ver detalhes de ${point.name}, número ${numbers.get(point.id)} do resultado`} onClick={() => onSelect(point.id)}>
          <span className="point-number" aria-hidden="true">{numbers.get(point.id)}</span>
          <span className="group-member-text"><strong>{point.name}</strong>
            <span>{[point.address.district, pointCity(point)].filter(Boolean).join(' · ')}</span></span>
        </button>
      </li>)}
    </ul>
    <button type="button" className="point-group-zoom" onClick={onZoom}><ZoomIn size={16} aria-hidden="true" />Aproximar neste grupo</button>
  </div>
}
