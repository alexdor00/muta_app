import { enLista, type Partes } from '../../state/autopilot.ts'

/**
 * Lo que dejas hecho de un plato un día de cocina: «Todo hecho», «Solo el arroz» o «Lo fresco, al momento». Lo mismo en
 * «3 Cocina» y en el modo cocina (usuario, 2026-11-20).
 */
export function parteDelPlato(x: Partes): string {
  if (!x.luego.length) return 'Todo hecho'
  if (x.ahora.length > 2) return 'Lo fresco, al momento'
  const solo = enLista(x.ahora.map((s) => s.toLowerCase()))
  return `Solo ${solo}`
}
