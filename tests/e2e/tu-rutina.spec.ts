import { expect, test } from './plan.ts'

// Las hojas de «Tu rutina» (A26–A30): foto de la sesión, cobertura muscular, rehacer el plan y mis consejos. Con el plan
// de prueba (MUTA Cuerpo completo, toca B1).

/** Un punto PNG de 1 × 1, como si fuera una foto de la galería. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
  'base64',
)

async function abrir(page: import('@playwright/test').Page, fila: string) {
  await page.goto('/entreno')
  await page.getByRole('button', { name: 'Tu rutina' }).click()
  await page.getByRole('dialog', { name: 'Tu rutina' }).getByRole('button', { name: fila }).click()
}

test('foto de la sesión: se pone desde la galería, sale en la tarjeta, sigue al recargar y se quita', async ({
  page,
}) => {
  await abrir(page, 'Añadir foto a la sesión')
  const hoja = page.getByRole('dialog', { name: 'Foto de la sesión' })
  await expect(hoja.locator('summary', { hasText: 'Sesión' })).toContainText('Isquios, glúteo y pecho')
  await hoja.getByText('Elegir de la galería').locator('input').setInputFiles({
    name: 'foto.png',
    mimeType: 'image/png',
    buffer: PNG,
  })
  await expect(page.getByText('Foto puesta')).toBeVisible()
  await expect(hoja.getByRole('img', { name: 'Tu foto de Isquios, glúteo y pecho' })).toBeVisible()
  await hoja.getByRole('button', { name: 'Cerrar' }).click()
  const tarjeta = page.getByRole('link', { name: /Isquios, glúteo y pecho/ })
  await expect(tarjeta.locator('img')).toHaveCount(1)
  await page.reload()
  await expect(page.getByRole('link', { name: /Isquios, glúteo y pecho/ }).locator('img')).toHaveCount(1)

  await abrir(page, 'Añadir foto a la sesión')
  await page.getByRole('button', { name: 'Quitar la foto' }).click()
  await expect(page.getByText('Foto quitada')).toBeVisible()
  await page
    .getByRole('dialog', { name: 'Foto de la sesión' })
    .getByRole('button', { name: 'Cerrar' })
    .click()
  await expect(page.getByRole('link', { name: /Isquios, glúteo y pecho/ }).locator('img')).toHaveCount(0)
})

test('cobertura muscular: lo que falta según el método y «+» lo añade a una sesión', async ({ page }) => {
  await abrir(page, 'Cobertura muscular')
  const hoja = page.getByRole('dialog', { name: 'Cobertura muscular' })
  const faltas = hoja.getByRole('list', { name: 'Por revisar' }).getByRole('listitem')
  const antes = await faltas.count()
  expect(antes).toBeGreaterThan(0)
  const boton = faltas.first().getByRole('button').first()
  const nombre = ((await boton.getAttribute('aria-label')) ?? '').replace(/^Añadir /, '')
  await boton.click()
  await page
    .getByRole('dialog', { name: `¿En qué sesión va ${nombre}?` })
    .getByText('Espalda y cuádriceps', { exact: true })
    .click()
  await expect(page.getByText(`${nombre} añadido a Espalda y cuádriceps`)).toBeVisible()
  await expect(faltas).toHaveCount(antes - 1)
})

test('rehacer el plan pregunta antes, quita lo cambiado y empieza por la primera sesión; los entrenos se quedan', async ({
  page,
}) => {
  await page.goto('/entreno')
  await expect(page.getByRole('link', { name: /^Hoy B1/ })).toBeVisible()
  await abrir(page, 'Rehacer el plan con mis respuestas')
  const hoja = page.getByRole('dialog', { name: '¿Rehacer el plan?' })
  await expect(hoja).toContainText('Tus entrenos y tus fotos se quedan')
  await hoja.getByRole('button', { name: 'Rehacer el plan' }).click()
  await expect(page.getByRole('link', { name: /^Hoy A1/ })).toBeVisible()
  // Los entrenos de prueba siguen ahí: B1 ya se hizo antes
  await page.goto('/entreno/rutina/b1')
  await expect(page.getByText('Aún no has hecho esta sesión.')).toHaveCount(0)
})

test('mis consejos: ocultar, cambiar y añadir; se guardan y se ven en la sesión', async ({ page }) => {
  await abrir(page, 'Mis consejos')
  const hoja = page.getByRole('dialog', { name: 'Mis consejos' })
  const lista = hoja.getByRole('list', { name: 'Consejos de antes de empezar' })
  const primero = lista.getByRole('listitem').first()
  const texto = ((await primero.getByRole('button').textContent()) ?? '').trim()
  await primero.getByRole('switch').click()
  await expect(primero.getByRole('switch')).not.toBeChecked()

  await lista.getByRole('listitem').nth(1).getByRole('button').click()
  await hoja.getByRole('textbox', { name: 'Texto del consejo' }).fill('Mi versión del segundo')
  await hoja.getByRole('button', { name: 'Guardar' }).click()
  await expect(lista).toContainText('Mi versión del segundo')
  await expect(lista).toContainText('Cambiado')

  await hoja.getByRole('button', { name: 'Añadir mi consejo' }).click()
  await hoja.getByRole('textbox', { name: 'Tu consejo' }).fill('Beber agua entre series')
  await hoja.getByRole('button', { name: 'Guardar' }).click()
  await expect(lista).toContainText('Beber agua entre series')
  await expect(lista).toContainText('Tuyo')

  // Se guarda: al recargar sigue igual
  await page.reload()
  await abrir(page, 'Mis consejos')
  const otra = page
    .getByRole('dialog', { name: 'Mis consejos' })
    .getByRole('list', { name: 'Consejos de antes de empezar' })
  await expect(otra.getByRole('listitem').first().getByRole('switch')).not.toBeChecked()
  await expect(otra).toContainText('Beber agua entre series')

  // En «Consejos de hoy» de la sesión: sin el oculto, con el cambiado y el tuyo
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: /consejos para esta sesión/ }).click()
  const hoy = page.getByRole('dialog', { name: /Consejos de hoy/ })
  await expect(hoy).toContainText('Mi versión del segundo')
  await expect(hoy).toContainText('Beber agua entre series')
  await expect(hoy).not.toContainText(texto)
})
