import AxeBuilder from '@axe-core/playwright'
import { ENTRENOS_MEJORANDO, expect, prepararPlan, sinAnimaciones, testGuardando as test } from './plan.ts'

// El entrenador de Entreno en Tu plan (guía de culturismo natural §5): el % de series que mejoras esta semana por
// músculo y lo que toca. Solo propone: «Aplicar» suma una serie en tu plan; «Ahora no» lo deja hasta la semana que viene.

test('casi todas las series mejoran: puedes subir volumen, y «Aplicar» suma una serie en tu plan', async ({
  page,
}) => {
  await prepararPlan(page, ENTRENOS_MEJORANDO)
  await page.goto('/entreno')
  const tarjeta = page.getByRole('region', { name: 'Tu entrenador' })
  await expect(tarjeta).toBeVisible()
  const femoral = tarjeta.getByRole('listitem').filter({ hasText: 'Femoral' })
  await expect(femoral).toContainText('mejoras en 5 de 5 series')
  await expect(femoral).toContainText('puedes subir volumen')
  const aplicar = femoral.getByRole('button', { name: /^Aplicar/ })
  await expect(aplicar).toHaveText('Aplicar: 2 → 3 series')
  await aplicar.click()
  await expect(tarjeta.getByRole('listitem').filter({ hasText: 'Femoral' })).toHaveCount(0)
  // Queda hecho: al recargar no vuelve a salir esta semana y el curl femoral tiene 3 series en B1
  await page.reload()
  await expect(page.getByRole('region', { name: 'Tu entrenador' }).getByText(/Femoral/)).toHaveCount(0)
  await page.goto('/entreno/rutina/b1')
  await expect(page.getByRole('button', { name: /Curl femoral tumbado/ })).toContainText('3 series')
})

test('«Ahora no» lo quita hasta la semana que viene', async ({ page }) => {
  await prepararPlan(page, ENTRENOS_MEJORANDO)
  await page.goto('/entreno')
  const tarjeta = page.getByRole('region', { name: 'Tu entrenador' })
  const biceps = tarjeta.getByRole('listitem').filter({ hasText: 'Bíceps' })
  await tarjeta.scrollIntoViewIfNeeded()
  await sinAnimaciones(page)
  const { violations } = await new AxeBuilder({ page })
    .include('section[aria-labelledby="entrenador"]')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
  expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([])
  await biceps.getByRole('button', { name: 'Ahora no' }).click()
  await expect(biceps).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('region', { name: 'Tu entrenador' }).getByText(/Bíceps/)).toHaveCount(0)
})

test('sin entrenos en los últimos 7 días no sale el entrenador', async ({ page }) => {
  await prepararPlan(page)
  await page.goto('/entreno')
  await expect(page.getByRole('link', { name: 'Empezar B1' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Tu entrenador' })).toHaveCount(0)
})
