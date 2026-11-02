import { expect, test } from '@playwright/test'

// Ver sesión (al tocar una tarjeta de Tu plan) con los datos de prueba de state/muestra.

test('la tarjeta de B1 abre Ver sesión, sin pestañas, y «Empezar B1» lleva a la sesión', async ({ page }) => {
  await page.goto('/entreno')
  await page.getByRole('link', { name: /Isquios, glúteo y pecho/ }).click()
  await expect(page).toHaveURL('/entreno/rutina/b1')
  await expect(page.getByRole('heading', { name: 'B1 Isquios, glúteo y pecho', level: 1 })).toBeVisible()
  await expect(page.getByText('7 ejercicios · 24 series · 65 min')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Pestañas' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Empezar B1' })).toHaveAttribute(
    'href',
    '/entreno/sesion/b1/inicio',
  )
  await page.getByRole('link', { name: 'Volver a Tu plan' }).click()
  await expect(page).toHaveURL('/entreno')
})

test('la gráfica enseña la última vez y cambia de medida', async ({ page }) => {
  await page.goto('/entreno/rutina/b1')
  await expect(page.getByText('7,1 t', { exact: true })).toBeVisible()
  await expect(page.getByText('−7 % que la anterior')).toBeVisible()
  await expect(page.getByText('Mar 20 oct')).toBeVisible()
  await expect(page.getByRole('img', { name: /^Tonelaje de \d+ entrenos$/ })).toBeVisible()

  await page.getByText('Repeticiones', { exact: true }).click()
  await expect(page.getByText('274 reps', { exact: true })).toBeVisible()
  await expect(page.getByText('−10 % que la anterior')).toBeVisible()
  await expect(page.getByRole('img', { name: /^Repeticiones de \d+ entrenos$/ })).toBeVisible()
})

test('un ejercicio se despliega con lo que hiciste la última vez', async ({ page }) => {
  await page.goto('/entreno/rutina/b1')
  const fila = page.getByRole('button', { name: /Peso muerto rumano/ })
  await expect(fila).toHaveAttribute('aria-expanded', 'false')
  await fila.click()
  await expect(fila).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByText('Última vez')).toBeVisible()
  await expect(page.getByText('62,5 × 6')).toBeVisible()
  await fila.click()
  await expect(page.getByText('Última vez')).toHaveCount(0)
})

test('una sesión que no existe lo dice', async ({ page }) => {
  await page.goto('/entreno/rutina/z9')
  await expect(page.getByRole('heading', { name: 'Esta sesión no existe' })).toBeVisible()
})
