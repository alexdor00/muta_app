import { test as base, expect, type Page } from '@playwright/test'

// Punto de partida de los recorridos de Entreno: un perfil, la rutina «MUTA · Cuerpo completo A/B» guardada, la
// siguiente sesión B1 y un historial de prueba escrito a mano (no viene de nadie). B1 se hizo hace 7, 14 y 21 días;
// la última vez, con los números del diseño (peso muerto rumano 60 × 10, 62,5 × 6, 60 × 7).

type Serie = { kg: number | null; reps: number }
type Ejercicio = { nombre: string; musculo: string; puesto: number; series: Serie[] }

const s = (kg: number, ...reps: number[]): Serie[] => reps.map((r) => ({ kg, reps: r }))

/** B1 la última vez (hace 7 días). */
const B1: Ejercicio[] = [
  {
    nombre: 'Peso muerto rumano',
    musculo: 'femoral',
    puesto: 1,
    series: [...s(60, 10), ...s(62.5, 6), ...s(60, 7)],
  },
  { nombre: 'Press inclinado con mancuernas', musculo: 'pecho', puesto: 2, series: s(22, 12, 11, 10) },
  { nombre: 'Curl inclinado con mancuernas', musculo: 'biceps', puesto: 3, series: s(12, 11, 10) },
  { nombre: 'Curl femoral tumbado', musculo: 'femoral', puesto: 4, series: s(40, 10, 9) },
  { nombre: 'Curl predicador', musculo: 'biceps', puesto: 5, series: s(35, 15, 13) },
  { nombre: 'Laterales en polea', musculo: 'hombro_lat', puesto: 6, series: s(15, 13, 12, 11) },
  { nombre: 'Crunch en máquina', musculo: 'core', puesto: 7, series: s(40, 11, 10) },
]

/** Una vez anterior: todo con menos peso y, hace 14 días, el rumano en tercer puesto. */
const antes = (menos: number, rumanoEn: number): Ejercicio[] =>
  B1.map((e) => ({
    ...e,
    puesto: e.nombre === 'Peso muerto rumano' ? rumanoEn : e.puesto === rumanoEn ? 1 : e.puesto,
    series: e.series.map((x) => ({ ...x, kg: x.kg === null ? null : x.kg - menos })),
  }))

const A1: Ejercicio[] = [
  { nombre: 'Sentadilla hack', musculo: 'cuadriceps', puesto: 1, series: s(100, 10, 9, 8) },
  {
    nombre: 'Remo con pecho apoyado (codos abiertos)',
    musculo: 'espalda_alta',
    puesto: 2,
    series: s(50, 12, 11, 10),
  },
]

const DIA = 86_400_000

/** La fecha de hace `dias` días, en hora local (AAAA-MM-DD). */
function haceDias(dias: number): { fecha: string; inicio: number } {
  const d = new Date(Date.now() - dias * DIA)
  d.setHours(18, 0, 0, 0)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
  return { fecha: local, inicio: d.getTime() }
}

function entreno(dias: number, sigla: string, nombre: string, ejercicios: Ejercicio[]) {
  const { fecha, inicio } = haceDias(dias)
  return {
    id: `prueba-${sigla}-${dias}`,
    date: fecha,
    status: 'finished',
    fecha,
    inicio,
    segundos: 62 * 60,
    sigla,
    nombre,
    programId: 'muta-cuerpo-completo-4d',
    ejercicios,
  }
}

export const ENTRENOS = [
  entreno(21, 'B1', 'Isquios, glúteo y pecho', antes(5, 1)),
  entreno(14, 'B1', 'Isquios, glúteo y pecho', antes(2.5, 3)),
  entreno(8, 'A1', 'Cuádriceps y espalda', A1),
  entreno(7, 'B1', 'Isquios, glúteo y pecho', B1),
]

/**
 * B1 hace 10 días y otra vez hace 3 con 2,5 kg más en todo: esta semana mejoras en todas las series (para el entrenador).
 */
export const ENTRENOS_MEJORANDO = [
  entreno(10, 'B1', 'Isquios, glúteo y pecho', antes(2.5, 1)),
  entreno(3, 'B1', 'Isquios, glúteo y pecho', B1),
]

/** Guarda el perfil, el plan, la rotación (toca B1) y los entrenos, y deja la app en Tu plan sin nada en memoria. */
export async function prepararPlan(page: Page, entrenos = ENTRENOS) {
  // La app crea la base al abrirse; después se escribe directamente en ella
  await page.goto('/dev/ui')
  await page.evaluate(async (filas) => {
    // Espera a que la app haya creado la base con sus almacenes (si se abriera antes, nacería vacía)
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
    const tx = db.transaction(['profile', 'plans', 'rotation', 'workouts'], 'readwrite')
    tx.objectStore('profile').put({
      id: 'me',
      daysPerWeek: 4,
      level: 'intermediate',
      goal: 'gain_muscle',
      createdAt: ahora,
      updatedAt: ahora,
      deletedAt: null,
    })
    tx.objectStore('plans').put({
      id: 'current',
      programId: 'muta-cuerpo-completo-4d',
      source: 'muta-cuerpo-completo-4d',
      variant: null,
      adaptation: null,
      weakPoints: null,
      priorities: null,
      chosenAt: ahora,
    })
    tx.objectStore('rotation').put({
      id: 'current',
      programId: 'muta-cuerpo-completo-4d',
      bloque: 0,
      semana: 0,
      siguiente: 1,
    })
    for (const f of filas) tx.objectStore('workouts').put(f)
    await new Promise((ok, ko) => {
      tx.oncomplete = ok
      tx.onerror = () => ko(tx.error)
    })
    db.close()
  }, entrenos)
}

/**
 * Espera a que lo que la app está guardando quede escrito: una transacción de escritura sobre todos los almacenes no empieza
 * hasta que acaban las anteriores. Sin esto, en la CI (más rápida) se recargaba antes de que IndexedDB terminase.
 */
export async function guardado(page: Page) {
  await page.evaluate(async () => {
    await new Promise((ok) => setTimeout(ok, 150))
    const db = await new Promise<IDBDatabase>((ok, ko) => {
      const r = indexedDB.open('muta')
      r.onsuccess = () => ok(r.result)
      r.onerror = () => ko(r.error)
    })
    if (db.objectStoreNames.length) {
      const tx = db.transaction([...db.objectStoreNames], 'readwrite')
      await new Promise((ok) => {
        tx.oncomplete = ok
        tx.onerror = ok
        tx.onabort = ok
      })
    }
    db.close()
  })
}

/**
 * Espera a que no quede ninguna animación (las hojas suben con una: a medio subir, los grises aún no tienen su contraste).
 * Cuenta tras dos fotogramas, porque justo tras un toque la de la hoja aún no ha empezado, y cuenta las que van a empezar.
 */
export async function sinAnimaciones(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(async () => {
        for (let i = 0; i < 2; i++) await new Promise((ok) => requestAnimationFrame(ok))
        return document.getAnimations().filter((a) => a.playState === 'running' || a.pending).length
      }),
    )
    .toBe(0)
}

/**
 * `test` como en el móvil por la wifi (http://192.168…, sin https: sin `crypto.randomUUID`) y en el que recargar o ir
 * a otra página espera a lo guardado.
 */
export const testGuardando = base.extend({
  page: async ({ page }, usar) => {
    await page.addInitScript(() => {
      // @ts-expect-error -- se quita a propósito, como en un contexto sin https
      delete Crypto.prototype.randomUUID
    })
    const recargar = page.reload.bind(page)
    const ir = page.goto.bind(page)
    page.reload = async (opciones) => {
      await guardado(page)
      return recargar(opciones)
    }
    page.goto = async (url, opciones) => {
      if (page.url().startsWith('http')) await guardado(page)
      return ir(url, opciones)
    }
    await usar(page)
  },
})

/** `test` con el plan de prueba ya guardado antes de cada recorrido (y esperando a lo guardado). */
export const test = testGuardando.extend<{ plan: void }>({
  plan: [
    async ({ page }, use) => {
      await prepararPlan(page)
      await use()
    },
    { auto: true },
  ],
})

export { expect }
