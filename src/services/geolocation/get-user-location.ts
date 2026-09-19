import type { UserLocation } from './types'
export function getUserLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('GEOLOCATION_UNSUPPORTED')); return }
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude, accuracy } = position.coords
      if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180 || !Number.isFinite(accuracy) || accuracy < 0) {
        reject(new Error('GEOLOCATION_INVALID'))
        return
      }
      resolve({ latitude, longitude, accuracy, timestamp: position.timestamp })
    }, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
  })
}
