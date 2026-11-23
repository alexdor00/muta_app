// Lo que dice la revisión semanal, como un informe corto (usuario, 2026-11-23: «más profesional, más acotado»): un estado,
// un titular, las cifras que lo explican y, si hace falta, una sola recomendación. El detalle de las reglas está en
// docs/conocimiento/02-reglas.md.
import { formatChange, formatDayDate, formatDecimal, formatInt } from '../../../../shared/lib/format.ts'
import { MESETAS_PARON, SUBIDA_MESETA } from '../../state/comida.ts'
import { NOMBRE_SENAL, RAPIDO_PCT, type Revision } from '../../state/entrenador.ts'

export type Resumen = {
  /** La pastilla de arriba: «Sin cambios», «Faltan datos», «En espera»… */
  estado: string
  titulo: string
  /** Etiqueta y cifra, una fila cada una. */
  datos: [string, string][]
  nota?: string
}

const pct = (n: number) => `${formatChange(n / 100, 2)} / sem`
const sinSigno = (n: number) => `${formatDecimal(Math.abs(Math.round(n * 100) / 100))} %`
const ritmo = (n: number): [string, string] => ['Tu ritmo', pct(n)]

/** La revisión de hoy (sin sugerencia pendiente). */
export function resumenRevision(r: Revision | null, fase: string | null): Resumen {
  const vacio: Resumen = {
    estado: 'Sin cambios',
    titulo: 'Todo en orden',
    datos: [],
    nota: 'Cada semana se revisan tu peso y lo que comes.',
  }
  if (!r) return vacio
  switch (r.tipo) {
    case 'faltan':
      return {
        estado: 'Faltan datos',
        titulo: 'Aún no se puede revisar',
        datos: [
          ['Pesajes en 14 días', `${r.pesajes} de ${r.pesajes + r.faltanPesajes}`],
          ['Días apuntados en 4 semanas', `${r.dias} de ${r.dias + r.faltanDias}`],
        ],
        nota: 'Se recomienda pesarte cada mañana y apuntar lo que comes.',
      }
    case 'cumplir':
      return {
        estado: 'Sin cambios',
        titulo: 'Primero, cumplir el plan',
        datos: [
          ['Comes de tu objetivo', `${Math.round(r.cumplido * 100)} %`],
          ['Margen', '85–115 %'],
        ],
        nota: 'Con el plan cumplido se valora si hace falta cambiarlo.',
      }
    case 'bien': {
      const centro = fase === 'definicion' ? sinSigno((r.previsto.min + r.previsto.max) / 2) : null
      const margen =
        fase === 'definicion'
          ? `${sinSigno(-r.previsto.max)} – ${formatDecimal(RAPIDO_PCT)} %`
          : `${formatChange(r.previsto.min / 100, 2)} a ${formatChange(r.previsto.max / 100, 2)}`
      const cerca = fase === 'definicion' && r.pct > r.previsto.max - 0.05
      return {
        estado: 'Sin cambios',
        titulo: 'Vas al ritmo previsto',
        datos: [
          ritmo(r.pct),
          ...(centro ? [['Objetivo', `−${centro}`] as [string, string]] : []),
          ['Margen', margen],
        ],
        nota: cerca ? 'Cerca del límite lento: si sigue así, habrá propuesta.' : undefined,
      }
    }
    case 'unaSemana':
      return {
        estado: 'En observación',
        titulo: 'Una semana fuera de ritmo',
        datos: [ritmo(r.pct)],
        nota: 'Una sola semana no basta: se confirma en la próxima.',
      }
    case 'esperar':
      return {
        estado: 'En espera',
        titulo: 'Midiendo el último cambio',
        datos: [['Próxima revisión', `en ${r.dias} ${r.dias === 1 ? 'día' : 'días'}`]],
        nota: 'Entre cambios se dejan 10 días.',
      }
    case 'pasos':
      return {
        estado: 'Recomendación',
        titulo: 'Más pasos antes que menos kcal',
        datos: [ritmo(r.pct), ['Pasos al día', `${formatInt(r.pasos)} → 10.000`]],
        nota: 'Se recomiendan 10.000 pasos, mejor 12.000–15.000, en varios ratos.',
      }
    case 'cintura':
      return {
        estado: 'Sin cambios',
        titulo: 'Estás perdiendo grasa',
        datos: [ritmo(r.pct), ['Cintura', `−${formatDecimal(Math.abs(r.cm))} cm`]],
        nota: 'La báscula va lenta, pero la cintura baja.',
      }
    case 'senales':
      return {
        estado: 'Sin cambios',
        titulo: 'Esta semana no se aprieta',
        datos: r.senales.length
          ? [ritmo(r.pct), ['Recuperación', r.senales.map((x) => NOMBRE_SENAL[x]).join(', ')]]
          : [ritmo(r.pct)],
        nota: 'Se recomienda recuperar antes de bajar más.',
      }
    case 'findes':
      return {
        estado: 'Sin cambios',
        titulo: 'Los fines de semana te pasas',
        datos: [ritmo(r.pct)],
        nota: 'Se recomienda guardar margen entre semana, con la misma media.',
      }
    case 'deficit':
      return {
        estado: 'Sin cambios',
        titulo: 'Déficit al máximo',
        datos: [['Comes de tu gasto', `${Math.round(r.parte * 100)} %`]],
        nota: 'Se recomiendan más pasos o paciencia.',
      }
    case 'progresas':
      return {
        estado: 'Sin cambios',
        titulo: 'Progresas en fuerza',
        datos: [ritmo(r.pct), ['Fuerza en los básicos', r.fuerza > 0 ? 'Sube' : 'Estable']],
        nota: 'Antes de comer más, se recomienda revisar el descanso.',
      }
    case 'meseta':
      return {
        estado: 'En espera',
        titulo: 'Esperando a que tu peso se estabilice',
        datos: [ritmo(r.pct), ['Mesetas', `${r.hechas} de ${MESETAS_PARON}`]],
        nota: `Después, +${SUBIDA_MESETA} kcal en hidratos.`,
      }
    case 'mesetasHechas':
      return {
        estado: 'Completado',
        titulo: 'Mesetas completadas',
        datos: [['Mesetas', `${MESETAS_PARON} de ${MESETAS_PARON}`]],
        nota: 'Ya puedes definir o seguir subiendo poco a poco.',
      }
    case 'recarga':
      return {
        estado: 'En pausa',
        titulo: 'Recarga de hidratos',
        datos: [['Próxima revisión', formatDayDate(r.vuelve)]],
        nota: 'El peso sube por el agua de los hidratos: no cuenta.',
      }
    case 'suelo':
      return {
        estado: 'Sin cambios',
        titulo: 'En tu mínimo de kcal',
        datos: [['Mínimo', `${formatInt(r.suelo)} kcal`]],
        nota: 'Se recomiendan más pasos o paciencia.',
      }
    case 'cambio':
      return vacio
  }
}
