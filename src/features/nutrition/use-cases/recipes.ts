// Las recetas: cargar el recetario (el tuyo de private/ o, si no hay, los platos de ejemplo), apuntar un plato (tal cual
// o ajustado), tus platos, tus productos (tu arroz, tu hummus) y poner un plato en tu dieta.
import { getDb } from '../../../shared/data/db.ts'
import { localRecipePhoto, readLocalRecipes } from '../../../shared/data/localRecipes.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { ajustar } from '../domain/fit.ts'
import { dietaDeEjemplo } from '../domain/dietSample.ts'
import type { Ingrediente, Receta, TipoDia } from '../domain/diet.ts'
import type { Alimento, ComidaId } from '../domain/food.ts'
import { menuVacio, type MenuSemanal } from '../domain/menu.ts'
import {
  ingredienteDe,
  leerRecetario,
  platoDeReceta,
  platoTuyo,
  productosVacios,
  type IngredientePlato,
  type Plato,
  type Productos,
} from '../domain/recipes.ts'
import { dias, diaVisto, hoy } from '../state/comida.ts'
import { recetaComoToca, recetaPorId } from '../state/dieta.ts'
import {
  estadoRecetas,
  fotos,
  menu,
  platosTuyos,
  productos,
  recetario,
  semanaVista,
  totalDePlato,
  valoresDe,
} from '../state/recetas.ts'
import { guardarReceta } from './diet.ts'
import { anadir, cargarAlimentos, quitar } from './foodLog.ts'

export const ID_PLATOS = 'platos-tuyos'
export const ID_MENU = 'menu'
export const ID_PRODUCTOS = 'productos'

let carga: Promise<void> | null = null

/** Carga los platos, tu menú y tus productos (una vez por visita). */
export function cargarRecetas(): Promise<void> {
  carga ??= (async () => {
    estadoRecetas.value = 'cargando'
    try {
      const db = await getDb()
      const [tuyos, guardado, mios, local] = await Promise.all([
        db.get('userContent', ID_PLATOS) as Promise<{ platos: Plato[] } | undefined>,
        db.get('userContent', ID_MENU) as Promise<MenuSemanal | undefined>,
        db.get('userContent', ID_PRODUCTOS) as Promise<Productos | undefined>,
        readLocalRecipes(),
      ])
      platosTuyos.value = tuyos?.platos ?? []
      menu.value = guardado ? { ...menuVacio(), ...guardado } : menuVacio()
      productos.value = mios ?? null
      semanaVista.value = hoy.value
      const leido = leerRecetario(local)
      if (leido?.platos.length) {
        recetario.value = leido
        fotos.value = Object.fromEntries(
          leido.platos.flatMap((p) => {
            const url = p.numero === null ? null : localRecipePhoto(p.numero)
            return url ? [[p.id, url]] : []
          }),
        )
      } else {
        // Sin recetario: los platos de la dieta de ejemplo del prototipo, marcados «de ejemplo»
        const ejemplo = dietaDeEjemplo(await cargarAlimentos())
        recetario.value = {
          rev: 0,
          categorias: [],
          platos: ejemplo ? ejemplo.recetas.map(platoDeReceta) : [],
        }
      }
    } catch (error) {
      logError(error, 'cargar las recetas')
      carga = null
    } finally {
      estadoRecetas.value = 'listo'
    }
  })()
  return carga
}

/** Para las pruebas: vuelve a cargar. */
export function olvidarRecetas(): void {
  carga = null
}

/**
 * Apunta un plato en una comida (tal cual o con los gramos del ajuste; `veces` raciones). Devuelve los ids (para
 * «Deshacer»).
 */
export async function apuntarPlato(
  p: Plato,
  comida: ComidaId,
  gramos: readonly (number | null)[] | null = null,
  veces = 1,
  fecha = diaVisto.value,
): Promise<string[]> {
  const t = totalDePlato(p, gramos ?? undefined, veces)
  const id = await anadir(
    {
      comida,
      nombre: p.nombre,
      alimentoId: null,
      gramos: null,
      raciones: veces,
      racion: veces === 1 ? 'ración' : 'raciones',
      ...t,
      receta: p.id,
    },
    fecha,
  )
  return [id]
}

/** Quita lo apuntado (deshacer). */
export const desapuntar = (ids: readonly string[], fecha = diaVisto.value) => quitar(ids, fecha)

/** Si un plato está apuntado en una comida de un día. */
export function platoApuntado(platoId: string, comida: ComidaId, fecha: string): boolean {
  return (dias.value[fecha] ?? []).some((a) => a.receta === platoId && a.comida === comida)
}

// --- Tus platos ---

async function guardarTuyos(lista: Plato[]): Promise<void> {
  platosTuyos.value = lista
  await (await getDb()).put('userContent', { id: ID_PLATOS, target: 'nutricion', platos: lista })
}

/** Crea un plato tuyo con alimentos de la base, tus alimentos o lo escaneado. Devuelve su id. */
export async function crearPlato(
  nombre: string,
  ingredientes: readonly { alimento: Alimento; gramos: number }[],
  pasos: string[] = [],
): Promise<string | null> {
  const n = nombre.trim()
  if (!n || !ingredientes.length) return null
  const p = platoTuyo(
    `mio-${crypto.randomUUID()}`,
    n,
    ingredientes.map((i) => ingredienteDe(i.alimento, i.gramos)),
    pasos,
  )
  await guardarTuyos([...platosTuyos.value, p])
  return p.id
}

export async function borrarPlato(id: string): Promise<Plato | null> {
  const p = platosTuyos.value.find((x) => x.id === id) ?? null
  if (p) await guardarTuyos(platosTuyos.value.filter((x) => x.id !== id))
  return p
}

export const devolverPlato = (p: Plato) => guardarTuyos([...platosTuyos.value, p])

// --- Tus productos ---

async function guardarProductos(p: Productos): Promise<void> {
  productos.value = p
  await (await getDb()).put('userContent', p)
}

/**
 * Usa tu producto en un ingrediente: en todos tus platos (lo que lleve ese alimento) o solo en este. `alimentoId` null
 * vuelve al del plato.
 */
export function usarProducto(
  plato: Plato,
  k: number,
  alimentoId: string | null,
  siempre: boolean,
): Promise<void> {
  const actual = productos.value ?? productosVacios()
  const generico = plato.ingredientes[k]?.alimentoId
  const enEste = { ...(actual.enPlato[plato.id] ?? {}) }
  delete enEste[String(k)]
  const enPlato = { ...actual.enPlato, [plato.id]: enEste }
  const todos = { ...actual.siempre }
  if (siempre && generico) {
    if (alimentoId) todos[generico] = alimentoId
    else delete todos[generico]
  } else if (alimentoId) enPlato[plato.id] = { ...enEste, [String(k)]: alimentoId }
  return guardarProductos({ ...actual, siempre: todos, enPlato })
}

// --- A tu dieta ---

/**
 * Pone un plato en tu dieta en lugar de una de sus recetas: los gramos de entreno y de descanso se ajustan a lo que esa
 * receta tenía en cada tipo de día; lo que hace de hidratos es lo que mueve la consulta.
 */
export async function ponerEnDieta(p: Plato, recetaId: string): Promise<boolean> {
  const r = recetaPorId(recetaId)
  if (!r) return false
  const valores = valoresDe(p)
  const por: Record<TipoDia, (number | null)[]> = {
    entreno: ajustar(p, recetaComoToca(r, 'entreno').total, valores).gramos,
    descanso: ajustar(p, recetaComoToca(r, 'descanso').total, valores).gramos,
  }
  const ingredientes = p.ingredientes.map((i: IngredientePlato, k): Ingrediente => {
    const e = por.entreno[k]
    const d = por.descanso[k]
    const v = valores[k] ?? i.por100
    return {
      nombre: i.nombre,
      alimentoId: i.alimentoId,
      categoria: i.categoria,
      por100: v ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 },
      gramos: i.cuenta && v && e !== null && d !== null ? { entreno: e, descanso: d } : null,
      ajusta: i.macro === 'carbs',
      nota: i.cuenta && v ? '' : i.texto,
    }
  })
  const nueva: Receta = { ...r, nombre: p.nombre, ingredientes, pasos: p.pasos, notas: [] }
  await guardarReceta(nueva)
  return true
}

/** Lo que tendría un plato en tu dieta en lugar de una receta (para enseñarlo antes de ponerlo). */
export function comoEnDieta(p: Plato, recetaId: string) {
  const r = recetaPorId(recetaId)
  if (!r) return null
  const valores = valoresDe(p)
  const entreno = ajustar(p, recetaComoToca(r, 'entreno').total, valores)
  const descanso = ajustar(p, recetaComoToca(r, 'descanso').total, valores)
  return {
    receta: r,
    antes: { entreno: recetaComoToca(r, 'entreno').total, descanso: recetaComoToca(r, 'descanso').total },
    entreno,
    descanso,
  }
}
