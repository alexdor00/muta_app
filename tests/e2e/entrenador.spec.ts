import AxeBuilder from '@axe-core/playwright'
import { ENTRENOS_MEJORANDO, expect, prepararPlan, sinAnimaciones, testGuardando as test } from './plan.ts'

// El entrenador de Entreno en Tu plan (guía de culturismo natural §5 y reglas del usuario): tras 3 semanas mejorando en
// casi todas las series, toca subir volumen en un solo músculo (+1 serie). Solo propone.

test('3 semanas mejorando: propone una serie más en un solo músculo, y «Aplicar» la suma en tu plan', async ({
  page,
}) => {
  await prepararPlan(page, ENTRENOS_MEJORANDO)
  await page.goto('/entreno')
  const tarjeta = page.getByRole('region', { name: 'Tu entrenador' })
  await expect(tarjeta).toBeVisible()
  const aplicar = tarjeta.getByRole('button', { name: /^Aplicar/ })
  await expect(aplicar).toHaveCount(1)
  const sube = tarjeta.getByRole('listitem').filter({ has: page.getByRole('button', { name: /^Aplicar/ }) })
  await expect(sube).toContainText('3 semanas mejorando en casi todas')
  await expect(sube).toContainText('toca subir volumen')
  // Los demás que también progresan esperan su turno
  await expect(tarjeta).toContainText('mejor un músculo cada vez')
  const musculo = (await sube.locator('b').first().textContent())?.split(':')[0] ?? ''
  await aplicar.click()
  await expect(tarjeta.getByRole('button', { name: /^Aplicar/ })).toHaveCount(0)
  await page.reload()
  await expect(
    page
      .getByRole('region', { name: 'Tu entrenador' })
      .getByRole('listitem')
      .filter({ hasText: `${musculo}:` }),
  ).toHaveCount(0)
})

test('«Ahora no» lo deja para la semana que viene; la tarjeta pasa la accesibilidad', async ({ page }) => {
  await prepararPlan(page, ENTRENOS_MEJORANDO)
  await page.goto('/entreno')
  const tarjeta = page.getByRole('region', { name: 'Tu entrenador' })
  await tarjeta.scrollIntoViewIfNeeded()
  await sinAnimaciones(page)
  const { violations } = await new AxeBuilder({ page })
    .include('section[aria-labelledby="entrenador"]')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
  expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([])
  await tarjeta.getByRole('button', { name: 'Ahora no' }).click()
  await expect(tarjeta.getByRole('button', { name: /^Aplicar/ })).toHaveCount(0)
})

test('«No me interesa» pasa el músculo a Mantener', async ({ page }) => {
  await prepararPlan(page, ENTRENOS_MEJORANDO)
  await page.goto('/entreno')
  const tarjeta = page.getByRole('region', { name: 'Tu entrenador' })
  const sube = tarjeta
    .getByRole('listitem')
    .filter({ has: page.getByRole('button', { name: 'No me interesa' }) })
  const musculo = (await sube.locator('b').first().textContent())?.split(':')[0] ?? ''
  await sube.getByRole('button', { name: 'No me interesa' }).click()
  await expect(tarjeta.getByRole('listitem').filter({ hasText: `${musculo}:` })).toHaveCount(0)
})

test('sin entrenos en los últimos 7 días no sale el entrenador', async ({ page }) => {
  await prepararPlan(page)
  await page.goto('/entreno')
  await expect(page.getByRole('link', { name: 'Empezar B1' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Tu entrenador' })).toHaveCount(0)
})
