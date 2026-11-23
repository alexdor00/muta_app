import { describe, expect, it } from 'vitest'
import { FOTOS_DE_SERIE, repartirFotos, tipoDeSesion } from './sessionDefaultPhoto.ts'

describe('tipoDeSesion', () => {
  it('pierna, empuje o tirón cuando un grupo manda; brazos con la mitad de bíceps y tríceps', () => {
    expect(
      tipoDeSesion([
        { musculo: 'cuadriceps', series: 6 },
        { musculo: 'femoral', series: 3 },
        { musculo: 'pecho', series: 2 },
      ]),
    ).toBe('pierna')
    expect(
      tipoDeSesion([
        { musculo: 'pecho', series: 6 },
        { musculo: 'hombro_lat', series: 3 },
      ]),
    ).toBe('empuje')
    expect(
      tipoDeSesion([
        { musculo: 'dorsal', series: 6 },
        { musculo: 'espalda_alta', series: 3 },
      ]),
    ).toBe('tiron')
    expect(
      tipoDeSesion([
        { musculo: 'biceps', series: 4 },
        { musculo: 'triceps', series: 4 },
      ]),
    ).toBe('brazos')
  })

  it('mitad pierna y mitad espalda (o nada): cuerpo completo', () => {
    expect(
      tipoDeSesion([
        { musculo: 'cuadriceps', series: 5 },
        { musculo: 'dorsal', series: 5 },
      ]),
    ).toBe('completo')
    expect(tipoDeSesion([])).toBe('completo')
  })
})

describe('repartirFotos', () => {
  it('dos sesiones de pierna: una foto de pierna distinta para cada una', () => {
    const fotos = repartirFotos(
      [
        { sigla: 'A1', tipo: 'pierna' },
        { sigla: 'A2', tipo: 'pierna' },
      ],
      {},
      () => 0,
    )
    expect(new Set(Object.values(fotos))).toEqual(new Set(FOTOS_DE_SERIE.pierna))
  })

  it('las que ya tenían foto la conservan; sin foto libre de su tipo, otra libre', () => {
    const fotos = repartirFotos(
      [
        { sigla: 'A1', tipo: 'empuje' },
        { sigla: 'B1', tipo: 'empuje' },
      ],
      { A1: 'empuje' },
      () => 0,
    )
    expect(fotos.A1).toBe('empuje')
    expect(fotos.B1).not.toBe('empuje')
  })

  it('una foto guardada que ya no existe se vuelve a elegir', () => {
    expect(repartirFotos([{ sigla: 'A1', tipo: 'tiron' }], { A1: 's2' }, () => 0)).toEqual({ A1: 'tiron' })
  })
})
