// La consulta semanal con tu dieta: apuntas la cinta, el sueño y cómo te has sentido; el nutricionista mira tus semanas
// (domain/consult.ts) y propone. Nada cambia hasta «Aplicar desde mañana»; «Ahora no» lo deja en el historial y lo
// aplicado se deshace. La fuerza en tus básicos la da Entreno (por su index.ts).
import { addDays, formatDecimal } from '../../../shared/lib/format.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { fuerzaEnBasicos } from '../../training/index.ts'
import {
  decidir,
  diaCumplido,
  mediasSemanales,
  perdidas,
  senales,
  type Decision,
  type Metrica,
  type Propuesta,
  type Revision,
} from '../domain/consult.ts'
import { ajusteDe, type AjusteDieta } from '../domain/diet.ts'
import { sumar } from '../domain/food.ts'
import { dias, dieta, hoy, pesajes, serie } from '../state/comida.ts'
import { ahoraDieta, consultas, diaDe, revisiones, type Consulta } from '../state/dieta.ts'
import { guardarConsulta, guardarDieta, guardarRevision } from './nutritionStore.ts'

/** Lo que apuntas hoy (lo de hoy si ya empezaste la consulta). */
export function revisionDeHoy(): Revision {
  return (
    revisiones.value.find((r) => r.fecha === hoy.value) ?? {
      fecha: hoy.value,
      cintura: null,
      sueno: null,
      hambre: null,
      energia: null,
      fatiga: null,
      dolor: null,
      ganas: null,
      estres: null,
      nota: '',
    }
  )
}

/** La cintura de la consulta anterior (para comparar y como pista al escribir). */
export function cinturaAnterior(antesDe = hoy.value): number | null {
  return [...revisiones.value].reverse().find((r) => r.fecha < antesDe && r.cintura !== null)?.cintura ?? null
}

export type Informe = {
  semana: number
  decision: Decision
  metricas: Metrica[]
  /** Lo que ve el entrenador: las señales de mala recuperación de esta semana. */
  senales: string[]
}

/** Parte de los 7 últimos días (desde que empezaste) en que cumpliste el plan; null si aún no hay ninguno. */
function cumplimiento(): number | null {
  const d = dieta.value
  if (!d) return null
  const fechas = Array.from({ length: 7 }, (_, i) => addDays(hoy.value, i - 7)).filter((f) => f >= d.inicio)
  if (!fechas.length) return null
  const ok = fechas.filter((f) => {
    const dia = diaDe(f)
    const apuntes = dias.value[f] ?? []
    return dia
      ? diaCumplido(
          dia.recetas.map((r) => r.id),
          apuntes,
          sumar(apuntes),
          dia.total,
        )
      : false
  })
  return ok.length / fechas.length
}

const signo = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '')

/** Guarda lo que apuntaste y prepara el informe del nutricionista y del entrenador. */
export async function prepararConsulta(r: Revision): Promise<Informe | null> {
  await guardarRevision(r)
  const d = dieta.value
  const ahora = ahoraDieta.value
  if (!d || !ahora) return null
  let fuerza: number | null = null
  try {
    fuerza = (await fuerzaEnBasicos(hoy.value))?.cambio ?? null
  } catch (error) {
    logError(error, 'leer tu fuerza en los básicos')
  }
  const medias = mediasSemanales(pesajes.value, d.inicio, ahora.semana)
  const antes = cinturaAnterior(r.fecha)
  const cumplido = cumplimiento()
  const decision = decidir({
    semana: ahora.semana,
    fases: d.dieta.fases,
    fase: ahora.fase,
    medias,
    cintura: { ahora: r.cintura, antes },
    cumplido,
    fuerza,
    revision: r,
    umbrales: d.dieta.umbrales,
    pesoKg: serie.value.at(-1)?.tendencia ?? null,
  })
  const media = medias.at(-1) ?? null
  const bajada = perdidas(medias).at(-1) ?? null
  const metricas: Metrica[] = [
    {
      nombre: 'Peso medio',
      valor:
        media === null
          ? 'sin pesajes'
          : `${formatDecimal(media)} kg${bajada !== null ? ` · ${signo(-bajada)}${formatDecimal(Math.abs(bajada))}` : ''}`,
      bien: null,
    },
    {
      nombre: 'Cintura',
      valor:
        r.cintura === null
          ? 'sin medir'
          : `${formatDecimal(r.cintura)} cm${antes !== null ? ` · ${signo(r.cintura - antes)}${formatDecimal(Math.abs(Math.round((r.cintura - antes) * 10) / 10))}` : ''}`,
      bien: r.cintura !== null && antes !== null ? r.cintura <= antes : null,
    },
    {
      nombre: 'Plan cumplido',
      valor: cumplido === null ? '—' : `${Math.round(cumplido * 100)} %`,
      bien: cumplido === null ? null : cumplido >= 0.6,
    },
    {
      nombre: 'Fuerza en básicos',
      valor:
        fuerza === null
          ? 'sin datos'
          : `${signo(fuerza)}${formatDecimal(Math.abs(Math.round(fuerza * 1000) / 10))} %`,
      bien: fuerza === null ? null : fuerza > -0.02,
    },
  ]
  return { semana: ahora.semana, decision, metricas, senales: senales(r) }
}

/** Guarda la consulta. Si propone algo, queda pendiente hasta que aplicas o dices «Ahora no». Devuelve la consulta. */
export async function guardarInforme(i: Informe): Promise<Consulta> {
  const at = new Date().toISOString()
  const ya = consultas.value.find((c) => c.fecha === hoy.value && c.status === 'pendiente')
  const c: Consulta = {
    id: ya?.id ?? crypto.randomUUID(),
    area: 'dieta',
    status: i.decision.propuestas.length ? 'pendiente' : 'hecho',
    fecha: hoy.value,
    semana: i.semana,
    titulo: i.decision.titulo,
    detalle: i.decision.detalle,
    propuestas: i.decision.propuestas,
    elegida: null,
    ajusteId: null,
    createdAt: ya?.createdAt ?? at,
    updatedAt: at,
  }
  await guardarConsulta(c)
  return c
}

/** El ajuste nuevo que deja una propuesta, sobre lo que vale mañana. */
function ajusteCon(p: Propuesta, base: AjusteDieta, desde: string): AjusteDieta {
  const nuevo = { ...base, id: crypto.randomUUID(), desde }
  if (p.cambio.tipo === 'kcal')
    return {
      ...nuevo,
      kcal: {
        entreno: base.kcal.entreno + p.cambio.kcal.entreno,
        descanso: base.kcal.descanso + p.cambio.kcal.descanso,
      },
    }
  if (p.cambio.tipo === 'pasos') return { ...nuevo, pasos: base.pasos + p.cambio.pasos }
  return { ...nuevo, fase: p.cambio.fase }
}

/** «Aplicar desde mañana»: la propuesta cambia tu dieta desde mañana. */
export async function aplicar(consultaId: string, propuestaId: string): Promise<void> {
  const d = dieta.value
  const c = consultas.value.find((x) => x.id === consultaId)
  const p = c?.propuestas.find((x) => x.id === propuestaId)
  if (!d || !c || !p || c.status !== 'pendiente') return
  const manana = addDays(hoy.value, 1)
  const ajuste = ajusteCon(p, ajusteDe(d, manana), manana)
  await guardarDieta({ ...d, ajustes: [...d.ajustes, ajuste] })
  await guardarConsulta({
    ...c,
    status: 'aplicado',
    elegida: p.id,
    ajusteId: ajuste.id,
    updatedAt: new Date().toISOString(),
  })
}

/** «Ahora no»: no cambia nada; queda en el historial. */
export async function ahoraNo(consultaId: string): Promise<void> {
  const c = consultas.value.find((x) => x.id === consultaId)
  if (!c || c.status !== 'pendiente') return
  await guardarConsulta({ ...c, status: 'descartado', updatedAt: new Date().toISOString() })
}

/** Deshace lo aplicado en una consulta (vuelve la dieta como estaba). */
export async function deshacer(consultaId: string): Promise<void> {
  const d = dieta.value
  const c = consultas.value.find((x) => x.id === consultaId)
  if (!d || !c || c.status !== 'aplicado') return
  await guardarDieta({ ...d, ajustes: d.ajustes.filter((a) => a.id !== c.ajusteId) })
  await guardarConsulta({ ...c, status: 'deshecho', updatedAt: new Date().toISOString() })
}

/** La consulta que espera tu respuesta (o null). */
export function consultaPendiente(): Consulta | null {
  return consultas.value.find((c) => c.status === 'pendiente') ?? null
}

/** La última consulta aplicada, si aún se puede deshacer (su ajuste es el último de tu dieta). */
export function consultaDeshacible(): Consulta | null {
  const ultimo = dieta.value?.ajustes.at(-1)?.id
  return consultas.value.find((c) => c.status === 'aplicado' && c.ajusteId === ultimo) ?? null
}
