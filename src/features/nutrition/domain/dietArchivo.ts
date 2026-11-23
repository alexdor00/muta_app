// El archivo de una dieta de MUTA (formato `muta-dieta` v1): leerlo comprobando todo lo que la app usa y guardarlo.
import type { ComidaId, Macros } from './food.ts'
import { FORMATO, MAX_CICLO, ORDEN, UMBRALES, type Dieta, type Ingrediente, type Receta } from './diet.ts'

const esNumero = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x >= 0
const esTexto = (x: unknown): x is string => typeof x === 'string'
const COMIDAS_ID: readonly string[] = ORDEN

function leerMacros(x: unknown): Macros | null {
  if (!x || typeof x !== 'object') return null
  const m = x as Record<string, unknown>
  return esNumero(m.kcal) && esNumero(m.protein) && esNumero(m.carbs) && esNumero(m.fat)
    ? { kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat }
    : null
}

function leerIngrediente(x: unknown): Ingrediente | null {
  if (!x || typeof x !== 'object') return null
  const i = x as Record<string, unknown>
  const por100 = leerMacros(i.por100)
  const g = i.gramos as Record<string, unknown> | null | undefined
  const gramos =
    g && esNumero(g.entreno) && esNumero(g.descanso) ? { entreno: g.entreno, descanso: g.descanso } : null
  if (!esTexto(i.nombre) || !i.nombre.trim() || !por100 || (g && !gramos)) return null
  return {
    nombre: i.nombre.trim(),
    alimentoId: esTexto(i.alimentoId) ? i.alimentoId : null,
    categoria: esTexto(i.categoria) ? i.categoria : '',
    por100,
    gramos,
    ajusta: i.ajusta === true,
    nota: esTexto(i.nota) ? i.nota : '',
    ...(i.alMomento === true ? { alMomento: true } : {}),
  }
}

const textos = (x: unknown) => (Array.isArray(x) ? x.filter(esTexto) : [])

/**
 * Lee un archivo de dieta de MUTA (lo que guarda «Guardar como archivo»). Devuelve la dieta o, si no vale, por qué.
 * Comprueba todo lo que la app usa: nada a medias.
 */
export function leerDieta(x: unknown): { ok: true; dieta: Dieta } | { ok: false; motivo: string } {
  if (!x || typeof x !== 'object') return { ok: false, motivo: 'No es un archivo de dieta de MUTA' }
  const d = x as Record<string, unknown>
  if (d.formato !== FORMATO) return { ok: false, motivo: 'No es un archivo de dieta de MUTA' }
  if (d.version !== 1) return { ok: false, motivo: 'Es de una versión de MUTA más nueva' }
  const menus = Array.isArray(d.menus)
    ? d.menus.flatMap((m: unknown) => {
        const mm = m as Record<string, unknown> | null
        return mm && esTexto(mm.id) && esTexto(mm.nombre) ? [{ id: mm.id, nombre: mm.nombre }] : []
      })
    : []
  if (!menus.length) return { ok: false, motivo: 'La dieta no trae menús' }
  const ids = new Set(menus.map((m) => m.id))
  const ciclo = Array.isArray(d.ciclo) ? d.ciclo.filter(esTexto) : []
  if (!ciclo.length || ciclo.length > MAX_CICLO || ciclo.some((c) => !ids.has(c)))
    return { ok: false, motivo: `El ciclo debe decir el menú de cada día (de 1 a ${MAX_CICLO} días)` }
  const cocinar = Array.isArray(d.cocinar)
    ? [...new Set(d.cocinar.filter((n): n is number => esNumero(n) && n >= 1 && n <= ciclo.length))].sort(
        (a, b) => a - b,
      )
    : []
  const recetas: Receta[] = []
  for (const r of Array.isArray(d.recetas) ? d.recetas : []) {
    const rr = r as Record<string, unknown> | null
    const ingredientes = Array.isArray(rr?.ingredientes) ? rr.ingredientes.map(leerIngrediente) : []
    if (
      !rr ||
      !esTexto(rr.id) ||
      !esTexto(rr.nombre) ||
      !esTexto(rr.comida) ||
      !COMIDAS_ID.includes(rr.comida) ||
      (rr.menu !== null && !(esTexto(rr.menu) && ids.has(rr.menu))) ||
      ingredientes.some((i) => !i)
    )
      return {
        ok: false,
        motivo: `Una receta no se puede leer${rr && esTexto(rr.nombre) ? `: ${rr.nombre}` : ''}`,
      }
    recetas.push({
      id: rr.id,
      nombre: rr.nombre,
      comida: rr.comida as ComidaId,
      rotulo: esTexto(rr.rotulo) ? rr.rotulo : rr.nombre,
      menu: rr.menu as string | null,
      soloEntreno: rr.soloEntreno === true,
      ...(rr.soloDescanso === true ? { soloDescanso: true } : {}),
      ...(rr.preparar === 'antes' || rr.preparar === 'momento' ? { preparar: rr.preparar } : {}),
      ingredientes: ingredientes as Ingrediente[],
      pasos: textos(rr.pasos),
      notas: textos(rr.notas),
      propia: rr.propia === true,
    })
  }
  const fases = Array.isArray(d.fases)
    ? d.fases.flatMap((f: unknown) => {
        const ff = f as Record<string, unknown> | null
        return ff &&
          esTexto(ff.id) &&
          esTexto(ff.nombre) &&
          esNumero(ff.desdeSemana) &&
          typeof ff.kcal === 'number'
          ? [{ id: ff.id, nombre: ff.nombre, desdeSemana: ff.desdeSemana, kcal: ff.kcal }]
          : []
      })
    : []
  const u = d.umbrales as Record<string, unknown> | undefined
  return {
    ok: true,
    dieta: {
      formato: FORMATO,
      version: 1,
      id: esTexto(d.id) && d.id ? d.id : 'dieta',
      nombre: esTexto(d.nombre) && d.nombre.trim() ? d.nombre.trim() : 'Mi dieta',
      descripcion: esTexto(d.descripcion) ? d.descripcion : '',
      menus,
      ciclo,
      ...(cocinar.length ? { cocinar } : {}),
      recetas,
      fases,
      umbrales:
        u && esNumero(u.rapido) && esNumero(u.lento) ? { rapido: u.rapido, lento: u.lento } : UMBRALES,
      ejemplo: d.ejemplo === true,
    },
  }
}

/** La dieta como archivo (lo que lee `leerDieta`): las recetas tal cual, con lo que hayas editado. */
export function aArchivo(dieta: Dieta): string {
  return JSON.stringify(dieta, null, 2)
}
