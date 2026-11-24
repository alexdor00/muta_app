import { expect, test } from './plan.ts'

// El «···» de la ficha del ejercicio, los discos del gimnasio en la calculadora y la imagen para compartir el resumen (C25).

test('los discos del gimnasio (en la calculadora): solo se usan los que hay y se recuerdan', async ({
  page,
}) => {
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: 'Opciones de Peso muerto rumano' }).click()
  await page.getByRole('button', { name: 'Discos' }).click()
  const hoja = page.getByRole('dialog', { name: 'Discos por lado' })
  await hoja.getByLabel('Peso total').fill('62,5')
  await expect(hoja).toContainText('Por lado: 20 + 1,25')
  // Sin discos de 20 en tu gimnasio: los menos discos posibles con los que hay
  await hoja.getByRole('button', { name: 'Discos de 20 kg' }).click()
  await expect(hoja).toContainText('Por lado: 15 + 5 + 1,25')
  await page.reload()
  await page.getByRole('button', { name: 'Opciones de Peso muerto rumano' }).click()
  await page.getByRole('button', { name: 'Discos' }).click()
  await expect(
    page.getByRole('dialog', { name: 'Discos por lado' }).getByRole('button', { name: 'Discos de 20 kg' }),
  ).toHaveAttribute('aria-pressed', 'false')
})

test('compartir el resumen hace una imagen', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  for (let n = 1; n <= 3; n++) await page.getByRole('button', { name: `Serie ${n} hecha` }).click()
  await page.getByRole('button', { name: 'Terminar' }).click()
  await page
    .getByRole('dialog', { name: '¿Terminar con tan poco?' })
    .getByRole('button', { name: 'Terminar' })
    .click()
  await expect(page).toHaveURL('/entreno/sesion/b1/resumen')
  // En el navegador de las pruebas no se pueden compartir archivos: se descarga
  const descarga = page.waitForEvent('download')
  await page.getByRole('button', { name: /Compartir/ }).click()
  expect((await descarga).suggestedFilename()).toMatch(/^muta-\d{4}-\d{2}-\d{2}-b1\.png$/)
  await expect(page.getByText('Imagen guardada')).toBeVisible()
})
