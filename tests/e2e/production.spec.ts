import { test, expect } from '@playwright/test'
import { expectMappedPoints } from './map-assertions'

test('link abre o ponto correto sem pedir localização e permite voltar', async ({ page }) => {
  await page.goto('/#ponto=magalu-bezerros')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Magazine Luiza, Bezerros' })).toBeVisible()
  await expect(page.getByLabel('Localidade', { exact: true })).toHaveValue('Bezerros')
  await page.getByRole('button', { name: 'Voltar aos destinos' }).click()
  await expect(page.locator('.point-list li')).toHaveCount(1)
  await expect(page).not.toHaveURL(/#ponto=/)
  await page.locator('.point-list button').click()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Magazine Luiza, Bezerros' })).toBeVisible()
})

test('hash inválido não quebra consulta e navegação do histórico restaura ponto', async ({ page }) => {
  await page.goto('/#ponto=%')
  await page.getByRole('button', { name: 'Continuar sem localização' }).click()
  await expect(page.getByText(/Este link não corresponde/)).toBeVisible()
  await page.locator('.point-list button').first().click()
  await page.goBack()
  await expect(page.locator('.point-list li')).toHaveCount(17)
  await page.goForward()
  await expect(page.locator('.point-details h2')).toBeVisible()
})

test('copia link e endereço e oferece alternativa quando clipboard é negado', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
    writeText: async (text: string) => { document.documentElement.dataset.copied = text },
  } }))
  await page.goto('/#ponto=magalu-bezerros')
  await page.getByRole('button', { name: 'Copiar link do ponto' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-copied', /\/#ponto=magalu-bezerros$/)
  await page.getByRole('button', { name: 'Copiar endereço' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-copied', /Sigismundo Gonçalves, 15/)
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }))
  await page.getByRole('button', { name: 'Copiar link do ponto' }).click()
  await expect(page.getByRole('textbox', { name: 'Texto para copiar link do ponto' })).toHaveValue(/#ponto=magalu-bezerros$/)
})

test('orientação de descarte informa limites e origem', async ({ page }) => {
  await page.goto('/#ponto=ferreira-costa-garanhuns')
  await page.getByText('Antes de levar seu descarte', { exact: true }).click()
  await expect(page.getByText(/Geladeiras, fogões/)).toBeVisible()
  await expect(page.getByRole('link', { name: /Orientações da Reciclus/ })).toHaveAttribute('href', 'https://reciclus.org.br/onde-descartar/')
  await expect(page.getByText(/Horários de recebimento não confirmados/)).toBeVisible()
})

test('ampliar a área preserva o material sem inventar resultados locais', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Continuar sem localização' }).click()
  await page.getByLabel('Localidade', { exact: true }).selectOption('Gravatá')
  await page.getByLabel('O que você quer descartar?').selectOption('lamps')
  await expect(page.locator('.point-list li')).toHaveCount(0)
  await page.getByRole('button', { name: 'Buscar em outras localidades' }).click()
  await expect(page.getByLabel('O que você quer descartar?')).toHaveValue('lamps')
  await expect(page.locator('.point-list li')).toHaveCount(4)
})

test('cancelar ignora resposta tardia da localização e permite nova tentativa', async ({ page }) => {
  await page.addInitScript(() => {
    let calls = 0
    Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: (success: PositionCallback) => {
      const value = { coords: { latitude: -8.8865202, longitude: -36.4865311, accuracy: 10 }, timestamp: Date.now() } as GeolocationPosition
      if (++calls === 1) window.addEventListener('test-late-location', () => success(value), { once: true })
      else success(value)
    } } })
  })
  await page.goto('/')
  await page.getByRole('dialog').getByRole('button', { name: 'Usar minha localização' }).click()
  await page.getByRole('button', { name: 'Continuar sem localização' }).click()
  await page.evaluate(() => window.dispatchEvent(new Event('test-late-location')))
  await expect(page.getByText(/Localização desativada/)).toBeVisible()
  await expect(page.getByRole('img', { name: 'Sua localização', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Usar minha localização', exact: true }).click()
  await expect(page.getByText(/Localização obtida/)).toBeVisible()
})

test('falha do mapa permite nova tentativa mantendo a lista', async ({ page }) => {
  test.setTimeout(60000)
  await page.route('https://tiles.openfreemap.org/**', route => route.abort())
  await page.goto('/')
  await page.getByRole('button', { name: 'Continuar sem localização' }).click()
  await expect(page.getByRole('button', { name: 'Tentar carregar o mapa' })).toBeVisible()
  await page.unroute('https://tiles.openfreemap.org/**')
  await page.getByRole('button', { name: 'Tentar carregar o mapa' }).click()
  await expect(page.locator('[data-map-status]')).toHaveAttribute('data-map-status', 'ready', { timeout: 45000 })
  await expect(page.locator('.point-list li')).toHaveCount(17)
  await expectMappedPoints(page, 15)
})

test('sem internet após carregar preserva detalhes e avisa sobre serviços externos', async ({ page, context }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Continuar sem localização' }).click()
  await context.setOffline(true)
  await expect(page.getByText(/Você está sem conexão/)).toBeVisible()
  const first = page.locator('.point-list li').first()
  const firstName = await first.locator('strong').textContent()
  await first.locator('button').click()
  await expect(page.locator('.point-details h2')).toHaveText(firstName!)
  await context.setOffline(false)
  await expect(page.getByText(/Você está sem conexão/)).toHaveCount(0)
})

test('tela estreita e paisagem mantêm controles e detalhes acessíveis', async ({ page }) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 812, height: 375 }]) {
    await page.setViewportSize(viewport)
    await page.goto('/#ponto=ferreira-costa-garanhuns')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await expect(page.getByLabel('Localidade', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: /Como chegar/ }).scrollIntoViewIfNeeded()
    await expect(page.getByRole('link', { name: /Como chegar/ })).toBeVisible()
    await page.getByRole('button', { name: 'Voltar aos destinos' }).click()
    await expect(page.getByLabel('Localidade', { exact: true })).toHaveValue('Garanhuns')
    await expect(page.locator('.point-list li')).toHaveCount(6)
  }
})

test('falha no módulo do mapa não impede abrir ponto e rota', async ({ page }) => {
  await page.route(/\/assets\/EcoMap-[^/]+\.js$/, route => route.abort())
  await page.goto('/')
  await page.getByRole('button', { name: 'Continuar sem localização' }).click()
  await expect(page.getByText(/Não foi possível iniciar o mapa/)).toBeVisible()
  await page.locator('.point-list button').first().click()
  await expect(page.getByRole('link', { name: /Como chegar/ })).toBeVisible()
})

test('atualização negada não mantém a posição anterior como atual', async ({ page }) => {
  await page.addInitScript(() => {
    let calls = 0
    Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: (success: PositionCallback, failure: PositionErrorCallback) => {
      if (++calls === 1) success({ coords: { latitude: -8.89, longitude: -36.49, accuracy: 10 }, timestamp: Date.now() } as GeolocationPosition)
      else failure({ code: 1 } as GeolocationPositionError)
    } } })
  })
  await page.goto('/')
  await page.getByRole('dialog').getByRole('button', { name: 'Usar minha localização' }).click()
  await expect(page.locator('.point-list [data-distance]')).toHaveCount(15)
  await page.getByRole('button', { name: 'Atualizar localização' }).click()
  await expect(page.getByText(/Não foi possível acessar sua localização/)).toBeVisible()
  await expect(page.locator('.point-list [data-distance]')).toHaveCount(0)
  await expect(page.getByRole('img', { name: 'Sua localização', exact: true })).toHaveCount(0)
})
