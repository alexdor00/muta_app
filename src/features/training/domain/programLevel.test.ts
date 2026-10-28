import { describe, expect, it } from 'vitest'
import { adaptToLevel } from './adaptVolume.ts'
import { muscleOf } from './muscleOf.ts'
import { rangeFor } from './muscles.ts'
import { levelFromSets, programLevel, weeklySets } from './programLevel.ts'

const ex = (originalName: string, sets: number, kind: 'heavy' | 'compound' | 'isolation' = 'compound') => ({
  name: originalName,
  originalName,
  sets,
  kind,
  rpe: '9',
  percent1RM: null,
})
const program = (days: ReturnType<typeof ex>[][]) => ({
  blocks: [{ weeks: [{ week: 1, days: days.map((exercises) => ({ exercises })) }] }],
})

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

describe('nivel por series', () => {
  it('rangos por nivel de docs/conocimiento', () => {
    expect(rangeFor('pecho', 'intermediate')).toEqual([6, 10])
    expect(rangeFor('pecho', 'beginner')).toEqual([4, 8])
    expect(rangeFor('pecho', 'advanced')).toEqual([6, 12])
    expect(rangeFor('core', 'beginner')).toEqual([4, 6])
    expect(rangeFor('hombro_ant', 'beginner')).toEqual([1, 6])
  })

  it('cuenta series directas por semana y escala ciclos más largos que la semana', () => {
    const week = {
      week: 1,
      days: [
        { exercises: [ex('Bench Press', 3), ex('Incline DB Press', 3)] },
        { exercises: [ex('Bench Press', 3)] },
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

describe('adaptar a un nivel', () => {
  const base = program([
    [ex('Bench Press', 4, 'heavy'), ex('Cable Fly', 4, 'isolation'), ex('Lat Pulldown', 3)],
    [ex('Incline DB Press', 4), ex('Seated Cable Row', 3), ex('Leg Press', 4)],
  ])

  it('principiante: baja cada músculo a su rango quitando primero aislamientos, y RPE 7/8', () => {
    expect(programLevel(base, 2).sets.pecho).toBe(12)
    const out = adaptToLevel(base, 'beginner', 2)
    // 12 series no es énfasis (no pasa de 10 + 2): baja al máximo de principiante (8)
    expect(programLevel(out, 2).sets.pecho).toBe(8)
    const day1 = out.blocks[0].weeks[0].days[0] as {
      exercises: { name: string; sets: unknown; rpe: unknown; original?: unknown }[]
    }
    expect(day1.exercises[0]).toMatchObject({ rpe: '7', original: { sets: 4, rpe: '9' } })
    expect(day1.exercises[1].sets).toBeLessThan(4)
    // La original no se toca
    expect((base.blocks[0].weeks[0].days[0] as { exercises: { sets: number }[] }).exercises[1].sets).toBe(4)
  })

  it('sube al mínimo añadiendo series y, si no caben, un ejercicio nuevo de 2 series', () => {
    const small = program([[ex('Lateral Raise', 5, 'isolation')], [ex('Bench Press', 3)]])
    const out = adaptToLevel(small, 'intermediate', 2)
    expect(programLevel(out, 2).sets.hombro_lat).toBeGreaterThanOrEqual(8)
    const added = out.blocks[0].weeks[0].days
      .flatMap((d) => ('exercises' in d ? d.exercises : []))
      .filter((e) => (e as { added?: boolean }).added)
    expect(added.length).toBeGreaterThan(0)
  })

  it('una rutina ya de tu nivel queda igual', () => {
    const fit = program([
      [ex('Bench Press', 4), ex('Lat Pulldown', 4)],
      [ex('Incline DB Press', 4), ex('Seated Cable Row', 4)],
    ])
    const out = adaptToLevel(fit, 'intermediate', 2)
    expect(programLevel(out, 2).sets).toEqual(programLevel(fit, 2).sets)
  })
})

describe('adaptar para mantener', () => {
  it('lleva cada músculo al rango «mantener» (los de énfasis se quedan en «desarrollar»)', () => {
    const p = program([
      [ex('Bench Press', 4, 'heavy'), ex('Incline DB Press', 4), ex('Lat Pulldown', 4)],
      [ex('Machine Chest Press', 3), ex('Seated Cable Row', 4), ex('Leg Press', 4)],
    ])
    const out = adaptToLevel(p, 'intermediate', 2, 'maintain')
    const sets = programLevel(out, 2).sets
    expect(sets.dorsal!).toBeLessThanOrEqual(4) // mantener dorsal 2–4
    expect(sets.cuadriceps!).toBeLessThanOrEqual(6) // mantener cuádriceps 4–6
  })
})
