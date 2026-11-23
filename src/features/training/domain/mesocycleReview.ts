// Al cerrar un mesociclo y al comparar dos (prototipo: progreso/mesociclos.js · mesoVerdict y estilo-cine.js · compareSheet):
// el balance (qué subió, qué se estancó, el peso frente a tu objetivo y los músculos cortos) y las barras por semana.
import type { Objetivo, ResumenMeso } from './mesocycles.ts'

/** Semanas de un mes (para pasar un ritmo mensual a semanal). */
const MES = 30.44 / 7

export type Balance = { tono: 'bien' | 'normal' | 'aviso'; texto: string }

/**
 * Balance al cerrar el mesociclo («Nuevo mesociclo»): cómo progresan los ejercicios, el peso frente a tu objetivo y los
 * músculos por debajo de su rango. Nada con menos de 3 sesiones. El progreso sigue la guía (04-guia § 5): subir en todo
 * indica volumen bajo; mantener la mayoría y subir en algunos es el punto dulce; si suben casi todos (≥ 80 %, sugerido,
 * el mismo corte que «Tu entrenador») y recuperas, toca más volumen; si el rendimiento cae (2+ ejercicios bajan, la señal
 * de 02-reglas § 5), primero sueño, estrés y comida. Ritmos del peso, de 02-reglas § 8.
 */
export function balanceDe(datos: {
  resumen: ResumenMeso
  semanas: number
  objetivo: Objetivo | null
  peso: { inicio: number; fin: number } | null
  bajos: string[]
  formato: (n: number) => string
}): Balance[] {
  const { formato: f } = datos
  const out: Balance[] = []
  if (datos.resumen.sesiones < 3) return out
  if (datos.resumen.repetidos >= 3) out.push(progresoDe(datos.resumen))
  if (datos.peso && datos.semanas >= 3 && datos.objetivo) {
    const { inicio, fin } = datos.peso
    const pct = (((fin - inicio) / inicio) * 100) / datos.semanas
    // Por semana: definición entre −1,2 y −0,25 %; volumen entre 0,1 y 0,8 % al mes; mantener, ±0,3 %
    const ok =
      datos.objetivo === 'bulk'
        ? pct >= 0.1 / MES && pct <= 0.8 / MES
        : datos.objetivo === 'cut'
          ? pct <= -0.25 && pct >= -1.2
          : Math.abs(pct) <= 0.3
    const signo = (n: number) => (n >= 0 ? '+' : '−')
    out.push({
      tono: ok ? 'bien' : 'aviso',
      texto: `Peso ${signo(fin - inicio)}${f(Math.abs(fin - inicio))} kg (${signo(pct)}${f(Math.abs(pct))} % por semana): ${ok ? 'va acorde con tu objetivo.' : 'no va acorde con tu objetivo.'}`,
    })
  }
  if (datos.bajos.length)
    out.push({
      tono: 'normal',
      texto: `Por debajo de su rango: ${datos.bajos.slice(0, 4).join(', ')}${datos.bajos.length > 4 ? ` y ${datos.bajos.length - 4} más` : ''}. Se recomienda sumar series directas en el siguiente.`,
    })
  return out
}

/** Cómo progresan los ejercicios del mesociclo (04-guia § 5): no hace falta subir en todo. */
function progresoDe({ suben, bajan, repetidos: n }: ResumenMeso): Balance {
  if (bajan >= 2)
    return {
      tono: 'aviso',
      texto: `Bajan ${bajan} de ${n} ejercicios. Antes de recortar series, se recomienda revisar sueño, estrés y comida.`,
    }
  if (suben / n >= 0.8)
    return {
      tono: 'bien',
      texto: `Subes en casi todo (${suben} de ${n}). Si recuperas bien, se recomienda subir el volumen en el siguiente.`,
    }
  if (suben > 0)
    return {
      tono: 'bien',
      texto: `Subes en ${suben} de ${n} y mantienes el resto: es el punto dulce. Se recomienda no tocar el volumen.`,
    }
  return {
    tono: 'normal',
    texto: `Mantienes en todo (ninguno de ${n} sube). Se recomienda revisar que llegas a tu RIR, el sueño y la comida.`,
  }
}

export type BarraComparada = {
  nombre: string
  a: number
  b: number
  textoA: string
  textoB: string
  /** null si van casi igual (menos de un 2 %). */
  gana: 'a' | 'b' | null
}

/** Una barra de «Comparar mesociclos»: casi igual por debajo de un 2 % de diferencia. */
export function comparar(
  nombre: string,
  a: number,
  b: number,
  textoA: string,
  textoB: string,
): BarraComparada {
  const max = Math.max(a, b, 1e-9)
  const igual = Math.abs(a - b) < 1e-9 || Math.abs(a - b) / max < 0.02
  return { nombre, a, b, textoA, textoB, gana: igual ? null : a > b ? 'a' : 'b' }
}

/** La frase de «Lo que dicen los datos». */
export function veredictoComparado(
  barras: readonly BarraComparada[],
  nombreA: string,
  nombreB: string,
): string {
  const conGanador = barras.filter((x) => x.gana)
  const a = conGanador.filter((x) => x.gana === 'a').length
  const b = conGanador.length - a
  if (!conGanador.length) return 'Van muy parejos en todo.'
  if (a === b) return 'Van parejos: cada uno gana en lo suyo.'
  return `${a > b ? nombreA : nombreB} sale mejor en ${Math.max(a, b)} de ${conGanador.length} medidas.`
}
