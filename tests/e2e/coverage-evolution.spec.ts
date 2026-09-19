import { test, expect } from '@playwright/test'
import { expectMappedPoints } from './map-assertions'

test.beforeEach(async ({ page }) => {
  await page.route('https://tiles.openfreemap.org/**', route => {
    if (new URL(route.request().url()).pathname === '/styles/liberty') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: 8, sources: {}, layers: [] }) })
    }
    return route.abort()
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Continuar sem localização' }).click()
  await expect(page.getByRole('button', { name: 'Usar minha localização' })).toBeFocused()
})

test('busca por objeto respeita sinônimos e aceitação confirmada', async ({ page }) => {
  const search = page.getByLabel('Busque um objeto ou material')
  await search.fill('laptop')
  await expect(page.locator('.point-list li')).toHaveCount(4)
  await expectMappedPoints(page, 4)
  await expect(page.getByText(/confirmação específica para notebook/i)).toBeVisible()

  await search.fill('carregador')
  await expect(page.locator('.point-list li')).toHaveCount(0)
  await expectMappedPoints(page, 0)
  await expect(page.getByText(/não há confirmação específica para carregador/i)).toBeVisible()

  await search.fill('liquidificador')
  await expect(page.locator('.point-list li')).toHaveCount(4)
  await expectMappedPoints(page, 4)
})

test('serviços de retirada ficam separados de pontos no mapa e mostram regras oficiais', async ({ page }) => {
  await page.getByLabel('Localidade', { exact: true }).selectOption('Caruaru')
  await expect(page.locator('.point-list li')).toHaveCount(6)
  await expectMappedPoints(page, 4)
  await expect(page.getByLabel('Tipo de atendimento')).not.toContainText('Campanha temporária')
  await page.getByLabel('Tipo de atendimento').selectOption('pickup_service')
  await expect(page.locator('.point-list li')).toHaveCount(2)
  await expectMappedPoints(page, 0)
  await expect(page.getByText(/sem marcador artificial/)).toBeVisible()

  await page.getByRole('button', { name: 'Ver detalhes de Coleta Seletiva, Caruaru' }).click()
  await expect(page.getByText('Serviço de retirada', { exact: true })).toBeVisible()
  await expect(page.getByText(/Retirada em endereço informado no município/)).toBeVisible()
  await expect(page.getByText('Necessário.', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /Abrir canal oficial/ })).toHaveAttribute('href', 'https://servicos.caruaru.pe.gov.br/portal/')
  await expect(page.getByRole('link', { name: /Como chegar/ })).toHaveCount(0)
})

test('referência manual calcula distância sem se apresentar como GPS', async ({ page }) => {
  await page.getByLabel('Referência manual').selectOption('drogasil-heliopolis')
  await expect(page.getByText(/Referência manual: Drogasil Heliópolis/)).toBeVisible()
  await expect(page.getByRole('img', { name: /Referência manual: Drogasil Heliópolis/ })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Sua localização', exact: true })).toHaveCount(0)
  await expect(page.locator('.point-list [data-distance]')).toHaveCount(6)
  await expect(page.locator('.point-list [data-point-id="drogasil-heliopolis"]')).toHaveAttribute('data-distance', '0')
})

test('movimento do mapa oferece busca explícita na área visível', async ({ page }) => {
  const canvas = page.locator('.maplibregl-canvas')
  await canvas.focus()
  await canvas.press('ArrowRight')
  await expect(page.getByRole('button', { name: 'Buscar nesta área' })).toBeVisible()
  await page.getByRole('button', { name: 'Buscar nesta área' }).click()
  await expect(page.getByLabel('Localidade', { exact: true })).toHaveValue('all')
  await expect(page.getByText(/Mostrando apenas destinos na área escolhida/)).toBeVisible()
  await page.getByRole('button', { name: 'Remover limite da área' }).click()
  await expect(page.getByText(/Mostrando apenas destinos na área escolhida/)).toHaveCount(0)
})

test('não publica atalhos de sugestão ou correção sem URL real', async ({ page }) => {
  await expect(page.getByRole('link', { name: /sugerir|corrigir/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /sugerir|corrigir/i })).toHaveCount(0)
})
