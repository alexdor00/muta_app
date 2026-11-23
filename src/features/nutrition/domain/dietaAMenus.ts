// Tu dieta como tus menús, de forma exacta (usuario, 2026-11-17: «que detecte de forma exacta todo»): cada menú de la
// dieta es uno tuyo (A, B, C…) con su receta en cada comida y, además, lo que va en esa comida (otra receta del menú o
// lo de todos los días, como el batido; el preentreno, solo los días de entreno); cada comida con los gramos de la
// receta (los de entreno o los de descanso según el día, sin ajustar); y el ciclo de la dieta, con su día de inicio y
// los días en que se cocina.
import { sumar, COMIDAS, macrosDe, type ComidaId } from './food.ts'
import type { Dieta, Receta } from './diet.ts'
import type { CicloMenus, ExtraMenu, MenuPlan } from './menu.ts'
import { macroDe, platoTuyo, type IngredientePlato, type Plato } from './recipes.ts'

const LETRAS = 'ABCDEFG'

/** Lo que lleva una receta con sus gramos de entreno (lo que cuenta un extra: una ración). */
const totalDeReceta = (r: Receta) =>
  sumar(r.ingredientes.flatMap((i) => (i.gramos ? [macrosDe(i.por100, i.gramos.entreno)] : [])))

/** Una receta que va además del plato, como extra del menú (con su tipo de día, si va solo uno). */
function comoExtra(r: Receta, platoId: string): ExtraMenu {
  const t = totalDeReceta(r)
  return {
    alimentoId: null,
    platoId,
    nombre: r.rotulo && r.rotulo !== r.nombre ? `${r.rotulo}: ${r.nombre}` : r.nombre,
    categoria: 'tuyos',
    gramos: 0,
    kcal: t.kcal,
    protein: t.protein,
    carbs: t.carbs,
    fat: t.fat,
    ...(r.soloEntreno ? { solo: 'entreno' as const } : r.soloDescanso ? { solo: 'descanso' as const } : {}),
  }
}

/**
 * Los menús y el ciclo de una dieta. `platoDe` da el id del plato tuyo de cada receta. Hasta 7 menús (A–G): los que
 * pasen no caben y se dicen en `fuera`.
 */
export function menusDesdeDieta(
  d: Dieta,
  inicio: string,
  platoDe: (r: Receta) => string,
): { menus: MenuPlan[]; ciclo: CicloMenus; fuera: string[] } {
  const usados = d.menus.slice(0, LETRAS.length)
  const letraDe = (id: string) =>
    LETRAS[
      Math.max(
        0,
        usados.findIndex((m) => m.id === id),
      )
    ]
  const deTodos = d.recetas.filter((r) => r.menu === null)
  const menus = usados.map((m, i): MenuPlan => {
    const platos: Partial<Record<ComidaId, string>> = {}
    const extras: Partial<Record<ComidaId, ExtraMenu[]>> = {}
    for (const { id: c } of COMIDAS) {
      // Primero las del menú, después las de todos los días; el plato, la primera que va todos los días del tipo
      const suyas = [
        ...d.recetas.filter((r) => r.menu === m.id && r.comida === c),
        ...deTodos.filter((r) => r.comida === c),
      ]
      const principal = suyas.find((r) => !r.soloEntreno && !r.soloDescanso)
      if (principal) platos[c] = platoDe(principal)
      const resto = suyas.filter((r) => r !== principal)
      if (resto.length) extras[c] = resto.map((r) => comoExtra(r, platoDe(r)))
    }
    return {
      id: LETRAS[i],
      nombre: m.nombre,
      platos,
      // Los gramos de la receta, tal cual: los de entreno o los de descanso, sin ajustar a tu objetivo
      fijos: COMIDAS.map((c) => c.id),
      ...(Object.keys(extras).length ? { extras } : {}),
    }
  })
  return {
    menus,
    ciclo: {
      menus: d.ciclo.map(letraDe),
      inicio,
      ...(d.cocinar?.length ? { cocinar: [...d.cocinar] } : {}),
    },
    fuera: d.menus.slice(LETRAS.length).map((m) => m.nombre),
  }
}

/** Una receta de una dieta como plato: con los gramos del día de entreno y, si cambian, los de descanso. */
export function platoDeReceta(r: Receta): Plato {
  const ingredientes = r.ingredientes.map((i): IngredientePlato => ({
    texto: i.gramos ? `${i.gramos.entreno} g de ${i.nombre.toLowerCase()}` : `${i.nombre} ${i.nota}`.trim(),
    nombre: i.nombre,
    categoria: i.categoria,
    por100: i.por100,
    alimentoId: i.alimentoId,
    cuenta: i.gramos !== null,
    gramos: i.gramos?.entreno ?? null,
    sugerido: false,
    macro: i.gramos ? macroDe(i.por100, i.gramos.entreno, i.categoria) : null,
  }))
  // Si algo cambia los días de descanso (el arroz, el pan), sus gramos de descanso
  const cambia = r.ingredientes.some((i) => i.gramos && i.gramos.descanso !== i.gramos.entreno)
  return {
    ...platoTuyo(`ej-${r.id}`, r.nombre, ingredientes, r.pasos),
    categoria: 'ejemplo',
    origen: 'ejemplo',
    ...(cambia ? { gramosDescanso: r.ingredientes.map((i) => i.gramos?.descanso ?? null) } : {}),
  }
}

/**
 * Cómo se prepara cada plato según la dieta (usuario, 2026-11-19: que «3 Cocina» salga como dice el documento): al
 * momento, con antelación o con una parte al momento (los ingredientes marcados «al momento»). Lo que la dieta no dice,
 * no se toca.
 */
export function preparacionDeLaDieta(recetas: readonly Receta[]): {
  porPlato: Record<string, 'taper' | 'mixto' | 'momento'>
  frescos: Record<string, string[]>
} {
  const porPlato: Record<string, 'taper' | 'mixto' | 'momento'> = {}
  const frescos: Record<string, string[]> = {}
  for (const r of recetas) {
    const plato = `ej-${r.id}`
    const alMomento = r.ingredientes.filter((i) => i.alMomento).map((i) => i.nombre)
    if (r.preparar === 'momento') porPlato[plato] = 'momento'
    else if (alMomento.length) {
      porPlato[plato] = 'mixto'
      frescos[plato] = alMomento
    } else if (r.preparar === 'antes') porPlato[plato] = 'taper'
  }
  return { porPlato, frescos }
}
