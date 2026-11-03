import { expect, test } from '@playwright/test'

// Consejos de hoy (C10): en Ver sesión, el aviso de la sesión y la hoja; el orden de hoy; el aviso de orden en la ficha.

const LATERAL = 'Hoy es de empuje: coloca la lateral en polea con el cable por delante del cuerpo.'
const CURL = /Tienes curl femoral y bisagra/

test('Ver sesión trae los consejos para esta sesión plegados; al tocarlos se abren', async ({ page }) => {
  await page.goto('/entreno/rutina/b1')
  const tarjeta = page.locator('details', { hasText: 'Consejos para esta sesión' })
  await expect(tarjeta.getByText(LATERAL)).toBeHidden()
  await tarjeta.getByText('Consejos para esta sesión').click()
  await expect(tarjeta.getByRole('listitem')).toHaveCount(3)
  await expect(tarjeta).toContainText(LATERAL)
  await expect(tarjeta).toContainText(CURL)
})

test('en la sesión, el aviso abre la hoja; «Invertir hoy» cambia el orden y la lista se marca', async ({
  page,
}) => {
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: /^3 consejos para esta sesión/ }).click()
  const hoja = page.getByRole('dialog', { name: 'Consejos de hoy' })
  await expect(hoja).toContainText('Isquios, glúteo y pecho')
  await expect(hoja).toContainText(LATERAL)
  await expect(hoja.getByText('0 de 9')).toBeVisible()

  await hoja.getByRole('button', { name: /^Decide qué tarea es la más valiosa/ }).click()
  await expect(hoja.getByText('1 de 9')).toBeVisible()
  await expect(hoja.getByRole('button', { name: /^Decide qué tarea es la más valiosa/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await hoja.getByRole('button', { name: 'Invertir hoy' }).click()
  await expect(hoja.getByText('Hecho, solo hoy')).toBeVisible()
  await hoja.getByRole('button', { name: 'Listo' }).click()
  await expect(hoja).toHaveCount(0)
  // El rumano (abierto) pasa al puesto 4 y el curl femoral al 1; el aviso ya no sale
  await expect(page.locator('#ejercicio-4')).toHaveText('Peso muerto rumano')
  await expect(page.getByRole('button', { name: /consejos para esta sesión/ })).toHaveCount(0)

  // Lo marcado sigue al volver a abrirla desde «Esta sesión»
  await page.getByRole('button', { name: /^Esta sesión/ }).click()
  await page.getByRole('button', { name: /Consejos de hoy/ }).click()
  await expect(page.getByRole('dialog', { name: 'Consejos de hoy' }).getByText('1 de 9')).toBeVisible()
})

test('el aviso se va al marcar la primera serie', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  const aviso = page.getByRole('button', { name: /consejos para esta sesión/ })
  await expect(aviso).toBeVisible()
  await page.getByRole('button', { name: 'Serie 1 hecha' }).click()
  await expect(aviso).toHaveCount(0)
})

test('«Hacer ahora» pasa un ejercicio delante y lo abre, solo hoy', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: /Curl femoral tumbado/ }).click()
  await page.getByRole('button', { name: 'Opciones de Curl femoral tumbado' }).click()
  await page.getByRole('button', { name: /Hacer ahora/ }).click()
  await expect(page.getByText('Curl femoral tumbado pasa a ser el siguiente, solo hoy')).toBeVisible()
  await expect(page.locator('#ejercicio-1')).toHaveText('Curl femoral tumbado')
  // Ya es el siguiente: la opción sale desactivada
  await page.getByRole('button', { name: 'Opciones de Curl femoral tumbado' }).click()
  await expect(page.getByRole('button', { name: /Hacer ahora/ })).toBeDisabled()
})

test('«Mostrar al empezar» abre la hoja sola en la próxima sesión', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: /consejos para esta sesión/ }).click()
  await page.getByRole('button', { name: 'Mostrar al empezar' }).click()
  await expect(page.getByRole('button', { name: 'No mostrar al empezar' })).toBeVisible()
  await page.getByRole('button', { name: 'Listo' }).click()
  await page.getByRole('button', { name: 'Descartar sesión' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Descartar' }).click()
  await page.getByRole('link', { name: /^Empezar/ }).click()
  await expect(page.getByRole('dialog', { name: 'Consejos de hoy' })).toBeVisible()
})

test('la ficha avisa si la última vez y la anterior el ejercicio iba en otro puesto', async ({ page }) => {
  await page.goto('/entreno/ejercicio/peso_muerto_rumano')
  const progreso = page.getByRole('region', { name: 'Progreso del ejercicio' })
  await expect(progreso.getByRole('note')).toContainText(
    'La última vez lo hiciste en el puesto 1 de la sesión y la anterior en el 3',
  )
  await expect(progreso).toContainText('Hecho en otro puesto de la sesión')
})
