import type { AddProtocolAction } from 'maplibre-gl'

const ORIGIN = 'https://tiles.openfreemap.org/'
export const MAP_PROTOCOL = 'ecomapa-map'
const PREFIX = `${MAP_PROTOCOL}://tiles.openfreemap.org/`

export function transformMapRequest(url: string) {
  return { url: url.startsWith(ORIGIN) ? PREFIX + url.slice(ORIGIN.length) : url }
}

// Limite por tentativa inclui o corpo da resposta. Uma conexão parada não deve
// bloquear indefinidamente o mapa. O cancelamento do MapLibre sempre prevalece.
export const loadMapResource: AddProtocolAction = async (request, parent) => {
  if (!request.url.startsWith(PREFIX)) throw new Error('Origem de mapa inválida')
  const url = ORIGIN + request.url.slice(PREFIX.length)
  for (let attempt = 0; attempt < 2; attempt++) {
    parent.signal.throwIfAborted()
    const controller = new AbortController()
    const cancel = () => controller.abort(parent.signal.reason)
    parent.signal.addEventListener('abort', cancel, { once: true })
    const timeout = setTimeout(() => controller.abort(new DOMException('Map request timeout', 'TimeoutError')), 10000)
    let retryable = true
    try {
      const response = await fetch(url, {
        signal: controller.signal, credentials: 'omit',
        cache: attempt === 0 ? 'default' : 'reload',
      })
      if (!response.ok) {
        retryable = response.status >= 500 || response.status === 408
        throw new Error(`Map resource HTTP ${response.status}`)
      }
      const data = request.type === 'json' ? await response.json()
        : request.type === 'string' ? await response.text() : await response.arrayBuffer()
      return { data, cacheControl: response.headers.get('cache-control'), expires: response.headers.get('expires') }
    } catch (error) {
      if (parent.signal.aborted || !retryable || attempt === 1) throw error
    } finally {
      clearTimeout(timeout)
      parent.signal.removeEventListener('abort', cancel)
    }
  }
  throw new Error('Map resource unavailable')
}
