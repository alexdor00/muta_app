import { expect, test } from './plan.ts'

// Lo que salió de la hoja «Tu rutina» y vive ahora en su sitio: la foto de la sesión (en Editar rutina) y
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
  // En tu semana, la sesión B1: ahí van su foto y su entrenador
  await page
    .getByRole('list', { name: 'Tu semana' })
    .getByRole('button', { name: /^Isquios, glúteo y pecho/ })
    .click()
  return page.getByRole('dialog', { name: 'Editar rutina' })
}

/** Las fotos de serie de las sesiones (las que salen si no pones la tuya). */
const DE_SERIE = /\/photos\/sesiones\//

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
  await expect(
    page.getByRole('link', { name: /Isquios, glúteo y pecho/ }).locator('img'),
  ).not.toHaveAttribute('src', DE_SERIE)
  await page.reload()
  await expect(
    page.getByRole('link', { name: /Isquios, glúteo y pecho/ }).locator('img'),
  ).not.toHaveAttribute('src', DE_SERIE)

  await (await editar(page)).getByRole('button', { name: /foto (a|de) Isquios, glúteo y pecho/ }).click()
  await page.getByRole('button', { name: 'Quitar la foto' }).click()
  await expect(page.getByText('Foto quitada')).toBeVisible()
  await page.goto('/entreno')
  // Sin tu foto vuelve la de serie (desde el 2026-11-14 toda sesión tiene una)
  await expect(page.getByRole('link', { name: /Isquios, glúteo y pecho/ }).locator('img')).toHaveAttribute(
    'src',
    DE_SERIE,
  )
})

test('en «Consejos de hoy» los de antes de empezar se marcan y ya no se ocultan', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: /consejos para esta sesión/ }).click()
  const hoy = page.getByRole('dialog', { name: 'Consejos de hoy' })
  await expect(hoy.getByText('0 de 9')).toBeVisible()
  // Los de antes de la primera serie ya no se ocultan (usuario, 2026-11-12)
  await expect(hoy.getByRole('button', { name: /^Ocultar/ })).toHaveCount(0)
})
