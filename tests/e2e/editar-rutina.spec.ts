import { expect, test } from './plan.ts'

// Editar rutina (A11–A13): desde «Tu rutina», con el plan de prueba (MUTA Cuerpo completo, toca B1).

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

test('se abre con la sesión que toca y cada ejercicio con su pauta', async ({ page }) => {
  const hoja = await abrir(page)
  await expect(hoja.getByRole('radio', { name: 'B1' })).toBeChecked()
  const lista = hoja.getByRole('list', { name: 'Ejercicios de B1' })
  await expect(lista.getByRole('button').first()).toContainText('Peso muerto rumano')
  await expect(lista.getByRole('button').first()).toContainText('3 series de 6–10, a 2 del fallo, 3:00')
  await hoja.getByText('A2', { exact: true }).click()
  await expect(hoja.getByRole('list', { name: 'Ejercicios de A2' })).toContainText('Remo en polea baja')
})

test('editar la pauta se guarda en el plan y se ve en Ver sesión', async ({ page }) => {
  const hoja = await abrir(page)
  await hoja.getByRole('button', { name: /^1 Peso muerto rumano/ }).click()
  const ej = page.getByRole('dialog', { name: 'Peso muerto rumano' })
  await ej.getByRole('button', { name: 'Series: más' }).click()
  await ej.getByText('Queda 1', { exact: true }).click()
  await ej.getByRole('button', { name: '2:00' }).click()
  await ej.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.getByText('Cambios guardados')).toBeVisible()
  await expect(page.getByRole('button', { name: /^1 Peso muerto rumano/ })).toContainText(
    '4 series de 6–10, a 1 del fallo, 2:00',
  )
  // En Ver sesión (navegando por la app) y, al recargar, sigue guardado
  await page.getByRole('dialog', { name: 'Editar rutina' }).getByRole('button', { name: 'Cerrar' }).click()
  await page.getByRole('link', { name: /Isquios, glúteo y pecho/ }).click()
  await expect(page.getByRole('button', { name: /Peso muerto rumano/ })).toContainText(
    '4 series · 6–10 reps · a 1 del fallo',
  )
  await page.reload()
  await expect(page.getByRole('button', { name: /Peso muerto rumano/ })).toContainText(
    '4 series · 6–10 reps · a 1 del fallo',
  )
})

test('quitar, añadir de la biblioteca y mover; volver a la rutina lo deshace todo', async ({ page }) => {
  const hoja = await abrir(page)
  await hoja.getByRole('button', { name: /Crunch en máquina/ }).click()
  await page
    .getByRole('dialog', { name: 'Crunch en máquina' })
    .getByRole('button', { name: 'Quitar de la rutina' })
    .click()
  await page
    .getByRole('dialog', { name: '¿Quitar Crunch en máquina?' })
    .getByRole('button', { name: 'Quitar' })
    .click()
  const lista = page.getByRole('list', { name: 'Ejercicios de B1' })
  await expect(lista).not.toContainText('Crunch en máquina')

  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  const bib = page.getByRole('dialog', { name: 'Elegir ejercicio' })
  await bib.getByRole('searchbox').fill('face pull')
  await bib
    .getByRole('button', { name: /^Face pull/ })
    .first()
    .click()
  await expect(lista.getByRole('button').last()).toContainText('Face pull')
  await expect(lista.getByRole('button').last()).toContainText('Añadido por ti')

  // Mover con «Subir un puesto» (Más opciones)
  await lista.getByRole('button').last().click()
  const ej = page.getByRole('dialog', { name: 'Face pull' })
  await ej.getByText('Más opciones').click()
  await ej.getByRole('button', { name: 'Subir un puesto' }).click()
  await ej.getByRole('button', { name: 'Rutina', exact: true }).click()
  await expect(lista.getByRole('button').nth(5)).toContainText('Face pull')

  await page.getByRole('button', { name: 'Volver a la rutina original' }).click()
  await page.getByRole('button', { name: 'Todas las sesiones' }).click()
  await expect(lista).toContainText('Crunch en máquina')
  await expect(lista).not.toContainText('Face pull')
})

test('mantener pulsado y arrastrar cambia de sitio', async ({ page }) => {
  await abrir(page)
  const lista = page.getByRole('list', { name: 'Ejercicios de B1' })
  const primero = lista.getByRole('button').nth(0)
  const tercero = lista.getByRole('button').nth(2)
  const a = (await primero.boundingBox())!
  const b = (await tercero.boundingBox())!
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(450)
  // Se suelta en la parte de arriba de la tercera fila: ocupa su puesto
  await page.mouse.move(b.x + b.width / 2, b.y + b.height * 0.3, { steps: 8 })
  await page.mouse.up()
  await expect(lista.getByRole('button').nth(2)).toContainText('Peso muerto rumano')
  await expect(lista.getByRole('button').nth(0)).toContainText('Press inclinado con mancuernas')
})

test('cambiar por otro que hace lo mismo, en tu plan', async ({ page }) => {
  const hoja = await abrir(page)
  await hoja.getByRole('button', { name: /^1 Peso muerto rumano/ }).click()
  await page
    .getByRole('dialog', { name: 'Peso muerto rumano' })
    .getByRole('button', { name: 'Cambiar por otro ejercicio' })
    .click()
  const cambiar = page.getByRole('dialog', { name: 'Cambiar ejercicio' })
  await expect(cambiar.getByRole('radio', { name: 'Solo hoy' })).toHaveCount(0)
  await cambiar.getByRole('button', { name: /^Peso muerto piernas rígidas/ }).click()
  const fila = page.getByRole('list', { name: 'Ejercicios de B1' }).getByRole('button').first()
  await expect(fila).toContainText('Peso muerto piernas rígidas')
  await expect(fila).toContainText('En lugar de Peso muerto rumano')
})
