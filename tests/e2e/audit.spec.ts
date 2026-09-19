import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('auditoria WCAG nos estados de permissão, lista, detalhe e vazio', async ({ page }, testInfo) => {
  test.setTimeout(90000)
  async function audit(name: string) {
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
    await testInfo.attach(`accessibility-${name}`, { body: JSON.stringify({ violations: result.violations, incomplete: result.incomplete }, null, 2), contentType: 'application/json' })
    expect(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, problem: n.failureSummary })) }))).toEqual([])
  }
  await page.goto('/')
  await expect(page.getByRole('dialog')).toBeVisible()
  await audit('permission')
  await page.getByRole('button', { name: 'Continuar sem localização' }).click()
  await expect(page.locator('[data-map-status]')).toBeAttached()
  await audit('list')
  const cluster = page.locator('.point-cluster').first()
  await expect(cluster).toBeVisible()
  await cluster.click()
  await expect(page.locator('.point-group-panel')).toBeVisible()
  await audit('group')
  await page.keyboard.press('Escape')
  await page.locator('.point-list button').last().click()
  await page.getByText('Antes de levar seu descarte', { exact: true }).click()
  await audit('details')
  await page.getByLabel('Localidade', { exact: true }).selectOption('Gravatá')
  await page.getByLabel('O que você quer descartar?').selectOption('electronics')
  await audit('empty')
})
