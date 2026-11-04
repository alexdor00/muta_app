import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from './plan.ts'

// Accesibilidad de las pantallas (contraste, nombres de botones, foco). Falla ante cualquier fallo grave.
async function sinFallos(page: Page, sinContraste = false) {
  // Las hojas suben con una animación: a medio subir, los grises aún no tienen su contraste. Se mide al terminar
  await expect
    .poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length))
    .toBe(0)
  const axe = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa'])
  // La página /dev/ui enseña muestras de color y la etiqueta naranja de una celda: el contraste se mide en las pantallas reales
  if (sinContraste) axe.disableRules(['color-contrast'])
  const { violations } = await axe.analyze()
  const graves = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(
    graves.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`),
    'fallos de accesibilidad',
  ).toEqual([])
}

test('bienvenida', async ({ page }) => {
  await page.goto('/bienvenida')
  await expect(page.getByRole('heading', { name: 'MUTA' })).toBeVisible()
  await sinFallos(page)
})

test('tu plan, con un músculo tocado y con la hoja Tu rutina abierta', async ({ page }) => {
  await page.goto('/entreno')
  await page
    .getByRole('button', { name: /^Bíceps/ })
    .locator('path')
    .first()
    .click()
  await sinFallos(page)
  await page.getByRole('button', { name: 'Tu rutina' }).click()
  await expect(page.getByRole('dialog', { name: 'Tu rutina' })).toBeVisible()
  await sinFallos(page)
})

test('la ficha del ejercicio, desde la sesión, con sus dos gráficas', async ({ page }) => {
  await page.goto('/entreno/ejercicio/peso_muerto_rumano?sesion=b1&ej=0')
  await expect(page.getByRole('button', { name: 'Empezar ejercicio' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Tonelaje del ejercicio' })).toBeVisible()
  await sinFallos(page)
})

test('«Consejos de hoy» (C10), con uno marcado y un consejo aplicado', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: /consejos para esta sesión/ }).click()
  const hoja = page.getByRole('dialog', { name: 'Consejos de hoy' })
  await sinFallos(page)
  await hoja.getByRole('button', { name: /^Decide qué tarea/ }).click()
  await hoja.getByRole('button', { name: 'Invertir hoy' }).click()
  await sinFallos(page)
})

test('la ficha del músculo, en Resumen (con el rango a mano abierto) y en Consejos', async ({ page }) => {
  await page.goto('/entreno/ejercicio/peso_muerto_rumano')
  await page
    .getByRole('region', { name: 'Músculos que trabaja' })
    .getByRole('button', { name: 'Femoral' })
    .click()
  const hoja = page.getByRole('dialog', { name: 'Femoral' })
  await hoja.getByText('Ajustar a mano').click()
  await sinFallos(page)
  await hoja.getByText('Consejos', { exact: true }).click()
  await hoja.getByText('Ver 5 consejos más').click()
  await sinFallos(page)
})

test('«Elegir ejercicio» en la sesión (C19)', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await expect(page.getByRole('dialog', { name: 'Elegir ejercicio' })).toBeVisible()
  await sinFallos(page)
})

test('la biblioteca de ejercicios, con un músculo elegido', async ({ page }) => {
  // Dos pasadas de axe sobre los 141 ejercicios: con todas las pruebas a la vez pasa de los 30 s
  test.slow()
  await page.goto('/entreno?hoja=biblioteca')
  const hoja = page.getByRole('dialog', { name: 'Biblioteca de ejercicios' })
  // La hoja sale cuando se ha cargado el plan: hasta que se ve, no hay animación que esperar
  await expect(hoja).toBeVisible()
  await sinFallos(page)
  await hoja.getByRole('button', { name: 'Dorsal' }).click()
  await sinFallos(page)
})

test('ver sesión, con un ejercicio desplegado', async ({ page }) => {
  await page.goto('/entreno/rutina/b1')
  await page.getByRole('button', { name: /Peso muerto rumano/ }).click()
  await expect(page.getByText('Última vez')).toBeVisible()
  await sinFallos(page)
  // La cabecera naranja (texto oscuro) también
  await page.goto('/entreno/rutina/a2')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await sinFallos(page)
})

test('sesión en curso, con una serie y un calentamiento hechos', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  await page
    .getByRole('button', { name: /^Calentamiento:/ })
    .first()
    .click()
  await page.getByRole('button', { name: 'Serie 1 hecha' }).click()
  await sinFallos(page)
  // Con el teclado abierto y el descanso encima
  await page.getByLabel('Kilos de la serie 2').click()
  await expect(page.getByRole('group', { name: 'Teclado numérico' })).toBeVisible()
  await sinFallos(page)
})

test('hojas de la sesión: esta sesión y descanso', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: /^Esta sesión/ }).click()
  await expect(page.getByRole('dialog', { name: 'Esta sesión' })).toBeVisible()
  await sinFallos(page)
  await page.getByRole('button', { name: 'Cerrar' }).click()
  await page.getByRole('button', { name: /Descanso 3:00, cambiar/ }).click()
  await expect(page.getByRole('dialog', { name: 'Descanso' })).toBeVisible()
  await sinFallos(page)
})

test('tarjeta final de la sesión', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  for (const n of [1, 2, 3]) await page.getByRole('button', { name: `Serie ${n} hecha` }).click()
  await page.getByRole('button', { name: 'Terminar' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Terminar' }).click()
  await expect(page.getByText(/días de racha/)).toBeVisible()
  await sinFallos(page)
})

test('piezas de diseño en claro y oscuro', async ({ page }) => {
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme })
    await page.goto('/dev/ui')
    await expect(page.locator('body')).toBeVisible()
    await sinFallos(page, true)
  }
})

test('elegir rutina y detalle de una rutina de MUTA', async ({ page }) => {
  // Tres pasadas de axe en páginas largas: sola tarda ~16 s y, con el resto en paralelo, rozaba los 30 s por defecto
  test.setTimeout(60_000)
  await page.goto('/bienvenida')
  await page.getByRole('link', { name: 'Comenzar' }).click()
  await page.getByRole('link', { name: 'Siguiente' }).click()
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await expect(page).toHaveURL('/entreno/rutinas')
  await sinFallos(page)
  await page.goto('/entreno/programa/muta-cuerpo-completo-4d')
  await expect(page.getByRole('button', { name: 'Empezar esta rutina' })).toBeVisible()
  await sinFallos(page)
  // con una sesión y un ejercicio desplegados
  // Las sesiones salen cerradas: se abre la que lleva el ejercicio
  await page
    .locator('details:not(:has(details))', { has: page.getByText(/Press militar en máquina/) })
    .first()
    .locator('summary')
    .click()
  await page
    .getByRole('button', { name: /Press militar en máquina/ })
    .first()
    .click()
  await sinFallos(page)
})

test('Editar rutina, sus consejos del entrenador y Editar ejercicio (con las repeticiones abiertas)', async ({
  page,
}) => {
  await page.goto('/entreno')
  await page.getByRole('button', { name: 'Tu rutina' }).click()
  await page
    .getByRole('dialog', { name: 'Tu rutina' })
    .getByRole('button', { name: /Editar rutina/ })
    .click()
  await expect(page.getByRole('dialog', { name: 'Editar rutina' })).toBeVisible()
  await sinFallos(page)
  await page.getByRole('button', { name: /^Peso muerto rumano/ }).click()
  const ej = page.getByRole('dialog', { name: 'Peso muerto rumano' })
  await ej.locator('summary', { hasText: 'Repeticiones' }).click()
  await sinFallos(page)
})

test('foto de la sesión (desde Editar rutina) y el «···» de un ejercicio con tus notas', async ({ page }) => {
  await page.goto('/entreno')
  await page.getByRole('button', { name: 'Tu rutina' }).click()
  await page
    .getByRole('dialog', { name: 'Tu rutina' })
    .getByRole('button', { name: /Editar rutina/ })
    .click()
  await page.getByRole('button', { name: /foto (a|de) Isquios, glúteo y pecho/ }).click()
  await expect(page.getByRole('dialog', { name: 'Foto de la sesión' })).toBeVisible()
  await sinFallos(page)
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: 'Opciones de Peso muerto rumano' }).click()
  await expect(page.getByRole('dialog', { name: 'Peso muerto rumano' })).toBeVisible()
  await sinFallos(page)
  await page.getByRole('button', { name: /Tus notas/ }).click()
  await sinFallos(page)
})
