import { expect, test, type Page } from '@playwright/test'

/** Valor en px de un token de tokens.css. */
const token = (page: Page, name: string) =>
  page.evaluate((n) => {
    const probe = document.createElement('div')
    probe.style.height = `var(${n})`
    document.body.append(probe)
    const px = probe.getBoundingClientRect().height
    probe.remove()
    return px
  }, name)

const height = async (page: Page, selector: ReturnType<Page['locator']>) =>
  (await selector.boundingBox())!.height

test('las piezas de /dev/ui miden lo que dicen los tokens', async ({ page }) => {
  await page.goto('/dev/ui')
  const choices = page.getByTestId('choices')
  await expect(choices).toBeVisible()

  const control = await token(page, '--control')
  const controlLg = await token(page, '--control-lg')

  // Pastillas y círculos: misma altura (--control) y misma letra
  const pill = choices.locator('label', { hasText: 'Principiante' })
  const circle = choices.locator('label', { hasText: /^3$/ })
  expect(await height(page, pill)).toBe(control)
  expect(await height(page, circle)).toBe(control)
  const fontOf = (l: typeof pill) => l.evaluate((el) => getComputedStyle(el).font)
  expect(await fontOf(pill)).toBe(await fontOf(circle))

  // Botones: altura del botón principal (--control-lg)
  for (const name of ['Principal', 'Secundario', 'Sobre foto']) {
    expect(await height(page, page.getByRole('button', { name }))).toBe(controlLg)
  }

  for (const theme of ['claro', 'oscuro']) {
    if (theme === 'oscuro') await page.getByRole('button', { name: 'Oscuro' }).click()
    await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()))
    await page.screenshot({ path: `tests/e2e/capturas/dev-ui-${theme}.png`, fullPage: true })
  }
})
