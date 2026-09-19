import { isMappablePoint, type CollectionPoint } from './collection-point.ts'

/**
 * Regra única de identificação: numera, na ordem do resultado atual, só os destinos
 * que podem aparecer no mapa. Mapa e lista leem o mesmo número pelo id, sem buracos
 * causados por serviços de retirada — que a lista identifica pelo tipo de atendimento.
 */
export function pointNumbers(points: CollectionPoint[]): ReadonlyMap<string, number> {
  const numbers = new Map<string, number>()
  for (const point of points) {
    if (isMappablePoint(point)) numbers.set(point.id, numbers.size + 1)
  }
  return numbers
}
