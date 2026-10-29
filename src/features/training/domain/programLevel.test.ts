import { describe, expect, it } from 'vitest'
import { levelFromSets, weeklySets } from './programLevel.ts'

const ex = (originalName: string, sets: number, kind: 'heavy' | 'compound' | 'isolation' = 'compound') => ({
  name: originalName,
  originalName,
  sets,
  kind,
  rpe: '9',
  percent1RM: null as string | null,
})

describe('nivel por series', () => {
  it('cuenta series directas por semana y escala ciclos más largos que la semana', () => {
    const week = {
      week: 1,
      days: [
        { name: 'Día 1', exercises: [ex('Bench Press', 3), ex('Incline DB Press', 3)] },
        { name: 'Día 2', exercises: [ex('Bench Press', 3)] },
      ],
    }
    expect(weeklySets(week, 2)).toEqual({ pecho: 9 })
    expect(weeklySets(week, 1)).toEqual({ pecho: 4.5 })
  })

  it('en programas por progresión cada grupo cuenta una vez', () => {
    const week = {
      week: 1,
      days: [
        {
          name: 'Día 1',
          exercises: [
            { ...ex('Braced Lunge', 2), group: 'LUNGE' },
            { ...ex('Bodyweight Lunge', 2), group: 'LUNGE' },
          ],
        },
      ],
    }
    expect(weeklySets(week, 1)).toEqual({ cuadriceps: 2 })
  })

  it('elige el nivel que deja menos series fuera de rango', () => {
    expect(levelFromSets({ pecho: 5, dorsal: 5, cuadriceps: 6 }).level).toBe('beginner')
    expect(levelFromSets({ pecho: 9, dorsal: 9, cuadriceps: 11, hombro_lat: 10 }).level).toBe('intermediate')
    expect(levelFromSets({ pecho: 12, dorsal: 11, cuadriceps: 14, hombro_lat: 14, triceps: 12 }).level).toBe(
      'advanced',
    )
  })

  it('una especialización (hasta 4 músculos) se mide con el rango de prioridad', () => {
    const fit = levelFromSets({ gluteo: 18, pecho: 8, dorsal: 8, cuadriceps: 10, hombro_lat: 9 })
    expect(fit.level).toBe('intermediate')
    expect(fit.perMuscle.find((m) => m.muscle === 'gluteo')!.priority.intermediate).toBe(true)
  })
})
