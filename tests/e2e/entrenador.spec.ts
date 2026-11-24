import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { ENTRENOS_MEJORANDO, expect, prepararPlan, sinAnimaciones, testGuardando as test } from './plan.ts'

// El entrenador de Entreno en Tu plan (guía de culturismo natural §5 y reglas del usuario): tras 3 semanas mejorando en
// casi todas las series, toca subir volumen en un solo músculo (+1 serie). Solo propone. La tarjeta es como la revisión
// semanal de Nutrición (usuario, 2026-11-23): el informe, una sugerencia y «Esta semana».

/** La tarjeta sale plegada: se abre tocando su título. */
async function abrir(page: Page) {
  const boton = page
    .getByRole('region', { name: 'Tu entrenador' })
    .getByRole('button', { name: /^Tu entrenador/ })
  await expect(boton).toHaveAttribute('aria-expanded', 'false')
  await boton.click()
}

test('3 semanas mejorando: propone una serie más en un solo músculo, y «Aplicar» la suma en tu plan', async ({
  page,
}) => {
  await prepararPlan(page, ENTRENOS_MEJORANDO)
  await page.goto('/entreno')
  await abrir(page)
  const tarjeta = page.getByRole('region', { name: 'Tu entrenador' })
  // Arriba, el informe de la semana: estado, titular y cifras
  await expect(tarjeta.getByText('1 sugerencia')).toBeVisible()
  await expect(tarjeta.getByText('Sesiones hechas')).toBeVisible()
  const sube = tarjeta.getByRole('group', { name: 'Sugerencia' })
  await expect(sube.getByRole('button', { name: /^Aplicar/ })).toHaveCount(1)
  await expect(sube).toContainText('3 semanas mejorando en casi todas')
  await expect(sube).toContainText('toca subir volumen')
  // Los demás que también progresan, en una línea: no se tocan
  await expect(tarjeta).toContainText('no toques lo que funciona')
  const musculo = (await sube.locator('p').first().textContent())?.split(':')[0] ?? ''
  await sube.getByRole('button', { name: /^Aplicar/ }).click()
  await expect(
    tarjeta.getByRole('group', { name: 'Sugerencia' }).filter({ hasText: `${musculo}:` }),
  ).toHaveCount(0)
  await page.reload()
  await expect(
    page
      .getByRole('region', { name: 'Tu entrenador' })
      .getByRole('group', { name: 'Sugerencia' })
      .filter({ hasText: `${musculo}:` }),
  ).toHaveCount(0)
})

test('«Ahora no» lo deja para la semana que viene; la tarjeta pasa la accesibilidad', async ({ page }) => {
  await prepararPlan(page, ENTRENOS_MEJORANDO)
  await page.goto('/entreno')
  await abrir(page)
  const tarjeta = page.getByRole('region', { name: 'Tu entrenador' })
  await tarjeta.scrollIntoViewIfNeeded()
  await sinAnimaciones(page)
  const { violations } = await new AxeBuilder({ page })
    .include('section[aria-labelledby="entrenador"]')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
  expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([])
  const sube = tarjeta.getByRole('group', { name: 'Sugerencia' })
  const musculo = (await sube.locator('p').first().textContent())?.split(':')[0] ?? ''
  await sube.getByRole('button', { name: 'Ahora no' }).click()
  await expect(
    tarjeta.getByRole('group', { name: 'Sugerencia' }).filter({ hasText: `${musculo}:` }),
  ).toHaveCount(0)
})

test('«No me interesa» pasa el músculo a Mantener', async ({ page }) => {
  await prepararPlan(page, ENTRENOS_MEJORANDO)
  await page.goto('/entreno')
  await abrir(page)
  const tarjeta = page.getByRole('region', { name: 'Tu entrenador' })
  const sube = tarjeta.getByRole('group', { name: 'Sugerencia' })
  const musculo = (await sube.locator('p').first().textContent())?.split(':')[0] ?? ''
  await sube.getByRole('button', { name: 'No me interesa' }).click()
  await expect(
    tarjeta.getByRole('group', { name: 'Sugerencia' }).filter({ hasText: `${musculo}:` }),
  ).toHaveCount(0)
})

test('la sugerencia lleva a Editar rutina con su músculo señalado', async ({ page }) => {
  await prepararPlan(page, ENTRENOS_MEJORANDO)
  await page.goto('/entreno')
  await abrir(page)
  const sube = page.getByRole('region', { name: 'Tu entrenador' }).getByRole('group', { name: 'Sugerencia' })
  // Lleva a Editar rutina con su músculo: lo dice arriba y marca la sesión y el ejercicio que lo entrenan
  const musculo = ((await sube.locator('p').first().textContent()) ?? '').split(':')[0]
  await sube.getByRole('button', { name: /^Ver dónde se edita/ }).click()
  const hoja = page.getByRole('dialog', { name: 'Editar rutina' })
  await expect(hoja).toContainText(`${musculo}: se entrena en las sesiones marcadas`)
  await hoja
    .getByRole('list', { name: 'Tu semana' })
    .getByRole('button')
    .filter({ has: page.locator('small') })
    .first()
    .click()
  await expect(hoja).toContainText(`${musculo}: toca el ejercicio marcado`)
  await expect(hoja.getByText(/^Entrena .* toca para cambiar sus series$/).first()).toBeVisible()
})

test('sin entrenos en los últimos 7 días no sale el entrenador', async ({ page }) => {
  await prepararPlan(page)
  await page.goto('/entreno')
  await expect(page.getByRole('link', { name: 'Empezar B1' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Tu entrenador' })).toHaveCount(0)
})
