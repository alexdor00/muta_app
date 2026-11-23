// Tu semana resuelta: aplicar lo que eliges (con «Deshacer»), dejar fijos los días de cocina que ya pasaron, marcar una
// tanda como hecha y pasar a hoy la que no hiciste («Aplicar» / «Ahora no»).
import { addDays } from '../../../shared/lib/format.ts'
import { platform } from '../../../shared/platform/index.ts'
import { pilotoNuevo, type Piloto, type Preparar } from '../domain/autopilot.ts'
import { conDiasPorMenu, type MenuSemanal } from '../domain/menu.ts'
import { tandasPasadas } from '../state/autopilot.ts'
import { preparacionDeLaDieta } from '../domain/dietaAMenus.ts'
import { dieta, hoy } from '../state/comida.ts'
import { menu } from '../state/recetas.ts'
import { guardarMenu } from './menu.ts'

const conPiloto = (p: Piloto | null) => guardarMenu({ ...menu.value, piloto: p })

/**
 * Aplica lo que elegiste desde hoy: lo de antes (tus tandas pasadas y las hechas) se queda. Devuelve el de antes (para
 * «Deshacer»).
 */
export async function aplicarPiloto(nuevo: Piloto): Promise<Piloto | null> {
  const antes = menu.value.piloto
  const h = hoy.value
  await conPiloto({
    ...nuevo,
    tandas: (antes?.tandas ?? []).filter((f) => f < h),
    saltadas: (antes?.saltadas ?? []).filter((f) => f < h),
    hechas: antes?.hechas ?? [],
    descartadas: antes?.descartadas ?? [],
    desde: h,
  })
  return antes
}

/**
 * Organizar la semana entera de una vez (usuario, 2026-11-17): cuántos días va cada menú (null: como esté) y cómo
 * cocinas y compras. Devuelve tu menú de antes, con su piloto (para «Deshacer» todo junto).
 */
export async function aplicarSemana(nuevo: Piloto, diasPorMenu: number | null): Promise<MenuSemanal> {
  const antes = menu.value
  const h = hoy.value
  const base = diasPorMenu ? conDiasPorMenu(antes, diasPorMenu, h) : antes
  await guardarMenu({
    ...base,
    piloto: {
      ...nuevo,
      tandas: (antes.piloto?.tandas ?? []).filter((f) => f < h),
      saltadas: (antes.piloto?.saltadas ?? []).filter((f) => f < h),
      hechas: antes.piloto?.hechas ?? [],
      descartadas: antes.piloto?.descartadas ?? [],
      desde: h,
    },
  })
  return antes
}

/** Tu semana como estaba (menús y piloto), para «Deshacer». */
export const volverASemana = (m: MenuSemanal) => guardarMenu(m)

/** Deja tu semana como estaba (para «Deshacer») o sin piloto (null). */
export const volverAlPiloto = (p: Piloto | null) => conPiloto(p)

/** Lo que se olvida: lo de hace más de dos meses. */
const OLVIDO = 60

/**
 * Deja fijos los días de cocina que ya pasaron (los que vienen siguen a tu regla: tus descansos pueden cambiar) y olvida lo
 * de hace más de dos meses. Va al abrir, con tus días de entreno ya leídos.
 */
export async function alDia(): Promise<void> {
  const p = menu.value.piloto
  if (!p || p.cocina.modo === 'no') return
  const limite = addDays(hoy.value, -OLVIDO)
  const reciente = (xs: readonly string[]) => xs.filter((f) => f >= limite)
  const fijas = reciente([...new Set([...p.tandas, ...tandasPasadas(p)])].sort())
  const iguales = (a: readonly string[], b: readonly string[]) => a.join() === b.join()
  const nuevo = {
    ...p,
    tandas: fijas,
    saltadas: reciente(p.saltadas),
    hechas: reciente(p.hechas),
    descartadas: reciente(p.descartadas),
  }
  if (
    iguales(nuevo.tandas, p.tandas) &&
    iguales(nuevo.saltadas, p.saltadas) &&
    iguales(nuevo.hechas, p.hechas) &&
    iguales(nuevo.descartadas, p.descartadas)
  )
    return
  await conPiloto(nuevo)
}

/** Marca una tanda como hecha (queda fija ese día) o no: fija ese día. */
export async function marcarTanda(fecha: string, hecha: boolean): Promise<void> {
  const p = menu.value.piloto
  if (!p || p.hechas.includes(fecha) === hecha) return
  await conPiloto({
    ...p,
    hechas: hecha ? [...p.hechas, fecha] : p.hechas.filter((f) => f !== fecha),
    tandas: p.tandas.includes(fecha) ? p.tandas : [...p.tandas, fecha].sort(),
  })
}

/** Pasa a hoy la tanda que no hiciste (lo que quede por comer sale de la de hoy). Devuelve cómo estaba (para «Deshacer»). */
export async function pasarTandaAHoy(fecha: string): Promise<Piloto | null> {
  const p = menu.value.piloto
  if (!p) return null
  const h = hoy.value
  await conPiloto({
    ...p,
    saltadas: [...p.saltadas.filter((f) => f !== h), fecha],
    tandas: [...new Set([...p.tandas.filter((f) => f !== fecha), h])].sort(),
  })
  return p
}

/** «Ahora no»: no se vuelve a proponer pasar esa tanda a hoy. */
export async function noPasarTanda(fecha: string): Promise<void> {
  const p = menu.value.piloto
  if (p) await conPiloto({ ...p, descartadas: [...p.descartadas, fecha] })
}

/** En el modo cocina, la pantalla no se apaga (con las manos ocupadas). */
export const pantallaEncendida = (si: boolean) => platform.keepScreenOn(si)

/** Un plato que va distinto de su comida (o, con null, como su comida). Devuelve cómo iba (para «Deshacer»). */
export async function prepararPlato(plato: string, como: Preparar | null): Promise<Preparar | null> {
  const p = menu.value.piloto
  if (!p) return null
  const antes = p.porPlato[plato] ?? null
  const porPlato = { ...p.porPlato }
  if (como) porPlato[plato] = como
  else delete porPlato[plato]
  await conPiloto({ ...p, porPlato })
  return antes
}

/**
 * Al empezar una dieta que dice qué días se cocina: cocinar «como dice tu dieta» (con tu hora, tu compra y lo demás como
 * lo tenías). Es lo que aceptas al empezarla, después de ver «Cocinas los días…».
 */
export async function cocinarComoLaDieta(): Promise<void> {
  if (!menu.value.ciclo?.cocinar?.length) return
  const p = menu.value.piloto ?? pilotoNuevo(hoy.value)
  // Y cómo se prepara cada plato, si la dieta lo dice
  const prep = preparacionDeLaDieta(dieta.value?.dieta.recetas ?? [])
  await aplicarPiloto({
    ...p,
    cocina: { ...p.cocina, modo: 'dieta' },
    porPlato: { ...p.porPlato, ...prep.porPlato },
    frescos: { ...p.frescos, ...prep.frescos },
  })
}

/** Raciones de más de un plato en un día de cocina (0 las quita): la olla y la compra crecen; tus tápers no cambian. */
export async function racionesDeMas(fecha: string, plato: string, n: number): Promise<void> {
  const p = menu.value.piloto
  if (!p) return
  const clave = `${fecha}|${plato}`
  const resto = Object.fromEntries(Object.entries(p.deMas ?? {}).filter(([k]) => k !== clave))
  await conPiloto({ ...p, deMas: n > 0 ? { ...resto, [clave]: n } : resto })
}

/** Cocinar un día que tu regla no pone (o no cocinar uno que sí): solo ese día, con «Deshacer» (usuario, 2026-11-19). */
export async function cocinarEseDia(fecha: string, si: boolean): Promise<Piloto | null> {
  const p = menu.value.piloto
  if (!p) return null
  await conPiloto({
    ...p,
    anadidas: si ? [...new Set([...p.anadidas, fecha])] : p.anadidas.filter((f) => f !== fecha),
    saltadas: si ? p.saltadas.filter((f) => f !== fecha) : [...new Set([...p.saltadas, fecha])],
  })
  return p
}
