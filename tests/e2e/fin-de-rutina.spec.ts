import type { Page } from '@playwright/test'
import { expect, prepararPlan, testGuardando as test } from './plan.ts'

// Terminar la rutina y comparar tus vueltas (usuario, 2026-11-23; docs/problemas-con-el-tiempo.md, problema 7): una rutina
// con semanas contadas avisa al acabar; «Repetirla» abre otra etapa y se compara con la anterior a la misma semana.
// Las de una sola semana (las de MUTA) no terminan nunca. Un CSV que se parece a una rutina tuya pregunta si es la misma.

const RUTINA = 'mia:dos-semanas'
const DIA = 86_400_000

/** Una rutina de 2 semanas con una sesión («Torso»: press banca), en su última semana; hiciste su sesión hace 7 días. */
async function rutinaDeDosSemanas(page: Page) {
  await page.goto('/dev/ui')
  await page.evaluate(
    async ({ id, dia }) => {
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
      const semana = (n: number) => ({
        week: n,
        days: [
          {
            name: 'Torso',
            exercises: [{ name: 'Press banca', sets: 3, reps: '8-10', rest: '2:00' }],
          },
        ],
      })
      const hace = (dias: number) => {
        const d = new Date(Date.now() - dias * dia)
        d.setHours(18, 0, 0, 0)
        return {
          fecha: new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10),
          inicio: d.getTime(),
        }
      }
      const tx = db.transaction(['profile', 'plans', 'rotation', 'workouts', 'programs'], 'readwrite')
      tx.objectStore('profile').put({
        id: 'me',
        daysPerWeek: 1,
        level: 'intermediate',
        goal: 'gain_muscle',
        createdAt: ahora,
        updatedAt: ahora,
        deletedAt: null,
      })
      tx.objectStore('programs').put({
        id,
        title: 'Dos semanas',
        blocks: [{ title: null, weeks: [semana(1), semana(2)] }],
      })
      tx.objectStore('plans').put({
        id: 'current',
        programId: id,
        source: id,
        variant: null,
        adaptation: null,
        weakPoints: null,
        priorities: null,
        chosenAt: ahora,
      })
      tx.objectStore('rotation').put({ id: 'current', programId: id, bloque: 0, semana: 1, siguiente: 0 })
      const { fecha, inicio } = hace(7)
      tx.objectStore('workouts').put({
        id: 'semana-1',
        date: fecha,
        status: 'finished',
        fecha,
        inicio,
        segundos: 3000,
        sigla: 'S1',
        nombre: 'Torso',
        programId: id,
        ejercicios: [
          { nombre: 'Press banca', musculo: 'pecho', puesto: 1, series: [{ kg: 80, reps: 8, rir: 2 }] },
        ],
      })
      await new Promise((ok, ko) => {
        tx.oncomplete = ok
        tx.onerror = () => ko(tx.error)
      })
      db.close()
    },
    { id: RUTINA, dia: DIA },
  )
}

/** Hace la sesión S1 con una serie y la termina: abre el resumen. */
async function hacerS1(page: Page) {
  await page.goto('/entreno/sesion/s1')
  await page.getByRole('button', { name: 'Serie 1 hecha' }).click()
  await page.getByRole('button', { name: 'Terminar' }).click()
  await page
    .getByRole('dialog', { name: '¿Terminar con tan poco?' })
    .getByRole('button', { name: 'Terminar' })
    .click()
  await expect(page).toHaveURL('/entreno/sesion/s1/resumen')
}

test('una rutina con final: al acabar lo dice; «Repetirla» abre otra vuelta que se compara con la anterior', async ({
  page,
}) => {
  await rutinaDeDosSemanas(page)
  // La etapa de la primera vuelta se crea al abrir Entreno (desde tu primer entreno con esta rutina)
  await page.goto('/progreso')
  await expect(page.getByRole('button', { name: /^Etapa/ })).toBeVisible()
  await hacerS1(page)

  const fin = page.getByRole('region', { name: 'Rutina terminada' })
  await expect(fin).toContainText('Has completado Dos semanas')
  await expect(fin).toContainText('2 semanas')
  await fin.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'tests/e2e/capturas/fin-resumen.png', fullPage: true })
  await fin.getByRole('button', { name: 'Repetirla' }).click()
  await expect(page).toHaveURL(/\/entreno$/)
  // En Tu plan ya no está el aviso
  await expect(page.getByRole('region', { name: 'Rutina terminada' })).toHaveCount(0)

  // Progreso: la etapa nueva, «· vuelta 2», y en su hoja la fila frente a la anterior
  await page.goto('/progreso')
  await page.getByRole('button', { name: /^Etapa .*vuelta 2/ }).click()
  const etapa = page.getByRole('dialog', { name: /vuelta 2$/ })
  const fila = etapa.getByRole('button', { name: /^Frente a «/ })
  await expect(fila).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/capturas/fin-etapa.png' })
  await fila.click()
  const hoja = page.getByRole('dialog', { name: 'Comparar etapas' })
  await expect(hoja).toContainText('a la semana 1 de las dos')
  await expect(hoja.getByRole('table', { name: 'Ejercicio a ejercicio' })).toContainText('Press banca')
  await page.screenshot({ path: 'tests/e2e/capturas/fin-comparar.png' })
  await hoja.getByRole('table', { name: 'Ejercicio a ejercicio' }).scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'tests/e2e/capturas/fin-comparar-abajo.png' })
})

test('«Ahora no» en Tu plan quita el aviso y no vuelve al recargar', async ({ page }) => {
  await rutinaDeDosSemanas(page)
  await page.goto('/progreso')
  await expect(page.getByRole('button', { name: /^Etapa/ })).toBeVisible()
  await hacerS1(page)
  await page.getByRole('button', { name: 'Hecho' }).first().click()
  await expect(page).toHaveURL(/\/entreno$/)
  const fin = page.getByRole('region', { name: 'Rutina terminada' })
  await expect(fin).toContainText('Terminaste tu rutina')
  await page.screenshot({ path: 'tests/e2e/capturas/fin-tu-plan.png' })
  await fin.getByRole('button', { name: 'Ahora no' }).click()
  await expect(fin).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('link', { name: /^Hecha hoy S1/ })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Rutina terminada' })).toHaveCount(0)
})

test('«Me faltó un ejercicio» tras la última sesión: el aviso se va con el entreno', async ({ page }) => {
  await rutinaDeDosSemanas(page)
  await hacerS1(page)
  await expect(page.getByRole('region', { name: 'Rutina terminada' })).toBeVisible()
  await page.getByRole('button', { name: /Me faltó un ejercicio/ }).click()
  await expect(page).toHaveURL('/entreno/sesion/s1')
  await page.goto('/entreno')
  await expect(page.getByRole('region', { name: 'Rutina terminada' })).toHaveCount(0)
})

test('las rutinas de MUTA (una semana que se repite) no terminan nunca', async ({ page }) => {
  await prepararPlan(page)
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: 'Serie 1 hecha' }).click()
  await page.getByRole('button', { name: 'Terminar' }).click()
  await page
    .getByRole('dialog', { name: '¿Terminar con tan poco?' })
    .getByRole('button', { name: 'Terminar' })
    .click()
  await expect(page).toHaveURL('/entreno/sesion/b1/resumen')
  await expect(page.getByRole('heading', { name: 'B1 completada', level: 1 })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Rutina terminada' })).toHaveCount(0)
})

test('con una sola etapa no hay nada que comparar: ni fila ni «Comparar»', async ({ page }) => {
  await prepararPlan(page)
  await page.goto('/progreso')
  await page.getByRole('button', { name: /^Etapa/ }).click()
  const etapa = page.getByRole('dialog').first()
  await expect(etapa.getByRole('button', { name: 'Tus músculos' })).toBeVisible()
  await expect(etapa.getByRole('button', { name: /^Frente a «/ })).toHaveCount(0)
  await expect(etapa.getByRole('button', { name: 'Comparar con otra etapa' })).toHaveCount(0)
})

const CSV = `Sesión;Ejercicio;Series;Repeticiones;RIR;Descanso
Torso;Press banca;3;6-10;2;3:00
Pierna;Sentadilla;3;6-10;2;3:00`

async function cargarCsv(page: Page, nombre: string) {
  await page.goto('/entreno/rutinas')
  await page
    .getByText('Cargar desde CSV')
    .locator('input')
    .setInputFiles({ name: `${nombre}.csv`, mimeType: 'text/csv', buffer: Buffer.from(CSV) })
  await page
    .getByRole('dialog', { name: 'Tu rutina' })
    .getByRole('button', { name: 'Empezar esta rutina' })
    .click()
}

const tuyas = (page: Page) =>
  page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((ok, ko) => {
      const r = indexedDB.open('muta')
      r.onsuccess = () => ok(r.result)
      r.onerror = () => ko(r.error)
    })
    const todas = await new Promise<{ id: string }[]>((ok) => {
      const q = db.transaction('programs').objectStore('programs').getAll()
      q.onsuccess = () => ok(q.result as { id: string }[])
    })
    db.close()
    return todas.filter((p) => p.id.startsWith('mia:')).length
  })

test('cargar otra vez el mismo CSV pregunta si es tu rutina de antes: «Sí» usa la misma, «No», una nueva', async ({
  page,
}) => {
  await prepararPlan(page)
  await cargarCsv(page, 'mi-rutina')
  await expect(page).toHaveURL(/\/entreno$/)
  expect(await tuyas(page)).toBe(1)

  // Otra vez el mismo: pregunta; «Sí, es la misma» no crea otra
  await cargarCsv(page, 'mi-rutina')
  const pregunta = page.getByRole('dialog', { name: /^¿Es tu rutina «.*» de antes\?$/ })
  await expect(pregunta).toBeVisible()
  await pregunta.getByRole('button', { name: 'Sí, es la misma' }).click()
  await expect(page).toHaveURL(/\/entreno$/)
  expect(await tuyas(page)).toBe(1)

  // Y otra vez: «No, es otra» crea una nueva
  await cargarCsv(page, 'mi-rutina')
  await page
    .getByRole('dialog', { name: /^¿Es tu rutina/ })
    .getByRole('button', { name: 'No, es otra' })
    .click()
  await expect(page).toHaveURL(/\/entreno$/)
  expect(await tuyas(page)).toBe(2)
})
