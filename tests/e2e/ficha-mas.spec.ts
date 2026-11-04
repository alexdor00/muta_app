import { expect, test } from './plan.ts'

// El «···» de la ficha del ejercicio, tu material (Perfil) y la imagen para compartir el resumen (C25).

test('«···» de la ficha: añadir a una sesión (con «Deshacer») y la que ya lo lleva lo dice', async ({
  page,
}) => {
  await page.goto('/entreno/ejercicio/press_banca')
  await page.getByRole('button', { name: 'Más opciones' }).click()
  const mas = page.getByRole('dialog', { name: 'Press banca' })
  // No está en tu plan: no se puede cambiar
  await expect(mas.getByRole('button', { name: 'Cambiar en tu plan por otro' })).toHaveCount(0)
  await mas.getByRole('button', { name: 'Añadir a una sesión' }).click()
  const elegir = page.getByRole('dialog', { name: /^¿En qué sesión va Press banca/ })
  await elegir.getByText(/^Isquios, glúteo y pecho/).click()
  await expect(page.getByText(/^Añadido al final de Isquios, glúteo y pecho/)).toBeVisible()

  await page.getByRole('button', { name: 'Más opciones' }).click()
  await page.getByRole('button', { name: 'Añadir a una sesión' }).click()
  await expect(page.getByRole('dialog', { name: /^¿En qué sesión va/ })).toContainText('ya lo tiene')
  await page
    .getByRole('dialog', { name: /^¿En qué sesión va/ })
    .getByText(/^Isquios, glúteo y pecho/)
    .click()
  await expect(page.getByText(/^Ya está en Isquios, glúteo y pecho/)).toBeVisible()

  // Deshacer lo quita
  await page.getByRole('button', { name: 'Más opciones' }).click()
  await page.getByRole('button', { name: 'Añadir a una sesión' }).click()
  await page
    .getByRole('dialog', { name: /^¿En qué sesión va/ })
    .getByText(/^Cuádriceps y espalda/)
    .click()
  await page.getByRole('button', { name: 'Deshacer' }).click()
  await expect(page.getByText('Deshecho')).toBeVisible()
  await page.goto('/entreno/rutina/a1')
  await expect(page.getByRole('button', { name: /^Press banca/ })).toHaveCount(0)
})

test('«···» de un ejercicio de tu plan: cambiarlo por otro', async ({ page }) => {
  await page.goto('/entreno/ejercicio/peso_muerto_rumano')
  await page.getByRole('button', { name: 'Más opciones' }).click()
  await page.getByRole('button', { name: 'Cambiar en tu plan por otro' }).click()
  const hoja = page.getByRole('dialog', { name: 'Cambiar ejercicio' })
  await hoja.getByRole('button', { name: /^Peso muerto piernas rígidas/ }).click()
  await expect(page.getByText('Cambiado por Peso muerto piernas rígidas en tu plan')).toBeVisible()
  await page.goto('/entreno/rutina/b1')
  await expect(page.getByRole('button', { name: /^Peso muerto piernas rígidas/ })).toContainText(
    'En lugar de Peso muerto rumano',
  )
})

test('tu material (Perfil): lo que no tienes baja al final de la biblioteca y de «Cambiar ejercicio»', async ({
  page,
}) => {
  await page.goto('/perfil')
  await expect(page.getByRole('heading', { name: 'Perfil', level: 1 })).toBeVisible()
  const maquinas = page.getByRole('switch', { name: 'Máquinas' })
  await expect(maquinas).toHaveAttribute('aria-checked', 'true')
  await maquinas.click()
  await page.getByRole('switch', { name: 'Poleas' }).click()
  await page.reload()
  await expect(page.getByRole('switch', { name: 'Máquinas' })).toHaveAttribute('aria-checked', 'false')

  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: 'Opciones de Peso muerto rumano' }).click()
  await page.getByRole('button', { name: 'Cambiar', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Cambiar ejercicio' })
    .getByRole('button', { name: /Elegir cualquier/ })
    .click()
  const biblioteca = page.getByRole('dialog', { name: 'Elegir ejercicio' })
  await expect(biblioteca.getByRole('heading', { name: 'No está en tu material' })).toBeVisible()
  // Las máquinas, después del título
  const textos = await biblioteca.locator('h3, li').allInnerTexts()
  const titulo = textos.findIndex((t) => t === 'No está en tu material')
  const maquina = textos.findIndex((t) => /máquina/i.test(t))
  expect(maquina).toBeGreaterThan(titulo)
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
