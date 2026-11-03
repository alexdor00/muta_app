import { describe, expect, it } from 'vitest'
import { CONSEJOS_ANTES, consejosDeSesion } from './sessionTips.ts'

describe('consejos de la sesión con el contenido real', () => {
  it('los 9 de antes de empezar, cada uno con su porqué y su fuente', () => {
    expect(CONSEJOS_ANTES).toHaveLength(9)
    expect(CONSEJOS_ANTES.filter((t) => !t.text || !t.why || !t.source)).toEqual([])
  })

  it('B1 (la captura del prototipo): es de empuje, la lateral por delante, el abdomen y el curl femoral con el rumano', () => {
    const tips = consejosDeSesion([
      { nombre: 'Peso muerto rumano', series: 3 },
      { nombre: 'Press inclinado con mancuernas', series: 3 },
      { nombre: 'Curl inclinado con mancuernas', series: 5 },
      { nombre: 'Curl femoral tumbado', series: 2 },
      { nombre: 'Curl predicador (Scott)', series: 4 },
      { nombre: 'Elevaciones laterales en polea', series: 5 },
      { nombre: 'Crunch en máquina', series: 2 },
    ])
    expect(tips.map((t) => t.text)).toEqual([
      'Hoy es de empuje: coloca la lateral en polea con el cable por delante del cuerpo.',
      'Pon el abdomen en un hueco que no compita, o en superserie con las laterales.',
      'Tienes curl femoral y bisagra: si la fatiga del curl hunde tu rumano o empeora su técnica, invierte el orden.',
    ])
    expect(tips[2].accion).toEqual({ tipo: 'invertir', a: 0, b: 3 })
  })

  it('los que no están en la biblioteca no cuentan, y las posiciones siguen siendo las de la lista', () => {
    const tips = consejosDeSesion([
      { nombre: 'Uno que no existe', series: 3 },
      { nombre: 'Peso muerto rumano', series: 3 },
      { nombre: 'Curl femoral tumbado', series: 2 },
    ])
    expect(tips.at(-1)?.accion).toEqual({ tipo: 'invertir', a: 1, b: 2 })
  })
})
