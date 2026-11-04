import { expect, test } from './plan.ts'

// Lo que salió de la hoja «Tu rutina» y vive ahora en su sitio: la foto de la sesión y la cobertura (en Editar rutina) y
// ocultar consejos (en «Consejos de hoy»). Con el plan de prueba (MUTA Cuerpo completo, toca B1).

/** Un punto PNG de 1 × 1, como si fuera una foto de la galería. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
  'base64',
)

async function editar(page: import('@playwright/test').Page) {
  await page.goto('/entreno')
  await page.getByRole('button', { name: 'Editar', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Tu rutina' })
    .getByRole('button', { name: /Editar rutina/ })
    .click()
  return page.getByRole('dialog', { name: 'Editar rutina' })
}

test('foto de la sesión (en Editar rutina): se pone, sale en la tarjeta, sigue al recargar y se quita', async ({
  page,
}) => {
  const hoja = await editar(page)
  await hoja.getByRole('button', { name: /foto (a|de) Isquios, glúteo y pecho/ }).click()
  const foto = page.getByRole('dialog', { name: 'Foto de la sesión' })
  await expect(foto.locator('summary', { hasText: 'Sesión' })).toContainText('Isquios, glúteo y pecho')
  await foto.getByText('Elegir de la galería').locator('input').setInputFiles({
    name: 'foto.png',
    mimeType: 'image/png',
    buffer: PNG,
  })
  await expect(page.getByText('Foto puesta')).toBeVisible()
  await expect(foto.getByRole('img', { name: 'Tu foto de Isquios, glúteo y pecho' })).toBeVisible()
  await foto.getByRole('button', { name: 'Cerrar' }).click()
  await expect(
    page
      .getByRole('dialog', { name: 'Editar rutina' })
      .getByRole('button', { name: 'Cambiar la foto de Isquios, glúteo y pecho' }),
  ).toBeVisible()
  await page.goto('/entreno')
  await expect(page.getByRole('link', { name: /Isquios, glúteo y pecho/ }).locator('img')).toHaveCount(1)
  await page.reload()
  await expect(page.getByRole('link', { name: /Isquios, glúteo y pecho/ }).locator('img')).toHaveCount(1)

  await (await editar(page)).getByRole('button', { name: /foto (a|de) Isquios, glúteo y pecho/ }).click()
  await page.getByRole('button', { name: 'Quitar la foto' }).click()
  await expect(page.getByText('Foto quitada')).toBeVisible()
  await page.goto('/entreno')
  await expect(page.getByRole('link', { name: /Isquios, glúteo y pecho/ }).locator('img')).toHaveCount(0)
})

test('la cobertura del método la dice el entrenador, con «Añadir…» a esta sesión', async ({ page }) => {
  const hoja = await editar(page)
  await hoja.getByRole('button', { name: /consejos? del entrenador/ }).click()
  const consejos = page.getByRole('dialog', { name: 'Consejos del entrenador' })
  const gluteo = consejos.getByRole('listitem').filter({ hasText: 'Glúteo: falta abducción.' })
  await expect(gluteo).toContainText('El método pide acortado, estirado y abducción.')
  await gluteo.getByRole('button', { name: 'Añadir abducción en máquina' }).click()
  await expect(page.getByText('Abducción en máquina añadido a Isquios, glúteo y pecho')).toBeVisible()
  await consejos.getByRole('button', { name: 'Cerrar' }).click()
  await expect(page.getByRole('list', { name: 'Ejercicios de Isquios, glúteo y pecho' })).toContainText(
    'Abducción en máquina',
  )
})

test('en «Consejos de hoy» se oculta un consejo de antes de empezar y se puede volver a enseñar', async ({
  page,
}) => {
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: /consejos para esta sesión/ }).click()
  const hoy = page.getByRole('dialog', { name: 'Consejos de hoy' })
  await expect(hoy.getByText('0 de 9')).toBeVisible()
  await hoy.getByRole('button', { name: /^Ocultar: Decide qué tarea/ }).click()
  await expect(hoy.getByText('0 de 8')).toBeVisible()
  await expect(hoy).not.toContainText('Decide qué tarea es la más valiosa')
  const otra = hoy
  await otra.getByRole('button', { name: '1 oculto · Volver a enseñar' }).click()
  await expect(otra.getByText('0 de 9')).toBeVisible()
})
