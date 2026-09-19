import type { PointSource } from '../domain/verification.ts'

export const sourceRegistry: PointSource[] = [{
  id: 'recicla-pilhas', name: 'Ambipar Environment, Recicla Pilhas',
  url: 'https://sistema.reciclelog.com.br/info/green?search_state=PE&search_city=GARANHUNS',
  kind: 'reverse_logistics_operator', checkedAt: '2026-09-14',
}, {
  id: 'reciclus', name: 'Reciclus, pontos de entrega de lâmpadas',
  url: 'https://reciclus.org.br/lista-pontos-entrega/',
  kind: 'reverse_logistics_operator', checkedAt: '2026-09-15',
}, {
  id: 'abree', name: 'ABREE, pontos de recebimento',
  url: 'https://abree.org.br/pontos-de-recebimento',
  kind: 'reverse_logistics_operator', checkedAt: '2026-09-15',
}, {
  id: 'assai', name: 'Assaí Atacadista, páginas oficiais das lojas',
  url: 'https://www.assai.com.br/loja/assai-garanhuns',
  kind: 'official_business', checkedAt: '2026-09-18',
}, {
  id: 'sesc-pe', name: 'Sesc Pernambuco, unidades',
  url: 'https://www.sescpe.org.br/unidades/',
  kind: 'official_business', checkedAt: '2026-09-18',
}, ...['Caruaru', 'Belo Jardim', 'Gravatá', 'Arcoverde', 'Panelas'].map(city => ({
  id: `recicla-${city}`, name: `Recicla Pilhas, ${city}`,
  url: `https://sistema.reciclelog.com.br/info/green?search_state=PE&search_city=${encodeURIComponent(city.toUpperCase())}`,
  kind: 'reverse_logistics_operator' as const, checkedAt: '2026-09-15',
})), {
  id: 'caruaru-services', name: 'Prefeitura de Caruaru, Portal do Cidadão',
  url: 'https://servicos.caruaru.pe.gov.br/portal/',
  kind: 'government', checkedAt: '2026-09-17',
}]
