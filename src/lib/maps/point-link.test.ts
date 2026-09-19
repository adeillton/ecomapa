import { expect, it } from 'vitest'
import { buildPointLink, pointSlugFromHash } from './point-link'

it('compartilha apenas o ponto, removendo qualquer query da página', () => {
  const link = buildPointLink('https://exemplo.test/?latitude=-8&longitude=-36#qualquer', 'magalu-bezerros')
  expect(link).toBe('https://exemplo.test/#ponto=magalu-bezerros')
  expect(pointSlugFromHash(new URL(link).hash)).toBe('magalu-bezerros')
})
it.each(['#ponto=%', '#ponto=<script>', '#ponto=../../', '#ponto=', '#points-panel', ''])('ignora hash inválido %s', hash => {
  expect(pointSlugFromHash(hash)).toBeNull()
})
