import { expect, it } from 'vitest'
import { groupMarkers } from './group-markers'
it('agrupa alvos próximos, inclusive pontes entre grupos, sem perder pontos', () => {
  const points = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 0 }, { x: 500, y: 0 }]
  const groups = groupMarkers(points, point => point)
  expect(groups.map(group => group.length).sort()).toEqual([1, 3])
  expect(new Set(groups.flat()).size).toBe(4)
})
it('mantém pontos separados quando o zoom abre espaço e aceita lista vazia', () => {
  expect(groupMarkers([{ x: 0, y: 0 }, { x: 60, y: 0 }], point => point)).toHaveLength(2)
  expect(groupMarkers([], () => ({ x: 0, y: 0 }))).toEqual([])
})
it('reúne coordenadas coincidentes num único grupo, sem perder membros', () => {
  // Fixture sintética: coordenadas idênticas não são separáveis por zoom.
  const points = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  const groups = groupMarkers(points, () => ({ x: 512, y: 300 }))
  expect(groups).toHaveLength(1)
  expect(groups[0].map(point => point.id).sort()).toEqual(['a', 'b', 'c'])
})
