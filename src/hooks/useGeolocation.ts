import { useCallback, useEffect, useRef, useState } from 'react'
import { getUserLocation } from '../services/geolocation/get-user-location'
import { geolocationErrorCode, geolocationErrors } from '../services/geolocation/geolocation-errors'
import type { UserLocation } from '../services/geolocation/types'

export function useGeolocation() {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pending = useRef(false)
  const generation = useRef(0)
  useEffect(() => () => { generation.current++; pending.current = false }, [])
  const request = useCallback(async () => {
    if (pending.current) return false
    const current = ++generation.current
    pending.current = true
    setLoading(true)
    setError(null)
    try {
      const next = await getUserLocation()
      if (current !== generation.current) return false
      setLocation(next)
    } catch (error) {
      if (current !== generation.current) return false
      setLocation(null)
      setError(geolocationErrors[geolocationErrorCode(error)])
    } finally {
      if (current === generation.current) { pending.current = false; setLoading(false) }
    }
    return true
  }, [])
  const clear = useCallback(() => {
    generation.current++
    pending.current = false
    setLoading(false)
    setLocation(null)
    setError(null)
  }, [])
  return { location, loading, error, request, clear }
}
