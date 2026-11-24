import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, sinAnimaciones, testGuardando as test } from './plan.ts'

// Tu logro y tu premio (usuario, 2026-11-24): con el perfil de prueba de /dev/demo (tres etapas: dos acabadas y la
// definición de ahora, con medidas y fotos del cuerpo cada mes). Salen solos al abrir una pestaña, con la imagen para
// Instagram (1080 × 1920); «Guardar en Fotos» la descarga; «Ahora no» no vuelve; desde la hoja de su etapa, cuando quieras.

async function perfilDePrueba(page: Page, objetivoGrasa: number | null) {
  test.slow() // escribe unos 100 días y dibuja 12 fotos
  page.on('dialog', (d) => void d.accept())
  await page.goto('/dev/demo')
  await page.getByRole('button', { name: 'Cargar el perfil de prueba' }).click()
  await page.waitForURL('**/progreso')
  // Lo de antes cuenta (si no, la función solo celebra desde hoy) y, si se pide, una grasa objetivo ya alcanzada
  await page.evaluate(async (objetivo) => {
    const db = await new Promise<IDBDatabase>((ok, ko) => {
      const r = indexedDB.open('muta')
      r.onsuccess = () => ok(r.result)
      r.onerror = () => ko(r.error)
    })
    const tx = db.transaction('userContent', 'readwrite')
    tx.objectStore('userContent').put({ id: 'logros', target: 'logros', desde: '2020-01-01', vistos: [] })
    if (objetivo !== null) {
      const q = tx.objectStore('userContent').get('composicion')
      q.onsuccess = () => tx.objectStore('userContent').put({ ...q.result, objetivo })
    }
    await new Promise((ok) => (tx.oncomplete = ok))
    db.close()
  }, objetivoGrasa)
}

test('al cumplir tu objetivo, tu premio con tu antes y después; se guarda en Fotos y no vuelve', async ({
  page,
}) => {
  await perfilDePrueba(page, 30)
  await page.goto('/hoy')
  const premio = page.getByRole('dialog', { name: 'Tu premio' })
  await expect(
    premio.getByRole('img', { name: /Objetivo cumplido: Llegaste al 30 % de grasa/ }),
  ).toBeVisible()
  // Tu antes y después de cada postura, y las fotos de las sesiones
  await expect(premio.getByRole('button', { name: 'Antes y después: Frente' })).toBeVisible()
  await premio.getByRole('button', { name: 'Antes y después: Perfil' }).click()
  await expect(premio.getByRole('button', { name: 'Antes y después: Perfil' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.screenshot({ path: 'tests/e2e/capturas/premio.png' })
  await sinAnimaciones(page)
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations).toEqual([])
  const descarga = page.waitForEvent('download')
  await premio.getByRole('button', { name: 'Guardar en Fotos' }).click()
  expect((await descarga).suggestedFilename()).toBe('muta-premio.png')
  await premio.getByRole('button', { name: 'Ahora no' }).click()
  await expect(premio).toHaveCount(0)

  // Al volver a una pestaña, lo siguiente: el logro de una etapa que acabó
  await page.goto('/entreno')
  const logro = page.getByRole('dialog', { name: 'Tu logro' })
  await expect(logro.getByRole('img', { name: /^Etapa completada/ })).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/capturas/logro.png' })
  await logro.getByRole('button', { name: 'Ahora no' }).click()
  await expect(logro).toHaveCount(0)
})

test('desde la hoja de la etapa, tu premio cuando quieras', async ({ page }) => {
  await perfilDePrueba(page, 30)
  await page.goto('/progreso')
  const premioSolo = page.getByRole('dialog', { name: 'Tu premio' })
  await premioSolo.getByRole('button', { name: 'Ahora no' }).click()
  await page.getByRole('button', { name: /^Etapa Definición/ }).click()
  await page.getByRole('button', { name: /^Tu premio/ }).click()
  await expect(page.getByRole('dialog', { name: 'Tu premio' }).getByRole('img')).toBeVisible()
})

test('sin objetivo cumplido no hay premio', async ({ page }) => {
  await perfilDePrueba(page, 8)
  await page.goto('/hoy')
  await expect(page.getByRole('dialog', { name: 'Tu logro' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Tu premio' })).toHaveCount(0)
})
