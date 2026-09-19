import { coordinatesSchema } from '../../domain/collection-point'
type Coordinates = { latitude: number; longitude: number }
const radians = (degrees: number) => degrees * Math.PI / 180

export function haversineDistanceKm(from: Coordinates, to: Coordinates): number {
  coordinatesSchema.parse(from)
  coordinatesSchema.parse(to)
  const a = Math.sin(radians(to.latitude - from.latitude) / 2) ** 2
    + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude))
    * Math.sin(radians(to.longitude - from.longitude) / 2) ** 2
  const clamped = Math.min(1, Math.max(0, a))
  return 6371 * 2 * Math.atan2(Math.sqrt(clamped), Math.sqrt(1 - clamped))
}
