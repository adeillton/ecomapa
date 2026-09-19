import type { WasteTypeId } from './waste-type.ts'
import { normalizeText } from '../lib/normalize/normalize-text.ts'

export const disposalObjectIds = [
  'portable-battery', 'lamp', 'notebook', 'blender', 'charger', 'cell-phone',
  'desktop-computer', 'television', 'microwave', 'generic-equipment',
  'generic-appliance', 'generic-furniture', 'sofa',
] as const

export type DisposalObjectId = (typeof disposalObjectIds)[number]

export interface DisposalObject {
  id: DisposalObjectId
  label: string
  category: WasteTypeId
  aliases: string[]
}

export const disposalObjects: DisposalObject[] = [
  { id: 'portable-battery', label: 'Pilha ou bateria portátil', category: 'batteries', aliases: ['pilha', 'pilhas', 'bateria', 'baterias', 'bateria portátil', 'pilha aa', 'pilha aaa'] },
  { id: 'lamp', label: 'Lâmpada', category: 'lamps', aliases: ['lâmpada', 'lâmpadas', 'lampada', 'lampadas', 'lâmpada led', 'lâmpada fluorescente'] },
  { id: 'notebook', label: 'Notebook', category: 'electronics', aliases: ['notebook', 'laptop', 'netbook', 'computador portátil'] },
  { id: 'blender', label: 'Liquidificador', category: 'appliances', aliases: ['liquidificador', 'liquidificadores'] },
  { id: 'charger', label: 'Carregador', category: 'electronics', aliases: ['carregador', 'carregadores', 'fonte de celular'] },
  { id: 'cell-phone', label: 'Celular', category: 'electronics', aliases: ['celular', 'celulares', 'smartphone'] },
  { id: 'desktop-computer', label: 'Computador', category: 'electronics', aliases: ['computador', 'computadores', 'desktop', 'pc'] },
  { id: 'television', label: 'Televisão', category: 'electronics', aliases: ['televisão', 'televisoes', 'televisões', 'tv'] },
  { id: 'microwave', label: 'Micro-ondas', category: 'appliances', aliases: ['microondas', 'micro-ondas'] },
  { id: 'generic-equipment', label: 'Equipamento sem uso', category: 'electronics', aliases: ['equipamento', 'equipamentos'] },
  { id: 'generic-appliance', label: 'Eletrodoméstico', category: 'appliances', aliases: ['eletrodoméstico', 'eletrodomestico', 'eletrodomésticos', 'eletrodomesticos'] },
  { id: 'generic-furniture', label: 'Móvel', category: 'bulky_items', aliases: ['móvel', 'movel', 'móveis', 'moveis', 'mobília', 'mobilia'] },
  { id: 'sofa', label: 'Sofá', category: 'bulky_items', aliases: ['sofá', 'sofa', 'sofás', 'sofas'] },
]

const categoryAliases: Record<WasteTypeId, string[]> = {
  batteries: ['pilhas e baterias', 'baterias portáteis'],
  lamps: ['lâmpadas'],
  electronics: ['eletrônico', 'eletronico', 'eletrônicos', 'eletronicos'],
  appliances: ['eletrodomésticos', 'eletrodomesticos'],
  bulky_items: ['móveis e objetos grandes', 'moveis e objetos grandes', 'objetos grandes'],
}

export type DisposalSearch =
  | { kind: 'empty' }
  | { kind: 'object'; object: DisposalObject }
  | { kind: 'category'; category: WasteTypeId }
  | { kind: 'unknown'; normalizedQuery: string }

export function resolveDisposalSearch(query: string): DisposalSearch {
  const normalizedQuery = normalizeText(query)
  if (!normalizedQuery) return { kind: 'empty' }
  const object = disposalObjects.find(item => item.aliases.some(alias => normalizeText(alias) === normalizedQuery))
  if (object) return { kind: 'object', object }
  const category = (Object.entries(categoryAliases) as [WasteTypeId, string[]][])
    .find(([, aliases]) => aliases.some(alias => normalizeText(alias) === normalizedQuery))?.[0]
  return category ? { kind: 'category', category } : { kind: 'unknown', normalizedQuery }
}

export function disposalObjectLabel(id: string): string {
  return disposalObjects.find(item => item.id === id)?.label ?? id
}
