// Leer un CSV (rutinas y dietas): la fila de títulos y las demás, con el separador que traiga (; o ,), comillas dobles y
// sin la marca de orden de bytes que pone Excel. Lo usan Entreno (tu rutina) y Nutrición (tu dieta).
import { plainText } from './format.ts'

/** Una línea en celdas: separadas por `sep`; las comillas dobles agrupan (y "" es una comilla). */
function celdas(linea: string, sep: string): string[] {
  const out: string[] = []
  let actual = ''
  let comillas = false
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i]
    if (c === '"' && comillas && linea[i + 1] === '"') {
      actual += '"'
      i++
    } else if (c === '"') comillas = !comillas
    else if (c === sep && !comillas) {
      out.push(actual.trim())
      actual = ''
    } else actual += c
  }
  out.push(actual.trim())
  return out
}

/** La marca de orden de bytes que pone Excel al principio. */
const BOM = String.fromCharCode(0xfeff)

/** Un título o una celda para comparar: sin espacios de más, en minúsculas y sin tildes. */
export const limpioCsv = (s: string) => plainText(s.trim())

/** El CSV en filas de celdas: `titulos` (ya limpios) y `filas` (tal cual, con su número de fila en el archivo). */
export function leerCsv(texto: string): { titulos: string[]; filas: { fila: number; celdas: string[] }[] } {
  const lineas = (texto.startsWith(BOM) ? texto.slice(1) : texto).split(/\r?\n/)
  const conTexto = lineas.map((l, i) => ({ l, fila: i + 1 })).filter((x) => x.l.trim())
  if (!conTexto.length) return { titulos: [], filas: [] }
  const primera = conTexto[0].l
  const sep = (primera.match(/;/g)?.length ?? 0) >= (primera.match(/,/g)?.length ?? 0) ? ';' : ','
  return {
    titulos: celdas(primera, sep).map(limpioCsv),
    filas: conTexto.slice(1).map((x) => ({ fila: x.fila, celdas: celdas(x.l, sep) })),
  }
}

/** En qué columna está cada dato, por sus nombres posibles (−1 si no está). */
export function columnas<K extends string>(
  titulos: readonly string[],
  nombres: Readonly<Record<K, readonly string[]>>,
): Record<K, number> {
  return Object.fromEntries(
    Object.entries(nombres).map(([k, ns]) => [k, titulos.findIndex((t) => (ns as string[]).includes(t))]),
  ) as Record<K, number>
}
