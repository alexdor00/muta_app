import { expect, test } from './plan.ts'

// Ficha del músculo (A17–A21): barra del rango, objetivo, a mano, dónde lo entrenas y consejos. Datos de prueba.

test('desde la ficha del ejercicio: rango en barra, objetivo, a mano y dónde lo entrenas', async ({
  page,
}) => {
  await page.goto('/entreno/ejercicio/peso_muerto_rumano')
  await page
    .getByRole('region', { name: 'Músculos que trabaja' })
    .getByRole('button', { name: 'Femoral' })
    .click()
  const hoja = page.getByRole('dialog', { name: 'Femoral' })
  // Rumano 3 y curl femoral tumbado 2 (B1) y curl femoral sentado 2 (B2): 7, dentro de 6–10
  await expect(
    hoja.getByRole('img', { name: /^7 series por semana en tu plan\. Tu rango es 6–10\. Vas bien/ }),
  ).toBeVisible()
  await expect(hoja.getByRole('button', { name: /^Desarrollar/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(hoja.getByRole('link', { name: /^Peso muerto rumano B1/ })).toBeVisible()
  await expect(hoja.getByRole('link', { name: /^Curl femoral sentado B2/ })).toBeVisible()

  // Con Prioridad, 7 se queda por debajo de 10–12
  await hoja.getByRole('button', { name: /^Prioridad/ }).click()
  await expect(hoja.getByRole('img', { name: /Tu rango es 10–12\./ })).toBeVisible()
  await expect(hoja.getByRole('img', { name: /Vas bien/ })).toHaveCount(0)

  await hoja.getByText('Ajustar a mano').click()
  await hoja.getByRole('button', { name: 'Máximo: más' }).click()
  await expect(hoja.getByText('Tu rango')).toBeVisible()
  await expect(hoja.getByRole('img', { name: /Tu rango es 10–13/ })).toBeVisible()
  for (const m of ['Mantener', 'Desarrollar', 'Prioridad'])
    await expect(hoja.getByRole('button', { name: new RegExp(`^${m}`) })).toHaveAttribute(
      'aria-pressed',
      'false',
    )

  // Una fila lleva a la ficha de su ejercicio
  await hoja.getByRole('link', { name: /^Curl femoral tumbado B1/ }).click()
  await expect(page).toHaveURL(/\/entreno\/ejercicio\/curl_femoral_tumbado$/)
})

test('la pestaña Consejos: la clave, 3 consejos, los demás plegados y cómo distribuirlo', async ({
  page,
}) => {
  await page.goto('/entreno/ejercicio/peso_muerto_rumano')
  await page
    .getByRole('region', { name: 'Músculos que trabaja' })
    .getByRole('button', { name: 'Glúteo' })
    .click()
  const hoja = page.getByRole('dialog', { name: 'Glúteo' })
  await hoja.getByText('Consejos', { exact: true }).click()
  await expect(hoja.getByText(/^Piensa en patrones/)).toBeVisible()
  await expect(hoja.getByRole('listitem').filter({ visible: true })).toHaveCount(3)
  await hoja.getByText('Ver 7 consejos más').click()
  await expect(hoja.getByRole('listitem').filter({ visible: true })).toHaveCount(10)
  await hoja.getByText('Cómo distribuirlo en tu rutina').click()
  await expect(hoja.getByText(/glúteo|Glúteo/).last()).toBeVisible()
})

test('desde Tu plan, «Ver ficha» en la burbuja; en hombros se pasa de uno a otro', async ({ page }) => {
  await page.goto('/entreno')
  await page
    .getByRole('button', { name: /^Hombros/ })
    .locator('path')
    .first()
    .click()
  await page.getByRole('button', { name: 'Ver ficha' }).click()
  const hoja = page.getByRole('dialog', { name: 'Hombro lateral' })
  await expect(hoja.getByRole('button', { name: 'Hombro lateral', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await hoja.getByRole('button', { name: 'Hombro posterior', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Hombro posterior' })).toBeVisible()
})

test('«Añadir un ejercicio» elige uno del músculo y la sesión, y sale en «Dónde lo entrenas»', async ({
  page,
}) => {
  await page.goto('/entreno/ejercicio/peso_muerto_rumano')
  await page
    .getByRole('region', { name: 'Músculos que trabaja' })
    .getByRole('button', { name: 'Femoral' })
    .click()
  await page
    .getByRole('dialog', { name: 'Femoral' })
    .getByRole('button', { name: 'Añadir un ejercicio' })
    .click()
  const bib = page.getByRole('dialog', { name: 'Elegir ejercicio' })
  await bib.getByRole('searchbox').fill('buenos días')
  await bib
    .getByRole('button', { name: /^Buenos días/ })
    .first()
    .click()
  const donde = page.getByRole('dialog', { name: /^¿En qué sesión va Buenos días/ })
  await donde.getByText('Espalda y cuádriceps', { exact: true }).click()
  const hoja = page.getByRole('dialog', { name: 'Femoral' })
  await expect(hoja.getByRole('link', { name: /^Buenos días.* A2/ })).toBeVisible()
})
