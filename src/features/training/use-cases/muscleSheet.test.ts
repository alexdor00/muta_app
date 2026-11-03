import { describe, expect, it } from 'vitest'
import { consejosDeMusculo, huecosDelPlan } from './muscleSheet.ts'

describe('ficha del músculo con el contenido real', () => {
  it('cada músculo trae su clave; el glúteo, sus 9 consejos y dónde ponerlo', () => {
    const g = consejosDeMusculo('gluteo')
    expect(g?.key).toMatch(/^Piensa en patrones/)
    expect(g?.tips).toHaveLength(9)
    expect(g?.where).toBeTruthy()
    expect(consejosDeMusculo('cuello')?.tips).toEqual([])
  })

  it('el plan se une con la biblioteca por el nombre; si no está, cuenta para su músculo, y si no se sabe, no cuenta', () => {
    const huecos = huecosDelPlan([
      {
        sigla: 'B1',
        ejercicios: [
          { nombre: 'Peso muerto rumano', series: 3 },
          { nombre: 'No existe', series: 2 },
          { nombre: 'Curl predicador', series: 4, musculo: 'biceps' },
        ],
      },
    ])
    expect(huecos).toEqual([
      {
        id: 'peso_muerto_rumano',
        sigla: 'B1',
        nombre: 'Peso muerto rumano',
        series: 3,
        contributes: expect.objectContaining({ femoral: 1 }),
      },
      { id: null, sigla: 'B1', nombre: 'Curl predicador', series: 4, contributes: { biceps: 1 } },
    ])
  })
})
