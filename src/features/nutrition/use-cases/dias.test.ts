// Tus días de comida con el tiempo (usuario, 2026-11-23; docs/problemas-con-el-tiempo.md, problemas 1, 4 y 5), con una
// IndexedDB de mentira: guardar un día que no se había leído no borra lo que tenía, quitar en un día leído sí quita, la
// racha de días redondos no tiene tope y Progreso ve toda tu comida, no solo los últimos 35 días.
import 'fake-indexeddb/auto'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { getDb } from '../../../shared/data/db.ts'
import { addDays, localDate } from '../../../shared/lib/format.ts'
import type { Apunte } from '../domain/food.ts'
import { dias, objetivoDelDia, rachaRedonda } from '../state/comida.ts'
import { comidaParaProgreso } from './forProgreso.ts'
import { cargarComida, guardarDia, olvidarCarga } from './nutritionStore.ts'
import { guardarDatos } from './target.ts'

const HOY = localDate()

const apunte = (id: string, kcal: number): Apunte => ({
  id,
  comida: 'comida',
  nombre: id,
  alimentoId: null,
  gramos: null,
  raciones: null,
  racion: null,
  kcal,
  protein: 150,
  carbs: 200,
  fat: 60,
})

/** Escribe días en la base, como si se hubieran apuntado hace tiempo. */
async function escribir(lista: [string, Apunte[]][]) {
  const db = await getDb()
  const at = new Date().toISOString()
  for (const [date, apuntes] of lista)
    await db.put('foodLog', { date, apuntes, createdAt: at, updatedAt: at })
}

async function leerDelDisco(date: string): Promise<Apunte[]> {
  const db = await getDb()
  return ((await db.get('foodLog', date)) as { apuntes: Apunte[] } | undefined)?.apuntes ?? []
}

describe('tus días de comida con el tiempo', () => {
  let kcal = 0
  beforeAll(async () => {
    await guardarDatos({ sexo: 'hombre', edad: 30, alturaCm: 180, pesoKg: 80 }, 8000)
    kcal = objetivoDelDia(HOY)?.kcal ?? 0
    // 80 días seguidos clavando tu objetivo, hasta ayer (más de los 35 que se leen al abrir)
    await escribir(
      Array.from(
        { length: 80 },
        (_, i) => [addDays(HOY, -(i + 1)), [apunte(`d${i}`, kcal)]] as [string, Apunte[]],
      ),
    )
    // Y uno de hace 200 días, suelto
    await escribir([[addDays(HOY, -200), [apunte('viejo', 1800)]]])
    olvidarCarga()
    await cargarComida()
  })

  it('al abrir se leen los últimos días, no toda la historia', () => {
    expect(kcal).toBeGreaterThan(0)
    expect(dias.value[addDays(HOY, -1)]).toHaveLength(1)
    expect(dias.value[addDays(HOY, -200)]).toBeUndefined()
  })

  it('la racha de días redondos no se para en los días leídos: lee más hasta que se corta', async () => {
    // Hoy aún no has comido: la racha cuenta desde hoy, así que se corta en hoy. Con hoy redondo, son 81
    await guardarDia(HOY, [apunte('hoy', kcal)])
    await vi.waitFor(() => expect(rachaRedonda.value).toBe(81), { timeout: 5000 })
  })

  it('guardar en un día que no se había leído conserva lo que tenía y suma lo nuevo', async () => {
    const viejo = addDays(HOY, -200)
    await guardarDia(viejo, [apunte('nuevo', 300)])
    expect((await leerDelDisco(viejo)).map((a) => a.id)).toEqual(['viejo', 'nuevo'])
    expect(dias.value[viejo]?.map((a) => a.id)).toEqual(['viejo', 'nuevo'])
  })

  it('en un día leído, guardar lo que ves: quitar una comida la quita', async () => {
    const ayer = addDays(HOY, -1)
    await guardarDia(ayer, [...(dias.value[ayer] ?? []), apunte('extra', 100)])
    expect((await leerDelDisco(ayer)).map((a) => a.id)).toEqual(['d0', 'extra'])
    await guardarDia(ayer, [apunte('extra', 100)])
    expect((await leerDelDisco(ayer)).map((a) => a.id)).toEqual(['extra'])
  })

  it('dos apuntes seguidos en el mismo día no se pisan', async () => {
    const f = addDays(HOY, -2)
    const a = guardarDia(f, [...(dias.value[f] ?? []), apunte('uno', 100)])
    const b = guardarDia(f, [...(dias.value[f] ?? []), apunte('dos', 100)])
    await Promise.all([a, b])
    expect((await leerDelDisco(f)).map((x) => x.id)).toEqual(['d1', 'uno', 'dos'])
  })

  it('Progreso ve toda tu comida, también la de hace 200 días', async () => {
    const c = await comidaParaProgreso()
    const fechas = c.dias.map((d) => d.date)
    expect(fechas).toContain(addDays(HOY, -200))
    expect(fechas).toContain(addDays(HOY, -80))
    expect(c.dias.find((d) => d.date === addDays(HOY, -200))?.kcal).toBe(2100)
  })
})
