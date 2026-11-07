// Tu dieta: empezarla (desde un archivo, la de ejemplo o la tuya desde cero), dejarla, guardarla como archivo, apuntar una
// receta de un toque, elegir si un día es de entreno o de descanso, y editar recetas y menús (se guarda solo).
import { platform } from '../../../shared/platform/index.ts'
import { addDays } from '../../../shared/lib/format.ts'
import { logError } from '../../../shared/lib/logger.ts'
import {
  aArchivo,
  dietaNueva,
  FACTOR_ARROZ,
  inicioSi,
  leerDieta,
  mediaDelTipo,
  recetaDelDia,
  siguienteMenu,
  type Dieta,
  type DietaActiva,
  type Ingrediente,
  type Receta,
  type RecetaDelDia,
  type TipoDia,
} from '../domain/diet.ts'
import { dietaDeEjemplo } from '../domain/dietSample.ts'
import { COMIDAS, type Alimento, type ComidaId } from '../domain/food.ts'
import { diaVisto, dias, dieta, hoy, objetivoHoy } from '../state/comida.ts'
import { anadir, cargarAlimentos, devolver, quitar } from './foodLog.ts'
import { guardarCambio, guardarDieta } from './nutritionStore.ts'
import { nuevoId } from '../../../shared/lib/id.ts'

/** Lo que se enseña antes de empezar una dieta: sus cifras y cuánto cambia tu objetivo. */
export function vistaPrevia(d: Dieta) {
  const prueba: DietaActiva = {
    id: 'dieta',
    target: 'nutricion',
    dieta: d,
    inicio: hoy.value,
    ajustes: [],
    tipoElegido: {},
    factorArroz: FACTOR_ARROZ,
    originales: {},
  }
  const entreno = mediaDelTipo(prueba, hoy.value, 'entreno').kcal
  const descanso = mediaDelTipo(prueba, hoy.value, 'descanso').kcal
  // Media de una semana de 4 entrenos (como el prototipo)
  const media = Math.round((entreno * 4 + descanso * 3) / 7)
  return {
    menus: d.menus.length,
    recetas: d.recetas.length,
    entreno,
    descanso,
    media,
    antes: objetivoHoy.value?.kcal ?? null,
  }
}

/** Empieza una dieta: hoy es el día `diaMenu` de su ciclo. Lo que tenías queda en el historial. */
export async function empezar(d: Dieta, diaMenu: number): Promise<void> {
  const media = vistaPrevia(d).media
  await guardarDieta({
    id: 'dieta',
    target: 'nutricion',
    dieta: d,
    inicio: inicioSi(hoy.value, diaMenu),
    ajustes: [],
    tipoElegido: {},
    factorArroz: dieta.value?.factorArroz ?? FACTOR_ARROZ,
    originales: {},
  })
  await guardarCambio({ status: 'hecho', tipo: 'dieta', de: null, a: media, texto: `Empiezas «${d.nombre}»` })
}

/** Deja la dieta: vuelve tu objetivo de kcal. Lo apuntado se queda. */
export async function dejar(): Promise<void> {
  const nombre = dieta.value?.dieta.nombre
  await guardarDieta(null)
  if (nombre)
    await guardarCambio({
      status: 'hecho',
      tipo: 'dieta',
      de: null,
      a: objetivoHoy.value?.kcal ?? 0,
      texto: `Dejas «${nombre}»`,
    })
}

/** La dieta de ejemplo del prototipo (descarga la base de alimentos si hace falta). */
export async function dietaEjemplo(): Promise<Dieta | null> {
  return dietaDeEjemplo(await cargarAlimentos())
}

/** Una dieta tuya desde cero: un menú para todos los días, sin recetas. */
export function dietaPropia(nombre: string): Dieta {
  return dietaNueva(`mia-${nuevoId()}`, nombre)
}

/** Elige un archivo de dieta y lo lee. Devuelve la dieta, o por qué no vale (null si no eliges nada). */
export async function elegirArchivo(): Promise<
  { ok: true; dieta: Dieta } | { ok: false; motivo: string } | null
> {
  const file = await platform.pickFile('.json,application/json')
  if (!file) return null
  try {
    return leerDieta(JSON.parse(await file.text()))
  } catch (error) {
    logError(error, 'leer un archivo de dieta')
    return { ok: false, motivo: 'No es un archivo de dieta de MUTA' }
  }
}

/** Guarda tu dieta como archivo (con lo que hayas editado) para compartirla o volver a cargarla. */
export async function guardarComoArchivo(): Promise<void> {
  const d = dieta.value?.dieta
  if (!d) return
  const nombre = `MUTA-dieta-${d.nombre.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}.json`
  await platform.saveFile(nombre, new Blob([aArchivo(d)], { type: 'application/json' }))
}

/** Un registro sin una clave. */
const sin = <T>(r: Record<string, T>, clave: string): Record<string, T> =>
  Object.fromEntries(Object.entries(r).filter(([k]) => k !== clave))

async function cambiarActiva(cambio: (a: DietaActiva) => DietaActiva): Promise<void> {
  const a = dieta.value
  if (a) await guardarDieta(cambio(a))
}

/** Un día, de entreno o de descanso (a mano: manda sobre lo que dice tu rutina). */
export function elegirTipo(fecha: string, tipo: TipoDia): Promise<void> {
  return cambiarActiva((a) => ({ ...a, tipoElegido: { ...a.tipoElegido, [fecha]: tipo } }))
}

/** Vuelve a lo que dice tu rutina para un día. */
export function tipoDeRutina(fecha: string): Promise<void> {
  return cambiarActiva((a) => ({ ...a, tipoElegido: sin(a.tipoElegido, fecha) }))
}

/** Apunta una receta del menú (como la toca ese día). Devuelve el id del apunte, para «Deshacer». */
export async function apuntarReceta(r: RecetaDelDia, fecha = diaVisto.value): Promise<string> {
  return anadir(
    {
      comida: r.comida,
      nombre: r.nombre,
      alimentoId: null,
      gramos: null,
      raciones: null,
      racion: null,
      kcal: r.total.kcal,
      protein: r.total.protein,
      carbs: r.total.carbs,
      fat: r.total.fat,
      receta: r.id,
    },
    fecha,
  )
}

/** Quita lo apuntado de una receta un día. Devuelve lo quitado (para «Deshacer»). */
export async function quitarReceta(recetaId: string, fecha = diaVisto.value) {
  const ids = (dias.value[fecha] ?? []).filter((x) => x.receta === recetaId).map((x) => x.id)
  return quitar(ids, fecha)
}

export { devolver }

/** Guarda una receta cambiada (la primera vez se guarda cómo venía, para poder volver a ella). */
export function guardarReceta(r: Receta): Promise<void> {
  return cambiarActiva((a) => {
    const antes = a.dieta.recetas.find((x) => x.id === r.id)
    const originales =
      antes && !antes.propia && !a.originales[r.id] ? { ...a.originales, [r.id]: antes } : a.originales
    return {
      ...a,
      originales,
      dieta: { ...a.dieta, recetas: a.dieta.recetas.map((x) => (x.id === r.id ? r : x)) },
    }
  })
}

/** Vuelve a la receta como venía en la dieta. */
export function restaurarReceta(id: string): Promise<void> {
  return cambiarActiva((a) => {
    const original = a.originales[id]
    if (!original) return a
    return {
      ...a,
      originales: sin(a.originales, id),
      dieta: { ...a.dieta, recetas: a.dieta.recetas.map((x) => (x.id === id ? original : x)) },
    }
  })
}

const de5 = (n: number) => Math.max(0, Math.round(n / 5) * 5)

/** Un ingrediente de la base con sus gramos de entreno (los de descanso, iguales). */
export function ingredienteDe(a: Alimento, gramos: number): Ingrediente {
  return {
    nombre: a.name,
    alimentoId: a.id,
    categoria: a.category,
    por100: { kcal: a.kcal, protein: a.protein, carbs: a.carbs, fat: a.fat },
    gramos: { entreno: gramos, descanso: gramos },
    ajusta: false,
    nota: '',
  }
}

/** Cambia los gramos de un ingrediente en un tipo de día; si es el de entreno y el de descanso era igual, los dos. */
export function conGramos(r: Receta, i: number, tipo: TipoDia, g: number): Receta {
  return {
    ...r,
    ingredientes: r.ingredientes.map((x, k) => {
      if (k !== i || !x.gramos) return x
      const iguales = x.gramos.entreno === x.gramos.descanso
      const gramos =
        tipo === 'entreno' && iguales
          ? { entreno: de5(g), descanso: de5(g) }
          : { ...x.gramos, [tipo]: de5(g) }
      return { ...x, gramos }
    }),
  }
}

/** Cambia un ingrediente por otro (intercambio para siempre): mismos gramos de su macro, en entreno y en descanso. */
export function conCambio(r: Receta, i: number, nuevo: Alimento, gramosEntreno: number): Receta {
  return {
    ...r,
    ingredientes: r.ingredientes.map((x, k) => {
      if (k !== i) return x
      const proporcion = x.gramos && x.gramos.entreno ? x.gramos.descanso / x.gramos.entreno : 1
      return {
        ...ingredienteDe(nuevo, gramosEntreno),
        gramos: { entreno: gramosEntreno, descanso: de5(gramosEntreno * proporcion) },
        ajusta: x.ajusta,
      }
    }),
  }
}

/** La receta de hoy con un ingrediente cambiado solo para hoy (se apunta así; la receta no cambia). */
export function recetaDeHoyCon(r: RecetaDelDia, i: number, nuevo: Alimento, gramos: number): RecetaDelDia {
  const receta = conCambio(r, i, nuevo, gramos)
  const delDia = recetaDelDia(
    {
      ...receta,
      ingredientes: receta.ingredientes.map((x, k) =>
        k === i && x.gramos ? { ...x, gramos: { entreno: gramos, descanso: gramos } } : x,
      ),
    },
    r.tipo,
  )
  return { ...delDia, nombre: `${r.nombre} (con ${nuevo.name.toLowerCase()})` }
}

/** Una receta nueva tuya en un menú (null = todos los días). Devuelve su id. */
export async function crearReceta(nombre: string, comida: ComidaId, menu: string | null): Promise<string> {
  const id = `u_${nuevoId()}`
  const rotulo = COMIDAS.find((c) => c.id === comida)?.nombre ?? 'Comida'
  await cambiarActiva((a) => ({
    ...a,
    dieta: {
      ...a.dieta,
      recetas: [
        ...a.dieta.recetas,
        {
          id,
          nombre: nombre.trim() || 'Mi receta',
          comida,
          rotulo,
          menu,
          soloEntreno: false,
          ingredientes: [],
          pasos: [],
          notas: [],
          propia: true,
        },
      ],
    },
  }))
  return id
}

/** Quita una receta de la dieta. Devuelve la receta y su puesto (para «Deshacer»). */
export async function borrarReceta(id: string): Promise<{ receta: Receta; puesto: number } | null> {
  const a = dieta.value
  const puesto = a?.dieta.recetas.findIndex((r) => r.id === id) ?? -1
  if (!a || puesto < 0) return null
  const receta = a.dieta.recetas[puesto]
  await guardarDieta({ ...a, dieta: { ...a.dieta, recetas: a.dieta.recetas.filter((r) => r.id !== id) } })
  return { receta, puesto }
}

/** Vuelve a poner una receta borrada en su puesto. */
export function devolverReceta(b: { receta: Receta; puesto: number }): Promise<void> {
  return cambiarActiva((a) => {
    const recetas = [...a.dieta.recetas]
    recetas.splice(b.puesto, 0, b.receta)
    return { ...a, dieta: { ...a.dieta, recetas } }
  })
}

/** El menú de un día del ciclo (1–7). */
export function menuDelDiaDelCiclo(dia: number, menu: string): Promise<void> {
  return cambiarActiva((a) => ({
    ...a,
    dieta: { ...a.dieta, ciclo: a.dieta.ciclo.map((m, i) => (i === dia - 1 ? menu : m)) },
  }))
}

/** Añade un menú nuevo (vacío). Devuelve su id. */
export async function anadirMenu(): Promise<string | null> {
  const a = dieta.value
  if (!a) return null
  const menu = siguienteMenu(a.dieta)
  await guardarDieta({ ...a, dieta: { ...a.dieta, menus: [...a.dieta.menus, menu] } })
  return menu.id
}

/** Cambia el nombre de tu dieta. */
export function renombrarDieta(nombre: string): Promise<void> {
  return cambiarActiva((a) => ({ ...a, dieta: { ...a.dieta, nombre: nombre.trim() || a.dieta.nombre } }))
}

/** El día de mañana (las propuestas aceptadas valen desde mañana, como en Tu objetivo). */
export const manana = () => addDays(hoy.value, 1)
