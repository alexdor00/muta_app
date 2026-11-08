import { expect, sinAnimaciones, test } from './plan.ts'

// Editar rutina (A11–A13): desde «Tu rutina», con el plan de prueba (MUTA Cuerpo completo, toca B1).
const B1 = 'Isquios, glúteo y pecho'

async function abrir(page: import('@playwright/test').Page) {
  await page.goto('/entreno')
  await page.getByRole('button', { name: 'Editar', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Tu rutina' })
    .getByRole('button', { name: /Editar rutina/ })
    .click()
  const hoja = page.getByRole('dialog', { name: 'Editar rutina' })
  await expect(hoja.getByRole('list', { name: 'Tu semana' })).toBeVisible()
  return hoja
}

/** Abre Editar rutina y, en tu semana, la sesión `nombre` (B1 si no se dice). */
async function abrirSesion(page: import('@playwright/test').Page, nombre = B1) {
  const hoja = await abrir(page)
  await hoja
    .getByRole('list', { name: 'Tu semana' })
    .getByRole('button', { name: new RegExp(`^\\d+ ${nombre}`) })
    .click()
  await expect(hoja.getByRole('heading', { name: nombre })).toBeVisible()
  // La hoja sube con una animación: se espera a que no quede ninguna en marcha para medir las filas
  await sinAnimaciones(page)
  return hoja
}

const filas = (page: import('@playwright/test').Page, sesion = B1) =>
  page.getByRole('list', { name: `Ejercicios de ${sesion}` }).getByRole('listitem')

test('se abre con tu semana en orden y sus días de descanso; una sesión abre sus ejercicios y «Tu semana» vuelve', async ({
  page,
}) => {
  const hoja = await abrir(page)
  const semana = hoja.getByRole('list', { name: 'Tu semana' })
  // MUTA Cuerpo completo: A1 · B1 · descanso · A2 · B2 · descanso
  await expect(semana.getByRole('button')).toHaveCount(4 + 2)
  await expect(semana.getByText('Día de descanso')).toHaveCount(2)
  await expect(semana.getByRole('button').first()).toContainText('Cuádriceps y espalda')
  await semana.getByRole('button', { name: new RegExp(`^\\d+ ${B1}`) }).click()
  await expect(hoja.getByRole('heading', { name: B1 })).toBeVisible()
  await expect(filas(page).first()).toContainText('Peso muerto rumano')
  await expect(filas(page).first()).toContainText('3 × 6–10 · 3:00')
  await hoja.getByRole('button', { name: 'Tu semana' }).click()
  await expect(hoja.getByRole('list', { name: 'Tu semana' })).toBeVisible()
})

test('el entrenador va en una fila que abre su hoja, con los consejos numerados', async ({ page }) => {
  const hoja = await abrirSesion(page)
  await hoja.getByRole('button', { name: /consejos? del entrenador/ }).click()
  const consejos = page.getByRole('dialog', { name: 'Consejos del entrenador' })
  await expect(consejos).toContainText(`Para ${B1}`)
  await expect(consejos.getByRole('listitem').first()).toBeVisible()
})

test('el nombre de la sesión se cambia con el lápiz y sale en Tu plan', async ({ page }) => {
  const hoja = await abrirSesion(page)
  await hoja.getByRole('button', { name: `Cambiar el nombre de ${B1}` }).click()
  const campo = hoja.getByRole('textbox', { name: 'Nombre de la sesión' })
  await campo.fill('Piernas y pecho')
  await campo.press('Enter')
  await expect(page.getByText('Ahora se llama «Piernas y pecho»')).toBeVisible()
  await expect(hoja.getByRole('heading', { name: 'Piernas y pecho' })).toBeVisible()
  await page.goto('/entreno')
  await expect(page.getByRole('link', { name: /Piernas y pecho/ })).toBeVisible()
})

test('editar la pauta se guarda sola y se ve en Ver sesión', async ({ page }) => {
  await abrirSesion(page)
  await page.getByRole('button', { name: /^Peso muerto rumano/ }).click()
  const ej = page.getByRole('dialog', { name: 'Peso muerto rumano' })
  await ej.getByRole('button', { name: 'Series: más', exact: true }).click()
  // Repeticiones: mínimo y máximo, cada uno de 1 en 1
  await ej.locator('summary', { hasText: 'Repeticiones' }).click()
  await ej.getByRole('button', { name: 'Máximo de reps: más' }).click()
  await ej.getByRole('button', { name: 'Máximo de reps: más' }).click()
  await expect(ej.locator('summary', { hasText: 'Repeticiones' })).toContainText('6–12')
  await ej.getByRole('button', { name: 'RIR (repeticiones en reserva): menos' }).click()
  await expect(ej.getByText('Termina cada serie cuando aún podrías hacer 1 repetición más.')).toBeVisible()
  for (let i = 0; i < 4; i++) await ej.getByRole('button', { name: 'Descanso entre series: menos' }).click()
  await expect(ej.getByLabel('Descanso entre series', { exact: true })).toHaveText('2:00')
  await ej.getByRole('button', { name: B1 }).click()
  await expect(filas(page).first()).toContainText('4 × 6–12 · 2:00')
  // En Ver sesión (navegando por la app) y, al recargar, sigue guardado
  await page.getByRole('dialog', { name: 'Editar rutina' }).getByRole('button', { name: 'Cerrar' }).click()
  await page.getByRole('link', { name: new RegExp(B1) }).click()
  await expect(page.getByRole('button', { name: /Peso muerto rumano/ })).toContainText(
    '4 series · 6–12 reps · RIR 1',
  )
  await page.reload()
  await expect(page.getByRole('button', { name: /Peso muerto rumano/ })).toContainText(
    '4 series · 6–12 reps · RIR 1',
  )
})

test('quitar, añadir de la biblioteca y mover con el teclado; volver la sesión a la original lo deshace', async ({
  page,
}) => {
  await abrirSesion(page)
  await page.getByRole('button', { name: /^Crunch en máquina/ }).click()
  await page
    .getByRole('dialog', { name: 'Crunch en máquina' })
    .getByRole('button', { name: 'Quitar' })
    .click()
  await page
    .getByRole('dialog', { name: '¿Quitar Crunch en máquina?' })
    .getByRole('button', { name: 'Quitar' })
    .click()
  const lista = page.getByRole('list', { name: `Ejercicios de ${B1}` })
  await expect(lista).not.toContainText('Crunch en máquina')

  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  const bib = page.getByRole('dialog', { name: 'Elegir ejercicio' })
  await bib.getByRole('searchbox').fill('face pull')
  await bib
    .getByRole('button', { name: /^Face pull/ })
    .first()
    .click()
  await expect(filas(page).last()).toContainText('Face pull')
  await expect(filas(page).last()).toContainText('Añadido por ti')

  // El asa, con el teclado: flecha arriba sube un puesto
  const total = await filas(page).count()
  await page.getByRole('button', { name: 'Mover Face pull' }).press('ArrowUp')
  await expect(filas(page).nth(total - 2)).toContainText('Face pull')

  await page.getByRole('button', { name: 'Volver esta sesión a la original' }).click()
  await page
    .getByRole('dialog', { name: `¿Volver ${B1} a la original?` })
    .getByRole('button', { name: 'Volver a la original' })
    .click()
  await expect(lista).toContainText('Crunch en máquina')
  await expect(lista).not.toContainText('Face pull')
})

test('arrastrar el asa cambia de sitio', async ({ page }) => {
  await abrirSesion(page)
  const asa = page.getByRole('button', { name: 'Mover Peso muerto rumano' })
  const a = (await asa.boundingBox())!
  const b = (await filas(page).nth(2).boundingBox())!
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
  await page.mouse.down()
  // Se suelta en la parte de arriba de la tercera fila: ocupa su puesto
  await page.mouse.move(a.x + a.width / 2, b.y + b.height * 0.3, { steps: 8 })
  await page.mouse.up()
  await expect(filas(page).nth(2)).toContainText('Peso muerto rumano')
  await expect(filas(page).nth(0)).toContainText('Press inclinado con mancuernas')
})

test('cambiar por otro que hace lo mismo, en tu plan', async ({ page }) => {
  await abrirSesion(page)
  await page.getByRole('button', { name: /^Peso muerto rumano/ }).click()
  await page
    .getByRole('dialog', { name: 'Peso muerto rumano' })
    .getByRole('button', { name: 'Cambiar por otro' })
    .click()
  const cambiar = page.getByRole('dialog', { name: 'Cambiar ejercicio' })
  await expect(cambiar.getByRole('radio', { name: 'Solo hoy' })).toHaveCount(0)
  await cambiar.getByRole('button', { name: /^Peso muerto piernas rígidas/ }).click()
  await expect(filas(page).first()).toContainText('Peso muerto piernas rígidas')
  await expect(filas(page).first()).toContainText('En lugar de Peso muerto rumano')
})

test('días de descanso: se quitan y se añaden «después de qué sesión», se guardan y vuelven a los de la rutina', async ({
  page,
}) => {
  const hoja = await abrir(page)
  const semana = hoja.getByRole('list', { name: 'Tu semana' })
  await hoja.getByRole('button', { name: `Quitar el día de descanso después de ${B1}` }).click()
  await expect(page.getByText('Día de descanso quitado')).toBeVisible()
  await expect(semana.getByText('Día de descanso')).toHaveCount(1)

  await hoja.getByRole('button', { name: 'Añadir un día de descanso' }).click()
  await page
    .getByRole('dialog', { name: '¿Después de qué sesión?' })
    .getByText('1. Cuádriceps y espalda', { exact: true })
    .click()
  await expect(page.getByText('Día de descanso después de Cuádriceps y espalda')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Quitar el día de descanso después de Cuádriceps y espalda' }),
  ).toBeVisible()

  // Se guarda en el plan: al volver a abrir sigue igual
  const otra = await abrir(page)
  await expect(otra.getByRole('button', { name: `Quitar el día de descanso después de ${B1}` })).toHaveCount(
    0,
  )
  // «Volver a la rutina original» repone los de la rutina
  await otra.getByRole('button', { name: 'Volver a la rutina original' }).click()
  await page
    .getByRole('dialog', { name: 'Volver a la rutina original' })
    .getByRole('button', { name: 'Volver a la original' })
    .click()
  await expect(otra.getByRole('button', { name: `Quitar el día de descanso después de ${B1}` })).toBeVisible()
})
