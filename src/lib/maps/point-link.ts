export function pointSlugFromHash(hash: string): string | null {
  if (!hash.startsWith('#ponto=')) return null
  try {
    const slug = decodeURIComponent(hash.slice(7))
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : null
  } catch { return null }
}

export function buildPointLink(pageUrl: string, slug: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Ponto inválido')
  const url = new URL(pageUrl)
  url.search = ''
  url.hash = `ponto=${slug}`
  return url.toString()
}
