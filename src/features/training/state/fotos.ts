// Las fotos de las sesiones, listas para enseñar: las tuyas (A29–A30, sigla → imagen en memoria) y las de serie ya repartidas
// (sigla → ruta en `public/photos/sesiones`). Las carga y guarda use-cases/sessionPhotos.ts.
import { signal } from '@preact/signals'
import { rutaFotoDeSerie } from '../domain/sessionDefaultPhoto.ts'

export { FOTOS_DE_SERIE, rutaFotoDeSerie } from '../domain/sessionDefaultPhoto.ts'

export const fotosSesion = signal<Record<string, string>>({})
/** La foto de serie que le tocó a cada sesión (al azar según su tipo; se guarda y no cambia). */
export const fotosDeSerie = signal<Record<string, string>>({})

/**
 * La foto de fondo de una sesión: la tuya o, si no has puesto ninguna, la de serie que le tocó (usuario, 2026-11-14: siete
 * fotos repartidas por tipo de sesión; mientras se reparte, la de cuerpo completo).
 */
export function fotoDeTarjeta(sigla: string): string {
  return fotosSesion.value[sigla] ?? rutaFotoDeSerie(fotosDeSerie.value[sigla] ?? 'completo-1')
}

/** Dónde centras la foto de cada sesión, en % (x, y); sin tocar, el centro. */
export const encuadres = signal<Record<string, { x: number; y: number }>>({})

/** El encuadre de una sesión para `object-position` («50% 30%»). */
export function encuadreDe(sigla: string): string {
  const e = encuadres.value[sigla]
  return e ? `${e.x}% ${e.y}%` : '50% 50%'
}
