import { expect, it } from 'vitest'
import { collectionPoints } from '../data/collection-points'
import { isDestinationAvailable, isInsideBounds, queryPoints } from './point-query'
import type { CollectionPoint } from './collection-point'

// Variações sintéticas isoladas de teste: nunca importadas pelo aplicativo.
const fixtures: CollectionPoint[] = collectionPoints.slice(0, 3).map(p => ({ ...p, accepts: ['batteries'] }))
fixtures[1] = { ...fixtures[1], accepts: ['lamps'] }
it('filtra todos, pilhas, lâmpadas e categoria sem resultados', () => {
  expect(queryPoints(fixtures, 'all', null)).toHaveLength(3)
  expect(queryPoints(fixtures, 'batteries', null)).toHaveLength(2)
  expect(queryPoints(fixtures, 'lamps', null).map(p => p.id)).toEqual([fixtures[1].id])
  expect(queryPoints(fixtures, 'electronics', null)).toEqual([])
})
it('exclui pontos sem verificação e temporariamente indisponíveis', () => {
  for (const status of ['needs_review', 'temporarily_unavailable'] as const) {
    expect(queryPoints([{ ...fixtures[0], verification: { ...fixtures[0].verification, status } }], 'all', null)).toEqual([])
  }
})
it('ordena alfabeticamente sem inventar distância e sem alterar a entrada', () => {
  const input = [...fixtures].reverse()
  const before = JSON.stringify(input)
  const result = queryPoints(input, 'all', null)
  expect(result.map(p => p.name)).toEqual([...fixtures.map(p => p.name)].sort((a,b) => a.localeCompare(b, 'pt-BR')))
  expect(result.every(p => p.distanceKm === null)).toBe(true)
  expect(JSON.stringify(input)).toBe(before)
})
it('ordena por distância quando existe localização', () => {
  const result = queryPoints(fixtures, 'all', fixtures[1].coordinates!)
  expect(result[0].id).toBe(fixtures[1].id)
  expect(result[0].distanceKm).toBe(0)
  expect(result[1].distanceKm).toBeLessThanOrEqual(result[2].distanceKm!)
})
it('ordena por distância e deixa os serviços sem distância no fim, em ordem estável', () => {
  const origem = { latitude: -8.8865202, longitude: -36.4865311 }
  const result = queryPoints(collectionPoints, 'all', origem, 'all')
  const comDistancia = result.filter(point => point.distanceKm !== null)
  const semDistancia = result.filter(point => point.distanceKm === null)
  // Comparar distância contra nome produzia ordem intransitiva: serviços cortavam a sequência por proximidade.
  expect(result.slice(0, comDistancia.length)).toEqual(comDistancia)
  expect(comDistancia.map(point => point.distanceKm)).toEqual([...comDistancia.map(point => point.distanceKm!)].sort((a, b) => a - b))
  expect(semDistancia.map(point => point.name)).toEqual([...semDistancia.map(point => point.name)].sort((a, b) => a.localeCompare(b, 'pt-BR')))
  expect(JSON.stringify(result)).toBe(JSON.stringify(queryPoints(collectionPoints, 'all', origem, 'all')))
})

it('combina município e material sem incluir pontos de outras cidades', () => {
  expect(queryPoints(collectionPoints, 'all', null, 'Garanhuns')).toHaveLength(6)
  expect(queryPoints(collectionPoints, 'lamps', null, 'Gravatá')).toEqual([])
  expect(queryPoints(collectionPoints, 'electronics', null, 'Bezerros').map(p => p.id)).toEqual(['magalu-bezerros'])
  expect(queryPoints(collectionPoints, 'all', null)).toHaveLength(17)
})

it('busca objeto somente quando a evidência confirma a granularidade', () => {
  expect(queryPoints(collectionPoints, 'all', null, 'all', { search: 'notebook' }).map(point => point.id)).toEqual([
    'bravil-garanhuns', 'ferreira-caruaru', 'ferreira-costa-garanhuns', 'magalu-bezerros',
  ])
  expect(queryPoints(collectionPoints, 'all', null, 'all', { search: 'liquidificador' })).toHaveLength(4)
  expect(queryPoints(collectionPoints, 'all', null, 'all', { search: 'carregador' })).toEqual([])
  expect(queryPoints(collectionPoints, 'all', null, 'all', { search: 'eletrodoméstico' }).map(point => point.id)).toEqual([
    'cata-treco-caruaru', 'coleta-seletiva-caruaru',
  ])
})

it('diferencia pontos fixos, serviços e área atendida', () => {
  expect(queryPoints(collectionPoints, 'all', null, 'all', { attendance: 'fixed_dropoff' })).toHaveLength(15)
  const services = queryPoints(collectionPoints, 'all', null, 'Caruaru', { attendance: 'pickup_service' })
  expect(services).toHaveLength(2)
  expect(services.every(point => point.attendance.type === 'pickup_service' && point.attendance.serviceArea.city === 'Caruaru')).toBe(true)
  expect(services.every(point => point.distanceKm === null)).toBe(true)
})

it('inclui apenas campanhas ativas e reage à mudança da data', () => {
  const base = collectionPoints[0]
  const campaign: CollectionPoint = { ...base, id: 'campaign', slug: 'campaign', attendance: { type: 'temporary_campaign', startsAt: '2026-09-18', endsAt: '2026-09-20' } }
  expect(isDestinationAvailable(campaign, '2026-09-17')).toBe(false)
  expect(isDestinationAvailable(campaign, '2026-09-18')).toBe(true)
  expect(isDestinationAvailable(campaign, '2026-09-20')).toBe(true)
  expect(isDestinationAvailable(campaign, '2026-09-21')).toBe(false)
  expect(queryPoints([campaign], 'all', null, 'all', { today: '2026-09-21' })).toEqual([])
})

it('limita pontos à área visível sem criar marcador para serviço', () => {
  const point = collectionPoints[0]
  const bounds = { west: point.coordinates!.longitude - 0.00001, east: point.coordinates!.longitude + 0.00001, south: point.coordinates!.latitude - 0.00001, north: point.coordinates!.latitude + 0.00001 }
  expect(isInsideBounds(point, bounds)).toBe(true)
  expect(queryPoints(collectionPoints, 'all', null, 'all', { bounds }).map(item => item.id)).toEqual([point.id])
})
