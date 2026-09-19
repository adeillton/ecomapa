import { expect, type Page } from '@playwright/test'

/** Um grupo representa vários pontos; comparar a cobertura, não só botões. */
export async function expectMappedPoints(page: Page, count: number) {
  await expect.poll(() => page.locator('.point-marker').evaluateAll(markers => markers.reduce((sum, marker) => sum + Number((marker as HTMLElement).dataset.pointCount), 0))).toBe(count)
}

/** Espera a câmera parar: mesmos marcadores, nas mesmas posições, em duas leituras seguidas. */
export async function waitForStableMarkers(page: Page) {
  let previous = ''
  await expect.poll(async () => {
    const current = (await page.locator('.point-marker').evaluateAll(markers => markers.map(marker => {
      const box = marker.getBoundingClientRect()
      return `${(marker as HTMLElement).dataset.pointId ?? (marker as HTMLElement).dataset.groupKey}@${Math.round(box.x)},${Math.round(box.y)}`
    }).sort().join('|')))
    const stable = !!current && current === previous
    previous = current
    return stable
  }, { intervals: [150, 200, 250, 300, 400, 500] }).toBe(true)
}

/** Abre um destino pelo mapa: direto quando isolado, pela lista do grupo quando sobreposto. Sem aproximar. */
export async function openMappedPoint(page: Page, id: string) {
  await waitForStableMarkers(page)
  const cluster = page.locator(`.point-cluster[data-group-ids~="${id}"]`)
  if (await cluster.count()) {
    await cluster.click()
    await page.locator(`.point-group-panel .group-member[data-point-id="${id}"]`).click()
    return
  }
  await page.locator(`.point-marker[data-point-id="${id}"]`).click()
}

/** O mesmo destino deve exibir o mesmo número no mapa e na lista. */
export async function expectSharedNumbering(page: Page) {
  await waitForStableMarkers(page)
  const list = Object.fromEntries(await page.locator('.point-list li').evaluateAll(items => items.map(item => [
    (item as HTMLElement).dataset.pointId, item.querySelector('.point-number')?.textContent,
  ])))
  const mapped = await page.locator('.point-marker[data-point-id]').evaluateAll(markers => markers.map(marker => [
    (marker as HTMLElement).dataset.pointId, marker.textContent,
  ]))
  expect(Object.keys(list).length).toBeGreaterThan(0)
  for (const [id, number] of mapped) expect([id, number]).toEqual([id, list[id!]])
  return { list, mapped }
}
