import { ENTRENOS, expect, prepararPlan, test } from './plan.ts'

// Tu semana con lo planeado, el día de descanso de Tu plan y cargar tu rutina desde un CSV.

/** La fecha de ayer en hora local (AAAA-MM-DD) y su hora de inicio. */
function ayer() {
  const d = new Date(Date.now() - 86_400_000)
  d.setHours(18, 0, 0, 0)
  return {
    fecha: new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10),
    inicio: d.getTime(),
  }
}

test('Tu semana: hoy con la sesión que toca y, si queda semana, el descanso de la rutina detrás', async ({
  page,
}) => {
  await page.goto('/entreno')
  const semana = page.getByRole('region', { name: 'Tu semana' })
  await expect(semana.getByRole('img', { name: /: hoy$/ })).toContainText('B1')
  // MUTA Cuerpo completo: A1 · B1 · descanso · A2 · B2 · descanso
  const diaHoy = (new Date().getDay() + 6) % 7
  if (diaHoy < 6)
    await expect(
      semana
        .getByRole('listitem')
        .nth(diaHoy + 1)
        .getByRole('img'),
    ).toHaveAccessibleName(/descanso$/)
  if (diaHoy < 5) await expect(semana.getByRole('listitem').nth(diaHoy + 2)).toContainText('A2')
})

test('si hoy toca descanso, sale «Hoy descansas» y se puede entrenar igualmente', async ({ page }) => {
  // Ayer hiciste A1 y le pones un descanso detrás en Editar rutina
  const { fecha, inicio } = ayer()
  await prepararPlan(page, [...ENTRENOS, { ...ENTRENOS[2], id: 'prueba-ayer', date: fecha, fecha, inicio }])
  await page.goto('/entreno')
  await page.getByRole('button', { name: 'Editar', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Tu rutina' })
    .getByRole('button', { name: /Editar rutina/ })
    .click()
  await page.getByRole('button', { name: 'Añadir un día de descanso' }).click()
  await page
    .getByRole('dialog', { name: '¿Después de qué sesión?' })
    .getByText('1. Cuádriceps y espalda', { exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Quitar el día de descanso después de Cuádriceps y espalda' }),
  ).toBeVisible()
  await page.goto('/entreno')
  await expect(page.getByRole('heading', { name: 'Hoy descansas' })).toBeVisible()
  await expect(page.getByText('La siguiente: B1 · Isquios, glúteo y pecho.')).toBeVisible()
  await expect(page.getByRole('link', { name: /Isquios, glúteo y pecho/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'Entrenar igualmente' }).click()
  await expect(page.getByRole('link', { name: /^Siguiente B1/ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Empezar B1' })).toBeVisible()
})

const CSV = `Sesión;Ejercicio;Series;Repeticiones;RIR;Descanso
Torso;Press banca;3;6-10;2;3:00
Torso;Remo con barra;3;8-12;1;2 min
Descanso
Pierna;Sentadilla;4;5;2;180`

test('cargar tu rutina desde un CSV: vista previa, nombre y empezar', async ({ page }) => {
  await page.goto('/entreno/rutinas')
  await expect(page.getByRole('link', { name: 'Descargar plantilla' })).toHaveAttribute(
    'download',
    'rutina-plantilla.csv',
  )
  await page
    .getByText('Cargar desde CSV')
    .locator('input')
    .setInputFiles({
      name: 'Mi rutina de casa.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(CSV),
    })
  const hoja = page.getByRole('dialog', { name: 'Tu rutina' })
  await expect(hoja.getByRole('textbox', { name: 'Nombre' })).toHaveValue('Mi rutina de casa')
  await expect(hoja).toContainText('2 sesiones · 3 ejercicios · 1 día de descanso')
  await expect(hoja.getByRole('list', { name: 'Tu semana' })).toContainText('Torso')
  await hoja.getByRole('button', { name: 'Empezar esta rutina' }).click()
  await expect(page).toHaveURL(/\/entreno$/)
  await expect(page.getByRole('link', { name: /Torso/ })).toBeVisible()
  await page.getByRole('link', { name: /Torso/ }).click()
  await expect(page.getByRole('button', { name: /Press banca/ })).toContainText(
    '3 series · 6–10 reps · a 2 del fallo',
  )
})

test('un CSV con errores dice cuáles y en qué fila', async ({ page }) => {
  await page.goto('/entreno/rutinas')
  await page
    .getByText('Cargar desde CSV')
    .locator('input')
    .setInputFiles({
      name: 'mal.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('Sesión;Ejercicio;Series\nTorso;Press banca;tres'),
    })
  const hoja = page.getByRole('dialog', { name: 'No se pudo leer el CSV' })
  await expect(hoja).toContainText('Fila 2: «tres» no es un número de series.')
})

test('dropset: cada serie trae su fila de bajada para apuntarla; «+ Bajada» añade otra y la × la quita', async ({
  page,
}) => {
  await page.goto('/entreno/rutinas')
  await page
    .getByText('Cargar desde CSV')
    .locator('input')
    .setInputFiles({
      name: 'hombro.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(
        'Sesión;Ejercicio;Series;Repeticiones;RIR\nHombro;Elevaciones laterales (dropset);2;12-15;0',
      ),
    })
  await page
    .getByRole('dialog', { name: 'Tu rutina' })
    .getByRole('button', { name: 'Empezar esta rutina' })
    .click()
  await expect(page).toHaveURL(/\/entreno$/)
  await page.goto('/entreno/sesion/s1')
  await expect(page.getByRole('list', { name: 'Pauta' }).first()).toContainText('Dropset')
  // Desde el principio, sin marcar la serie: una fila vacía por serie, sin × ni «+ Bajada»
  await expect(page.getByLabel('Kilos de la bajada 1 de la serie 1')).toHaveValue('')
  await expect(page.getByLabel('Kilos de la bajada 1 de la serie 2')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Quitar la bajada 1 de la serie 1' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Bajada', exact: true })).toHaveCount(0)

  await page.getByLabel('Kilos de la bajada 1 de la serie 1').fill('6')
  await page.getByLabel('Repeticiones de la bajada 1 de la serie 1').fill('10')
  await page.getByRole('button', { name: 'Bajada', exact: true }).first().click()
  await page.getByLabel('Kilos de la bajada 2 de la serie 1').fill('3')
  // Se guarda con la sesión: al recargar sigue ahí
  await page.reload()
  await expect(page.getByLabel('Kilos de la bajada 1 de la serie 1')).toHaveValue('6')
  await expect(page.getByLabel('Kilos de la bajada 2 de la serie 1')).toHaveValue('3')
  await page.getByRole('button', { name: 'Quitar la bajada 2 de la serie 1' }).click()
  await expect(page.getByLabel('Kilos de la bajada 2 de la serie 1')).toHaveCount(0)
})
