import { expect, it } from 'vitest'
import { pointNumbers } from './point-numbering'
import { collectionPoints } from '../data/collection-points'
import { queryPoints } from './point-query'
import { isMappablePoint, pointCity } from './collection-point'

const cities = [...new Set(collectionPoints.map(pointCity))]

it('numera sem buracos: serviços de retirada não consomem número', () => {
  const caruaru = queryPoints(collectionPoints, 'all', null, 'Caruaru')
  const numbers = pointNumbers(caruaru)
  // Serviços aparecem na lista, mas não no mapa: dar número a eles abriria buracos entre os marcadores.
  expect(caruaru.filter(point => !isMappablePoint(point)).map(point => numbers.get(point.id))).toEqual([undefined, undefined])
  expect(caruaru.filter(isMappablePoint).map(point => numbers.get(point.id))).toEqual([1, 2, 3, 4])
  expect(numbers.get('ferreira-caruaru')).toBe(3)
})

it('mantém mapa e lista com o mesmo número em toda localidade e material', () => {
  for (const city of ['all', ...cities]) {
    for (const waste of ['all', 'batteries', 'lamps', 'electronics', 'appliances'] as const) {
      const result = queryPoints(collectionPoints, waste, null, city)
      const numbers = pointNumbers(result)
      const mapped = result.filter(isMappablePoint)
      // Uma única regra: o número do mapa é o mesmo que a lista mostra para aquele id.
      expect(mapped.map(point => numbers.get(point.id))).toEqual(mapped.map((_, index) => index + 1))
      expect([...numbers.keys()]).toEqual(mapped.map(point => point.id))
    }
  }
})

it('depende só do resultado atual: nova ordem renumera, consulta repetida não', () => {
  const points = queryPoints(collectionPoints, 'all', null, 'Garanhuns')
  expect([...pointNumbers(points)]).toEqual([...pointNumbers(points)])
  expect(pointNumbers([...points].reverse()).get(points[0].id)).toBe(points.filter(isMappablePoint).length)
  expect(pointNumbers([]).size).toBe(0)
})
