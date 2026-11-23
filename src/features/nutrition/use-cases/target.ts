// Tu objetivo: se calcula con tus datos y después solo cambia por ti (fase, a mano, tus datos) o al aceptar una
// sugerencia del entrenador. Cada cambio queda en el historial y el último aceptado se puede deshacer.
import { getDb } from '../../../shared/data/db.ts'
import { addDays, daysBetween, formatInt } from '../../../shared/lib/format.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { phaseOf, type Goal, type Phase } from '../../profile/index.ts'
import {
  calcularObjetivo,
  FASES,
  GRASA_G_KG,
  kcalAManoValidas,
  macrosObjetivo,
  PROTEINA_G_KG,
  RITMO_DE_SERIE,
  type Cuerpo,
  type Fase,
  type Reparto,
  ritmoDeLaSemana,
  RITMO_MAX_FINAL,
  SEMANA_FINAL,
  semanaDeLaFase,
  type Situacion,
  aprenderGasto,
  gastoEnReposo,
  type Deporte,
  type Trabajo,
} from '../domain/targets.ts'
import { finDeRecarga } from '../domain/refeed.ts'
import { ajustes, cambios, hoy, tipoDe, type Ajustes, type Cambio } from '../state/comida.ts'
import { gastoReal, rendimientoComida } from '../state/entrenador.ts'
import { apuntarPeso, guardarAjustes, guardarCambio, ID_AJUSTES, marcarCambio } from './nutritionStore.ts'

const FASE_DEL_PERFIL: Record<Phase, Fase> = {
  cut: 'definicion',
  bulk: 'volumen',
  maintenance: 'mantenimiento',
}

/** Tu fase y tus días de entreno según la bienvenida (si no hay perfil: mantenimiento y 3 días). */
export async function deTuPerfil(): Promise<{ fase: Fase; diasEntreno: number }> {
  try {
    const perfil = (await (await getDb()).get('profile', 'me')) as
      { goal?: Goal; daysPerWeek?: number } | undefined
    return {
      fase: perfil?.goal ? FASE_DEL_PERFIL[phaseOf(perfil.goal)] : 'mantenimiento',
      diasEntreno: perfil?.daysPerWeek ?? 3,
    }
  } catch (error) {
    logError(error, 'leer tu perfil para Comida')
    return { fase: 'mantenimiento', diasEntreno: 3 }
  }
}

const nombreFase = (f: Fase) => FASES.find((x) => x.id === f)?.nombre ?? f

/** Deja hecho un cambio tuyo: nuevo objetivo desde hoy y la sugerencia que hubiera, descartada. */
async function cambiarObjetivo(a: Ajustes, tipo: Cambio['tipo'], texto: string, previo: Ajustes | null) {
  await guardarAjustes(a)
  for (const p of cambios.value.filter((c) => c.status === 'pendiente'))
    await marcarCambio(p.id, 'descartado')
  await guardarCambio({ status: 'hecho', tipo, de: previo?.kcal ?? null, a: a.kcal, texto })
}

/**
 * Guarda tus datos y recalcula tu objetivo. La primera vez lo crea con la fase que eliges (si no, la de tu bienvenida);
 * tu peso queda también como pesaje de hoy.
 */
export async function guardarDatos(
  cuerpo: Cuerpo,
  pasos: number,
  fase?: Fase,
  ritmo?: number,
): Promise<void> {
  const previo = ajustes.value
  const deLaBienvenida = previo ?? { ...(await deTuPerfil()), ritmo: ritmo ?? RITMO_DE_SERIE }
  const perfil = { ...deLaBienvenida, fase: (!previo && fase) || deLaBienvenida.fase }
  const calculo = calcularObjetivo({
    cuerpo,
    pasos,
    diasEntreno: perfil.diasEntreno,
    fase: perfil.fase,
    ritmo: perfil.ritmo,
    trabajo: previo?.trabajo,
    deporte: previo?.deporte,
    gastoAprendido: previo?.gastoAprendido,
  })
  const a: Ajustes = {
    id: ID_AJUSTES,
    trabajo: previo?.trabajo,
    deporte: previo?.deporte ?? null,
    gastoAprendido: previo?.gastoAprendido ?? null,
    gastoFecha: previo?.gastoFecha ?? null,
    target: 'nutricion',
    cuerpo,
    pasos,
    diasEntreno: perfil.diasEntreno,
    fase: perfil.fase,
    ritmo: perfil.ritmo,
    proteinaGKg: previo?.proteinaGKg ?? PROTEINA_G_KG[0],
    grasaGKg: previo?.grasaGKg ?? GRASA_G_KG[0],
    proteinaG: previo?.proteinaG ?? null,
    grasaG: previo?.grasaG ?? null,
    kcal: calculo.kcal,
    kcalAnterior: null,
    desde: hoy.value,
    aMano: false,
    creado: previo?.creado ?? hoy.value,
  }
  await apuntarPeso(cuerpo.pesoKg)
  await cambiarObjetivo(
    a,
    previo ? 'datos' : 'inicio',
    previo
      ? 'Cambiaste tus datos'
      : `Empiezas en ${formatInt(a.kcal)} kcal · ${nombreFase(a.fase).toLowerCase()}`,
    previo,
  )
}

/**
 * Lo que saldría con tus datos, sin guardar nada (la bienvenida lo enseña antes de que lo aceptes): kcal, macros con el
 * reparto de serie y el cálculo paso a paso.
 */
export function previaDelObjetivo(
  cuerpo: Cuerpo,
  pasos: number,
  perfil: { fase: Fase; diasEntreno: number },
  ritmo: number,
) {
  const calculo = calcularObjetivo({
    cuerpo,
    pasos,
    diasEntreno: perfil.diasEntreno,
    fase: perfil.fase,
    ritmo,
  })
  const macros = macrosObjetivo(calculo.kcal, cuerpo.pesoKg, {
    proteinaGKg: PROTEINA_G_KG[0],
    grasaGKg: GRASA_G_KG[0],
  })
  return { calculo, macros }
}

/**
 * Cambia de fase (y de ritmo en definición) y recalcula. Con velocidad por fases, las kcal salen de la velocidad de la
 * etapa en la que estás; en mantenimiento, `situacion` (parón o salida de una definición) empieza sus mesetas de cero.
 */
export async function cambiarFase(
  fase: Fase,
  ritmoPedido: number,
  opciones: { porFases?: boolean; situacion?: Situacion | null; ritmoVolumen?: number } = {},
): Promise<void> {
  const previo = ajustes.value
  if (!previo) return
  const faseDesde = fase !== previo.fase ? hoy.value : (previo.faseDesde ?? previo.creado)
  // En la etapa final de la definición no se aprieta: como mucho −0,75 % por semana
  const ritmo =
    fase === 'definicion' && semanaDeLaFase(faseDesde, hoy.value) >= SEMANA_FINAL
      ? Math.min(ritmoPedido, RITMO_MAX_FINAL)
      : ritmoPedido
  const porFases = fase === 'definicion' && (opciones.porFases ?? previo.porFases ?? false)
  const ritmoTramo = porFases ? ritmoDeLaSemana(ritmo, semanaDeLaFase(faseDesde, hoy.value)) : null
  const situacion = fase === 'mantenimiento' ? (opciones.situacion ?? previo.situacion ?? null) : null
  const ritmoVolumen = opciones.ritmoVolumen ?? previo.ritmoVolumen
  const calculo = calcularObjetivo({ ...previo, fase, ritmo: ritmoTramo ?? ritmo, ritmoVolumen })
  const a: Ajustes = {
    ...previo,
    fase,
    ritmo,
    faseDesde,
    porFases,
    ritmoTramo,
    situacion,
    ritmoVolumen,
    mesetas: situacion !== (previo.situacion ?? null) ? 0 : (previo.mesetas ?? 0),
    kcal: calculo.kcal,
    kcalAnterior: null,
    desde: hoy.value,
    aMano: false,
  }
  await cambiarObjetivo(a, 'fase', `Nueva fase: ${nombreFase(fase).toLowerCase()}`, previo)
}

/**
 * Tu actividad (trabajo y otros deportes; usuario, 2026-11-19): recalcula tu objetivo con ella. Si ya se aprendió tu gasto
 * de tus datos, manda lo aprendido y la actividad solo queda guardada.
 */
export async function cambiarActividad(trabajo: Trabajo, deporte: Deporte | null): Promise<void> {
  const previo = ajustes.value
  if (!previo) return
  const calculo = calcularObjetivo({ ...previo, trabajo, deporte, ritmo: previo.ritmoTramo ?? previo.ritmo })
  if (previo.aMano || calculo.kcal === previo.kcal)
    return void (await guardarAjustes({ ...previo, trabajo, deporte }))
  const a: Ajustes = { ...previo, trabajo, deporte, kcal: calculo.kcal, kcalAnterior: null, desde: hoy.value }
  await cambiarObjetivo(a, 'datos', 'Cambiaste tu actividad', previo)
}

/**
 * Aprende lo que gastas de tus datos (02-reglas, «Revisión semanal automática»): con 8 pesajes y 8 días de comida en 14,
 * una vez por semana, nuevo gasto = 0,6 × el anterior + 0,4 × lo observado. No cambia lo que comes: tu objetivo sigue
 * igual hasta que cambias de fase o aceptas una revisión; desde entonces, sale de lo aprendido.
 */
export async function aprenderDeTusDatos(): Promise<void> {
  const a = ajustes.value
  const observado = gastoReal.value
  if (!a || !observado) return
  if (a.gastoFecha && daysBetween(a.gastoFecha, hoy.value) < 7) return
  const anterior = a.gastoAprendido ?? calcularObjetivo({ ...a, gastoAprendido: null }).gasto
  const nuevo = aprenderGasto(anterior, observado, gastoEnReposo(a.cuerpo))
  await guardarAjustes({ ...a, gastoAprendido: nuevo, gastoFecha: hoy.value })
}

/** Cambia cómo repartes tus kcal: proteína y grasa por kilo o en gramos; los hidratos son lo que queda. */
export async function cambiarReparto(r: Reparto): Promise<void> {
  const previo = ajustes.value
  if (previo) await guardarAjustes({ ...previo, ...r })
}

/** Hidratos según el día (ON/OFF): la diferencia entre entreno y descanso, o null para apagarlo. Las kcal no cambian. */
export async function cambiarOnOff(diferencia: number | null): Promise<void> {
  const previo = ajustes.value
  if (previo) await guardarAjustes({ ...previo, onOff: diferencia })
}

/** Empieza la recarga de hidratos propuesta: desde hoy hasta completar una vuelta de tu rutina. */
export async function empezarRecarga(hasta: string, sesiones?: number): Promise<Ajustes | null> {
  const previo = ajustes.value
  if (previo) await guardarAjustes({ ...previo, recarga: { desde: hoy.value, hasta, sesiones } })
  return previo
}

/**
 * Empezar una recarga porque tú lo decides (usuario, 2026-11-22: un botón en Tu objetivo): desde hoy, una vuelta de tu
 * rutina (las sesiones que da Entreno o, sin ellas, tus entrenos de la semana). Devuelve lo de antes (para «Deshacer»).
 */
export function empezarRecargaYa(): Promise<Ajustes | null> {
  const sesiones = rendimientoComida.value?.sesionesDelCiclo ?? ajustes.value?.diasEntreno ?? 4
  return empezarRecarga(
    finDeRecarga(hoy.value, sesiones, (f) => tipoDe(f) === 'entreno'),
    sesiones,
  )
}

/** Terminar la recarga (usuario, 2026-11-22): desde hoy, tu definición. Devuelve lo de antes (para «Deshacer»). */
export async function terminarRecarga(): Promise<Ajustes | null> {
  const previo = ajustes.value
  const r = previo?.recarga
  if (previo && r)
    await guardarAjustes({ ...previo, recarga: { desde: r.desde, hasta: addDays(hoy.value, -1) } })
  return previo
}

/** «Deshacer» de empezar, terminar o «Ahora no» a la recarga: vuelve lo de antes. */
export async function volverARecarga(previo: Ajustes | null): Promise<void> {
  if (previo) await guardarAjustes(previo)
}

/** «Ahora no» a la recarga: no se vuelve a proponer en 7 días. */
export async function descartarRecarga(): Promise<Ajustes | null> {
  const previo = ajustes.value
  if (previo) await guardarAjustes({ ...previo, recargaDescartada: hoy.value })
  return previo
}

/** Fija las kcal a mano (entre 1.000 y 6.000). Devuelve false si no son válidas. */
export async function fijarAMano(kcal: number): Promise<boolean> {
  const previo = ajustes.value
  if (!previo || !kcalAManoValidas(kcal)) return false
  const a: Ajustes = { ...previo, kcal, kcalAnterior: null, desde: hoy.value, aMano: true }
  await cambiarObjetivo(a, 'mano', 'Fijado a mano', previo)
  return true
}

/** Vuelve a calcular el objetivo con tus datos (deja de estar fijado a mano). */
export async function volverAlCalculo(): Promise<void> {
  const previo = ajustes.value
  if (!previo) return
  const a: Ajustes = {
    ...previo,
    kcal: calcularObjetivo(previo).kcal,
    kcalAnterior: null,
    desde: hoy.value,
    aMano: false,
  }
  await cambiarObjetivo(a, 'mano', 'Vuelve al cálculo', previo)
}

/** Acepta la sugerencia: el nuevo objetivo vale desde mañana. */
export async function aplicarSugerencia(id: string): Promise<void> {
  const previo = ajustes.value
  const c = cambios.value.find((x) => x.id === id)
  if (!previo || !c || c.status !== 'pendiente') return
  const extra = c.revision?.extra
  const antes = {
    kcal: previo.kcal,
    kcalAnterior: previo.kcalAnterior,
    desde: previo.desde,
    aMano: previo.aMano,
    // Si cambia de fase (salir de la definición o una pausa), lo de antes para «Deshacer»
    ...(extra?.fase
      ? {
          fase: previo.fase,
          faseDesde: previo.faseDesde,
          situacion: previo.situacion ?? null,
          mesetas: previo.mesetas ?? 0,
          kcalAlEmpezar: previo.kcalAlEmpezar ?? null,
          ultimaDefinicion: previo.ultimaDefinicion ?? null,
        }
      : {}),
  }
  await guardarAjustes({
    ...previo,
    kcal: c.a,
    kcalAnterior: previo.kcal,
    desde: addDays(hoy.value, 1),
    // Una etapa nueva de la definición o una meseta más
    ...(extra?.ritmoTramo ? { ritmoTramo: extra.ritmoTramo } : {}),
    ...(extra?.meseta ? { mesetas: (previo.mesetas ?? 0) + 1 } : {}),
    // Salir de la definición o una pausa (usuario, 2026-11-22): la fase nueva desde mañana
    ...(extra?.fase
      ? { fase: extra.fase, faseDesde: addDays(hoy.value, 1), situacion: extra.situacion ?? null, mesetas: 0 }
      : {}),
  })
  // Una pausa porque la definición se atragantaba: queda dicho para la siguiente
  const u = ajustes.value?.ultimaDefinicion
  if (extra?.fase && !extra.situacion && u && ajustes.value)
    await guardarAjustes({ ...ajustes.value, ultimaDefinicion: { ...u, atragantada: true } })
  const nuevo = { ...c, status: 'aplicado' as const, antes, updatedAt: new Date().toISOString() }
  cambios.value = cambios.value.map((x) => (x.id === id ? nuevo : x))
  await (await getDb()).put('coach', nuevo)
}

/** «Ahora no»: la sugerencia queda en el historial sin aplicar. */
export async function descartarSugerencia(id: string): Promise<void> {
  await marcarCambio(id, 'descartado')
}

/** Deshace una sugerencia aplicada: vuelve el objetivo de antes. */
export async function deshacerCambio(id: string): Promise<void> {
  const previo = ajustes.value
  const c = cambios.value.find((x) => x.id === id)
  if (!previo || !c || c.status !== 'aplicado' || !c.antes) return
  await guardarAjustes({ ...previo, ...c.antes })
  await marcarCambio(id, 'deshecho')
}

/** Lo que cambió tu objetivo de kcal tú mismo (no «sin cambios», ni empezar o dejar una dieta). */
const esDeTuObjetivo = (c: Cambio) => c.tipo !== 'sin-cambios' && c.tipo !== 'dieta'

/** El último cambio aceptado que aún se puede deshacer (solo el más reciente, y si nada lo ha pisado después). */
export function deshacible(): Cambio | null {
  const ordenados = [...cambios.value]
    .filter((c) => c.status === 'aplicado' || (c.status === 'hecho' && esDeTuObjetivo(c)))
    .sort((x, y) => y.updatedAt.localeCompare(x.updatedAt))
  return ordenados[0]?.status === 'aplicado' ? ordenados[0] : null
}

/** Tus macros con otras kcal (para enseñar cómo quedaría una sugerencia): cambian los hidratos. */
export function macrosCon(kcal: number) {
  const a = ajustes.value
  return a ? macrosObjetivo(kcal, a.cuerpo.pesoKg, a) : null
}

/** Lo que han movido tu objetivo las sugerencias aceptadas desde el último cálculo (fase, a mano o tus datos). */
export function aceptadosDesdeElCalculo(): number {
  const tuyos = cambios.value.filter((c) => c.status === 'hecho' && esDeTuObjetivo(c))
  const desde =
    tuyos
      .map((c) => c.createdAt)
      .sort()
      .at(-1) ?? ''
  return cambios.value
    .filter((c) => c.status === 'aplicado' && c.updatedAt > desde && c.de !== null)
    .reduce((s, c) => s + c.a - (c.de ?? c.a), 0)
}
