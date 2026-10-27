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

  // Elige tu rutina: intermedio y 4 días → recomienda Cuerpo completo A/B
  await expect(page).toHaveURL('/entreno/rutinas')
  const recomendadas = page.getByRole('region', { name: 'Recomendadas para ti' })
  await expect(recomendadas.getByRole('button').first()).toContainText('Cuerpo completo A/B')
  await expect(page.getByText('Para 4 días por semana · nivel intermedio')).toBeVisible()
  await capture(page, 'elegir-rutina')
  await recomendadas.getByRole('button', { name: /Cuerpo completo A\/B/ }).click()
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
  expect(plan).toMatchObject({ programId: 'muta-cuerpo-completo-4d' })

  // Con perfil, la app ya no abre en la bienvenida
  await page.goto('/')
  await expect(page).toHaveURL('/hoy')
})
