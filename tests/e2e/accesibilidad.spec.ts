import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Accesibilidad de las pantallas (contraste, nombres de botones, foco). Falla ante cualquier fallo grave.
async function sinFallos(page: Page, sinContraste = false) {
  const axe = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa'])
  // La página /dev/ui enseña muestras de color y la etiqueta naranja de una celda: el contraste se mide en las pantallas reales
  if (sinContraste) axe.disableRules(['color-contrast'])
  const { violations } = await axe.analyze()
  const graves = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(
    graves.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`),
    'fallos de accesibilidad',
  ).toEqual([])
}

test('bienvenida', async ({ page }) => {
  await page.goto('/bienvenida')
  await expect(page.getByRole('heading', { name: 'MUTA' })).toBeVisible()
  await sinFallos(page)
})

test('piezas de diseño en claro y oscuro', async ({ page }) => {
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme })
    await page.goto('/dev/ui')
    await expect(page.locator('body')).toBeVisible()
    await sinFallos(page, true)
  }
})

test('elegir rutina y detalle de una rutina de MUTA', async ({ page }) => {
  await page.goto('/bienvenida')
  await page.getByRole('link', { name: 'Comenzar' }).click()
  await page.getByRole('link', { name: 'Siguiente' }).click()
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await expect(page).toHaveURL('/entreno/rutinas')
  await sinFallos(page)
  await page.goto('/entreno/programa/muta-cuerpo-completo-4d')
  await expect(page.getByRole('button', { name: 'Empezar esta rutina' })).toBeVisible()
  await sinFallos(page)
  // con una sesión y un ejercicio desplegados
  // Las sesiones salen cerradas: se abre la que lleva el ejercicio
  await page
    .locator('details:not(:has(details))', { has: page.getByText(/Press militar en máquina/) })
    .first()
    .locator('summary')
    .click()
  await page
    .getByRole('button', { name: /Press militar en máquina/ })
    .first()
    .click()
  await sinFallos(page)
})
