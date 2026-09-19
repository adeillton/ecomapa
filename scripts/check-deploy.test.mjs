import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, copyFile, writeFile, rm } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'

async function fixture(run) {
  const parent = path.resolve(tmpdir())
  const root = await mkdtemp(path.join(parent, 'ecomapa-deploy-check-'))
  try {
    await mkdir(path.join(root, 'scripts'))
    await mkdir(path.join(root, 'dist/assets'), { recursive: true })
    await copyFile(new URL('./check-deploy.mjs', import.meta.url), path.join(root, 'scripts/check-deploy.mjs'))
    for (const name of ['index.html', 'favicon.svg', 'manifest.webmanifest', '_headers', 'assets/maplibre-gl-worker-test.js']) {
      await writeFile(path.join(root, 'dist', name), 'safe fixture')
    }
    await run({
      write: (name, text) => writeFile(path.join(root, 'dist', name), text),
      check: (env = {}) => spawnSync(process.execPath, [path.join(root, 'scripts/check-deploy.mjs')], { encoding: 'utf8', env: { ...process.env, ...env } }),
    })
  } finally {
    // Remove only the dedicated temporary fixture created above.
    assert.equal(path.dirname(root), parent)
    assert.ok(path.basename(root).startsWith('ecomapa-deploy-check-'))
    await rm(root, { recursive: true, force: true })
  }
}

test('accepts only an expected static package and records file hashes', () => fixture(async ({ check }) => {
  const result = check()
  assert.equal(result.status, 0, result.stderr)
  assert.equal(JSON.parse(result.stdout).files.length, 5)
}))

test('rejects unexpected private files', () => fixture(async ({ write, check }) => {
  await write('.env', 'placeholder')
  assert.equal(check().status, 1)
}))

test('rejects credential configuration embedded in a public asset', () => fixture(async ({ write, check }) => {
  await write('assets/config-test.js', 'const COMPOSIO_API_KEY = "synthetic-test-value"')
  const result = check()
  assert.equal(result.status, 1)
  assert.ok(!result.stderr.includes('synthetic-test-value'))
}))

test('rejects an available secret value without disclosing it', () => fixture(async ({ write, check }) => {
  const synthetic = 'ecomapa-synthetic-secret-for-test-only'
  await write('assets/config-test.js', `const value = "${synthetic}"`)
  const result = check({ ECOMAPA_TEST_SECRET: synthetic })
  assert.equal(result.status, 1)
  assert.ok(!result.stderr.includes(synthetic))
}))

test('rejects source maps and missing referenced assets', () => fixture(async ({ write, check }) => {
  await write('assets/code-test.js', '//# sourceMappingURL=code-test.js.map')
  assert.equal(check().status, 1)
  await write('assets/code-test.js', '// safe fixture')
  await write('index.html', '<script src="/assets/missing.js"></script>')
  assert.equal(check().status, 1)
}))
