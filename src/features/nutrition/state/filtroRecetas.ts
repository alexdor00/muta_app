// Filtrar recetas con lo que te falta hoy (rediseño, pantalla 29).
import { error } from '../domain/fit.ts'
import { filtrarPlatos, type FiltroRecetas, type Plato } from '../domain/recipes.ts'
import { ajustar, faltaDia, recetasGuardadas } from './recetas.ts'

export function recetasCon(platos: readonly Plato[], f: FiltroRecetas): Plato[] {
  const falta = faltaDia.value
  return filtrarPlatos(platos, f, {
    error: falta ? (p) => error(ajustar(p, falta).total, falta) : null,
    guardadas: recetasGuardadas.value,
  })
}

/** Cuántos filtros llevas puestos; otro orden que no sea de la A a la Z también cuenta (usuario, 2026-11-21). */
export const filtrosPuestos = (f: FiltroRecetas) =>
  [f.orden !== 'az', f.tiempo !== null, f.dificultad !== null, f.guardadas].filter(Boolean).length
