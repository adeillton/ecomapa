import { addProtocol, setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { loadMapResource, MAP_PROTOCOL } from './map-request'
setWorkerUrl(workerUrl)
addProtocol(MAP_PROTOCOL, loadMapResource)
