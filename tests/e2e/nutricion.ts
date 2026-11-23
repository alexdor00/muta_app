// Lo común de los recorridos de Nutrición: un perfil con su objetivo (2.375 kcal, sin nada apuntado) y escribir tu menú
// directamente en IndexedDB (para empezar en un punto concreto: tu semana resuelta con una tanda sin hacer).
import type { Page } from '@playwright/test'

/** Abre la base de la app (ya migrada) y escribe estos documentos en `profile` y `userContent`. */
async function escribir(page: Page, docs: { store: 'profile' | 'userContent'; doc: object }[]) {
  await page.goto('/dev/ui')
  await page.evaluate(async (lista) => {
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
    const tx = db.transaction(['profile', 'userContent'], 'readwrite')
    for (const x of lista) tx.objectStore(x.store).put(x.doc)
    await new Promise((ok, ko) => {
      tx.oncomplete = ok
      tx.onerror = () => ko(tx.error)
    })
    db.close()
  }, docs)
}

/** Un perfil y su objetivo de 2.375 kcal (definición), sin nada apuntado. */
export async function prepararObjetivo(page: Page) {
  const ahora = new Date().toISOString()
  await escribir(page, [
    {
      store: 'profile',
      doc: {
        id: 'me',
        daysPerWeek: 4,
        level: 'intermediate',
        goal: 'lose_fat',
        createdAt: ahora,
        updatedAt: ahora,
        deletedAt: null,
      },
    },
    {
      store: 'userContent',
      doc: {
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
      },
    },
  ])
}

/** Escribe tu menú tal cual (con tu semana resuelta, si la lleva). */
export const guardarMenu = (page: Page, menu: object) =>
  escribir(page, [{ store: 'userContent', doc: { id: 'menu', target: 'nutricion', ...menu } }])
