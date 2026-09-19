import { expectMappedPoints } from './map-assertions'
import { test, expect } from '@playwright/test'
test('filtro atualiza lista e marcadores e permite recuperar todos', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Continuar sem localização' }).click()
  const select = page.getByLabel('O que você quer descartar?')
  await select.selectOption('batteries')
  await expect(page.locator('.point-list li')).toHaveCount(13)
  await expectMappedPoints(page, 13)
  // Serviços de retirada entram na lista sem marcador: as duas contagens não são iguais.
  for (const [category, listed, mapped] of [['lamps', 4, 4], ['electronics', 6, 4], ['appliances', 6, 4]] as const) {
    await select.selectOption(category)
    await expectMappedPoints(page, mapped)
    await expect(page.locator('.point-list li')).toHaveCount(listed)
  }
  await page.getByLabel('Localidade', { exact: true }).selectOption('Gravatá')
  for (const category of ['lamps', 'electronics', 'appliances']) {
    await select.selectOption(category)
    await expectMappedPoints(page, 0)
    await expect(page.locator('.point-list li')).toHaveCount(0)
    await expect(page.getByText(/Nenhum destino verificado para/)).toBeVisible()
  }
  await page.getByRole('button', { name: 'Limpar busca e filtros' }).click()
  await expect(select).toHaveValue('all')
  await expectMappedPoints(page, 1)
  await expect(page.locator('.point-list li')).toHaveCount(1)
  await page.getByLabel('Localidade', { exact: true }).selectOption('all')
  await expectMappedPoints(page, 15)
  await expect(page.locator('.point-list li')).toHaveCount(17)
})

test('município enquadra ponto regional e preserva fonte e restrição', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Continuar sem localização' }).click()
  await page.getByLabel('Localidade', { exact: true }).selectOption('Bezerros')
  await expect(page.locator('.point-list li')).toHaveCount(1)
  await page.locator('.point-marker[data-point-id="magalu-bezerros"]').click()
  await expect(page.getByRole('heading', { name: 'Magazine Luiza, Bezerros' })).toBeVisible()
  await expect(page.getByText(/Produtos maiores que o coletor/)).toBeVisible()
  await expect(page.getByRole('link', { name: /ABREE/ })).toHaveAttribute('href', 'https://abree.org.br/pontos-de-recebimento')
})
