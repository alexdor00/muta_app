import type { Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { expect, test } from './plan.ts'

// Tu copia de seguridad (usuario, 2026-11-24; docs/problemas-con-el-tiempo.md, problema 10): guardarla en un archivo,
// recuperarla en otro móvil (lo de antes se sustituye, con las fotos), el recordatorio de Hoy cada mes y un archivo que no
// es una copia.

/** Cuántos entrenos terminados hay en la base. */
const entrenos = (page: Page) =>
  page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((ok, ko) => {
      const r = indexedDB.open('muta')
      r.onsuccess = () => ok(r.result)
      r.onerror = () => ko(r.error)
    })
    const n = await new Promise<number>((ok) => {
      const q = db.transaction('workouts').objectStore('workouts').count()
      q.onsuccess = () => ok(q.result)
    })
    db.close()
    return n
  })

/** Borra todo lo de este «móvil», como uno nuevo. */
const borrarTodo = (page: Page) =>
  page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((ok, ko) => {
      const r = indexedDB.open('muta')
      r.onsuccess = () => ok(r.result)
      r.onerror = () => ko(r.error)
    })
    const tx = db.transaction([...db.objectStoreNames], 'readwrite')
    for (const s of db.objectStoreNames) tx.objectStore(s).clear()
    await new Promise((ok) => (tx.oncomplete = ok))
    db.close()
  })

test('guardar la copia y recuperarla en un móvil nuevo', async ({ page }) => {
  await page.goto('/perfil')
  const copia = page.getByRole('region', { name: 'Copia de seguridad' })
  await expect(copia).toContainText('Aún no has guardado ninguna')
  // En el navegador de las pruebas no se pueden compartir archivos: se descarga
  const descarga = page.waitForEvent('download')
  await copia.getByRole('button', { name: 'Guardar copia' }).click()
  const archivo = await descarga
  expect(archivo.suggestedFilename()).toMatch(/^muta-copia-\d{4}-\d{2}-\d{2}\.json$/)
  await expect(page.getByRole('status')).toContainText('Copia guardada')
  await expect(copia).toContainText(/Última copia: .* · hoy/)
  const ruta = await archivo.path()
  const n = await entrenos(page)
  expect(n).toBeGreaterThan(0)

  // Otro móvil: sin nada. Se recupera la copia
  await borrarTodo(page)
  expect(await entrenos(page)).toBe(0)
  await page.goto('/perfil')
  await page
    .getByRole('region', { name: 'Copia de seguridad' })
    .getByText('Recuperar una copia')
    .locator('input')
    .setInputFiles({ name: 'muta-copia.json', mimeType: 'application/json', buffer: await readFile(ruta) })
  const hoja = page.getByRole('dialog', { name: '¿Recuperar esta copia?' })
  await expect(hoja.getByRole('list', { name: 'Lo que trae' })).toContainText(`Entrenos${n}`)
  await hoja.getByRole('button', { name: 'Recuperar' }).click()
  await expect(page).toHaveURL(/\/$|\/hoy$/)
  await expect.poll(() => entrenos(page)).toBe(n)
})

test('un archivo que no es una copia lo dice y no toca nada', async ({ page }) => {
  await page.goto('/perfil')
  const n = await entrenos(page)
  await page
    .getByRole('region', { name: 'Copia de seguridad' })
    .getByText('Recuperar una copia')
    .locator('input')
    .setInputFiles({
      name: 'otra-cosa.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"hola":1}'),
    })
  await expect(page.getByRole('status')).toContainText('no es una copia de MUTA')
  await expect(page.getByRole('dialog', { name: '¿Recuperar esta copia?' })).toHaveCount(0)
  expect(await entrenos(page)).toBe(n)
})

test('una vez al mes, al abrir la app, el cuadro de la copia; «Ahora no» lo deja un mes', async ({
  page,
}) => {
  // Usas la app desde hace 10 días y nunca guardaste copia
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((ok, ko) => {
      const r = indexedDB.open('muta')
      r.onsuccess = () => ok(r.result)
      r.onerror = () => ko(r.error)
    })
    const tx = db.transaction('profile', 'readwrite')
    const q = tx.objectStore('profile').get('me')
    q.onsuccess = () =>
      tx
        .objectStore('profile')
        .put({ ...q.result, createdAt: new Date(Date.now() - 10 * 86_400_000).toISOString() })
    await new Promise((ok) => (tx.oncomplete = ok))
    db.close()
  })
  await page.goto('/')
  const cuadro = page.getByRole('dialog', { name: 'Haz tu copia de seguridad' })
  await expect(cuadro).toContainText('Para no perder tus entrenos')
  await cuadro.getByRole('button', { name: 'Ahora no' }).click()
  await expect(cuadro).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Hoy', level: 1 })).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Haz tu copia de seguridad' })).toHaveCount(0)
})

test('recién empezado no sale el cuadro de la copia', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Hoy', level: 1 })).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Haz tu copia de seguridad' })).toHaveCount(0)
})
