export const wasteTypeIds = ['batteries', 'lamps', 'electronics', 'appliances', 'bulky_items'] as const
export type WasteTypeId = (typeof wasteTypeIds)[number]
export type SelectedWasteType = WasteTypeId | 'all'
export interface WasteType {
  id: WasteTypeId
  label: string
  shortLabel: string
  description: string
  examples: string[]
}
