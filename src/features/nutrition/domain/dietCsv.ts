// Tu dieta desde un CSV (Tu dieta · «Cargar»), además del archivo de MUTA y de crearla en la app (decisión 2026-11-09).
// Una fila por ingrediente. Columnas (da igual mayúsculas y tildes): menú, comida (desayuno, comida, merienda o cena),
// receta, ingrediente y gramos (o «gramos entreno» y «gramos descanso»); y si quieres, sus valores por 100 g (kcal,
// proteína, hidratos, grasa: si no, se buscan en la base) y «días» (los días del ciclo, del 1 al 7, en que va ese menú).
import { columnas, leerCsv, limpioCsv } from '../../../shared/lib/csv.ts'
import { FORMATO, UMBRALES, type Dieta, type Ingrediente, type Menu, type Receta } from './diet.ts'
import type { Alimento, ComidaId } from './food.ts'

const COLUMNAS = {
  menu: ['menu'],
  comida: ['comida'],
  receta: ['receta', 'plato'],
  ingrediente: ['ingrediente', 'alimento'],
  gramos: ['gramos', 'g'],
  entreno: ['gramos entreno', 'entreno'],
  descanso: ['gramos descanso', 'descanso'],
  kcal: ['kcal'],
  proteina: ['proteina', 'proteinas'],
  hidratos: ['hidratos', 'carbohidratos'],
  grasa: ['grasa', 'grasas'],
  dias: ['dias', 'dia'],
} as const

const COMIDAS: Record<string, ComidaId> = {
  desayuno: 'desayuno',
  comida: 'comida',
  almuerzo: 'comida',
  merienda: 'merienda',
  cena: 'cena',
}

const numero = (s: string) => {
  const n = Number(s.replace(',', '.'))
  return s.trim() && Number.isFinite(n) && n >= 0 ? n : null
}
const id = (s: string) =>
  limpioCsv(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export type DietaCsv = { dieta: Dieta | null; recetas: number; errores: string[] }

/**
 * Lee el CSV de una dieta. `buscar` encuentra un alimento de la base por su nombre (para los valores por 100 g que no
 * traiga el archivo). Si algo no se puede leer, no hay dieta y se dice qué fila falla.
 */
export function dietaDesdeCsv(
  texto: string,
  nombre: string,
  idDieta: string,
  buscar: (nombre: string) => Alimento | null,
): DietaCsv {
  const { titulos, filas } = leerCsv(texto)
  const errores: string[] = []
  const nada = (): DietaCsv => ({ dieta: null, recetas: 0, errores })
  if (!filas.length) {
    errores.push('El archivo está vacío: hace falta la fila de títulos y al menos un ingrediente.')
    return nada()
  }
  const col = columnas(titulos, COLUMNAS)
  for (const k of ['menu', 'comida', 'receta', 'ingrediente'] as const)
    if (col[k] < 0) errores.push(`Falta la columna «${k === 'menu' ? 'menú' : k}».`)
  if (col.gramos < 0 && (col.entreno < 0 || col.descanso < 0))
    errores.push('Falta la columna «gramos» (o «gramos entreno» y «gramos descanso»).')
  if (errores.length) return nada()

  const menus: Menu[] = []
  const diasDe = new Map<string, number[]>()
  const recetas = new Map<string, Receta>()
  for (const { fila, celdas } of filas) {
    const dato = (k: keyof typeof COLUMNAS) => (col[k] >= 0 ? (celdas[col[k]] ?? '') : '')
    const nombreMenu = dato('menu')
    const comida = COMIDAS[limpioCsv(dato('comida'))]
    const nombreReceta = dato('receta')
    const ingrediente = dato('ingrediente')
    if (!nombreMenu || !nombreReceta || !ingrediente) {
      errores.push(`Fila ${fila}: faltan el menú, la receta o el ingrediente.`)
      continue
    }
    if (!comida) {
      errores.push(`Fila ${fila}: «${dato('comida')}» no es una comida (desayuno, comida, merienda o cena).`)
      continue
    }
    const gramos = numero(dato('gramos'))
    const entreno = numero(dato('entreno')) ?? gramos
    const descanso = numero(dato('descanso')) ?? gramos
    if (entreno === null || descanso === null) {
      errores.push(`Fila ${fila}: faltan los gramos de «${ingrediente}».`)
      continue
    }
    const valores = [
      numero(dato('kcal')),
      numero(dato('proteina')),
      numero(dato('hidratos')),
      numero(dato('grasa')),
    ]
    const deBase = valores.some((v) => v === null) ? buscar(ingrediente) : null
    if (valores.some((v) => v === null) && !deBase) {
      errores.push(
        `Fila ${fila}: no encuentro «${ingrediente}» en la base: pon sus kcal, proteína, hidratos y grasa por 100 g.`,
      )
      continue
    }
    const [kcal, protein, carbs, fat] = valores.every((v) => v !== null)
      ? (valores as number[])
      : [deBase!.kcal, deBase!.protein, deBase!.carbs, deBase!.fat]
    const menuId = id(nombreMenu)
    if (!menus.some((m) => m.id === menuId)) menus.push({ id: menuId, nombre: nombreMenu })
    const dias = dato('dias')
      .split(/[\s,;]+/)
      .map(Number)
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= 7)
    if (dias.length) diasDe.set(menuId, dias)
    const recetaId = `${menuId}-${comida}-${id(nombreReceta)}`
    const r = recetas.get(recetaId) ?? {
      id: recetaId,
      nombre: nombreReceta,
      comida,
      rotulo: nombreReceta,
      menu: menuId,
      soloEntreno: false,
      ingredientes: [],
      pasos: [],
      notas: [],
      propia: false,
    }
    const ing: Ingrediente = {
      nombre: deBase?.name ?? ingrediente,
      alimentoId: deBase?.id ?? null,
      categoria: deBase?.category ?? '',
      por100: { kcal, protein, carbs, fat },
      gramos: { entreno, descanso },
      ajusta: false,
      nota: '',
    }
    recetas.set(recetaId, { ...r, ingredientes: [...r.ingredientes, ing] })
  }
  if (errores.length || !menus.length) {
    if (!errores.length) errores.push('El archivo no trae ningún ingrediente.')
    return nada()
  }
  // En cada receta, lo que más hidratos aporta es lo que se mueve cuando la consulta cambia las kcal
  const lista = [...recetas.values()].map((r) => {
    const masHidratos = r.ingredientes.reduce(
      (m, x, k) =>
        x.por100.carbs * (x.gramos?.entreno ?? 0) >
        r.ingredientes[m].por100.carbs * (r.ingredientes[m].gramos?.entreno ?? 0)
          ? k
          : m,
      0,
    )
    return {
      ...r,
      ingredientes: r.ingredientes.map((x, k) => ({ ...x, ajusta: k === masHidratos && x.por100.carbs > 0 })),
    }
  })
  // El ciclo de 7 días: los días que diga cada menú y, los que falten, por turnos
  const ciclo: string[] = Array.from({ length: 7 }, () => '')
  for (const [m, dias] of diasDe) for (const d of dias) ciclo[d - 1] = m
  let turno = 0
  for (let d = 0; d < 7; d++)
    if (!ciclo[d]) {
      ciclo[d] = menus[turno % menus.length].id
      turno++
    }
  return {
    dieta: {
      formato: FORMATO,
      version: 1,
      id: idDieta,
      nombre,
      descripcion: 'Cargada desde un CSV',
      menus,
      ciclo,
      recetas: lista,
      fases: [],
      umbrales: UMBRALES,
      ejemplo: false,
    },
    recetas: lista.length,
    errores,
  }
}
