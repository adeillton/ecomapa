import type { WasteType } from '../domain/waste-type'

export const wasteTypes: WasteType[] = [
  { id: 'batteries', label: 'Pilhas e baterias portáteis', shortLabel: 'Pilhas e baterias', description: 'Pilhas e baterias portáteis aceitas pelo ponto.', examples: ['pilha AA', 'pilha AAA', 'bateria portátil'] },
  { id: 'lamps', label: 'Lâmpadas', shortLabel: 'Lâmpadas', description: 'Lâmpadas aceitas pelo ponto conforme a fonte.', examples: ['lâmpada fluorescente', 'lâmpada LED'] },
  { id: 'electronics', label: 'Eletrônicos', shortLabel: 'Eletrônicos', description: 'Equipamentos eletroeletrônicos pós-consumo.', examples: ['celular', 'notebook', 'carregador', 'fone'] },
  { id: 'appliances', label: 'Eletrodomésticos', shortLabel: 'Eletrodomésticos', description: 'Eletrodomésticos quando expressamente aceitos.', examples: ['liquidificador', 'micro-ondas', 'televisão'] },
  { id: 'bulky_items', label: 'Móveis e objetos grandes', shortLabel: 'Móveis e grandes', description: 'Móveis e objetos grandes somente quando as regras do serviço estão documentadas.', examples: ['móvel', 'sofá'] },
]
export const wasteSynonyms = {
  batteries: ['pilha', 'pilhas', 'bateria', 'baterias', 'bateria portátil'],
  lamps: ['lampada', 'lâmpada', 'lampadas', 'lâmpadas', 'fluorescente', 'led'],
  electronics: ['eletronico', 'eletrônico', 'eletronicos', 'eletrônicos', 'celular', 'computador', 'notebook', 'fone', 'carregador'],
  appliances: ['eletrodomestico', 'eletrodoméstico', 'eletrodomesticos', 'eletrodomésticos', 'liquidificador', 'microondas', 'televisao', 'televisão'],
  bulky_items: ['móvel', 'movel', 'móveis', 'moveis', 'objeto grande', 'objetos grandes'],
}
