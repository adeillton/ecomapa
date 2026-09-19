import { describe, expect, it } from 'vitest'
import { resolveDisposalSearch } from './disposal-object'

describe('catálogo local de objetos', () => {
  it.each([
    ['pilhas', 'portable-battery'], ['LÂMPADA', 'lamp'], ['laptop', 'notebook'],
    ['liquidificador', 'blender'], ['carregador', 'charger'], ['móveis', 'generic-furniture'],
  ])('normaliza %s para %s', (term, expected) => {
    const result = resolveDisposalSearch(term)
    expect(result.kind).toBe('object')
    if (result.kind === 'object') expect(result.object.id).toBe(expected)
  })

  it('diferencia termo desconhecido, vazio e categoria ampla', () => {
    expect(resolveDisposalSearch('  ').kind).toBe('empty')
    expect(resolveDisposalSearch('garrafa pet').kind).toBe('unknown')
    expect(resolveDisposalSearch('eletrônicos')).toEqual({ kind: 'category', category: 'electronics' })
  })
})
