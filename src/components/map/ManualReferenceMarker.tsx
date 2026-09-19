import { useEffect } from 'react'
import { Map, Marker } from 'maplibre-gl'

export interface ManualMapReference {
  latitude: number
  longitude: number
  label: string
}

export function ManualReferenceMarker({ map, reference }: { map: Map | null; reference: ManualMapReference | null }) {
  useEffect(() => {
    if (!map || !reference) return
    const element = document.createElement('div')
    element.className = 'manual-reference-marker'
    element.setAttribute('role', 'img')
    element.setAttribute('aria-label', `Referência manual: ${reference.label}`)
    element.title = `Referência manual: ${reference.label}`
    const marker = new Marker({ element }).setLngLat([reference.longitude, reference.latitude]).addTo(map)
    return () => { marker.remove() }
  }, [map, reference])
  return null
}
