// El calendario (.ics) de tu menú: lo único que avisa a una hora con la app cerrada (la app no tiene servidor). Tus horas
// de estos días (la compra, lo que cocinas y, si quieres, cada comida) con su alarma antes.
import type { ComidaId } from './food.ts'
import { huecosDelDia, type MenuSemanal } from './menu.ts'
import { horaDeComida, nombreDeComida } from './menuPlan.ts'

/** La hora de cada comida (sugerida): la del aviso y la que ordena lo que cubre una tanda. */
export const HORA_COMIDA: Record<ComidaId, string> = {
  desayuno: '08:00',
  comida: '14:00',
  merienda: '17:30',
  cena: '21:00',
}

const ics = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')
const fechaIcs = (fecha: string, hora: string) => `${fecha.replace(/-/g, '')}T${hora.replace(':', '')}00`

/** Una hora más de tu semana resuelta (la compra de cada semana o una tanda de cocina), ya con su texto. */
export type EventoExtra = {
  uid: string
  tipo: 'compra' | 'cocinar'
  fecha: string
  hora: string
  titulo: string
  detalle: string
}

/**
 * Un archivo de calendario con tus horas de estos días (y su alarma antes): la compra, lo que cocinas (también tus tandas
 * y tu compra de cada semana, en `extra`) y, si quieres, cada comida. Las horas de las comidas son sugeridas.
 */
export function calendarioDelMenu(
  m: MenuSemanal,
  fechas: readonly string[],
  nombreDe: (platoId: string) => string,
  sello: string,
  extra: readonly EventoExtra[] = [],
): string {
  const eventos: { uid: string; inicio: string; titulo: string; detalle: string }[] = []
  const a = m.avisos
  for (const e of extra)
    if (fechas.includes(e.fecha) && (e.tipo === 'compra' ? a.compra : a.cocinar))
      eventos.push({ uid: e.uid, inicio: fechaIcs(e.fecha, e.hora), titulo: e.titulo, detalle: e.detalle })
  if (a.compra && m.compraEl && fechas.includes(m.compraEl.fecha))
    eventos.push({
      uid: `compra-${m.compraEl.fecha}`,
      inicio: fechaIcs(m.compraEl.fecha, m.compraEl.hora),
      titulo: 'Hacer la compra',
      detalle: 'La lista está en MUTA · Nutrición · Tu plan · La compra',
    })
  if (a.cocinar)
    for (const c of m.cocinados)
      if (fechas.includes(c.fecha))
        eventos.push({
          uid: `cocinar-${c.id}`,
          inicio: fechaIcs(c.fecha, c.hora),
          titulo: `Cocinar: ${nombreDe(c.plato)}`,
          detalle: `${c.para.length} ${c.para.length === 1 ? 'ración' : 'raciones'}. Los gramos están en MUTA.`,
        })
  if (a.comidas)
    for (const f of fechas)
      for (const h of huecosDelDia(m, f))
        eventos.push({
          uid: `comida-${h.fecha}-${h.comida}`,
          inicio: fechaIcs(h.fecha, horaDeComida(m, h.comida)),
          titulo: `${nombreDeComida(m, h.comida)}: ${nombreDe(h.plato)}`,
          detalle: 'Apúntalo en MUTA al comerlo.',
        })
  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MUTA//Comida//ES',
    ...eventos.flatMap((e) => [
      'BEGIN:VEVENT',
      `UID:${e.uid}@muta`,
      `DTSTAMP:${sello}`,
      `DTSTART:${e.inicio}`,
      'DURATION:PT30M',
      `SUMMARY:${ics(e.titulo)}`,
      `DESCRIPTION:${ics(e.detalle)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${ics(e.titulo)}`,
      `TRIGGER:-PT${a.antesMin}M`,
      'END:VALARM',
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ]
  return lineas.join('\r\n') + '\r\n'
}
