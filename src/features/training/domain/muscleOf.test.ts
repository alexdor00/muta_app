import { describe, expect, it } from 'vitest'
import { muscleOf } from './muscleOf.ts'

describe('músculo de cada ejercicio', () => {
  it('resuelve los casos que se confunden por el orden', () => {
    expect(muscleOf({ name: 'Seated Leg Curl' })).toBe('femoral')
    expect(muscleOf({ name: 'Hammer Curl' })).toBe('biceps')
    expect(muscleOf({ name: 'Leg Press' })).toBe('cuadriceps')
    expect(muscleOf({ name: 'Leg Press Toe Press' })).toBe('gemelo')
    expect(muscleOf({ name: 'Reverse Pec Deck' })).toBe('hombro_post')
    expect(muscleOf({ name: 'Pec Deck' })).toBe('pecho')
    expect(muscleOf({ name: 'Cable Glute Kickback' })).toBe('gluteo')
    expect(muscleOf({ name: 'Cable Triceps Kickback' })).toBe('triceps')
    expect(muscleOf({ name: 'Close-Grip Bench Press' })).toBe('triceps')
    expect(muscleOf({ name: 'A1: Lat Pulldown' })).toBe('dorsal')
  })

  it('las rutinas de MUTA usan el músculo que traen', () => {
    expect(muscleOf({ name: 'Sentadilla hack', muscle: 'Cuádriceps' })).toBe('cuadriceps')
  })

  it('estiramientos y ejercicios a elegir no cuentan', () => {
    expect(muscleOf({ name: 'A2. Pec Static Stretch 30s' })).toBeNull()
    expect(muscleOf({ name: 'Weak Point Exercise 1' })).toBeNull()
  })
})
