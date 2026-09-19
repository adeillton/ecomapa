import { expect, it } from 'vitest'
import { haversineDistanceKm } from './haversine'
const a = { latitude: 0, longitude: 0 }
const b = { latitude: 0, longitude: 1 }
it('mesmo ponto tem distância zero', () => expect(haversineDistanceKm(a, a)).toBe(0))
it('um grau no equador equivale a aproximadamente 111,195 km', () => expect(haversineDistanceKm(a, b)).toBeCloseTo(111.195, 2))
it('é simétrica', () => expect(haversineDistanceKm(a, b)).toBe(haversineDistanceKm(b, a)))
it('é finita inclusive em antípodas e polos', () => {
  for (const p of [{ latitude: 0, longitude: 180 }, { latitude: 90, longitude: 0 }, { latitude: -90, longitude: -180 }]) {
    const d = haversineDistanceKm(a, p)
    expect(Number.isFinite(d)).toBe(true)
    expect(d).toBeGreaterThanOrEqual(0)
    expect(d).toBeLessThanOrEqual(Math.PI * 6371)
  }
})
it('rejeita coordenadas inválidas', () => {
  expect(() => haversineDistanceKm(a, { latitude: 91, longitude: 0 })).toThrow()
  expect(() => haversineDistanceKm(a, { latitude: NaN, longitude: 0 })).toThrow()
})
