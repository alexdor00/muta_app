// Los casos de uso de tu objetivo con una IndexedDB de mentira: la recarga, las sugerencias (aplicar, «Ahora no»,
// deshacer, cambiar de fase) y fijar a mano, también en las situaciones raras (sin objetivo, dos veces, un id que no existe).
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { addDays } from '../../../shared/lib/format.ts'
import {
  ajustes,
  cambios,
  hoy,
  objetivoDe,
  recargaActiva,
  tiposEntreno,
  type Cambio,
} from '../state/comida.ts'
import { guardarAjustes, guardarCambio } from './nutritionStore.ts'
import {
  aplicarSugerencia,
  descartarRecarga,
  descartarSugerencia,
  deshacerCambio,
  deshacible,
  empezarRecarga,
  fijarAMano,
  guardarDatos,
  terminarRecarga,
  volverARecarga,
} from './target.ts'

const HOY = '2026-11-23' // lunes
const MANANA = addDays(HOY, 1)

/** Entreno lunes, miércoles y viernes de estas dos semanas; lo demás, descanso. */
function semana() {
  const t: Record<string, 'entreno' | 'descanso'> = {}
  for (let k = -7; k < 14; k++) {
    const f = addDays(HOY, k)
    const d = new Date(`${f}T12:00:00`).getDay()
    t[f] = d === 1 || d === 3 || d === 5 ? 'entreno' : 'descanso'
  }
  return t
}

async function enDefinicion() {
  await guardarDatos({ sexo: 'hombre', edad: 30, alturaCm: 180, pesoKg: 80 }, 8000)
  const a = ajustes.value
  if (!a) throw new Error('sin ajustes')
  await guardarAjustes({ ...a, fase: 'definicion', faseDesde: addDays(HOY, -60), ritmo: 0.5, kcal: 2200 })
}

/** Una sugerencia pendiente, como la deja la revisión semanal. */
function sugerencia(de: number, a: number, extra?: NonNullable<Cambio['revision']>['extra']) {
  return guardarCambio({
    status: 'pendiente',
    tipo: 'sugerencia',
    de,
    a,
    texto: 'Bajas más despacio de lo previsto',
    revision: {
      tipo: 'cambio',
      de,
      a,
      lento: true,
      pct: -0.1,
      kgSemana: -0.1,
      previsto: { min: -0.7, max: -0.3 },
      comprobaciones: [],
      extra,
    },
  })
}

beforeEach(() => {
  ajustes.value = null
  cambios.value = []
  hoy.value = HOY
  tiposEntreno.value = semana()
})

describe('sin objetivo, nada se rompe ni se crea', () => {
  it('la recarga, terminarla, «Ahora no» y aplicar no hacen nada', async () => {
    expect(await empezarRecarga(MANANA)).toBeNull()
    expect(await terminarRecarga()).toBeNull()
    expect(await descartarRecarga()).toBeNull()
    await volverARecarga(null)
    await aplicarSugerencia('no-existe')
    await deshacerCambio('no-existe')
    expect(await fijarAMano(2000)).toBe(false)
    expect(ajustes.value).toBeNull()
    expect(deshacible()).toBeNull()
  })
})

describe('la recarga de hidratos', () => {
  it('solo sube las kcal los días de entreno; termina ayer y se deshace', async () => {
    await enDefinicion()
    const defi = objetivoDe(ajustes.value!, HOY).kcal
    const previo = await empezarRecarga(addDays(HOY, 6), 3)
    expect(previo?.recarga ?? null).toBeNull()
    expect(ajustes.value?.recarga).toEqual({ desde: HOY, hasta: addDays(HOY, 6), sesiones: 3 })
    // Lunes (entreno): mantenimiento, más; martes (descanso): la definición
    expect(objetivoDe(ajustes.value!, HOY).kcal).toBeGreaterThan(defi)
    expect(objetivoDe(ajustes.value!, MANANA).kcal).toBe(defi)
    // Terminar: desde hoy, la definición
    const antes = await terminarRecarga()
    expect(ajustes.value?.recarga?.hasta).toBe(addDays(HOY, -1))
    expect(objetivoDe(ajustes.value!, HOY).kcal).toBe(defi)
    // «Deshacer» de terminar: vuelve la recarga
    await volverARecarga(antes)
    expect(ajustes.value?.recarga?.hasta).toBe(addDays(HOY, 6))
  })

  it('acaba al hacer las sesiones de una vuelta, aunque la fecha prevista sea más tarde', async () => {
    await enDefinicion()
    await guardarAjustes({
      ...ajustes.value!,
      recarga: { desde: addDays(HOY, -7), hasta: addDays(HOY, 7), sesiones: 3 },
    })
    // Lunes, miércoles y viernes pasados: tres entrenos hechos; hoy ya no es recarga
    const r = recargaActiva()
    expect(r && r.hasta < HOY).toBe(true)
  })

  it('terminar sin recarga no inventa una', async () => {
    await enDefinicion()
    await terminarRecarga()
    expect(ajustes.value?.recarga ?? null).toBeNull()
  })

  it('«Ahora no» guarda el día y se deshace', async () => {
    await enDefinicion()
    const previo = await descartarRecarga()
    expect(ajustes.value?.recargaDescartada).toBe(HOY)
    await volverARecarga(previo)
    expect(ajustes.value?.recargaDescartada ?? null).toBeNull()
  })
})

describe('las sugerencias del entrenador', () => {
  it('aplicar: vale desde mañana; hoy sigue lo de antes; se deshace', async () => {
    await enDefinicion()
    const c = await sugerencia(2200, 2050)
    await aplicarSugerencia(c.id)
    expect(ajustes.value).toMatchObject({ kcal: 2050, kcalAnterior: 2200, desde: MANANA })
    expect(objetivoDe(ajustes.value!, HOY).kcal).toBe(2200)
    expect(objetivoDe(ajustes.value!, MANANA).kcal).toBe(2050)
    expect(deshacible()?.id).toBe(c.id)
    await deshacerCambio(c.id)
    expect(ajustes.value?.kcal).toBe(2200)
    expect(cambios.value.find((x) => x.id === c.id)?.status).toBe('deshecho')
    expect(deshacible()).toBeNull()
  })

  it('aplicar dos veces o deshacer dos veces no cambia nada más', async () => {
    await enDefinicion()
    const c = await sugerencia(2200, 2050)
    await aplicarSugerencia(c.id)
    await aplicarSugerencia(c.id)
    expect(ajustes.value?.kcalAnterior).toBe(2200)
    await deshacerCambio(c.id)
    await deshacerCambio(c.id)
    expect(ajustes.value?.kcal).toBe(2200)
  })

  it('«Ahora no»: queda en el historial y ya no se puede aplicar', async () => {
    await enDefinicion()
    const c = await sugerencia(2200, 2050)
    await descartarSugerencia(c.id)
    await aplicarSugerencia(c.id)
    expect(ajustes.value?.kcal).toBe(2200)
    expect(cambios.value.find((x) => x.id === c.id)?.status).toBe('descartado')
  })

  it('salir de la definición: mantenimiento desde mañana, guarda cómo fue y se deshace entera', async () => {
    await enDefinicion()
    const c = await sugerencia(2200, 2200, { fase: 'mantenimiento', situacion: 'salida' })
    await aplicarSugerencia(c.id)
    expect(ajustes.value).toMatchObject({
      fase: 'mantenimiento',
      faseDesde: MANANA,
      situacion: 'salida',
      mesetas: 0,
    })
    expect(ajustes.value?.ultimaDefinicion).toMatchObject({ hasta: HOY, kcalFinal: 2200 })
    expect(ajustes.value?.ultimaDefinicion?.atragantada).toBeUndefined()
    await deshacerCambio(c.id)
    expect(ajustes.value?.fase).toBe('definicion')
    expect(ajustes.value?.faseDesde).toBe(addDays(HOY, -60))
    expect(ajustes.value?.ultimaDefinicion ?? null).toBeNull()
  })

  it('una pausa porque la definición se atraganta queda marcada', async () => {
    await enDefinicion()
    const c = await sugerencia(2200, 2500, { fase: 'mantenimiento' })
    await aplicarSugerencia(c.id)
    expect(ajustes.value?.fase).toBe('mantenimiento')
    expect(ajustes.value?.ultimaDefinicion?.atragantada).toBe(true)
  })

  it('una etapa nueva o una meseta se guardan con la sugerencia', async () => {
    await enDefinicion()
    const etapa = await sugerencia(2200, 2100, { ritmoTramo: 0.75 })
    await aplicarSugerencia(etapa.id)
    expect(ajustes.value?.ritmoTramo).toBe(0.75)
    const meseta = await sugerencia(2100, 2300, { meseta: true })
    await aplicarSugerencia(meseta.id)
    expect(ajustes.value?.mesetas).toBe(1)
  })
})

describe('fijar tus kcal a mano', () => {
  it('rechaza lo imposible y acepta lo razonable', async () => {
    await enDefinicion()
    for (const k of [0, -100, 500, 9000, Number.NaN]) expect(await fijarAMano(k), String(k)).toBe(false)
    expect(ajustes.value?.kcal).toBe(2200)
    expect(await fijarAMano(2400)).toBe(true)
    expect(ajustes.value).toMatchObject({ kcal: 2400, aMano: true, desde: HOY })
  })
})
