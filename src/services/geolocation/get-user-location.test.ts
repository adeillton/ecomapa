import { afterEach, expect, it, vi } from 'vitest'
import { getUserLocation } from './get-user-location'

afterEach(() => vi.unstubAllGlobals())

it('solicita posição nova e alta precisão, sem aceitar cache', async () => {
  const getCurrentPosition = vi.fn((success: PositionCallback) => success({
    coords: { latitude: -8.89, longitude: -36.49, accuracy: 25 }, timestamp: 100,
  } as GeolocationPosition))
  vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
  await expect(getUserLocation()).resolves.toEqual({ latitude: -8.89, longitude: -36.49, accuracy: 25, timestamp: 100 })
  expect(getCurrentPosition.mock.calls[0]).toHaveLength(3)
  expect(getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
})

it.each([
  { latitude: NaN, longitude: -36, accuracy: 10 },
  { latitude: -8, longitude: 181, accuracy: 10 },
  { latitude: -8, longitude: -36, accuracy: -1 },
])('rejeita resposta inválida do dispositivo: %j', async coords => {
  vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: (success: PositionCallback) => success({ coords } as GeolocationPosition) } })
  await expect(getUserLocation()).rejects.toThrow('GEOLOCATION_INVALID')
})
