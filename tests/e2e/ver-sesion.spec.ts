import { expect, test } from './plan.ts'

// Ver sesión (al tocar una tarjeta de Tu plan) con el plan de prueba (plan.ts): B1 real de MUTA y su historial.

test('la tarjeta de B1 abre Ver sesión, sin pestañas, y «Empezar B1» lleva a la sesión', async ({ page }) => {
  await page.goto('/entreno')
  await page.getByRole('link', { name: /Isquios, glúteo y pecho/ }).click()
  await expect(page).toHaveURL('/entreno/rutina/b1')
  await expect(page.getByRole('heading', { name: 'B1 Isquios, glúteo y pecho', level: 1 })).toBeVisible()
  await expect(page.getByText('7 ejercicios · 17 series · 55 min')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Pestañas' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Empezar B1' })).toHaveAttribute('href', '/entreno/sesion/b1')
  await page.getByRole('link', { name: 'Volver a Tu plan' }).click()
  await expect(page).toHaveURL('/entreno')
})

test('la gráfica enseña la última vez y cambia de medida', async ({ page }) => {
  await page.goto('/entreno/rutina/b1')
  // Hace 7 días, 5493 kg; hace 14, con 2,5 kg menos en cada serie, 5040 kg
  await expect(page.getByText('5,5 t', { exact: true })).toBeVisible()
  await expect(page.getByText('+10 % que la anterior')).toBeVisible()
  await expect(page.getByRole('img', { name: /^Tonelaje de \d+ entrenos$/ })).toBeVisible()

  await page.getByText('Repeticiones', { exact: true }).click()
  await expect(page.getByText('181 reps', { exact: true })).toBeVisible()
  await expect(page.getByText('Igual que la anterior')).toBeVisible()
  await expect(page.getByRole('img', { name: /^Repeticiones de \d+ entrenos$/ })).toBeVisible()
})

test('un ejercicio se despliega con su ficha en pequeño y lo que hiciste la última vez', async ({ page }) => {
  await page.goto('/entreno/rutina/b1')
  const fila = page.getByRole('button', { name: /Peso muerto rumano/ })
  await expect(fila).toHaveAttribute('aria-expanded', 'false')
  await fila.click()
  await expect(fila).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByText('Última vez')).toBeVisible()
  await expect(page.getByText('62,5 × 6')).toBeVisible()
  // La ficha en pequeño: lo que toca hoy, los músculos, la clave y el enlace a la completa
  await expect(page.getByText('62,5 kg × 6–10')).toBeVisible()
  await expect(page.getByText('Femoral · Glúteo · Aductores')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver ficha' })).toHaveAttribute(
    'href',
    '/entreno/ejercicio/peso_muerto_rumano',
  )
  await fila.click()
  await expect(page.getByText('Última vez')).toHaveCount(0)
})

test('una sesión que no existe lo dice', async ({ page }) => {
  await page.goto('/entreno/rutina/z9')
  await expect(page.getByRole('heading', { name: 'Esta sesión no existe' })).toBeVisible()
})

test('un ejercicio que en la biblioteca se llama de otra forma tiene su ficha y nada sugerido', async ({
  page,
}) => {
  await page.goto('/entreno/rutina/b1')
  // «Laterales en polea» (MUTA) es «Elevaciones laterales en polea» de la biblioteca (exercise-aliases.json)
  const fila = page.getByRole('button', { name: /Laterales en polea/ })
  await expect(fila).not.toContainText('Sugerido')
  await fila.click()
  await expect(page.getByText('15 kg × 14')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver ficha' })).toHaveAttribute(
    'href',
    '/entreno/ejercicio/elevaciones_laterales_en_polea',
  )
})
