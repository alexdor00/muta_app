import { expect, test } from './plan.ts'

// A14 · Cada serie distinta y superserie, con una rutina cargada por CSV: «4,6,8» y A1/A2 como en las rutinas.

const CSV = `Sesión;Ejercicio;Series;Repeticiones;RIR;Descanso
Brazos;Sentadilla hack;3;4,6,8;2;3:00
Brazos;A1: Press francés;2;12-15;1;0
Brazos;A2: Curl con barra Z;2;12-15;1;1:30`

async function cargar(page: import('@playwright/test').Page) {
  await page.goto('/entreno/rutinas')
  await page
    .getByText('Cargar desde CSV')
    .locator('input')
    .setInputFiles({ name: 'brazos.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV) })
  await page
    .getByRole('dialog', { name: 'Tu rutina' })
    .getByRole('button', { name: 'Empezar esta rutina' })
    .click()
  await expect(page).toHaveURL(/\/entreno$/)
}

async function editarBrazos(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Editar', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Tu rutina' })
    .getByRole('button', { name: /Editar rutina/ })
    .click()
  await page
    .getByRole('list', { name: 'Tu semana' })
    .getByRole('button', { name: /^1 Brazos/ })
    .click()
  return page.getByRole('list', { name: 'Ejercicios de Brazos' })
}

test('en Editar rutina: cada serie distinta («4 · 6 · 8») y la superserie unida', async ({ page }) => {
  await cargar(page)
  const lista = await editarBrazos(page)
  await expect(lista.getByRole('listitem').nth(0)).toContainText('3 × 4 · 6 · 8 · 3:00')
  await expect(lista).toContainText('Superserie')
  await expect(lista.getByRole('listitem').nth(1)).toContainText('pasa al siguiente')

  await page.getByRole('button', { name: /^Sentadilla hack/ }).click()
  const hack = page.getByRole('dialog', { name: 'Sentadilla hack' })
  await expect(hack.getByRole('switch', { name: 'Cada serie distinta' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  await expect(hack.locator('summary', { hasText: 'Serie 3' })).toContainText('8 reps')
  await hack.getByRole('button', { name: 'Brazos' }).click()

  // Deshacer la superserie
  await page.getByRole('button', { name: /^Superserie A1: Press francés/ }).click()
  const press = page.getByRole('dialog', { name: 'A1: Press francés' })
  await expect(press.locator('summary', { hasText: 'Superserie con' })).toContainText(
    'Con A2: Curl con barra Z',
  )
  await press.locator('summary', { hasText: 'Superserie con' }).click()
  await press.getByText('Ninguno', { exact: true }).click()
  await press.getByRole('button', { name: 'Brazos' }).click()
  await expect(lista).not.toContainText('Superserie')
})

test('en la sesión: tras una serie del primero de la superserie, 20 s y pasa al segundo', async ({
  page,
}) => {
  await cargar(page)
  await page.goto('/entreno/sesion/s1')
  await page.getByRole('button', { name: /A1: Press francés/ }).click()
  await expect(page.getByRole('list', { name: 'Pauta' }).first()).toContainText('Superserie')
  const teclado = page.getByRole('group', { name: 'Teclado numérico' })
  await page.getByLabel('Kilos de la serie 1').click()
  for (const c of '25') await teclado.getByRole('button', { name: c, exact: true }).click()
  await teclado.getByRole('button', { name: 'Siguiente' }).click()
  for (const c of '14') await teclado.getByRole('button', { name: c, exact: true }).click()
  await page.getByRole('button', { name: /^Serie 1 hecha/ }).click()
  await expect(page.getByText('Superserie: ahora A2: Curl con barra Z')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'A2: Curl con barra Z' })).toBeVisible()
  await expect(page.getByRole('timer', { name: 'Descanso' })).toContainText('0:')
})

test('técnica de intensidad: se pone a cualquier ejercicio en Editar rutina y se apunta en la sesión', async ({
  page,
}) => {
  await cargar(page)
  await editarBrazos(page)
  await page.getByRole('button', { name: /^Sentadilla hack/ }).click()
  const hack = page.getByRole('dialog', { name: 'Sentadilla hack' })
  const tecnica = hack.locator('summary', { hasText: 'Técnica' })
  await expect(tecnica).toContainText('Ninguna')
  await tecnica.click()
  await hack.getByText('Rest-pause', { exact: true }).click()
  await expect(tecnica).toContainText('Rest-pause')
  await hack.getByRole('button', { name: 'Brazos' }).click()

  await page.goto('/entreno/sesion/s1')
  await expect(page.getByRole('list', { name: 'Pauta' }).first()).toContainText('Rest-pause')
  await expect(page.getByLabel('Repeticiones de la mini-serie 1 de la serie 1')).toBeVisible()
})
