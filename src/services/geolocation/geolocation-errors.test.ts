import { expect, it } from 'vitest'
import { geolocationErrorCode } from './geolocation-errors'
it('distingue negação, indisponibilidade, timeout, ausência e erro desconhecido', () => {
  expect(geolocationErrorCode({ code: 1 })).toBe('PERMISSION_DENIED')
  expect(geolocationErrorCode({ code: 2 })).toBe('POSITION_UNAVAILABLE')
  expect(geolocationErrorCode({ code: 3 })).toBe('TIMEOUT')
  expect(geolocationErrorCode(new Error('GEOLOCATION_UNSUPPORTED'))).toBe('UNSUPPORTED')
  expect(geolocationErrorCode(null)).toBe('UNKNOWN')
})
