import { expect, test } from '@playwright/test'

// Tu plan (pestaña Entreno) con los datos de prueba de state/muestra: carrusel, «Empezar», hoja y músculos.

test('el carrusel cambia la sesión de «Empezar»', async ({ page }) => {
  await page.goto('/entreno')
  const empezar = page.getByRole('link', { name: /^Empezar/ })
  await expect(empezar).toHaveText('Empezar B1')
  await page
    .getByRole('group', { name: 'Sesiones de tu rutina' })
    .evaluate((rail) => rail.scrollTo({ left: rail.clientWidth * 3 }))
  await expect(empezar).not.toHaveText('Empezar B1')
  await expect(empezar).toHaveAttribute('href', /\/entreno\/sesion\/[ab]\d\/inicio$/)
})

test('«···» abre la hoja Tu rutina y se cierra', async ({ page }) => {
  await page.goto('/entreno')
  await page.getByRole('button', { name: 'Tu rutina' }).click()
  const hoja = page.getByRole('dialog', { name: 'Tu rutina' })
  await expect(hoja.getByText('Biblioteca de ejercicios')).toBeVisible()
  await hoja.getByRole('button', { name: 'Cerrar' }).click()
  await expect(hoja).toHaveCount(0)
})

test('tocar un músculo enseña sus series y tocar fuera las quita', async ({ page }) => {
  await page.goto('/entreno')
  const burbuja = page.locator('[aria-live="polite"]')
  // Se toca un trozo del músculo (el bíceps son dos piezas, una por brazo)
  await page
    .getByRole('button', { name: /^Bíceps: 9 series/ })
    .locator('path')
    .first()
    .click()
  await expect(burbuja).toContainText('Bíceps')
  await expect(burbuja).toContainText('9 series hoy')

  await page.getByRole('radio', { name: 'Semana' }).check({ force: true })
  await expect(burbuja).toContainText('esta semana')

  const cuerpo = await page.getByRole('group', { name: /^Músculos/ }).boundingBox()
  await page.mouse.click(cuerpo!.x + 4, cuerpo!.y + 4)
  await expect(burbuja).toBeEmpty()
})

test('al bajar queda arriba una barra con «Entrenamiento»', async ({ page }) => {
  await page.goto('/entreno')
  await expect(page.getByRole('link', { name: /^Empezar/ })).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, 600))
  await expect(page.getByText('Entrenamiento', { exact: true }).first()).toBeInViewport()
  await expect(page.getByRole('heading', { name: 'Entrenamiento', level: 1 })).not.toBeInViewport()
})
