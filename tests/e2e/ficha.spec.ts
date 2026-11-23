import { expect, test } from './plan.ts'

// Ficha del ejercicio (diseño aprobado del 2026-11-02): datos de prueba de state/muestra/ y la biblioteca real.

test('un ejercicio del plan: pauta, la clave, peso sugerido, progreso, músculos y descanso en la cabecera', async ({
  page,
}) => {
  await page.goto('/entreno/ejercicio/peso_muerto_rumano')
  await expect(page.getByRole('heading', { name: 'Ficha del ejercicio', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Peso muerto rumano' })).toBeVisible()
  // Sin pestañas: pantalla completa con su flecha atrás
  await expect(page.getByRole('navigation')).toHaveCount(0)
  const pauta = page.getByRole('list', { name: 'Pauta' })
  await expect(pauta.getByLabel('3 series')).toBeVisible()
  await expect(pauta.getByLabel('6 a 10 repeticiones, de tu plan')).toBeVisible()
  await expect(pauta.getByLabel('Descanso 3:00')).toBeVisible()

  await expect(page.getByRole('region', { name: 'La clave' })).toContainText('RIR 2–3')
  const sugerido = page.getByRole('region', { name: 'Peso sugerido' })
  await expect(sugerido).toContainText('↑ Sube')
  await expect(sugerido).toContainText('62,5 kg × 6–10')
  await expect(sugerido).toContainText(
    'Llegaste a 10 reps: subes 2,5 kg y vuelves a la parte baja del rango.',
  )

  const progreso = page.getByRole('region', { name: 'Progreso del ejercicio' })
  await expect(progreso).toContainText('84 kg')
  await expect(progreso).toContainText('desde la primera vez')
  await expect(progreso).toContainText('1RM estimado')
  // La misma gráfica cambia al tonelaje con su botón
  await progreso.getByText('Tonelaje', { exact: true }).click()
  await expect(progreso).toContainText('Tonelaje total')
  await expect(progreso).toContainText(' t')
  await expect(progreso.getByRole('img', { name: /de 3 entrenos/ })).toBeVisible()

  await expect(page.getByRole('region', { name: 'Músculos que trabaja' })).toContainText('Femoral')

  // El descanso solo se ve en la cabecera: se cambia en Editar rutina o en la sesión
  await expect(pauta.getByLabel(/^Descanso \d/)).toBeVisible()
  await expect(page.getByRole('region', { name: 'Descanso' })).toHaveCount(0)
  // Solo se puede empezar si vienes de la sesión
  await expect(page.getByRole('button', { name: 'Empezar ejercicio' })).toHaveCount(0)
})

test('un ejercicio que no está en tu plan: primera vez, sin descanso ni historial', async ({ page }) => {
  await page.goto('/entreno/ejercicio/press_banca')
  await expect(page.getByRole('region', { name: 'Peso sugerido' })).toContainText(
    'Primera vez: elige un peso con el que hagas 6–10 reps RIR 2.',
  )
  await expect(page.getByText('Aún no has hecho este ejercicio.')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Descanso' })).toHaveCount(0)
  // Tu rutina (MUTA cuerpo completo) no lo lleva: las típicas, y lo dice
})

test('desde la biblioteca se abre la ficha y la flecha vuelve', async ({ page }) => {
  await page.goto('/entreno?hoja=biblioteca')
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('prensa')
  await page.getByRole('link', { name: /^Prensa Cuádriceps/ }).click()
  await expect(page.getByRole('heading', { name: 'Prensa', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Volver' }).click()
  await expect(page.getByRole('dialog', { name: 'Biblioteca de ejercicios' })).toBeVisible()
})

test('un ejercicio que no existe lo dice', async ({ page }) => {
  await page.goto('/entreno/ejercicio/no_existe')
  await expect(page.getByText('Este ejercicio no está en la biblioteca')).toBeVisible()
})
