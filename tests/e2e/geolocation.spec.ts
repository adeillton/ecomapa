import { test, expect } from '@playwright/test'

test('posição imprecisa não produz distâncias e pode ser atualizada ou descartada', async ({ page, context }) => {
  await context.grantPermissions(['geolocation'])
  // Cenário sintético de navegador apontando Belo Jardim com grande incerteza.
  await context.setGeolocation({ latitude: -8.3327505, longitude: -36.418432, accuracy: 50000 })
  await page.goto('/')
  await page.getByRole('dialog').getByRole('button', { name: 'Usar minha localização' }).click()
  await expect(page.getByText(/Localização aproximada/)).toBeVisible()
  await expect(page.getByText(/Margem informada de 50,0 km/)).toBeVisible()
  await expect(page.locator('.point-list [data-distance]')).toHaveCount(0)
  await expect(page.getByLabel('Localidade', { exact: true })).toHaveValue('all')
  await context.setGeolocation({ latitude: -8.8865202, longitude: -36.4865311, accuracy: 10 })
  await page.getByRole('button', { name: 'Atualizar localização' }).click()
  await expect(page.getByText(/Precisão informada de 10 m/)).toBeVisible()
  await expect(page.locator('.point-list li').first()).toHaveAttribute('data-point-id', 'drogasil-heliopolis')
  await expect(page.getByRole('img', { name: 'Sua localização', exact: true })).toBeAttached()
  await page.getByRole('button', { name: 'Usar só o município' }).click()
  await expect(page.getByRole('img', { name: 'Sua localização', exact: true })).toHaveCount(0)
  await expect(page.locator('.point-list [data-distance]')).toHaveCount(0)
  await expect(page.locator('.point-list li')).toHaveCount(17)
})
test('permissão concedida pela API nativa do navegador', async ({ page, context, isMobile }) => {
  await context.grantPermissions(['geolocation'])
  await context.setGeolocation({ latitude: -8.8865202, longitude: -36.4865311, accuracy: 10 })
  await page.goto('/')
  await page.getByRole('dialog').getByRole('button', { name: 'Usar minha localização' }).click()
  await expect(page.getByText(/Localização obtida/)).toBeVisible()
  await expect(page.getByRole('img', { name: 'Sua localização', exact: true })).toBeAttached()
  await expect(page.locator('.point-list li').first()).toHaveAttribute('data-point-id', 'drogasil-heliopolis')
  if (isMobile) {
    await page.getByRole('button', { name: 'Ampliar lista' }).click()
    await expect.poll(async () => {
      const marker = await page.locator('.user-marker').boundingBox()
      const header = await page.locator('.app-header').boundingBox()
      const panel = await page.locator('#points-panel').boundingBox()
      return !!marker && marker.y > header!.y + header!.height && marker.y + marker.height < panel!.y
    }).toBe(true)
  }
})
test('só pede localização por ação e permite, calcula e ordena sem persistir', async ({ page }) => {
  await page.addInitScript(() => {
    let calls = 0
    Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: (success: PositionCallback) => {
      calls++; document.documentElement.dataset.geoCalls = String(calls)
      success({ coords: { latitude: -8.8865202, longitude: -36.4865311, accuracy: 10 }, timestamp: Date.now() } as GeolocationPosition)
    } } })
  })
  await page.goto('/')
  await expect(page.locator('html')).not.toHaveAttribute('data-geo-calls', /.+/)
  await page.getByRole('dialog').getByRole('button', { name: 'Usar minha localização' }).click()
  await expect(page.getByRole('img', { name: 'Sua localização', exact: true })).toBeAttached()
  await expect(page.locator('.point-list li').first()).toHaveAttribute('data-point-id', 'drogasil-heliopolis')
  const distances = await page.locator('.point-list li[data-distance]').evaluateAll(elements => elements.map(el => Number((el as HTMLElement).dataset.distance)))
  expect(distances).toEqual([...distances].sort((a,b) => a-b))
  expect(distances[0]).toBe(0)
  await page.getByLabel('O que você quer descartar?').selectOption('lamps')
  await expect(page.getByRole('img', { name: 'Sua localização', exact: true })).toBeAttached()
  await page.getByRole('button', { name: 'Recentralizar na minha localização' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-geo-calls', '1')
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 })
  expect(page.url()).not.toContain('-8.')
})
for (const [code, message] of [[1, 'Não foi possível acessar sua localização'], [2, 'Seu dispositivo não conseguiu'], [3, 'A localização demorou']] as const) {
  test(`erro ${code} mantém app funcional e permite tentar novamente`, async ({ page }) => {
    await page.addInitScript(code => {
      let calls = 0
      Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: (success: PositionCallback, fail: PositionErrorCallback) => {
        if (++calls === 1) fail({ code } as GeolocationPositionError)
        else success({ coords: { latitude: -8.89, longitude: -36.49, accuracy: 10 }, timestamp: Date.now() } as GeolocationPosition)
      } } })
    }, code)
    await page.goto('/')
    await page.getByRole('dialog').getByRole('button', { name: 'Usar minha localização' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByText(message, { exact: false })).toBeVisible()
    await expect(page.locator('.point-list li')).toHaveCount(17)
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByText(/Localização obtida/)).toBeVisible()
  })
}
test('navegador sem API de localização mantém lista', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'geolocation', { value: undefined }))
  await page.goto('/')
  await page.getByRole('dialog').getByRole('button', { name: 'Usar minha localização' }).click()
  await expect(page.getByText(/Este navegador não oferece localização/)).toBeVisible()
  await expect(page.locator('.point-list li')).toHaveCount(17)
})
