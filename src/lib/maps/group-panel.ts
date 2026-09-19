/** Área útil do mapa: `top`/`bottom` excluem cabeçalho e painel sobrepostos. */
export interface PanelArea {
  width: number
  height: number
  top: number
  bottom: number
}

export interface PanelPlacement {
  left: number
  width: number
  maxHeight: number
  top?: number
  bottom?: number
}

const PANEL_WIDTH = 288
const MARKER_GAP = 30
const HEAD_HEIGHT = 44
const MEMBER_HEIGHT = 58

/** Altura que a lista do grupo gostaria de ter: cabeçalho, membros e ação de aproximar. */
export function groupPanelHeight(members: number): number {
  return HEAD_HEIGHT + members * MEMBER_HEIGHT + HEAD_HEIGHT
}

/** Texto visível do marcador de grupo: quantidade explícita, nunca lida como identificador. */
export function groupMarkerText(count: number): string {
  return `${count} pontos`
}

/** Nome acessível equivalente ao texto visível, sinalizando o destino aberto dentro do grupo. */
export function groupMarkerLabel(count: number, selectedName?: string | null): string {
  const base = `Abrir grupo de ${count} pontos sobrepostos`
  return selectedName ? `${base}; inclui o destino selecionado ${selectedName}` : base
}

/**
 * Posiciona a lista do grupo dentro da área útil. Fica junto ao marcador quando o lado
 * escolhido comporta a lista inteira; senão ocupa a faixa livre, que é maior. Em qualquer
 * caso a lista não invade o cabeçalho nem o painel de destinos.
 */
export function placeGroupPanel(
  anchor: { x: number; y: number },
  area: PanelArea,
  desiredHeight = groupPanelHeight(2),
  panelWidth = PANEL_WIDTH,
): PanelPlacement {
  const width = Math.min(panelWidth, Math.max(area.width - 16, 120))
  const half = width / 2
  const left = Math.min(Math.max(anchor.x, half + 8), Math.max(area.width - half - 8, half + 8))
  // O marcador pode estar sob o cabeçalho ou sob o painel: a lista fica na faixa livre mesmo assim.
  const edge = Math.min(anchor.y - MARKER_GAP, area.bottom)
  const start = Math.max(anchor.y + MARKER_GAP, area.top)
  const above = edge - area.top
  const below = area.bottom - start
  const top = Math.min(area.top + 4, area.bottom)
  const fill = Math.max(area.bottom - top - 4, 0)
  const anchored = Math.max(above, below)
  if (anchored >= desiredHeight || anchored >= fill) {
    return above >= below
      ? { left, width, maxHeight: above, bottom: area.height - edge }
      : { left, width, maxHeight: below, top: start }
  }
  return { left, width, maxHeight: fill, top }
}
