/** Los días del ciclo en que va un menú, en palabras: «Días 1, 2 y 7», «Día 3» o «Ningún día». */
export function formatoDias(ciclo: readonly string[], menu: string): string {
  const dias = ciclo.flatMap((m, i) => (m === menu ? [i + 1] : []))
  if (!dias.length) return 'Ningún día'
  if (dias.length === 7) return 'Todos los días'
  if (dias.length === 1) return `Día ${dias[0]}`
  return `Días ${dias.slice(0, -1).join(', ')} y ${dias.at(-1)}`
}
