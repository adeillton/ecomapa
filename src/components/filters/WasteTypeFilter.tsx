import { wasteTypes } from '../../data/waste-types'
import type { SelectedWasteType } from '../../domain/waste-type'
export function WasteTypeFilter({ value, onChange }: { value: SelectedWasteType; onChange: (value: SelectedWasteType) => void }) {
  return <div className="waste-filter"><label htmlFor="waste-type">O que você quer descartar?</label>
    <select id="waste-type" value={value} onChange={event => onChange(event.target.value as SelectedWasteType)}>
      <option value="all">Todos os materiais</option>
      {wasteTypes.map(waste => <option key={waste.id} value={waste.id}>{waste.label}</option>)}
    </select>
  </div>
}
