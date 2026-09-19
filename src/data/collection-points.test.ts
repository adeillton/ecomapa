import { describe, expect, it } from 'vitest'
import { collectionPoints } from './collection-points'
import { sourceRegistry } from './source-registry'
import { collectionPointSchema, validateDataset } from '../domain/collection-point'

describe('dataset público', () => {
  it('tem pelo menos três pontos válidos, com fontes existentes', () => {
    expect(collectionPoints.length).toBeGreaterThanOrEqual(3)
    expect(validateDataset(collectionPoints, sourceRegistry)).toHaveLength(collectionPoints.length)
    collectionPoints.forEach(point => expect(collectionPointSchema.safeParse(point).success).toBe(true))
  })
  it('rejeita coordenada, data, material ou fonte inválidos', () => {
    const point = collectionPoints[0]
    for (const patch of [{ coordinates: { latitude: 91, longitude: 0 } }, { accepts: [] }, { accepts: ['batteries', 'batteries'] }, { slug: '../outro' },
      { verification: { ...point.verification, verifiedAt: '2026-02-30' } }]) {
      expect(collectionPointSchema.safeParse({ ...point, ...patch }).success).toBe(false)
    }
    expect(() => validateDataset(collectionPoints, [])).toThrow('Unknown source')
    expect(() => validateDataset([...collectionPoints, point], sourceRegistry)).toThrow('Duplicate')
  })
  it('não permite endereço artificial em serviço nem ponto fixo sem coordenadas', () => {
    const fixed = collectionPoints.find(point => point.attendance.type === 'fixed_dropoff')!
    const service = collectionPoints.find(point => point.attendance.type === 'pickup_service')!
    expect(collectionPointSchema.safeParse({ ...fixed, coordinates: undefined }).success).toBe(false)
    expect(collectionPointSchema.safeParse({ ...service, address: fixed.address, coordinates: fixed.coordinates }).success).toBe(false)
  })
  it('registra ficha prática e método de verificação em todos os destinos', () => {
    for (const point of collectionPoints) {
      expect(point.practicalInfo.acceptedItemIds.length).toBeGreaterThan(0)
      expect(point.practicalInfo.verificationMethod).toBeTruthy()
    }
  })
})
