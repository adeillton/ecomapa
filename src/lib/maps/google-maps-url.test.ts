import { expect, it } from 'vitest'
import { buildGoogleMapsDirectionsUrl } from './google-maps-url'
it('constrói rota com latitude/longitude corretas e omite origem', () => {
  const url = new URL(buildGoogleMapsDirectionsUrl(-8.89, -36.49))
  expect(url.origin + url.pathname).toBe('https://www.google.com/maps/dir/')
  expect(url.searchParams.get('destination')).toBe('-8.89,-36.49')
  expect(url.searchParams.get('api')).toBe('1')
  expect(url.searchParams.has('origin')).toBe(false)
})
