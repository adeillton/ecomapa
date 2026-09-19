import type { AttendanceType, CollectionPoint } from './collection-point'
import { isMappablePoint, pointCity } from './collection-point'
import type { SelectedWasteType } from './waste-type'
import { resolveDisposalSearch } from './disposal-object'
import { haversineDistanceKm } from '../lib/distance/haversine'

export interface MapBounds {
  west: number
  south: number
  east: number
  north: number
}

export interface PointQueryOptions {
  search?: string
  attendance?: AttendanceType | 'all'
  bounds?: MapBounds | null
  today?: string
}

export type LocatedPoint = CollectionPoint & { distanceKm: number | null }

export function localDate(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isDestinationAvailable(point: CollectionPoint, today = localDate()): boolean {
  if (point.verification.status !== 'verified') return false
  if (point.attendance.type !== 'temporary_campaign') return true
  return point.attendance.startsAt <= today && point.attendance.endsAt >= today
}

export function isInsideBounds(point: CollectionPoint, bounds: MapBounds): boolean {
  if (!isMappablePoint(point)) return false
  const { latitude, longitude } = point.coordinates
  const longitudeMatches = bounds.west <= bounds.east
    ? longitude >= bounds.west && longitude <= bounds.east
    : longitude >= bounds.west || longitude <= bounds.east
  return latitude >= bounds.south && latitude <= bounds.north && longitudeMatches
}

export function queryPoints(
  points: CollectionPoint[],
  waste: SelectedWasteType,
  location: { latitude: number; longitude: number } | null,
  city = 'all',
  options: PointQueryOptions = {},
): LocatedPoint[] {
  const search = resolveDisposalSearch(options.search ?? '')
  return points
    .filter(point => isDestinationAvailable(point, options.today))
    .filter(point => city === 'all' || pointCity(point) === city)
    .filter(point => waste === 'all' || point.accepts.includes(waste))
    .filter(point => !options.attendance || options.attendance === 'all' || point.attendance.type === options.attendance)
    .filter(point => !options.bounds || isInsideBounds(point, options.bounds))
    .filter(point => search.kind === 'empty'
      || (search.kind === 'object' && point.practicalInfo.acceptedItemIds.includes(search.object.id))
      || (search.kind === 'category' && point.accepts.includes(search.category)))
    .map(point => ({
      ...point,
      distanceKm: location && isMappablePoint(point) ? haversineDistanceKm(location, point.coordinates) : null,
    }))
    // Ordem total: misturar distância com nome produziria comparações intransitivas e ordem instável.
    .sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm || a.name.localeCompare(b.name, 'pt-BR')
      }
      if (a.distanceKm !== null) return -1
      if (b.distanceKm !== null) return 1
      return a.name.localeCompare(b.name, 'pt-BR')
    })
}
