import { expect, it } from 'vitest'
import { formatDistance } from './format-distance'
it.each([[0, '0 m'], [0.25, '250 m'], [1, '1,0 km'], [1.44, '1,4 km'], [101, '101 km']] as const)('formata %s km em %s', (km, text) => expect(formatDistance(km)).toBe(text))
it('rejeita distâncias inválidas', () => { for (const km of [-1, NaN, Infinity]) expect(() => formatDistance(km)).toThrow() })
