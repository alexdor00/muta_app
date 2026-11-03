import { expect, test } from './plan.ts'

// Tu plan (pestaña Entreno) con los datos de prueba de state/muestra: carrusel, «Empezar», hoja y músculos.

test('el carrusel cambia la sesión de «Empezar»', async ({ page }) => {
  await page.goto('/entreno')
  const empezar = page.getByRole('link', { name: /^Empezar/ })
  await expect(empezar).toHaveText('Empezar B1')
  await page
    .getByRole('group', { name: 'Sesiones de tu rutina' })
    .evaluate((rail) => rail.scrollTo({ left: rail.clientWidth * 3 }))
  await expect(empezar).not.toHaveText('Empezar B1')
  await expect(empezar).toHaveAttribute('href', /\/entreno\/sesion\/[ab]\d$/)
})

test.describe('con ratón (ordenador)', () => {
  test.use({ hasTouch: false, isMobile: false })

  test('arrastrar la tarjeta pasa a la siguiente sin abrirla', async ({ page }) => {
    await page.goto('/entreno')
    const empezar = page.getByRole('link', { name: /^Empezar/ })
    await expect(empezar).toHaveText('Empezar B1')
    const caja = (await page.getByRole('group', { name: 'Sesiones de tu rutina' }).boundingBox())!
    const y = caja.y + caja.height / 2
    await page.mouse.move(caja.x + caja.width * 0.8, y)
    await page.mouse.down()
    await page.mouse.move(caja.x + caja.width * 0.3, y, { steps: 8 })
    await page.mouse.up()
    await expect(empezar).toHaveText('Empezar A2')
    await expect(page).toHaveURL('/entreno')
  })
})

test('«···» abre la hoja Tu rutina y se cierra', async ({ page }) => {
  await page.goto('/entreno')
  await page.getByRole('button', { name: 'Tu rutina' }).click()
  const hoja = page.getByRole('dialog', { name: 'Tu rutina' })
  await expect(hoja.getByText('Biblioteca de ejercicios')).toBeVisible()
  await hoja.getByRole('button', { name: 'Cerrar' }).click()
  await expect(hoja).toHaveCount(0)
})

test('en la hoja Tu rutina, lo que aún no existe dice «Pronto» y «Cambiar de rutina» lleva al catálogo', async ({
  page,
}) => {
  await page.goto('/entreno')
  await page.getByRole('button', { name: 'Tu rutina' }).click()
  const hoja = page.getByRole('dialog', { name: 'Tu rutina' })
  await expect(hoja.getByText('Pronto')).toHaveCount(4)
  await expect(hoja.getByRole('button', { name: /Mis consejos/ })).toHaveCount(0)
  await hoja.getByRole('link', { name: 'Cambiar de rutina' }).click()
  await expect(page).toHaveURL(/\/entreno\/rutinas$/)
  await expect(page.getByRole('heading', { name: 'Elige tu rutina' })).toBeVisible()
})

test('la biblioteca busca, filtra por músculo y abre la ficha', async ({ page }) => {
  await page.goto('/entreno')
  await page.getByRole('button', { name: 'Tu rutina' }).click()
  await page.getByRole('button', { name: 'Biblioteca de ejercicios' }).click()
  const hoja = page.getByRole('dialog', { name: 'Biblioteca de ejercicios' })
  await expect(page.getByRole('dialog', { name: 'Tu rutina' })).toHaveCount(0)
  await expect(hoja.getByRole('link')).toHaveCount(141)
  await expect(hoja.getByRole('link', { name: /^Press banca Pecho, barra/ })).toBeVisible()

  await hoja.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('jalon')
  await expect(hoja.getByRole('link', { name: /^Jalón al pecho/ }).first()).toBeVisible()
  await expect(hoja.getByRole('link', { name: /^Press banca/ })).toHaveCount(0)

  await hoja.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('')
  await hoja.getByRole('button', { name: 'Glúteo' }).click()
  await expect(hoja.getByRole('button', { name: 'Glúteo' })).toHaveAttribute('aria-pressed', 'true')
  await expect(hoja.getByRole('link', { name: /^Press banca/ })).toHaveCount(0)
  await hoja.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('xyz')
  await expect(hoja.getByText('Sin resultados.')).toBeVisible()

  await hoja.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('')
  await hoja.getByRole('link').first().click()
  await expect(page).toHaveURL(/\/entreno\/ejercicio\//)
  // Atrás vuelve a la biblioteca, y otra vez atrás a Tu plan (no a la hoja Tu rutina)
  await page.goBack()
  await expect(page.getByRole('dialog', { name: 'Biblioteca de ejercicios' })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).toHaveURL(/\/entreno$/)
})

test('tocar un músculo enseña sus series y tocar fuera las quita', async ({ page }) => {
  await page.goto('/entreno')
  const burbuja = page.locator('[aria-live="polite"]')
  // Se toca un trozo del músculo (el bíceps son dos piezas, una por brazo)
  await page
    .getByRole('button', { name: /^Bíceps: 4 series/ })
    .locator('path')
    .first()
    .click()
  await expect(burbuja).toContainText('Bíceps')
  // B1: curl inclinado y curl predicador, 2 series cada uno
  await expect(burbuja).toContainText('4 series hoy')

  await page.getByRole('radio', { name: 'Semana' }).check({ force: true })
  await expect(burbuja).toContainText('esta semana')

  const cuerpo = await page.getByRole('group', { name: /^Músculos/ }).boundingBox()
  await page.mouse.click(cuerpo!.x + 4, cuerpo!.y + 4)
  await expect(burbuja).toBeEmpty()
})

test('al bajar queda arriba una barra con «Entrenamiento»', async ({ page }) => {
  await page.goto('/entreno')
  await expect(page.getByRole('link', { name: /^Empezar/ })).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, 600))
  await expect(page.getByText('Entrenamiento', { exact: true }).first()).toBeInViewport()
  await expect(page.getByRole('heading', { name: 'Entrenamiento', level: 1 })).not.toBeInViewport()
})

test('sin rutina elegida lo dice y lleva al catálogo', async ({ page }) => {
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((ok) => {
      const r = indexedDB.open('muta')
      r.onsuccess = () => ok(r.result)
    })
    const tx = db.transaction('plans', 'readwrite')
    tx.objectStore('plans').delete('current')
    await new Promise((ok) => (tx.oncomplete = ok))
    db.close()
  })
  await page.goto('/entreno')
  await expect(page.getByText('Aún no has elegido rutina.')).toBeVisible()
  await page.getByRole('link', { name: 'Elegir rutina' }).click()
  await expect(page).toHaveURL('/entreno/rutinas')
})
