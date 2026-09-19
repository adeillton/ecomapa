/** Agrupa alvos que se sobrepõem na tela, sem modificar coordenadas do cadastro. */
export function groupMarkers<T>(items: T[], project: (item: T) => { x: number; y: number }, separation = 56): T[][] {
  const groups: { items: T[]; positions: { x: number; y: number }[] }[] = []
  for (const item of items) {
    const position = project(item)
    const nearby = groups.filter(group => group.positions.some(p => Math.abs(p.x - position.x) < separation && Math.abs(p.y - position.y) < separation))
    const merged = { items: [item, ...nearby.flatMap(group => group.items)], positions: [position, ...nearby.flatMap(group => group.positions)] }
    for (const group of nearby) groups.splice(groups.indexOf(group), 1)
    groups.push(merged)
  }
  return groups.map(group => group.items)
}
