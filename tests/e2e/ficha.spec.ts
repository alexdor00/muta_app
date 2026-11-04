import { expect, test } from './plan.ts'

// Ficha del ejercicio (diseño aprobado del 2026-11-02): datos de prueba de state/muestra/ y la biblioteca real.

test('un ejercicio del plan: pauta, la clave, peso sugerido, progreso, músculos y descanso', async ({
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
  await expect(page.getByText('Repeticiones de tu plan')).toBeVisible()
  await expect(pauta.getByLabel('Descanso 3:00')).toBeVisible()

  await expect(page.getByRole('region', { name: 'La clave' })).not.toContainText('RIR')
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
  // Debajo, la del tonelaje total
  const tonelaje = page.getByRole('region', { name: 'Tonelaje del ejercicio' })
  await expect(tonelaje).toContainText('Tonelaje total')
  await expect(tonelaje).toContainText(' t')
  await expect(tonelaje.getByRole('img', { name: /de 3 entrenos/ })).toBeVisible()

  await expect(page.getByRole('region', { name: 'Músculos que trabaja' })).toContainText('Femoral')

  const descanso = page.getByRole('region', { name: 'Descanso' })
  await descanso.getByRole('button', { name: '15 segundos más' }).click()
  await expect(descanso.getByRole('button', { name: /^Descanso 3:15/ })).toBeVisible()
  await descanso.getByRole('button', { name: /^Descanso 3:15/ }).click()
  await page.getByRole('dialog', { name: 'Descanso' }).getByRole('button', { name: '2:00' }).click()
  await expect(pauta.getByLabel('Descanso 2:00')).toBeVisible()
  // Solo se puede empezar si vienes de la sesión
  await expect(page.getByRole('button', { name: 'Empezar ejercicio' })).toHaveCount(0)
})

test('un ejercicio que no está en tu plan: primera vez, sin descanso ni historial', async ({ page }) => {
  await page.goto('/entreno/ejercicio/press_banca')
  await expect(page.getByRole('region', { name: 'Peso sugerido' })).toContainText(
    'Primera vez: elige un peso con el que hagas 6–10 reps a 2 del fallo.',
  )
  await expect(page.getByText('Aún no has hecho este ejercicio.')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Descanso' })).toHaveCount(0)
  // Tu rutina (MUTA cuerpo completo) no lo lleva: las típicas, y lo dice
  await expect(page.getByText('Repeticiones típicas de este ejercicio: tu rutina no lo lleva')).toBeVisible()
})

test('desde la biblioteca se abre la ficha y la flecha vuelve', async ({ page }) => {
  await page.goto('/entreno?hoja=biblioteca')
  await page.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('prensa')
  await page.getByRole('link', { name: /^Prensa Cuádriceps/ }).click()
  await expect(page.getByRole('heading', { name: 'Prensa', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Volver' }).click()
  await expect(page.getByRole('dialog', { name: 'Biblioteca de ejercicios' })).toBeVisible()
})

test('desde la sesión, «Empezar ejercicio» vuelve con ese ejercicio abierto', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: /Press inclinado con mancuernas/ }).click()
  await page.getByRole('button', { name: 'Opciones de Press inclinado con mancuernas' }).click()
  await page.getByRole('link', { name: 'Ficha', exact: true }).click()
  await expect(page).toHaveURL(/\/entreno\/ejercicio\/press_inclinado_con_mancuernas\?sesion=b1&ej=1/)
  // Cerrar el ejercicio en la sesión no importa: se pide el de la ficha
  await page.getByRole('button', { name: 'Empezar ejercicio' }).click()
  await expect(page).toHaveURL(/\/entreno\/sesion\/b1$/)
  await expect(page.getByRole('button', { name: 'Opciones de Press inclinado con mancuernas' })).toBeVisible()
})

test('un ejercicio que no existe lo dice', async ({ page }) => {
  await page.goto('/entreno/ejercicio/no_existe')
  await expect(page.getByText('Este ejercicio no está en la biblioteca')).toBeVisible()
})
