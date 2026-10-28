import { expect, test, type Page } from '@playwright/test'

/** Captura para comparar con el diseño, sin animaciones a medias. */
async function capture(page: Page, name: string) {
  for (const img of await page.locator('img').all()) {
    await img.evaluate((el: HTMLImageElement) => el.decode())
  }
  await page.evaluate(() => document.getAnimations().forEach((animation) => animation.finish()))
  await page.screenshot({ path: `tests/e2e/capturas/${name}.png` })
}

test('la primera vez la app abre en la bienvenida (A01)', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL('/bienvenida')
  await expect(page.getByRole('heading', { name: 'MUTA' })).toBeVisible()
  await expect(page.getByText('Entrena. Come. Evoluciona.')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Pestañas' })).toHaveCount(0)
  await capture(page, 'A01-bienvenida')
})

test('la bienvenida completa guarda el perfil y lleva a Tu plan', async ({ page }) => {
  await page.goto('/bienvenida')
  await page.getByRole('link', { name: 'Comenzar' }).click()

  // A03: «Ganar músculo» viene marcado; se elige «Perder grasa»
  await expect(page).toHaveURL('/bienvenida/1')
  await expect(page.getByText('1/2')).toBeVisible()
  await expect(page.getByRole('radio', { name: /Ganar músculo/ })).toBeChecked()
  await capture(page, 'A03-define-tu-objetivo')
  await page.getByText('Perder grasa').click()
  await expect(page.getByRole('radio', { name: /Perder grasa/ })).toBeChecked()
  await page.getByRole('link', { name: 'Siguiente' }).click()

  // A04: Principiante y 3 días vienen marcados; se elige Intermedio y 4 días
  await expect(page).toHaveURL('/bienvenida/2')
  await expect(page.getByText('2/2')).toBeVisible()
  // Nivel y días miden lo mismo de alto
  const pill = await page.getByText('Principiante').boundingBox()
  const day = await page.getByText('3', { exact: true }).boundingBox()
  expect(Math.round(pill!.height)).toBe(Math.round(day!.height))
  await expect(page.getByRole('radio', { name: 'Principiante' })).toBeChecked()
  await expect(page.getByRole('radio', { name: '3' })).toBeChecked()
  await capture(page, 'A04-personaliza-tu-plan')
  await page.getByText('Intermedio').click()
  await page.getByText('4', { exact: true }).click()
  await page.getByRole('button', { name: 'Siguiente' }).click()

  // Elige tu rutina (en la CI solo están las 2 rutinas de MUTA)
  await expect(page).toHaveURL('/entreno/rutinas')
  await expect(page.getByText('4 días por semana · nivel intermedio · definición')).toBeVisible()
  const paraTi = page.getByRole('region', { name: 'Para ti' })
  await expect(paraTi.getByRole('button')).toContainText('Cuerpo completo A/B')
  await capture(page, 'elegir-rutina')

  // Tipo de entrenamiento: cabecera con foto, número de rutinas, filtros y lista
  await page
    .getByRole('region', { name: 'Tipos de entrenamiento' })
    .getByRole('button', { name: /^MUTA/ })
    .click()
  await expect(page).toHaveURL('/entreno/rutinas/muta')
  await expect(page.getByRole('heading', { name: 'MUTA', level: 1 })).toBeVisible()
  await expect(page.getByText('2 rutinas')).toBeVisible()
  await capture(page, 'categoria')
  await page.getByRole('button', { name: 'Filtros' }).first().click()
  await page.getByText('3 días', { exact: true }).click()
  await expect(page.getByRole('button', { name: 'Ver 1 rutina' })).toBeVisible()
  await capture(page, 'filtros')
  await page.getByRole('button', { name: 'Ver 1 rutina' }).click()
  await page.getByRole('link', { name: /Cuerpo completo A\/B/ }).click()

  // Detalle: la rutina tal cual, sin selector de nivel
  await expect(page).toHaveURL('/entreno/programa/muta-cuerpo-completo-4d')
  await expect(page.getByRole('button', { name: 'Adaptar a mí' })).toHaveCount(0)
  // La «!» explica de qué trata la rutina
  await page.getByRole('button', { name: 'De qué trata esta rutina' }).click()
  await expect(page.getByRole('dialog', { name: 'Cuerpo completo A/B' })).toContainText('Para quién')
  await capture(page, 'rutina-info')
  await page.getByRole('button', { name: 'Cerrar' }).click()
  await capture(page, 'rutina')

  // Prioridades: el hombro anterior solo entra si es prioridad (reglas de MUTA); lo demás, a tu elección
  expect(await page.content()).not.toContain('Press militar en máquina')
  await page.getByRole('button', { name: 'Elegir mis prioridades' }).click()
  const prioridades = page.getByRole('dialog', { name: 'Tus prioridades' })
  await prioridades.getByText('Hombro anterior', { exact: true }).first().click()
  await capture(page, 'prioridades')
  await page.getByRole('button', { name: 'Listo' }).click()
  expect(await page.content()).toContain('Press militar en máquina')
  await expect(page.getByRole('region', { name: 'Prioridades' })).toContainText('Prioridad: Hombro anterior')
  await page.getByRole('button', { name: 'Empezar esta rutina' }).click()
  await expect(page).toHaveURL('/entreno')
  const profile = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const open = indexedDB.open('muta')
        open.onsuccess = () => {
          const get = open.result.transaction('profile').objectStore('profile').get('me')
          get.onsuccess = () => resolve(get.result)
        }
      }),
  )
  expect(profile).toMatchObject({ goal: 'lose_fat', level: 'intermediate', daysPerWeek: 4 })
  const plan = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const open = indexedDB.open('muta')
        open.onsuccess = () => {
          const get = open.result.transaction('plans').objectStore('plans').get('current')
          get.onsuccess = () => resolve(get.result)
        }
      }),
  )
  expect(plan).toMatchObject({
    programId: 'muta-cuerpo-completo-4d',
    adaptation: null,
  })

  // Con perfil, la app ya no abre en la bienvenida
  await page.goto('/')
  await expect(page).toHaveURL('/hoy')
})
