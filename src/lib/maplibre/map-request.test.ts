import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadMapResource, transformMapRequest } from './map-request'

const url = 'https://tiles.openfreemap.org/styles/liberty'
const request = { ...transformMapRequest(url), type: 'json' as const }
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

describe('downloads do mapa', () => {
  it('transforma apenas a origem permitida', () => {
    expect(request.url).toBe('ecomapa-map://tiles.openfreemap.org/styles/liberty')
    expect(transformMapRequest('https://example.com/map')).toEqual({ url: 'https://example.com/map' })
  })
  it('repete uma falha transitória e preserva dados e cache', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError('Network error'))
      .mockResolvedValueOnce(new Response('{"version":8}', { headers: { 'cache-control': 'max-age=60' } }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await loadMapResource(request, new AbortController())).toMatchObject({ data: { version: 8 }, cacheControl: 'max-age=60' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1][1].cache).toBe('reload')
  })
  it('cancela downloads parados e limita a duas tentativas', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(options.signal.reason))
    }))
    vi.stubGlobal('fetch', fetchMock)
    const result = expect(loadMapResource(request, new AbortController())).rejects.toThrow('Map request timeout')
    await vi.advanceTimersByTimeAsync(20000)
    await result
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
  it('não repete cancelamento do mapa nem erros HTTP permanentes', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 404 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(loadMapResource(request, new AbortController())).rejects.toThrow('404')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const parent = new AbortController()
    parent.abort()
    await expect(loadMapResource(request, parent)).rejects.toThrow()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it('interrompe uma requisição em andamento sem nova tentativa', async () => {
    const fetchMock = vi.fn((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(options.signal.reason))
    }))
    vi.stubGlobal('fetch', fetchMock)
    const parent = new AbortController()
    const result = expect(loadMapResource(request, parent)).rejects.toThrow()
    parent.abort()
    await result
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
