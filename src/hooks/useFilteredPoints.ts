import { useMemo } from 'react'
import { collectionPoints } from '../data/collection-points'
import { queryPoints, type MapBounds } from '../domain/point-query'
import type { AttendanceType } from '../domain/collection-point'
import type { SelectedWasteType } from '../domain/waste-type'

interface QueryState {
  waste: SelectedWasteType
  location: { latitude: number; longitude: number } | null
  city: string
  search: string
  attendance: AttendanceType | 'all'
  bounds: MapBounds | null
  today: string
}

export function useFilteredPoints(state: QueryState) {
  return useMemo(
    () => queryPoints(collectionPoints, state.waste, state.location, state.city, {
      search: state.search, attendance: state.attendance, bounds: state.bounds, today: state.today,
    }),
    [state.waste, state.location, state.city, state.search, state.attendance, state.bounds, state.today],
  )
}
