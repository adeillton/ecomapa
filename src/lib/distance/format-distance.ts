export function formatDistance(km: number): string {
  if (!Number.isFinite(km) || km < 0) throw new RangeError('Distância inválida')
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 100) return `${km.toFixed(1).replace('.', ',')} km`
  return `${Math.round(km)} km`
}
