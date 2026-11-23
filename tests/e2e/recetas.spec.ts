import AxeBuilder from '@axe-core/playwright'
import { expect } from '@playwright/test'
import { prepararObjetivo } from './nutricion.ts'
import { sinAnimaciones, testGuardando as test } from './plan.ts'

// Recetas y tus menús (sin el recetario privado: salen los platos de la dieta de ejemplo, «De ejemplo»). Un plato
// ajustado a lo que te falta y apuntado, tus menús (cuántos, qué día, un plato y cuándo cocinarlo), el tick en Hoy, lo de
// hoy en la pestaña Hoy, la compra de tus menús, cuadrar el día y axe en sus pantallas. Datos escritos a mano: perfil y un objetivo de 2.375 kcal, sin nada apuntado hoy.

test('un plato: apuntarlo hoy desde su hoja (se deshace)', async ({ page }) => {
  await prepararObjetivo(page)
  await page.goto('/comida?vista=recetas')
  await expect(page.getByRole('heading', { name: 'Categorías' })).toBeVisible()
  await page.getByLabel('Buscar una receta o un ingrediente').fill('pollo con arroz')
  await page
    .getByRole('link', { name: /Pollo con arroz y verduras/ })
    .first()
    .click()
  await expect(page.getByRole('heading', { name: 'Pollo con arroz y verduras', level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ingredientes' })).toHaveAttribute('aria-pressed', 'true')
  // Un solo «Apuntar» abre su hoja: hoy o en un menú, y en qué comida (usuario, 2026-11-21)
  await page.getByRole('button', { name: 'Apuntar', exact: true }).click()
  const hoja = page.getByRole('dialog', { name: /^Apuntar pollo con arroz/ })
  await hoja.getByRole('button', { name: /^Añadir (al|a la) / }).click()
  await expect(page.getByRole('status')).toContainText('Apuntado en')
  await page.getByRole('button', { name: 'Deshacer' }).click()
})

test('tus menús: un plato en la cena, el tick en Hoy y la compra', async ({ page }) => {
  await prepararObjetivo(page)
  await page.goto('/comida?vista=menus&menu=A')
  await expect(page.getByRole('radio', { name: 'Menú A' })).toBeChecked()
  await page.getByRole('button', { name: /^Cena .*Añadir/ }).click()
  await page
    .getByRole('dialog', { name: 'Cena' })
    .getByRole('button', { name: /^Añadir un plato/ })
    .click()
  const elegir = page.getByRole('dialog', { name: 'Menú A · Cena' })
  await elegir.getByRole('button', { name: 'Poner Salmón con patata asada' }).click()
  await expect(page.getByRole('status')).toContainText('Salmón con patata asada: en Menú A')
  // En Hoy, la cena ya trae su plato: el tick lo apunta
  await page.goto('/comida')
  await expect(page.getByRole('heading', { name: 'Menú A' })).toBeVisible()
  await page.getByRole('button', { name: 'Apuntar Salmón con patata asada' }).click()
  await expect(page.getByRole('status')).toContainText('apuntado')
  await expect(page.getByRole('button', { name: 'Salmón con patata asada: hecho, quitar' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  // La compra sale de tus menús, por días o por los menús que elijas
  await page.goto('/comida/compra')
  await expect(page.getByRole('heading', { name: /^Pescado y marisco/ })).toBeVisible()
  await expect(page.getByText(/Salmón/).first()).toBeVisible()
  await page.getByText('Unos menús', { exact: true }).click()
  // Cada menú entra una vez de serie (con ×0 la lista salía vacía)
  await expect(page.getByText('× 1')).toBeVisible()
  await page.getByRole('button', { name: 'Menú A: una vez más' }).click()
  await expect(page.getByText('× 2')).toBeVisible()
  await expect(page.getByText(/Salmón/).first()).toBeVisible()
})

test('tu dieta: cuántos menús y qué menú va cada día de tu ciclo', async ({ page }) => {
  await prepararObjetivo(page)
  await page.goto('/comida?vista=menus&menu=A')
  // Dos menús más: el nuevo queda elegido
  await page.getByText('+', { exact: true }).click()
  await page.getByText('+', { exact: true }).click()
  await expect(page.getByRole('radio', { name: 'Menú C' })).toBeChecked()
  // En Tu dieta, se toca un día del ciclo y se le pone un menú; el ciclo puede durar un día más
  // En Tu dieta, los días de la semana se reparten entre tus menús; tocar uno le pone el menú elegido
  await page.goto('/comida?vista=menus')
  const semana = page.getByRole('group', { name: 'Días de esta semana' })
  await expect(semana.getByRole('button', { name: /, Menú C$/ }).first()).toBeVisible()
  await page
    .getByRole('group', { name: 'Tus menús' })
    .getByRole('radio', { name: 'C' })
    .check({ force: true })
  await semana.getByRole('button', { name: /^lunes \d+, Menú A$/ }).click()
  await expect(semana.getByRole('button', { name: /^lunes \d+, Menú C$/ })).toBeVisible()
})

test('cuadrar el día con recetas: un plato por comida que queda', async ({ page }) => {
  await prepararObjetivo(page)
  await page.goto('/comida')
  await page.getByRole('button', { name: 'Cuadrar con recetas' }).click()
  const hoja = page.getByRole('dialog', { name: 'Cuadrar tu día' })
  await expect(hoja.getByRole('region', { name: 'Tu día con esto' })).toBeVisible()
  await hoja.getByRole('button', { name: 'Cambiar' }).first().click()
  await hoja.getByRole('button', { name: /^Aplicar y apuntar/ }).click()
  await expect(page.getByRole('status')).toContainText('Apuntadas las 4')
})

test('tu versión de un plato: quitar un ingrediente cambia la receta (se deshace)', async ({ page }) => {
  await prepararObjetivo(page)
  await page.goto('/comida/plato/ej-pollo_arroz')
  await page.getByRole('button', { name: /Arroz/ }).first().click()
  await page
    .getByRole('dialog', { name: /^Arroz/ })
    .getByRole('button', { name: 'Eliminar de la receta' })
    .click()
  await expect(page.getByRole('status')).toContainText('Sin arroz')
  await expect(page.getByRole('button', { name: /^Arroz/ })).toHaveCount(0)
  await page.getByRole('status').getByRole('button', { name: 'Deshacer' }).click()
  await expect(page.getByRole('button', { name: /Arroz/ }).first()).toBeVisible()
})

test('tu dieta pasa a tus menús (y se deshace)', async ({ page }) => {
  await prepararObjetivo(page)
  await page.goto('/comida?vista=dieta')
  await page.getByRole('button', { name: /^Probar una de ejemplo/ }).click()
  await page
    .getByRole('dialog', { name: 'Empezar la dieta' })
    .getByRole('button', { name: 'Empezar hoy' })
    .click()
  // Sin menús, Plan está vacío: «Usar mi dieta» pasa los de tu dieta
  await page.goto('/comida?vista=plan')
  await page.getByRole('button', { name: /^Usar mi dieta/ }).click()
  await expect(page.getByRole('status')).toContainText('Tus menús son ahora los de tu dieta')
  await page.goto('/comida?vista=menus&menu=A')
  await expect(page.getByRole('radio', { name: 'C', exact: true })).toBeVisible()
})

test('accesibilidad: Recetas, un plato, el menú y tu nutricionista', async ({ page }) => {
  test.setTimeout(150_000)
  await prepararObjetivo(page)
  const revisar = async (donde: string) => {
    // Con las hojas ya abiertas del todo (a medio abrir, el texto aún es transparente)
    await sinAnimaciones(page)
    const r = await new AxeBuilder({ page }).analyze()
    expect(r.violations, `${donde}: ${r.violations.map((v) => v.id).join(', ')}`).toEqual([])
  }
  await page.goto('/comida?vista=recetas')
  await expect(page.getByRole('heading', { name: 'Categorías' })).toBeVisible()
  await revisar('Recetas')
  await page.goto('/comida/plato/ej-pollo_arroz')
  await expect(page.getByRole('button', { name: 'Ingredientes' })).toHaveAttribute('aria-pressed', 'true')
  await revisar('Plato')
  await page.getByRole('button', { name: 'Apuntar', exact: true }).click()
  await expect(page.getByRole('dialog', { name: /^Apuntar / })).toBeVisible()
  await revisar('Apuntar')
  await page.goto('/comida/plato/ej-pollo_arroz')
  await page.getByRole('button', { name: /Arroz/ }).first().click()
  await expect(page.getByRole('dialog', { name: /^Arroz/ })).toBeVisible()
  await revisar('Cambiar un ingrediente')
  await page.goto('/comida?vista=menus&menu=A')
  await expect(page.getByRole('radio', { name: 'Menú A' })).toBeChecked()
  await revisar('Menú')
  await page.goto('/comida/recetas/ejemplo')
  await expect(page.getByRole('heading', { name: 'De ejemplo', level: 1 })).toBeVisible()
  await revisar('Categoría')
  await page.goto('/hoy')
  await expect(page.getByRole('img', { name: /de \d+ hechas/ })).toBeVisible()
  await revisar('Hoy')
  await page.goto('/comida/nutricionista')
  await expect(page.getByRole('heading', { name: 'Tu nutricionista', level: 1 })).toBeVisible()
  await revisar('Tu nutricionista')
})
