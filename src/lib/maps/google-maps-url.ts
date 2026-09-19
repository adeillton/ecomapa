import { coordinatesSchema } from '../../domain/collection-point'
export function buildGoogleMapsDirectionsUrl(latitude: number, longitude: number): string {
  coordinatesSchema.parse({ latitude, longitude })
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${latitude},${longitude}`)}`
}
