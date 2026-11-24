// Tu logro y tu premio (usuario, 2026-11-24): cuáles tocan (con lo que ya viste, en `userContent/logros`) y sus datos
// para la imagen: el logro, al acabar una etapa o cada 6 meses, con la foto de una sesión; el premio, al cumplir tu
// objetivo, con tu antes y después. Todo sale de lo que ya leyó Progreso (cargarProgreso) y del detalle de la etapa.
import { getDb } from '../../../shared/data/db.ts'
import {
  formatChange,
  formatDecimal,
  formatInt,
  formatShortDate,
  localDate,
} from '../../../shared/lib/format.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { mesocicloParaProgreso, type TarjetaMeso } from '../../training/index.ts'
import { ffmiDe } from '../domain/composition.ts'
import {
  cambioEnTramo,
  claveDe,
  antesYAhora,
  estrellaDe,
  mesesCumplidos,
  objetivoCumplido,
  pendientes,
  perimetrosQueCrecen,
  type Pendiente,
} from '../domain/logro.ts'
export type { Pendiente } from '../domain/logro.ts'
import { serieDe } from '../domain/measures.ts'
import type { Pose } from '../domain/photos.ts'
import {
  ajustesCuerpo,
  comida,
  composicion,
  entreno,
  evolucion,
  fotos,
  hoy,
  medidas,
  pesoActual,
} from '../state/progreso.ts'
import { cargarProgreso, fotoDelEntreno, fotoDeSerieDelEntreno } from './progress.ts'

const ID = 'logros'
type Guardado = { id: typeof ID; target: typeof ID; desde: string; vistos: string[] }

async function leer(): Promise<Guardado> {
  const db = await getDb()
  const g = (await db.get('userContent', ID)) as Guardado | undefined
  if (g) return g
  // La primera vez: desde hoy (lo de antes no se celebra de golpe)
  const nuevo: Guardado = { id: ID, target: ID, desde: localDate(), vistos: [] }
  await db.put('userContent', nuevo)
  return nuevo
}

/** «Ahora no», compartir o guardar: ya no sale solo (sigue en la hoja de su etapa). */
export async function marcarVisto(p: Pendiente): Promise<void> {
  try {
    const g = await leer()
    const k = claveDe(p)
    if (!g.vistos.includes(k))
      await (await getDb()).put('userContent', { ...g, vistos: [...g.vistos, k].slice(-500) })
  } catch (error) {
    logError(error, 'apuntar tu logro como visto')
  }
}

const etapas = (): TarjetaMeso[] => [
  ...(entreno.value?.anteriores ?? []),
  ...(entreno.value?.mesoActual ? [entreno.value.mesoActual] : []),
]

/** Si cumpliste tu objetivo con la etapa de ahora (definición: grasa; volumen: peso). */
export function premioDeAhora(): { etapaId: string; fase: 'definicion' | 'volumen' } | null {
  const actual = entreno.value?.mesoActual
  if (!actual) return null
  const fase = objetivoCumplido(
    comida.value?.fase ?? null,
    { grasa: composicion.value?.grasa ?? null, peso: pesoActual.value },
    { grasa: ajustesCuerpo.value.objetivo, peso: ajustesCuerpo.value.pesoObjetivo ?? null },
  )
  return fase && { etapaId: actual.id, fase }
}

/** Los de una etapa, para abrirlos desde su hoja cuando quieras: su premio (si lo cumpliste) y su logro (si acabó o lleva 6 meses). */
export function logrosDeEtapa(etapaId: string): Pendiente[] {
  const m = etapas().find((x) => x.id === etapaId)
  if (!m) return []
  const premio = premioDeAhora()
  const meses = m.fin ? 0 : mesesCumplidos(m.inicio, hoy.value)
  return [
    ...(premio?.etapaId === etapaId ? [{ tipo: 'premio' as const, ...premio }] : []),
    ...(m.fin ? [{ tipo: 'etapa' as const, etapaId }] : []),
    ...(meses ? [{ tipo: 'meses' as const, etapaId, meses }] : []),
  ]
}

/** Lo primero que toca enseñar solo (o null). Carga Progreso. */
export async function buscarLogro(): Promise<Pendiente | null> {
  try {
    await cargarProgreso()
    const g = await leer()
    return (
      pendientes({
        etapas: etapas(),
        desde: g.desde,
        hoy: hoy.value,
        vistos: new Set(g.vistos),
        premio: premioDeAhora(),
      })[0] ?? null
    )
  } catch (error) {
    logError(error, 'buscar tu logro')
    return null
  }
}

/** Una cifra de la imagen: su valor, qué es y su color (mejora: verde; logro: naranja). */
export type CifraLogro = { valor: string; nombre: string; tono?: 'mejora' | 'logro' }

/** Lo que lleva la imagen (1080 × 1920): se dibuja en imagenLogro.ts. */
export type DatosLogro = {
  premio: boolean
  etiqueta: string
  titulo: string
  sub: string
  /** Tu ejercicio estrella (en el logro): «Press banca · 80 kg → 100 kg (+25 %)». */
  destacado: string | null
  cifras: CifraLogro[]
  linea: string
  fotos: { url: string; etiqueta: string | null }[]
}

/** Una foto que se puede elegir: la de una sesión o tu antes y después de una postura. */
export type OpcionFoto = {
  id: string
  nombre: string
  urls: string[]
  /** Las miniaturas, para elegir (sin ellas, las grandes). */
  minis?: string[]
  fechas?: string[]
}

const kg = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${formatDecimal(Math.abs(n))} kg`
const cm = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${formatDecimal(Math.abs(n))} cm`
const fuerzaCifra = (f: number | null): CifraLogro => ({
  valor: f === null ? '—' : Math.round(f * 100) === 0 ? '=' : formatChange(f),
  nombre: 'fuerza',
  tono: f !== null && f > 0.005 ? 'mejora' : undefined,
})
const serieTexto = (s: { kg: number | null; reps: number }) =>
  s.kg ? `${formatDecimal(s.kg)} kg` : `${s.reps} reps`

/** Las fotos que se pueden elegir: las de las sesiones de la etapa y, en el premio, tu antes y después por postura. */
export async function opcionesDeFoto(etapaId: string, premio: boolean): Promise<OpcionFoto[]> {
  const m = etapas().find((x) => x.id === etapaId)
  if (!m) return []
  const out: OpcionFoto[] = []
  if (premio) {
    for (const pose of ['frente', 'perfil', 'espalda'] as Pose[]) {
      // Tu antes (la última de antes de empezar la etapa) y tu ahora (la última de la etapa)
      const par = antesYAhora(
        fotos.value.filter((f) => f.pose === pose),
        m.inicio,
        m.fin ?? hoy.value,
      )
      if (par)
        out.push({
          id: pose,
          nombre: pose.charAt(0).toUpperCase() + pose.slice(1),
          urls: [par[0].url, par[1].url],
          minis: [par[0].mini, par[1].mini],
          fechas: [par[0].date, par[1].date],
        })
    }
  }
  const d = await mesocicloParaProgreso(etapaId, hoy.value, () => null)
  const programId = entreno.value?.entrenos.find(
    (x) => x.fecha >= m.inicio && x.fecha <= (m.fin ?? hoy.value),
  )?.programId
  for (const s of d?.rutina ?? []) {
    const propia = programId ? await fotoDelEntreno(programId, s.sigla) : null
    const url = propia
      ? URL.createObjectURL(propia)
      : programId
        ? await fotoDeSerieDelEntreno(programId, s.sigla)
        : null
    if (url) out.push({ id: `sesion:${s.sigla}`, nombre: s.sigla, urls: [url] })
  }
  return out
}

/** Los datos de la imagen de un logro o un premio, con la foto elegida. */
export async function datosDe(p: Pendiente, foto: OpcionFoto | null): Promise<DatosLogro | null> {
  const m = etapas().find((x) => x.id === p.etapaId)
  const c = comida.value
  if (!m) return null
  const [desde, hasta] = [m.inicio, m.fin ?? hoy.value]
  const d = await mesocicloParaProgreso(m.id, hoy.value, () => null)
  const fechas = `${formatShortDate(desde)} – ${formatShortDate(hasta)}`
  const semanas = `${m.semanas} ${m.semanas === 1 ? 'semana' : 'semanas'}`
  const peso = cambioEnTramo(
    (c?.serie ?? []).map((x) => ({ date: x.date, v: x.tendencia })),
    desde,
    hasta,
  )
  const cintura = cambioEnTramo(
    serieDe('cintura', medidas.value, c?.cinturas ?? []).map((x) => ({ date: x.date, v: x.cm })),
    desde,
    hasta,
  )
  const minutos = (entreno.value?.entrenos ?? [])
    .filter((x) => x.fecha >= desde && x.fecha <= hasta)
    .reduce((t, x) => t + x.minutos, 0)
  const constancia = d?.constancia.pct ?? null
  const records: CifraLogro = {
    valor: formatInt(m.records),
    nombre: 'récords',
    tono: m.records ? 'logro' : undefined,
  }
  const fotosDe = (urls: string[], etiquetas: (string | null)[]) =>
    urls.map((url, i) => ({ url, etiqueta: etiquetas[i] ?? null }))
  const elegida = foto?.urls ?? []
  const etiquetasFoto =
    elegida.length === 2
      ? [
          `Antes · ${formatShortDate(foto?.fechas?.[0] ?? desde)}`,
          `Ahora · ${formatShortDate(foto?.fechas?.[1] ?? hasta)}`,
        ]
      : [null]

  if (p.tipo === 'premio') {
    const grasa = cambioEnTramo(
      evolucion.value.map((x) => ({ date: x.date, v: x.grasa })),
      desde,
      hasta,
    )
    const magra = cambioEnTramo(
      evolucion.value.map((x) => ({ date: x.date, v: x.magraKg })),
      desde,
      hasta,
    )
    const altura = c?.cuerpo?.alturaCm ?? null
    const cifras: CifraLogro[] =
      p.fase === 'definicion'
        ? [
            ...(grasa
              ? [
                  {
                    valor: `${formatDecimal(grasa.de)} → ${formatDecimal(grasa.a)} %`,
                    nombre: 'grasa estimada',
                  },
                ]
              : []),
            ...(cintura ? [{ valor: cm(cintura.cambio), nombre: 'de cintura' }] : []),
            ...(magra
              ? [
                  {
                    valor: `${formatDecimal(magra.a)} kg`,
                    nombre: magra.cambio >= -0.5 ? 'magra: la mantienes' : 'masa magra',
                    tono: magra.cambio >= -0.5 ? ('mejora' as const) : undefined,
                  },
                ]
              : []),
            ...(peso ? [{ valor: kg(peso.cambio), nombre: 'de peso' }] : []),
            fuerzaCifra(m.fuerza),
            records,
          ]
        : [
            ...(magra && altura
              ? [
                  {
                    valor: `${formatDecimal(ffmiDe(magra.de, altura))} → ${formatDecimal(ffmiDe(magra.a, altura))}`,
                    nombre: 'FFMI estimado',
                  },
                ]
              : []),
            ...(magra
              ? [
                  {
                    valor: kg(magra.cambio),
                    nombre: 'masa magra',
                    tono: magra.cambio > 0 ? ('mejora' as const) : undefined,
                  },
                ]
              : []),
            ...perimetrosQueCrecen(medidas.value, desde, hasta).map((x) => ({
              valor: cm(x.cm),
              nombre: `de ${x.nombre.toLowerCase()}`,
            })),
            fuerzaCifra(m.fuerza),
            records,
          ]
    const objetivo =
      p.fase === 'definicion'
        ? `Llegaste al ${formatDecimal(ajustesCuerpo.value.objetivo ?? 0)} % de grasa`
        : `Llegaste a ${formatDecimal(ajustesCuerpo.value.pesoObjetivo ?? 0)} kg`
    return {
      premio: true,
      etiqueta: 'Objetivo cumplido',
      titulo: objetivo,
      sub: `${p.fase === 'definicion' ? 'Definición' : 'Volumen'} · ${semanas} · ${fechas}`,
      destacado: null,
      cifras: cifras.slice(0, 6),
      linea: `${formatInt(m.sesiones)} sesiones · ${formatDecimal(Math.round(m.toneladas))} t movidas${constancia !== null ? ` · ${constancia} % de constancia` : ''}`,
      fotos: fotosDe(elegida, etiquetasFoto),
    }
  }

  // El logro: al acabar la etapa o a los 6 meses
  const estrella = estrellaDe(entreno.value?.ejercicios ?? [], desde, hasta)
  const cuerpo: CifraLogro[] =
    m.objetivo === 'definición' && cintura
      ? [{ valor: cm(cintura.cambio), nombre: 'de cintura' }]
      : peso
        ? [{ valor: kg(peso.cambio), nombre: 'de peso' }]
        : []
  return {
    premio: false,
    etiqueta: p.tipo === 'meses' ? `${p.meses} meses con tu rutina` : `Etapa completada · ${semanas}`,
    titulo: m.rutina,
    sub: `${m.nombre} · ${fechas}`,
    destacado: estrella
      ? `${estrella.nombre} · ${serieTexto(estrella.de)} → ${serieTexto(estrella.a)} (${formatChange(estrella.cambio)})`
      : null,
    cifras: [
      { valor: `${formatDecimal(Math.round(m.toneladas))} t`, nombre: 'movidas' },
      fuerzaCifra(m.fuerza),
      records,
      ...cuerpo,
      ...(constancia !== null ? [{ valor: `${constancia} %`, nombre: 'constancia' }] : []),
      { valor: `${formatInt(Math.round(minutos / 60))} h`, nombre: 'entrenando' },
    ].slice(0, 6),
    linea: `${formatInt(m.sesiones)} sesiones${m.objetivo ? ` · ${m.objetivo}` : ''}`,
    fotos: fotosDe(elegida, etiquetasFoto),
  }
}
