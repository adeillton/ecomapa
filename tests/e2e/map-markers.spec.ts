import { test, expect, type Page } from '@playwright/test'
import { expectMappedPoints, expectSharedNumbering, openMappedPoint, waitForStableMarkers } from './map-assertions'

// Estilo mínimo interceptado: a geometria dos marcadores não deve depender do provedor externo.
// Os tiles reais continuam cobertos por basic-map.spec.ts.
test.beforeEach(async ({ page }) => {
  await page.route('https://tiles.openfreemap.org/**', route => {
    if (new URL(route.request().url()).pathname === '/styles/liberty') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: 8, sources: {}, layers: [] }) })
    }
    return route.abort()
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Continuar sem localização' }).click()
  await expectMappedPoints(page, 15)
})

const groupPanel = (page: Page) => page.locator('.point-group-panel')

test('grupo diz a quantidade e entrega todos os membros sem aproximar', async ({ page }) => {
  const cluster = page.locator('.point-cluster').first()
  const ids = (await cluster.getAttribute('data-group-ids'))!.split(' ')
  expect(ids.length).toBeGreaterThan(1)
  // Quantidade por escrito: nenhum marcador de grupo pode ser lido como identificador de ponto.
  await expect(cluster).toHaveText(`${ids.length} pontos`)
  await expect(cluster).toHaveAttribute('aria-label', `Abrir grupo de ${ids.length} pontos sobrepostos`)
  const individuals = await page.locator('.point-marker[data-point-id]').evaluateAll(markers => markers.map(marker => marker.textContent))
  expect(individuals.every(text => /^\d+$/.test(text ?? ''))).toBe(true)

  const anchor = page.locator('.point-marker[data-point-id]').first()
  const before = await anchor.boundingBox()
  const markers = await page.locator('.point-marker').count()
  await cluster.click()
  const panel = groupPanel(page)
  await expect(page.getByRole('dialog', { name: `${ids.length} pontos neste local` })).toBeVisible()
  await expect(cluster).toHaveAttribute('aria-expanded', 'true')
  for (const id of ids) await expect(panel.locator(`.group-member[data-point-id="${id}"]`)).toBeVisible()
  await expect(panel.locator('.group-member')).toHaveCount(ids.length)
  // Consultar o grupo não movimenta a câmera nem ativa a busca de área.
  expect(await anchor.boundingBox()).toEqual(before)
  await expect(page.getByRole('button', { name: 'Buscar nesta área' })).toHaveCount(0)
  await expect(page.locator('.point-marker')).toHaveCount(markers)

  // A lista do grupo segue a numeração do resultado e o alvo de toque mínimo.
  const numbers = await panel.locator('.point-number').evaluateAll(items => items.map(item => Number(item.textContent)))
  expect(numbers).toEqual([...numbers].sort((a, b) => a - b))
  for (const box of await panel.locator('.group-member').evaluateAll(items => items.map(item => item.getBoundingClientRect().height))) {
    expect(box).toBeGreaterThanOrEqual(44)
  }
  const target = ids[ids.length - 1]
  const name = await panel.locator(`.group-member[data-point-id="${target}"] strong`).textContent()
  await panel.locator(`.group-member[data-point-id="${target}"]`).click()
  await expect(page.getByRole('heading', { name: name! })).toBeVisible()
  await expect(groupPanel(page)).toHaveCount(0)
})

test('todo membro do grupo é alcançável pelo nome a partir da visão inicial', async ({ page }) => {
  const names = Object.fromEntries(await page.locator('.point-list li').evaluateAll(items => items.map(item => [
    (item as HTMLElement).dataset.pointId, item.querySelector('strong')?.textContent,
  ])))
  const ids = (await page.locator('.point-cluster').first().getAttribute('data-group-ids'))!.split(' ')
  for (const id of ids) {
    // Cada membro é aberto a partir do mesmo estado inicial, sem tocar no controle de zoom.
    await openMappedPoint(page, id)
    await expect(page.locator('.point-details h2')).toHaveText(names[id]!)
    await page.goto('/')
    await page.getByRole('button', { name: 'Continuar sem localização' }).click()
    await expectMappedPoints(page, 15)
  }
})

test('mapa e lista usam o mesmo número, inclusive onde serviços ocupam posições', async ({ page }) => {
  await expectSharedNumbering(page)
  const city = page.getByLabel('Localidade', { exact: true })
  await city.selectOption('Caruaru')
  await expect(page.locator('.point-list li')).toHaveCount(6)
  // Defeito anterior: a lista mostrava 3 e o mapa mostrava 1 para o mesmo ponto.
  await expect(page.locator('.point-list li[data-point-id="ferreira-caruaru"] .point-number')).toHaveText('3')
  await expect(page.locator('.point-marker[data-point-id="ferreira-caruaru"]')).toHaveText('3')
  await expectSharedNumbering(page)

  await city.selectOption('all')
  await expectSharedNumbering(page)
  await page.getByLabel('O que você quer descartar?').selectOption('batteries')
  await expectSharedNumbering(page)
  await page.getByLabel('O que você quer descartar?').selectOption('all')
  await page.getByLabel('Busque um objeto ou material').fill('liquidificador')
  await expect(page.locator('.point-list li')).toHaveCount(4)
  await expectSharedNumbering(page)
  await page.getByLabel('Tipo de atendimento').selectOption('fixed_dropoff')
  await expectSharedNumbering(page)
})

test('ordenar por GPS mantém mapa e lista com o mesmo número', async ({ page, context }) => {
  await context.grantPermissions(['geolocation'])
  await context.setGeolocation({ latitude: -8.8865202, longitude: -36.4865311, accuracy: 10 })
  await page.getByRole('button', { name: 'Usar minha localização' }).click()
  await expect(page.locator('.point-list li').first()).toHaveAttribute('data-point-id', 'drogasil-heliopolis')
  await expect(page.locator('.point-marker[data-point-id="drogasil-heliopolis"]')).toHaveText('1')
  await expectSharedNumbering(page)
})

test('filtro que retira um membro descarta a lista do grupo em vez de mostrar dado obsoleto', async ({ page }) => {
  await page.locator('.point-cluster').first().click()
  await expect(groupPanel(page)).toBeVisible()
  await page.getByLabel('O que você quer descartar?').selectOption('lamps')
  await expect(groupPanel(page)).toHaveCount(0)
  await expect(page.locator('.point-list li')).toHaveCount(4)
  await expectSharedNumbering(page)
})

test('reordenar por referência e buscar na área não produzem números incorretos', async ({ page }) => {
  await page.getByLabel('Referência manual').selectOption('drogasil-heliopolis')
  await expect(page.locator('.point-list li').first()).toHaveAttribute('data-point-id', 'drogasil-heliopolis')
  await expect(page.locator('.point-marker[data-point-id="drogasil-heliopolis"]')).toHaveText('1')
  await expectSharedNumbering(page)

  const canvas = page.locator('.maplibregl-canvas')
  await canvas.focus()
  await canvas.press('ArrowRight')
  await page.getByRole('button', { name: 'Buscar nesta área' }).click()
  await expect(page.getByText(/Mostrando apenas destinos na área escolhida/)).toBeVisible()
  await expectSharedNumbering(page)
})

test('pan e zoom mudam o agrupamento, nunca os números', async ({ page }) => {
  const before = await expectSharedNumbering(page)
  const canvas = page.locator('.maplibregl-canvas')
  await canvas.focus()
  await canvas.press('ArrowRight')
  await waitForStableMarkers(page)
  const individuals = () => page.locator('.point-marker[data-point-id]').count()
  for (let attempt = 0; attempt < 4 && await individuals() <= before.mapped.length; attempt++) {
    await page.locator('.maplibregl-ctrl-zoom-in').click()
    await waitForStableMarkers(page)
  }
  expect(await individuals()).toBeGreaterThan(before.mapped.length)
  const after = await expectSharedNumbering(page)
  expect(after.list).toEqual(before.list)
})

test('destaque do selecionado resiste a zoom, pan e mudança de tamanho', async ({ page }) => {
  const listed = await page.locator('.point-list li[data-point-id="bravil-garanhuns"] .point-number').textContent()
  await page.locator('.point-list li[data-point-id="bravil-garanhuns"] button').click()
  const marker = page.locator('.point-marker[data-point-id="bravil-garanhuns"]')
  await expect(marker).toHaveAttribute('aria-pressed', 'true')
  await expect(marker).toHaveText(listed!)

  // Afastar reúne o ponto aberto num grupo; o grupo precisa continuar indicando isso.
  const cluster = page.locator('.point-cluster[data-group-ids~="bravil-garanhuns"]')
  for (let attempt = 0; attempt < 6 && await cluster.count() === 0; attempt++) {
    await page.locator('.maplibregl-ctrl-zoom-out').click()
    await page.waitForTimeout(350)
  }
  await expect(cluster).toHaveClass(/holds-selected/)
  await expect(cluster).toHaveAttribute('aria-label', /inclui o destino selecionado Bravil Sistemas, Garanhuns/)

  const viewport = page.viewportSize()!
  await page.setViewportSize({ width: viewport.width - 60, height: viewport.height })
  await waitForStableMarkers(page)
  await expect.poll(() => page.locator('.point-marker[data-point-id="bravil-garanhuns"][aria-pressed="true"], .point-cluster[data-group-ids~="bravil-garanhuns"].holds-selected').count()).toBe(1)
  await page.setViewportSize(viewport)
})

test('grupo abre e fecha pelo teclado devolvendo o foco ao marcador', async ({ page }) => {
  const cluster = page.locator('.point-cluster').first()
  await cluster.focus()
  await page.keyboard.press('Enter')
  await expect(groupPanel(page).locator('.group-member').first()).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(groupPanel(page)).toHaveCount(0)
  await expect(cluster).toBeFocused()
  await expect(cluster).toHaveAttribute('aria-expanded', 'false')

  await page.keyboard.press('Enter')
  await groupPanel(page).getByRole('button', { name: 'Fechar lista do grupo' }).click()
  await expect(groupPanel(page)).toHaveCount(0)
  await expect(cluster).toBeFocused()
})

test('aproximar continua disponível como opção e conserva pontos e números', async ({ page }) => {
  const cluster = page.locator('.point-cluster').first()
  const ids = (await cluster.getAttribute('data-group-ids'))!.split(' ')
  const individuals = await page.locator('.point-marker[data-point-id]').count()
  await cluster.click()
  await groupPanel(page).getByRole('button', { name: 'Aproximar neste grupo' }).click()
  await expect(groupPanel(page)).toHaveCount(0)
  await waitForStableMarkers(page)
  // Aproximar separa parte do grupo; o que continuar sobreposto segue acessível pela lista do grupo.
  expect(await page.locator('.point-marker[data-point-id]').count()).toBeGreaterThan(individuals)
  for (const id of ids) {
    await expect(page.locator(`.point-marker[data-point-id="${id}"], .point-cluster[data-group-ids~="${id}"]`)).toHaveCount(1)
  }
  await expectMappedPoints(page, 15)
  await expectSharedNumbering(page)
})
