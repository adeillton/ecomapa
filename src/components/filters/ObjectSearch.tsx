import { Search, X } from 'lucide-react'
import { disposalObjects } from '../../domain/disposal-object'

export function ObjectSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className="object-search">
    <label htmlFor="object-search">Busque um objeto ou material</label>
    <div className="object-search-field">
      <Search size={17} aria-hidden="true" />
      <input id="object-search" list="object-suggestions" type="search" value={value}
        placeholder="Ex.: pilha, carregador, notebook" autoComplete="off"
        onInput={event => onChange(event.currentTarget.value)} />
      {value && <button type="button" aria-label="Limpar busca por objeto" onClick={() => onChange('')}><X size={16} aria-hidden="true" /></button>}
    </div>
    <datalist id="object-suggestions">{disposalObjects.map(item => <option key={item.id} value={item.aliases[0]}>{item.label}</option>)}</datalist>
  </div>
}
