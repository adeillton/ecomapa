import { test, expect } from '@playwright/test'

test('localização aparece mesmo antes do estilo responder', async ({ page, context }) => {
  await context.grantPermissions(['geolocation'])
  await context.setGeolocation({ latitude: -8.8865202, longitude: -36.4865311, accuracy: 10 })
  let release!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  await page.route('https://tiles.openfreemap.org/styles/liberty', async route => {
    await pending
    await route.abort()
  })
  try {
    await page.goto('/')
    await page.getByRole('dialog').getByRole('button', { name: 'Usar minha localização' }).click()
    await expect(page.locator('.user-marker')).toHaveCount(1)
    await expect(page.locator('.point-list [data-distance]')).toHaveCount(15)
    await expect(page.locator('[data-map-status]')).toHaveAttribute('data-map-status', 'loading')
  } finally { release() }
})

test('repete download transitório do estilo e carrega o mapa', async ({ page }) => {
  test.setTimeout(60000)
  let requests = 0
  await page.route('https://tiles.openfreemap.org/styles/liberty', route => {
    requests++
    return requests === 1 ? route.abort() : route.continue()
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Continuar sem localização' }).click()
  await expect(page.locator('[data-map-status]')).toHaveAttribute('data-map-status', 'ready', { timeout: 45000 })
  expect(requests).toBe(2)
})

test('tile indisponível não impede localização, distâncias nem consulta', async ({ page, context }) => {
  test.setTimeout(60000)
  await context.grantPermissions(['geolocation'])
  await context.setGeolocation({ latitude: -8.8865202, longitude: -36.4865311, accuracy: 10 })
  await page.route(/tiles\.openfreemap\.org\/planet\/.*\.pbf/, route => route.abort())
  await page.goto('/')
  await page.getByRole('dialog').getByRole('button', { name: 'Usar minha localização' }).click()
  await expect(page.getByText(/Localização obtida/)).toBeVisible()
  await expect(page.locator('.user-marker')).toHaveCount(1, { timeout: 30000 })
  await expect(page.locator('[data-map-status]')).toHaveAttribute('data-map-status', 'partial')
  await expect(page.locator('.point-list [data-distance]')).toHaveCount(15)
  await page.locator('.point-list button').first().click()
  await expect(page.getByRole('link', { name: /Como chegar/ })).toBeVisible()
})
