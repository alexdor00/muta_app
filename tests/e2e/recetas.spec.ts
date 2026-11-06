import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Recetas y Menú (sin el recetario privado: salen los platos de la dieta de ejemplo, «De ejemplo»). Un plato ajustado a
// lo que te falta y apuntado, tu menú con un plato y cuándo cocinarlo, lo de hoy, la compra que sale del menú, cuadrar el
// día y axe en sus pantallas. Datos escritos a mano: perfil y un objetivo de 2.375 kcal, sin nada apuntado hoy.

async function prepararObjetivo(page: Page) {
  await page.goto('/dev/ui')
  await page.evaluate(async () => {
    for (let i = 0; i < 100; i++) {
      const dbs = await indexedDB.databases()
      if (dbs.some((d) => d.name === 'muta' && (d.version ?? 0) > 1)) break
      await new Promise((ok) => setTimeout(ok, 50))
    }
    const db = await new Promise<IDBDatabase>((ok, ko) => {
      const r = indexedDB.open('muta')
      r.onsuccess = () => ok(r.result)
      r.onerror = () => ko(r.error)
    })
    const ahora = new Date().toISOString()
    const tx = db.transaction(['profile', 'userContent'], 'readwrite')
    tx.objectStore('profile').put({
      id: 'me',
      daysPerWeek: 4,
      level: 'intermediate',
      goal: 'lose_fat',
      createdAt: ahora,
      updatedAt: ahora,
      deletedAt: null,
    })
    tx.objectStore('userContent').put({
      id: 'nutricion',
      target: 'nutricion',
      cuerpo: { sexo: 'hombre', edad: 30, alturaCm: 180, pesoKg: 81 },
      pasos: 10300,
      diasEntreno: 4,
      fase: 'definicion',
      ritmo: 0.75,
      proteinaGKg: 1.8,
      grasaGKg: 0.8,
      kcal: 2375,
      kcalAnterior: null,
      desde: '2026-01-01',
      aMano: false,
      creado: '2026-01-01',
    })
    await new Promise((ok, ko) => {
      tx.oncomplete = ok
      tx.onerror = () => ko(tx.error)
    })
    db.close()
  })
}

test('un plato: ajustarlo a lo que te falta y apuntarlo (se deshace)', async ({ page }) => {
  await prepararObjetivo(page)
  await page.goto('/comida?vista=recetas')
  await expect(page.getByRole('heading', { name: 'De ejemplo' })).toBeVisible()
  await page
    .getByRole('link', { name: /Pollo con arroz y verduras/ })
    .first()
    .click()
  await expect(page.getByRole('heading', { name: 'Pollo con arroz y verduras', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ingredientes' })).toBeVisible()
  await page.getByRole('button', { name: 'Ajustar a lo que falta' }).click()
  const hoja = page.getByRole('dialog', { name: /^Ajustar (al|a la) / })
  await expect(hoja.getByRole('region', { name: /Así queda/ })).toBeVisible()
  await hoja.getByRole('button', { name: 'Aplicar y apuntar' }).click()
  await expect(page.getByRole('status')).toContainText('Ajustado y apuntado')
  await page.getByRole('button', { name: 'Deshacer' }).click()
})

test('tu menú: un plato en la cena de hoy, cuándo cocinarlo y lo de hoy', async ({ page }) => {
  await prepararObjetivo(page)
  await page.goto('/comida?vista=menu')
  const hoy = page
    .getByRole('region', { name: /./ })
    .filter({ has: page.getByRole('heading', { name: /^Hoy ·/ }) })
  await hoy.getByRole('button', { name: /Cena.*Añadir plato/ }).click()
  const elegir = page.getByRole('dialog', { name: /^Cena ·/ })
  await elegir.getByRole('button', { name: 'Poner Salmón con patata asada' }).click()
  await expect(page.getByRole('status')).toContainText('Salmón con patata asada: en la cena')
  await hoy.getByRole('button', { name: /Cena.*Salmón con patata asada/ }).click()
  const hueco = page.getByRole('dialog', { name: /^Cena ·/ })
  await hueco.getByRole('button', { name: 'Cuándo cocinarlo' }).click()
  const cocinar = page.getByRole('dialog', { name: 'Cocinar · Salmón con patata asada' })
  await cocinar.getByLabel('Hora').fill('20:30')
  await expect(cocinar.getByRole('region', { name: 'Cocinas en total' })).toContainText('Salmón')
  await cocinar.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByRole('status')).toContainText('a las 20:30')
  // Lo de hoy, en Comida · Hoy
  await page.goto('/comida')
  const loDeHoy = page.getByRole('region', { name: 'Tu nutricionista · lo de hoy' })
  await expect(loDeHoy).toContainText('20:30 · Cocina Salmón con patata asada')
  await loDeHoy.getByRole('button', { name: /Cena · Salmón con patata asada/ }).click()
  await expect(page.getByRole('status')).toContainText('apuntado')
  // La compra sale del menú
  await page.goto('/comida/compra')
  await expect(page.getByText(/Salmón/).first()).toBeVisible()
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

test('accesibilidad: Recetas, un plato, el menú y tu nutricionista', async ({ page }) => {
  test.setTimeout(150_000)
  await prepararObjetivo(page)
  const revisar = async (donde: string) => {
    const r = await new AxeBuilder({ page }).analyze()
    expect(r.violations, `${donde}: ${r.violations.map((v) => v.id).join(', ')}`).toEqual([])
  }
  await page.goto('/comida?vista=recetas')
  await expect(page.getByRole('heading', { name: 'De ejemplo' })).toBeVisible()
  await revisar('Recetas')
  await page.goto('/comida/plato/ej-pollo_arroz')
  await expect(page.getByRole('heading', { name: 'Ingredientes' })).toBeVisible()
  await revisar('Plato')
  await page.getByRole('button', { name: 'Ajustar a lo que falta' }).click()
  await expect(page.getByRole('dialog', { name: /^Ajustar (al|a la) / })).toBeVisible()
  await revisar('Ajustar')
  await page.goto('/comida?vista=menu')
  await expect(page.getByRole('button', { name: 'Cuadrar la semana' })).toBeVisible()
  await revisar('Menú')
  await page.goto('/comida/recetas/ejemplo')
  await expect(page.getByRole('heading', { name: 'De ejemplo', level: 1 })).toBeVisible()
  await revisar('Categoría')
  await page.goto('/comida/nutricionista')
  await expect(page.getByRole('heading', { name: 'Tu nutricionista', level: 1 })).toBeVisible()
  await revisar('Tu nutricionista')
})
