import { useEffect } from 'react'
import { Map, Marker } from 'maplibre-gl'
import type { UserLocation } from '../../services/geolocation/types'

const SOURCE_ID = 'user-accuracy'
const LAYER_ID = 'user-accuracy-circle'

// Conversão padrão de metros para pixels na projeção Web Mercator, ajustada pela latitude.
function metersPerPixel(latitude: number, zoom: number) {
  return (78271.51696 * Math.cos((latitude * Math.PI) / 180)) / Math.pow(2, zoom)
}

export function UserLocationMarker({ map, location }: { map: Map | null; location: UserLocation | null }) {
  useEffect(() => {
    if (!map || !location) return
    const element = document.createElement('div')
    element.className = 'user-marker'
    element.setAttribute('role', 'img')
    element.setAttribute('aria-label', 'Sua localização')
    element.title = `Posição informada pelo dispositivo. Precisão de ${Math.round(location.accuracy)} m.`
    const marker = new Marker({ element }).setLngLat([location.longitude, location.latitude]).addTo(map)

    const addAccuracy = () => {
      if (map.getSource(SOURCE_ID)) return
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'Point', coordinates: [location.longitude, location.latitude] }, properties: {} },
      })
      map.addLayer({
        id: LAYER_ID, type: 'circle', source: SOURCE_ID,
        paint: { 'circle-color': '#176bab', 'circle-opacity': 0.12, 'circle-stroke-color': '#176bab', 'circle-stroke-width': 1, 'circle-stroke-opacity': 0.4, 'circle-radius': 0 },
      })
      updateRadius()
    }
    const updateRadius = () => {
      if (!map.getLayer(LAYER_ID)) return
      const radius = location.accuracy / metersPerPixel(location.latitude, map.getZoom())
      map.setPaintProperty(LAYER_ID, 'circle-radius', Math.max(radius, 6))
    }
    // O estilo pode existir enquanto fontes/tiles ainda estão carregando.
    if (map.getStyle()) addAccuracy()
    map.on('style.load', addAccuracy)
    map.on('zoom', updateRadius)

    return () => {
      map.off('zoom', updateRadius)
      map.off('style.load', addAccuracy)
      marker.remove()
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
    }
  }, [map, location])
  return null
}
