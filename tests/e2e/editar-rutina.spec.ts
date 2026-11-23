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
    .getByRole('button', { name: new RegExp(`^${nombre}`) })
    .click()
  await expect(hoja.getByRole('heading', { name: nombre })).toBeVisible()
  // La hoja sube con una animación: se espera a que no quede ninguna en marcha para medir las filas
  await sinAnimaciones(page)
  return hoja
}

/** Desliza una fila a la izquierda (con el ratón, desde su mitad: a la derecha está el asa) para descubrir «Quitar». */
async function deslizar(page: import('@playwright/test').Page, fila: import('@playwright/test').Locator) {
  await fila.scrollIntoViewIfNeeded()
  const caja = (await fila.boundingBox())!
  await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2)
  await page.mouse.down()
  await page.mouse.move(caja.x + caja.width / 2 - 140, caja.y + caja.height / 2, { steps: 8 })
  await page.mouse.up()
}

const filas = (page: import('@playwright/test').Page, sesion = B1) =>
  page.getByRole('list', { name: `Ejercicios de ${sesion}` }).getByRole('listitem')

test('se abre con tu semana en orden y sus días de descanso; una sesión abre sus ejercicios y «Tu semana» vuelve', async ({
  page,
}) => {
  const hoja = await abrir(page)
  const semana = hoja.getByRole('list', { name: 'Tu semana' })
  // MUTA Cuerpo completo: A1 · B1 · descanso · A2 · B2 · descanso, en una sola lista
  await expect(semana.getByRole('listitem')).toHaveCount(4 + 2)
  await expect(semana.getByText('Descanso', { exact: true })).toHaveCount(2)
  await expect(semana.getByRole('listitem').first()).toContainText('Cuádriceps y espalda')
  await semana.getByRole('button', { name: new RegExp(`^${B1}`) }).click()
  await expect(hoja.getByRole('heading', { name: B1 })).toBeVisible()
  await expect(filas(page).first()).toContainText('Peso muerto rumano')
  await expect(filas(page).first()).toContainText('3 series · 6–10 reps · 3:00')
  await hoja.getByRole('button', { name: 'Tu semana' }).click()
  await expect(hoja.getByRole('list', { name: 'Tu semana' })).toBeVisible()
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
  // Repeticiones: mínimo y máximo, cada uno de 1 en 1 y a la vista
  await ej.getByRole('button', { name: 'Máximo de reps: más' }).click()
  await ej.getByRole('button', { name: 'Máximo de reps: más' }).click()
  await expect(ej.getByLabel('Máximo de reps', { exact: true })).toHaveText('12')
  await ej.getByRole('button', { name: 'RIR: menos' }).click()
  await expect(ej.getByText('Terminas con 1 en reserva')).toBeVisible()
  for (let i = 0; i < 4; i++) await ej.getByRole('button', { name: 'Descanso entre series: menos' }).click()
  await expect(ej.getByLabel('Descanso entre series', { exact: true })).toHaveText('2:00')
  await ej.getByRole('button', { name: B1 }).click()
  await expect(filas(page).first()).toContainText('4 series · 6–12 reps · 2:00')
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
  // Se quita sin preguntar, con «Deshacer»
  const lista = page.getByRole('list', { name: `Ejercicios de ${B1}` })
  await expect(lista).not.toContainText('Crunch en máquina')
  await page.getByRole('status').getByRole('button', { name: 'Deshacer' }).click()
  await expect(lista).toContainText('Crunch en máquina')
  // Deslizando la fila a la izquierda, lo mismo
  await deslizar(page, filas(page).filter({ hasText: 'Crunch en máquina' }))
  await page.getByRole('button', { name: 'Quitar Crunch en máquina' }).click()
  await expect(page.getByRole('status')).toContainText('Crunch en máquina quitado')
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

test('días de descanso: se quitan deslizando (con «Deshacer»), se añaden con el «+», se mueven y vuelven a los de la rutina', async ({
  page,
}) => {
  const hoja = await abrir(page)
  const semana = hoja.getByRole('list', { name: 'Tu semana' })
  const dias = semana.getByRole('listitem')
  // A1 · B1 · descanso · A2 · B2 · descanso: se quita el de después de B1
  await deslizar(page, dias.nth(2))
  await hoja.getByRole('button', { name: `Quitar el día de descanso después de ${B1}` }).click()
  await expect(page.getByRole('status')).toContainText('Día de descanso quitado')
  await expect(semana.getByText('Descanso', { exact: true })).toHaveCount(1)
  await page.getByRole('status').getByRole('button', { name: 'Deshacer' }).click()
  await expect(semana.getByText('Descanso', { exact: true })).toHaveCount(2)
  await deslizar(page, dias.nth(2))
  await hoja.getByRole('button', { name: `Quitar el día de descanso después de ${B1}` }).click()
  await expect(semana.getByText('Descanso', { exact: true })).toHaveCount(1)

  // El «+»: un día de descanso entra al final
  await hoja.getByRole('button', { name: 'Añadir un día' }).click()
  await hoja.getByRole('menuitem', { name: 'Día de descanso' }).click()
  await expect(semana.getByText('Descanso', { exact: true })).toHaveCount(2)
  await expect(dias.last()).toContainText('Descanso')
  // A1 · B1 · A2 · B2 · descanso · descanso: con el asa (teclado), el primero sube a después de A1
  for (let k = 0; k < 3; k++)
    await semana.getByRole('button', { name: 'Mover Descanso' }).first().press('ArrowUp')
  await expect(dias.nth(1)).toContainText('Descanso')

  // Se guarda en el plan: al volver a abrir sigue igual
  const otra = await abrir(page)
  const lista = otra.getByRole('list', { name: 'Tu semana' }).getByRole('listitem')
  await expect(lista.nth(1)).toContainText('Descanso')
  // «Volver a la rutina original» repone los de la rutina
  await otra.getByRole('button', { name: 'Volver a la rutina original' }).click()
  await page
    .getByRole('dialog', { name: 'Volver a la rutina original' })
    .getByRole('button', { name: 'Volver a la original' })
    .click()
  await expect(lista.nth(2)).toContainText('Descanso')
})

test('mover una sesión cambia tu semana y la que toca sigue tocando', async ({ page }) => {
  const hoja = await abrir(page)
  const semana = hoja.getByRole('list', { name: 'Tu semana' })
  // B1 (la que toca) sube al primer puesto
  await semana.getByRole('button', { name: `Mover ${B1}` }).press('ArrowUp')
  await expect(semana.getByRole('listitem').first()).toContainText(B1)
  await hoja.getByRole('button', { name: 'Cerrar' }).click()
  // En Tu plan sigue tocando B1, también al recargar
  await expect(page.getByRole('link', { name: 'Empezar B1' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('link', { name: 'Empezar B1' })).toBeVisible()
})

test('un día de entrenamiento nuevo: una sesión vacía al final, se le añaden ejercicios y se quita', async ({
  page,
}) => {
  const hoja = await abrir(page)
  await hoja.getByRole('button', { name: 'Añadir un día' }).click()
  await hoja.getByRole('menuitem', { name: 'Día de entrenamiento' }).click()
  // Se abre la sesión nueva, vacía
  await expect(hoja.getByRole('heading', { name: 'Sesión 5' })).toBeVisible()
  await expect(hoja).toContainText('Sin ejercicios: añade el primero')
  await hoja.getByRole('button', { name: 'Añadir ejercicio' }).click()
  const bib = page.getByRole('dialog', { name: 'Elegir ejercicio' })
  await bib.getByRole('searchbox').fill('face pull')
  await bib
    .getByRole('button', { name: /^Face pull/ })
    .first()
    .click()
  await expect(filas(page, 'Sesión 5').first()).toContainText('Face pull')
  // En tu semana, al final; deslizando, se quita (pregunta antes)
  await hoja.getByRole('button', { name: 'Tu semana' }).click()
  const semana = hoja.getByRole('list', { name: 'Tu semana' })
  await expect(semana.getByRole('listitem').last()).toContainText('Sesión 5')
  await deslizar(page, semana.getByRole('listitem').last())
  await hoja.getByRole('button', { name: 'Quitar Sesión 5' }).click()
  await page
    .getByRole('dialog', { name: '¿Quitar Sesión 5?' })
    .getByRole('button', { name: 'Quitar' })
    .click()
  await expect(page.getByRole('list', { name: 'Tu semana' })).not.toContainText('Sesión 5')
})
