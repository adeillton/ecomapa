import { test, expect } from '@playwright/test'
import { expectMappedPoints, openMappedPoint } from './map-assertions'
test('mapa, tiles e worker reais abrem', async ({ page }) => {
  test.setTimeout(60000)
  const errors: string[] = []
  const workers: string[] = []
  const tiles: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('worker', worker => workers.push(worker.url()))
  page.on('response', response => { if (response.url().includes('tiles.openfreemap.org') && /\/(\d+)\/(\d+)\/(\d+)/.test(response.url()) && response.ok()) tiles.push(response.url()) })
  await page.goto('/')
  await page.getByRole('button', { name: 'Continuar sem localização' }).click()
  await expect(page.getByLabel('O que você quer descartar?')).toBeVisible()
  await expect(page.getByRole('list', { name: 'Destinos de descarte' })).toBeAttached()
  await expect(page.locator('[data-map-status]')).toHaveAttribute('data-map-status', 'ready', { timeout: 45000 })
  expect(workers.some(url => /maplibre-gl-worker(?:-.*\.js|\.mjs\?worker_file)/.test(url))).toBe(true)
  expect(tiles.length).toBeGreaterThan(0)
  expect(errors).toEqual([])
  await expectMappedPoints(page, 15)
  // Pontos sobrepostos são alcançados pela lista do grupo, sem aproximações sucessivas.
  await openMappedPoint(page, 'ferreira-costa-garanhuns')
  await expect(page.getByRole('heading', { name: 'Ferreira Costa, Garanhuns' })).toBeVisible()
  await openMappedPoint(page, 'casas-bahia-garanhuns')
  await expect(page.getByRole('heading', { name: 'Casas Bahia, Garanhuns' })).toBeVisible()
})
test('falha de tiles preserva consulta pela lista', async ({ page }) => {
  await page.route('https://tiles.openfreemap.org/**', route => route.abort())
  await page.goto('/')
  await page.getByRole('button', { name: 'Continuar sem localização' }).click()
  await expect(page.getByText(/Não foi possível carregar o mapa agora/)).toBeVisible()
  // Sem mapa, a lista continua numerada e operável.
  await expect(page.locator('.point-list li').first().locator('.point-number')).toHaveText('1')
  await page.getByRole('list', { name: 'Destinos de descarte' }).getByRole('button').first().click()
  await expect(page.getByRole('link', { name: /Como chegar/ })).toBeVisible()
})
