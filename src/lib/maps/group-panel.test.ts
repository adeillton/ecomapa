import { expect, it } from 'vitest'
import { groupMarkerLabel, groupMarkerText, groupPanelHeight, placeGroupPanel, type PanelArea } from './group-panel'

it('grupo informa quantidade por escrito, sem se confundir com o número de um ponto', () => {
  expect(groupMarkerText(2)).toBe('2 pontos')
  expect(groupMarkerText(3)).toBe('3 pontos')
  expect(groupMarkerText(3)).not.toBe('3')
  expect(groupMarkerLabel(3)).toBe('Abrir grupo de 3 pontos sobrepostos')
  expect(groupMarkerLabel(2, 'Ferreira Costa, Garanhuns')).toContain('inclui o destino selecionado Ferreira Costa, Garanhuns')
})

/** Área útil e caixa final do painel, para conferir que ele não invade cabeçalho nem painel. */
function box(anchor: { x: number; y: number }, area: PanelArea) {
  const placement = placeGroupPanel(anchor, area)
  const top = placement.top ?? area.height - placement.bottom! - placement.maxHeight
  return { left: placement.left - placement.width / 2, right: placement.left + placement.width / 2, top, bottom: top + placement.maxHeight }
}

const desktop: PanelArea = { width: 1060, height: 806, top: 0, bottom: 806 }
// Celular: cabeçalho sobreposto de 138 px e painel de destinos começando em 520 px.
const mobile: PanelArea = { width: 412, height: 915, top: 138, bottom: 520 }
const shallow: PanelArea = { width: 412, height: 240, top: 20, bottom: 210 }

it('mantém a lista do grupo dentro da faixa livre em desktop, celular e tela baixa', () => {
  const anchors = [{ x: 0, y: 0 }, { x: 40, y: 150 }, { x: 530, y: 400 }, { x: 1059, y: 805 }, { x: 200, y: 145 }, { x: 206, y: 515 }]
  for (const area of [desktop, mobile, shallow]) {
    for (const anchor of anchors) {
      const result = box(anchor, area)
      expect(result.top).toBeGreaterThanOrEqual(area.top)
      expect(result.bottom).toBeLessThanOrEqual(area.bottom + 0.001)
      expect(result.left).toBeGreaterThanOrEqual(0)
      expect(result.right).toBeLessThanOrEqual(area.width)
    }
  }
})

it('abre acima quando há espaço e abaixo quando o marcador fica junto ao topo livre', () => {
  expect(placeGroupPanel({ x: 500, y: 600 }, desktop).bottom).toBe(desktop.height - 570)
  expect(placeGroupPanel({ x: 500, y: 60 }, desktop).top).toBe(90)
  expect(placeGroupPanel({ x: 200, y: 160 }, mobile).top).toBe(190)
})

it('sem espaço confortável dos dois lados, ocupa a faixa livre inteira em vez de espremer a lista', () => {
  const placement = placeGroupPanel({ x: 200, y: 115 }, shallow)
  expect(placement.top).toBe(24)
  expect(placement.maxHeight).toBe(182)
  // Celular baixo: 164 px acima do marcador é pior que os 265 px da faixa livre.
  const iphone: PanelArea = { width: 390, height: 664, top: 138, bottom: 411 }
  expect(placeGroupPanel({ x: 195, y: 332 }, iphone).maxHeight).toBe(265)
})

it('usa a faixa livre quando o lado junto ao marcador não comporta a lista inteira', () => {
  // Celular: 6 membros não cabem nos 262 px abaixo do marcador, mas cabem melhor na faixa toda.
  const celular: PanelArea = { width: 412, height: 915, top: 138, bottom: 587 }
  const seis = placeGroupPanel({ x: 206, y: 295 }, celular, groupPanelHeight(6))
  expect(seis.top).toBe(142)
  expect(seis.maxHeight).toBe(441)
  // Com poucos membros, a lista continua ancorada ao marcador.
  const dois = placeGroupPanel({ x: 206, y: 295 }, celular, groupPanelHeight(2))
  expect(dois.top).toBe(325)
  expect(dois.maxHeight).toBe(262)
})
