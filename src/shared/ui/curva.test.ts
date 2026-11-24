import { describe, expect, it } from 'vitest'
import { curva } from './SessionProgress.tsx'

/** Los tramos de la curva: de dónde sale, sus dos puntos de control y adónde llega. */
function tramos(d: string) {
  const nums = (s: string) => s.split(/[ ,]/).filter(Boolean).map(Number)
  const [inicio, ...resto] = d.split(' C')
  let desde = nums(inicio.slice(1))
  return resto.map((t) => {
    const [c1x, c1y, c2x, c2y, x, y] = nums(t)
    const tramo = { desde, c1: [c1x, c1y], c2: [c2x, c2y], hasta: [x, y] }
    desde = [x, y]
    return tramo
  })
}

describe('curva de SessionProgress (el punto tocado cae sobre la línea)', () => {
  const xy = [
    [0, 70],
    [40, 72],
    [80, 50],
    [120, 55],
    [160, 20],
    [200, 60],
  ] as const

  it('pasa justo por cada punto', () => {
    const t = tramos(curva(xy))
    expect(t).toHaveLength(xy.length - 1)
    t.forEach((x, i) => {
      expect(x.desde).toEqual([...xy[i]])
      expect(x.hasta).toEqual([...xy[i + 1]])
    })
  })

  it('no se sale: cada tramo se queda entre sus dos puntos (sin picos ni valles de más)', () => {
    for (const x of tramos(curva(xy))) {
      const bajo = Math.min(x.desde[1], x.hasta[1]) - 1e-9
      const alto = Math.max(x.desde[1], x.hasta[1]) + 1e-9
      for (const c of [x.c1, x.c2]) {
        expect(c[1]).toBeGreaterThanOrEqual(bajo)
        expect(c[1]).toBeLessThanOrEqual(alto)
      }
    }
  })

  it('con menos de dos puntos, nada; con dos, una línea entre ellos', () => {
    expect(curva([])).toBe('')
    expect(curva([[0, 5]])).toBe('')
    const [t] = tramos(
      curva([
        [0, 10],
        [30, 40],
      ]),
    )
    expect(t.hasta).toEqual([30, 40])
  })
})
