import type { JSX } from 'preact'
import { useEffect } from 'preact/hooks'
import { addDays, formatDecimal, formatDuracion, formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import {
  ORDEN_TAREA,
  ordenDeHora,
  type PropuestaDeHoy,
  type TareaDeHoy,
} from '../../../../shared/lib/tareaDeHoy.ts'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import {
  COMIDAS,
  dias,
  dieta,
  estado,
  hoy,
  objetivoHoy,
  pasosDias,
  pesajes,
  serie,
  totales,
} from '../../state/comida.ts'
import { objetivoPasos, tocaConsulta, ultimaConsulta } from '../../state/dieta.ts'
import {
  DIA_LARGO,
  diaSemana,
  estadoRecetas,
  HORA_COMIDA,
  platoPorId,
  tareasDeHoy,
} from '../../state/recetas.ts'
import { cargarComida, tiposLeidos } from '../../use-cases/nutritionStore.ts'
import { cargarRecetas, platoApuntado } from '../../use-cases/recipes.ts'
import { alDia, noPasarTanda, pasarTandaAHoy } from '../../use-cases/autopilot.ts'
import { marcarCocinados } from '../../use-cases/menu.ts'
import {
  comidasDelDia,
  compraDeLaSemana,
  enLista,
  minutosDeTanda,
  platosEnTexto,
  tandaDeHoy,
  tandaPerdida,
} from '../../state/autopilot.ts'
import { PesoHoja } from '../comida/PesoHoja.tsx'
import { PasosHoja } from './PasosHoja.tsx'

export type HoyDeComida = {
  listo: boolean
  tareas: TareaDeHoy[]
  /** Lo que te propone para hoy (pasar a hoy la tanda que no hiciste). */
  propuestas: PropuestaDeHoy[]
  /** Sus hojas (peso, pasos, cocinar): Hoy las pinta debajo. */
  hojas: JSX.Element
}

/**
 * Lo de Nutrición en Hoy, como cosas que hacer: pésate, nutrición (lo que te queda, en una línea), tus pasos, la compra y lo
 * que cocinas (con hora, de tu menú) y, el día que toca, tu consulta semanal. Cada una lleva a su sitio o abre su hoja.
 */
export function useHoyDeComida(avisar: (texto: string) => void): HoyDeComida {
  useEffect(() => {
    void cargarComida().then(cargarRecetas).then(tiposLeidos).then(alDia)
  }, [])
  const peso = useSheet('peso')
  const pasos = useSheet('pasos')
  const hojas = (
    <>
      {peso.open && <PesoHoja onClose={peso.close} avisar={avisar} />}
      {pasos.open && <PasosHoja objetivo={objetivoPasos.value} onClose={pasos.close} avisar={avisar} />}
    </>
  )
  if (estado.value === 'cargando') return { listo: false, tareas: [], propuestas: [], hojas }
  const fecha = hoy.value
  const tareas: TareaDeHoy[] = []

  // Pésate: al levantarte; hecha con el peso de hoy y cómo va la semana
  const deHoy = pesajes.value.find((p) => p.date === fecha)
  const puntos = serie.value
  const ahora = puntos.at(-1)
  const antes = [...puntos].reverse().find((p) => p.date <= addDays(fecha, -7))
  const cambio = ahora && antes ? Math.round((ahora.tendencia - antes.tendencia) * 10) / 10 : null
  tareas.push({
    id: 'peso',
    orden: ORDEN_TAREA.peso,
    icono: 'peso',
    titulo: 'Pésate',
    corta: 'pesarte',
    detalle: deHoy
      ? `${formatDecimal(deHoy.kg)} kg${cambio !== null ? ` · ${cambio > 0 ? '+' : cambio < 0 ? '−' : ''}${formatDecimal(Math.abs(cambio))} esta semana` : ''}`
      : 'Al levantarte, en ayunas',
    hecha: !!deHoy,
    boton: deHoy ? undefined : 'Apuntar',
    onClick: peso.show,
  })

  // Come: lo que te queda hoy (kcal y proteína); hecha con todas las comidas del día apuntadas
  const objetivo = objetivoHoy.value
  if (objetivo) {
    const llevas = totales.value[fecha] ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    const apuntadas = new Set((dias.value[fecha] ?? []).map((a) => a.comida))
    const todas = COMIDAS.every((c) => apuntadas.has(c.id))
    const kcal = Math.round(objetivo.kcal - llevas.kcal)
    const proteina = Math.round(objetivo.protein - llevas.protein)
    tareas.push({
      id: 'comida',
      orden: ORDEN_TAREA.comida,
      icono: 'comida',
      titulo: 'Nutrición',
      corta: 'tu nutrición',
      detalle: todas
        ? `${formatInt(llevas.kcal)} de ${formatInt(objetivo.kcal)} kcal`
        : kcal > 0
          ? `Te quedan ${formatInt(kcal)} kcal${proteina > 0 ? ` · ${formatInt(proteina)} g de proteína` : ''}`
          : `Ya llevas tus ${formatInt(objetivo.kcal)} kcal`,
      hecha: todas,
      href: paths.nutrition,
    })
  }

  // Tus pasos: hecha al llegar a tu objetivo
  const hoyPasos = pasosDias.value[fecha] ?? 0
  const meta = objetivoPasos.value
  tareas.push({
    id: 'pasos',
    orden: ORDEN_TAREA.pasos,
    icono: 'pasos',
    titulo: 'Pasos',
    corta: 'tus pasos',
    detalle: `${formatInt(hoyPasos)} de ${formatInt(meta)}`,
    hecha: hoyPasos >= meta,
    boton: hoyPasos >= meta ? undefined : 'Apuntar',
    onClick: pasos.show,
  })

  // La compra y lo que cocinas: de tu menú, con su hora; se marcan a mano en Hoy
  if (estadoRecetas.value === 'listo') {
    for (const t of tareasDeHoy.value)
      if (t.tipo === 'compra')
        tareas.push({
          id: t.id,
          orden: ordenDeHora(t.hora),
          icono: 'compra',
          titulo: 'La compra del menú',
          corta: 'la compra',
          detalle: t.hora,
          hecha: false,
          aMano: true,
          href: paths.shopping,
        })
  }
  // Lo que cocinas aparte: los platos de una misma hora, en una sola fila
  const cocinar = tareasDeHoy.value.filter((t) => t.tipo === 'cocinar')
  for (const hora of [...new Set(cocinar.map((t) => t.hora))]) {
    const deEsaHora = cocinar.filter((t) => t.hora === hora)
    const nombres = deEsaHora.map((t) =>
      t.tipo === 'cocinar' ? (platoPorId(t.cocinado.plato)?.nombre.toLowerCase() ?? 'el plato') : '',
    )
    const raciones = deEsaHora.reduce((n, t) => n + (t.tipo === 'cocinar' ? t.raciones : 0), 0)
    tareas.push({
      id: `cocinar-${hora}`,
      orden: ordenDeHora(hora),
      icono: 'cocinar',
      titulo: `Cocina ${nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}` : nombres[0]}`,
      corta: 'cocinar',
      detalle: `${hora} · ${raciones} ${raciones === 1 ? 'ración' : 'raciones'}`,
      hecha: deEsaHora.every((t) => t.tipo === 'cocinar' && t.cocinado.hecho),
      alTerminar: `Ya has cocinado lo que te propusiste: ${raciones} ${raciones === 1 ? 'ración lista' : 'raciones listas'}.`,
      // El círculo marca lo mismo que su hoja y tu día de Nutrición
      alMarcar: () =>
        void marcarCocinados(
          deEsaHora.flatMap((t) => (t.tipo === 'cocinar' ? [t.cocinado.id] : [])),
          !deEsaHora.every((t) => t.tipo === 'cocinar' && t.cocinado.hecho),
        ),
      href: paths.batch(fecha, hora),
    })
  }

  // Tu semana resuelta: la compra de tu día, la tanda de hoy y tus tápers
  const propuestas: PropuestaDeHoy[] = []
  if (estadoRecetas.value === 'listo') {
    const s = compraDeLaSemana.value
    if (s && s.fecha === fecha) {
      const quedan = s.faltan.filter((x) => !x.comprado).length
      tareas.push({
        id: 'compra-semana',
        orden: ordenDeHora(s.hora),
        icono: 'compra',
        titulo: 'La compra',
        corta: 'la compra',
        detalle: quedan ? `${s.hora} · ${quedan} ${quedan === 1 ? 'cosa' : 'cosas'}` : 'Todo comprado',
        hecha: !quedan,
        aMano: true,
        href: paths.shopping,
      })
    }
    const t = tandaDeHoy.value
    if (t && t.huecos.length) {
      const min = minutosDeTanda(t)
      tareas.push({
        id: `tanda-${t.fecha}`,
        orden: ordenDeHora(t.hora),
        icono: 'cocinar',
        titulo: 'Cocinar',
        corta: 'cocinar',
        detalle: t.hecha
          ? `${t.huecos.length} tápers`
          : `${t.hora}${min ? ` · ≈ ${formatDuracion(min)}` : ''}`,
        hecha: t.hecha,
        alTerminar: `Ya has cocinado todo lo que te propusiste: ${t.huecos.length} ${t.huecos.length === 1 ? 'táper listo' : 'tápers listos'} hasta la siguiente tanda.`,
        boton: t.hecha ? undefined : 'Empezar',
        href: paths.batch(t.fecha),
      })
    }
    // Tus comidas de hoy, en una sola fila: abre la pantalla que las pasa una a una (‹ ›); lo apuntado ya no sale
    const delDia = comidasDelDia(fecha)
    const porApuntar = delDia.filter((x) => {
      const r = platoPorId(x.hueco.plato)
      return !(r && platoApuntado(r.id, x.hueco.comida, fecha))
    })
    if (delDia.length) {
      const nombres = porApuntar.map(
        (x) => COMIDAS.find((c) => c.id === x.hueco.comida)?.nombre.toLowerCase() ?? '',
      )
      tareas.push({
        id: 'comidas-de-hoy',
        orden: ordenDeHora(HORA_COMIDA[(porApuntar[0] ?? delDia[0]).hueco.comida]),
        icono: 'cocinar',
        titulo: 'Tus comidas de hoy',
        corta: 'tus comidas',
        detalle: porApuntar.length
          ? `${enLista(nombres).charAt(0).toUpperCase()}${enLista(nombres).slice(1)} · ${porApuntar.length} por apuntar`
          : 'Todas apuntadas',
        hecha: !porApuntar.length,
        alTerminar: 'Ya has apuntado todas tus comidas de hoy.',
        href: paths.cookNow(fecha, (porApuntar[0] ?? delDia[0]).hueco.comida),
      })
    }
    const perdida = tandaPerdida.value
    if (perdida)
      propuestas.push({
        id: `tanda-${perdida.fecha}`,
        titulo: `No cocinaste el ${DIA_LARGO[diaSemana(perdida.fecha)]}`,
        detalle: `¿La pasamos a hoy, a las ${perdida.hora}? ${platosEnTexto(perdida)}. Si ya la hiciste, márcala en el modo cocina.`,
        aplicar: () =>
          void pasarTandaAHoy(perdida.fecha).then(() => avisar(`Tu tanda, hoy a las ${perdida.hora}`)),
        ahoraNo: () => void noPasarTanda(perdida.fecha),
      })
  }

  // Tu consulta semanal (con dieta): el día que toca; hecha si la hiciste hoy
  const hechaHoy = ultimaConsulta.value?.fecha === fecha
  if (dieta.value && (tocaConsulta.value || hechaHoy))
    tareas.push({
      id: 'consulta',
      orden: ORDEN_TAREA.consulta,
      icono: 'consulta',
      titulo: 'Tu consulta semanal',
      corta: 'tu consulta',
      detalle: hechaHoy ? 'Hecha' : 'Tu peso, tu cintura y cómo estás',
      hecha: hechaHoy,
      boton: hechaHoy ? undefined : 'Empezar',
      href: paths.checkIn,
    })

  // Todo lo de la comida (cada comida, la compra, cocinar), dentro de la tarjeta de Nutrición
  const fuera = new Set(['peso', 'pasos', 'comida', 'consulta'])
  const partes = tareas.filter((t) => !fuera.has(t.id)).sort((a, b) => a.orden - b.orden)
  const resto = tareas.filter((t) => fuera.has(t.id))
  if (partes.length) {
    const nutricion = resto.find((t) => t.id === 'comida')
    if (nutricion) nutricion.partes = partes
    else
      resto.push({
        id: 'comida',
        orden: ORDEN_TAREA.comida,
        icono: 'comida',
        titulo: 'Nutrición',
        corta: 'tu nutrición',
        detalle: 'Lo de tu comida de hoy',
        hecha: true,
        href: paths.nutrition,
        partes,
      })
  }
  return { listo: true, tareas: resto, propuestas, hojas }
}
