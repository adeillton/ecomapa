import { createHash } from 'node:crypto'
import { lstat, readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../dist/', import.meta.url))
const required = new Set(['index.html', 'favicon.svg', 'manifest.webmanifest', '_headers'])
const allowedAsset = /^assets\/[A-Za-z0-9_-]+\.(?:js|css)$/
const indicators = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:ghp_|github_pat_|sk-proj-)[A-Za-z0-9_-]{20,}/,
  /\bAKIA[A-Z0-9]{16}\b/,
  /(?:COMPOSIO_API_KEY|CLOUDFLARE_API_TOKEN|CLOUDFLARE_API_KEY|CF_API_KEY|X-Auth-Key)/i,
  /(?:api[_-]?key|client[_-]?secret|access[_-]?token)["']?\s*[:=]\s*["'][A-Za-z0-9_./+\-=]{20,}["']/i,
  /sourceMappingURL\s*=/,
  /(?:C:\\\\?Users\\|\/Users\/|\/home\/)[A-Za-z0-9_.-]+/i,
]
// Compare available credentials without printing their names or values.
const secrets = Object.entries(process.env)
  .filter(([name, value]) => /(?:key|token|secret|password)/i.test(name) && value?.length >= 16)
  .map(([, value]) => value)
const manifest = []
async function inspect(relative = '') {
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const name = relative ? `${relative}/${entry.name}` : entry.name
    const full = path.join(root, name)
    const stat = await lstat(full)
    if (stat.isSymbolicLink()) throw new Error('Link simbólico no pacote: envio bloqueado')
    if (stat.isDirectory()) {
      if (name !== 'assets') throw new Error('Diretório inesperado no pacote: envio bloqueado')
      await inspect(name)
      continue
    }
    if (!stat.isFile() || (!required.has(name) && !allowedAsset.test(name))) throw new Error('Arquivo inesperado no pacote: envio bloqueado')
    if (stat.size > 25 * 1024 * 1024) throw new Error('Arquivo excede o limite do pacote')
    const buffer = await readFile(full)
    const text = buffer.toString('utf8')
    if (indicators.some(pattern => pattern.test(text)) || secrets.some(secret => text.includes(secret))) {
      throw new Error('Indício de credencial, caminho privado ou source map: envio bloqueado; conteúdo omitido')
    }
    manifest.push({ file: name, bytes: buffer.length, sha256: createHash('sha256').update(buffer).digest('hex') })
  }
}
try {
  if ((await lstat(root)).isSymbolicLink()) throw new Error('dist não pode ser link simbólico')
  await inspect()
  if ([...required].some(name => !manifest.some(entry => entry.file === name))) throw new Error('Build incompleto')
  if (!manifest.some(entry => /^assets\/maplibre-gl-worker-.*\.js$/.test(entry.file))) throw new Error('Worker do mapa ausente')
  const html = await readFile(path.join(root, 'index.html'), 'utf8')
  for (const [, asset] of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)) {
    if (!manifest.some(entry => `/${entry.file}` === asset)) throw new Error('Referência a asset ausente')
  }
  console.log(JSON.stringify({ status: 'approved', directory: 'dist', files: manifest.sort((a, b) => a.file.localeCompare(b.file)), note: 'Heuristic scan; does not replace manual review. Only these build files may be uploaded.' }, null, 2))
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
