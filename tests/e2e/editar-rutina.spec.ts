import { expect, test } from './plan.ts'

// Editar rutina (A11–A13): desde «Tu rutina», con el plan de prueba (MUTA Cuerpo completo, toca B1).
const B1 = 'Isquios, glúteo y pecho'

async function abrir(page: import('@playwright/test').Page) {
  await page.goto('/entreno')
  await page.getByRole('button', { name: 'Tu rutina' }).click()
  await page
    .getByRole('dialog', { name: 'Tu rutina' })
    .getByRole('button', { name: /Editar rutina/ })
    .click()
  const hoja = page.getByRole('dialog', { name: 'Editar rutina' })
  await expect(hoja).toBeVisible()
  // La hoja sube con una animación: se espera a que no quede ninguna en marcha para medir las filas
  await page.waitForTimeout(100)
  await expect
    .poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length))
    .toBe(0)
  return hoja
}

const filas = (page: import('@playwright/test').Page, sesion = B1) =>
  page.getByRole('list', { name: `Ejercicios de ${sesion}` }).getByRole('listitem')

test('se abre con la sesión que toca, por su nombre, y cada ejercicio con su pauta corta', async ({
  page,
}) => {
  const hoja = await abrir(page)
  await expect(hoja.getByRole('radio', { name: B1 })).toBeChecked()
  await expect(filas(page).first()).toContainText('Peso muerto rumano')
  await expect(filas(page).first()).toContainText('3 × 6–10 · 3:00')
  await hoja.getByText('Espalda y cuádriceps', { exact: true }).click()
  await expect(page.getByRole('list', { name: 'Ejercicios de Espalda y cuádriceps' })).toContainText(
    'Remo en polea baja',
  )
})

test('el entrenador dice un consejo cada vez y «Vale» lo quita', async ({ page }) => {
  const hoja = await abrir(page)
  const consejo = hoja.getByRole('note', { name: 'Consejo del entrenador' })
  await expect(consejo).toHaveCount(1)
  const antes = await consejo.textContent()
  await consejo.getByRole('button', { name: 'Vale' }).click()
  await expect(hoja.getByRole('note', { name: 'Consejo del entrenador' })).not.toHaveText(antes ?? '')
})

test('editar la pauta se guarda sola y se ve en Ver sesión', async ({ page }) => {
  await abrir(page)
  await page.getByRole('button', { name: /^Peso muerto rumano/ }).click()
  const ej = page.getByRole('dialog', { name: 'Peso muerto rumano' })
  await ej.getByRole('button', { name: 'Series: más' }).click()
  await ej.locator('summary').click()
  await ej.getByText('Queda 1', { exact: true }).click()
  for (let i = 0; i < 4; i++) await ej.getByRole('button', { name: 'Descanso: menos' }).click()
  await expect(ej.getByLabel('Descanso', { exact: true })).toHaveText('2:00')
  await ej.getByRole('button', { name: B1 }).click()
  await expect(filas(page).first()).toContainText('4 × 6–10 · 2:00')
  // En Ver sesión (navegando por la app) y, al recargar, sigue guardado
  await page.getByRole('dialog', { name: 'Editar rutina' }).getByRole('button', { name: 'Cerrar' }).click()
  await page.getByRole('link', { name: new RegExp(B1) }).click()
  await expect(page.getByRole('button', { name: /Peso muerto rumano/ })).toContainText(
    '4 series · 6–10 reps · a 1 del fallo',
  )
  await page.reload()
  await expect(page.getByRole('button', { name: /Peso muerto rumano/ })).toContainText(
    '4 series · 6–10 reps · a 1 del fallo',
  )
})

test('quitar, añadir de la biblioteca y mover con el teclado; volver a la rutina lo deshace todo', async ({
  page,
}) => {
  await abrir(page)
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

  await page.getByRole('button', { name: 'Volver a la rutina original' }).click()
  await page.getByRole('button', { name: 'Todas las sesiones' }).click()
  await expect(lista).toContainText('Crunch en máquina')
  await expect(lista).not.toContainText('Face pull')
})

test('arrastrar el asa cambia de sitio', async ({ page }) => {
  await abrir(page)
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
  await abrir(page)
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
