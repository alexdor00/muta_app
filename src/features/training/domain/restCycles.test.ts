import { describe, expect, it } from 'vitest'
import type { MuscleId } from './muscles.ts'
import { restPositions } from './restCycles.ts'

const empuje: MuscleId[] = ['pecho', 'hombro_ant', 'triceps']
const tiron: MuscleId[] = ['dorsal', 'biceps']
const torso: MuscleId[] = [...empuje, ...tiron]
const pierna: MuscleId[] = ['cuadriceps', 'femoral', 'gemelo']
const cuadriceps: MuscleId[] = ['cuadriceps']
const posterior: MuscleId[] = ['femoral', 'gluteo']
const cuerpo: MuscleId[] = [...torso, ...pierna]

describe('restPositions', () => {
  it('cuerpo completo cada día: descanso tras cada sesión', () => {
    expect(restPositions([cuerpo, cuerpo, cuerpo])).toEqual([1, 2, 3])
  })

  it('torso y pierna: tras cada pareja (A1, B1, descanso, A2, B2, descanso)', () => {
    expect(restPositions([pierna, torso, pierna, torso])).toEqual([2, 4])
  })

  it('empuje, tirón y pierna: tras cada vuelta (EA, TA, PA, descanso, EB, TB, PB, descanso)', () => {
    expect(restPositions([empuje, tiron, pierna, empuje, tiron, pierna])).toEqual([3, 6])
  })

  it('la pierna partida: parte de la pierna, torso y la otra parte de la pierna; ahí va el descanso', () => {
    expect(restPositions([cuadriceps, torso, posterior])).toEqual([3])
    // Y la vuelta siguiente empieza de cero
    expect(restPositions([cuadriceps, torso, posterior, cuadriceps, torso, posterior])).toEqual([3, 6])
  })

  it('no cuenta la parte de otra vuelta: sin la segunda parte de la pierna no está completo', () => {
    expect(restPositions([cuadriceps, torso, torso])).toEqual([3])
    expect(restPositions([cuadriceps, torso, cuadriceps, torso, posterior])).toEqual([5])
  })

  it('si la semana acaba a medias, un descanso al final', () => {
    expect(restPositions([pierna, torso, empuje])).toEqual([2, 3])
    expect(restPositions([empuje, tiron, empuje])).toEqual([3])
  })

  it('abdomen, gemelo y brazos sueltos no completan nada', () => {
    expect(restPositions([['core'], ['gemelo'], ['antebrazo']])).toEqual([3])
  })

  it('sin músculos reconocidos: solo el descanso del final', () => {
    expect(restPositions([[], [], []])).toEqual([3])
  })

  it('torso y pierna alternados en seis sesiones: tras cada pareja', () => {
    expect(restPositions([pierna, torso, pierna, torso, pierna, torso])).toEqual([2, 4, 6])
  })

  it('cuerpo completo en cinco sesiones: tras cada una', () => {
    expect(restPositions([cuerpo, cuerpo, cuerpo, cuerpo, cuerpo])).toEqual([1, 2, 3, 4, 5])
  })

  it('sin sesiones, nada', () => {
    expect(restPositions([])).toEqual([])
  })
})
