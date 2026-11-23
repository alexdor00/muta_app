import { getDb } from '../../../shared/data/db.ts'
import { leerOllas, type ModoReparto, type Olla, type Ollas } from '../domain/ollas.ts'
import { ollas } from '../state/ollas.ts'

const ID_OLLAS = 'ollas'
let carga: Promise<void> | null = null

/** Carga tus ollas (una vez por visita). */
export function cargarOllas(): Promise<void> {
  carga ??= getDb()
    .then((db) => db.get('userContent', ID_OLLAS))
    .then((x) => void (ollas.value = leerOllas(x)))
  return carga
}

async function guardar(o: Ollas): Promise<void> {
  ollas.value = o
  await (await getDb()).put('userContent', { id: ID_OLLAS, target: 'nutricion', ...o })
}

/** Añade una olla o cambia la que tiene ese id. Devuelve la olla guardada. */
export async function guardarOlla(nombre: string, gramos: number, id?: string): Promise<Olla> {
  const o = ollas.value
  const olla = { id: id ?? `olla-${Date.now()}`, nombre: nombre.trim() || 'Olla', gramos: Math.round(gramos) }
  await guardar({
    ...o,
    lista: o.lista.some((x) => x.id === olla.id)
      ? o.lista.map((x) => (x.id === olla.id ? olla : x))
      : [...o.lista, olla],
  })
  return olla
}

/** Borra una olla (y deja de ser la de sus recetas). */
export async function borrarOlla(id: string): Promise<void> {
  const o = ollas.value
  await guardar({
    ...o,
    lista: o.lista.filter((x) => x.id !== id),
    dePlato: Object.fromEntries(Object.entries(o.dePlato).filter(([, v]) => v !== id)),
  })
}

/** La olla en la que haces una receta (la próxima vez sale elegida); null, sin olla. */
export async function ollaDeReceta(plato: string, id: string | null): Promise<void> {
  const o = ollas.value
  const resto = Object.fromEntries(Object.entries(o.dePlato).filter(([k]) => k !== plato))
  await guardar({ ...o, dePlato: id ? { ...resto, [plato]: id } : resto })
}

/** Guarda lo que rinde una receta o algo que se cuece (lo pesaste): la próxima vez se estima. */
export async function guardarRinde(clave: string, valor: number): Promise<void> {
  const o = ollas.value
  if (o.rinde[clave] === valor) return
  await guardar({ ...o, rinde: { ...o.rinde, [clave]: valor } })
}

/** Cómo repartes una receta: todo junto o por partes. */
export async function modoDeReparto(plato: string, modo: ModoReparto): Promise<void> {
  const o = ollas.value
  await guardar({ ...o, modo: { ...o.modo, [plato]: modo } })
}
