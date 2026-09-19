import { MapPinOff } from 'lucide-react'
import { wasteTypes } from '../../data/waste-types'
import type { SelectedWasteType } from '../../domain/waste-type'
export function EmptyState({ waste, search = '', areaLimited, canExpand, onClearArea, onExpand, onReset }: { waste: SelectedWasteType; search?: string; areaLimited: boolean; canExpand: boolean; onClearArea: () => void; onExpand: () => void; onReset: () => void }) {
  const label = wasteTypes.find(w => w.id === waste)?.label.toLocaleLowerCase('pt-BR')
  return <div className="empty-state"><MapPinOff size={30} aria-hidden="true" /><h3>Ainda não há destinos por aqui</h3>
    <p>Nenhum destino verificado{search.trim() ? ` para “${search.trim()}”` : label ? ` para ${label}` : ''} foi encontrado nos filtros atuais.</p>
    {areaLimited && <button className="primary" onClick={onClearArea}>Buscar além desta área</button>}
    {canExpand && <button className="primary" onClick={onExpand}>Buscar em outras localidades</button>}
    <button onClick={onReset}>Limpar busca e filtros</button>
  </div>
}
