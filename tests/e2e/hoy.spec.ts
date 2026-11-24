import AxeBuilder from '@axe-core/playwright'
import { expect } from '@playwright/test'
import { sinAnimaciones, test } from './plan.ts'

// Hoy (propuesta 2, 2026-11-13): solo lo que queda por hacer hoy. Con el plan de prueba (B1 hecha hace 7, 14 y 21 días).
test('tu día: el anillo, lo que queda y lo hecho; cada cosa lleva a su sitio o abre su hoja', async ({
  page,
}) => {
  test.slow() // recorre todo Hoy, recarga y pasa axe: con todos los recorridos a la vez pasaba de 30 s
  await page.goto('/hoy')
  const anillo = page.getByRole('img', { name: /^0 de \d+ hechas$/ })
  await expect(anillo).toBeVisible()
  const queda = page.getByRole('region', { name: 'Te queda', exact: true })
  // El entreno de hoy abre Ver sesión; su flecha atrás vuelve a Hoy
  await expect(queda.getByRole('link', { name: /Entrena · \d+ min/ })).toHaveAttribute(
    'href',
    /\/entreno\/rutina\/\w+\?de=hoy$/,
  )
  await queda.getByRole('link', { name: /Entrena · \d+ min/ }).click()
  await page.getByRole('link', { name: 'Volver a Hoy' }).click()
  await expect(page).toHaveURL(/\/hoy$/)
  await expect(page.getByRole('region', { name: 'Hecho' })).toHaveCount(0)

  // ¿Cómo estás? Un toque por pregunta y «Listo»
  await queda.getByRole('button', { name: /^¿Cómo estás\?/ }).click()
  const hoja = page.getByRole('dialog', { name: '¿Cómo estás hoy?' })
  await sinAnimaciones(page)
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations).toEqual([])
  await hoja.getByText('6–8 h', { exact: true }).click()
  await hoja.getByText('Con energía', { exact: true }).click()
  await hoja.getByRole('button', { name: 'Listo' }).click()
  await expect(page.getByRole('status')).toContainText('Apuntado')
  const hecho = page.getByRole('region', { name: 'Hecho' })
  await expect(hecho).toContainText('Sueño 6–8 h · energía alta')
  await expect(page.getByRole('img', { name: /^1 de \d+ hechas$/ })).toBeVisible()

  // Tus pasos: al llegar a tu objetivo, hecho
  await queda.getByRole('button', { name: /^Pasos/ }).click()
  await page.getByRole('textbox', { name: 'Pasos de hoy' }).fill('12500')
  await page
    .getByRole('dialog', { name: 'Tus pasos de hoy' })
    .getByRole('button', { name: 'Guardar' })
    .click()
  await expect(hecho).toContainText('12.500 de 10.000')

  // Sigue al recargar
  await page.reload()
  await expect(page.getByRole('region', { name: 'Hecho' })).toContainText('12.500')
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations).toEqual([])
})
