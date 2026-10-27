import { expect, test } from '@playwright/test'

test('la primera vez la app abre en la bienvenida (A01)', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL('/bienvenida')
  await expect(page.getByRole('heading', { name: 'MUTA' })).toBeVisible()
  await expect(page.getByText('Entrena. Come. Evoluciona.')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Pestañas' })).toHaveCount(0)

  await page
    .locator('img')
    .first()
    .evaluate((img: HTMLImageElement) => img.decode())
  await page.evaluate(() => document.getAnimations().forEach((animation) => animation.finish()))
  await page.screenshot({ path: 'tests/e2e/capturas/A01-bienvenida.png' })
})

test('«Comenzar» lleva al primer paso de la bienvenida', async ({ page }) => {
  await page.goto('/bienvenida')
  await page.getByRole('link', { name: 'Comenzar' }).click()
  await expect(page).toHaveURL('/bienvenida/1')
})
