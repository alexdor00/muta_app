import { describe, expect, it } from 'vitest'
import { categorize } from './categories.ts'
import {
  equipmentOf,
  infoOf,
  restMinutes,
  selectVariant,
  sessionMinutes,
  splitOf,
  volumeTier,
  type ProgramData,
} from './programInfo.ts'

const ex = (originalName: string, sets: number, extra: Record<string, unknown> = {}) => ({
  name: originalName,
  originalName,
  sets,
  rest: '~2 min',
  ...extra,
})
const week = (days: { name: string; exercises: ReturnType<typeof ex>[] }[]) => ({ week: 1, days })
const program = (...days: { name: string; exercises: ReturnType<typeof ex>[] }[]): ProgramData => ({
  blocks: [{ title: null, weeks: [week(days)] }],
})

describe('hechos de una rutina', () => {
  it('descanso en minutos desde el texto del archivo', () => {
    expect(restMinutes('~2-3 min')).toBe(2.5)
    expect(restMinutes('30sec')).toBe(0.5)
    expect(restMinutes('3.0 min')).toBe(3)
    expect(restMinutes(null, 'isolation')).toBe(1.5)
  })

  it('duración: Σ series × (descanso + 45 s) + 8 min, más las series de aproximación', () => {
    expect(sessionMinutes([ex('Bench Press', 3), ex('Lat Pulldown', 3)])).toBe(6 * 2.75 + 8)
    expect(sessionMinutes([ex('Bench Press', 3, { warmupSets: '2-3' })])).toBe(3 * 2.75 + 2.5 + 8)
  })

  it('reparto según las sesiones, también las de MUTA que se llaman por músculos', () => {
    expect(
      splitOf(program({ name: 'Empuje #1', exercises: [] }, { name: 'Tirón #1', exercises: [] })).split,
    ).toBe('ppl')
    expect(
      splitOf(program({ name: 'Torso #1', exercises: [] }, { name: 'Pierna #1', exercises: [] })).split,
    ).toBe('torso-pierna')
    expect(splitOf(program({ name: 'A1 · Cuádriceps y espalda', exercises: [] })).split).toBe(
      'cuerpo-completo',
    )
    expect(
      splitOf(program({ name: 'Empuje #1', exercises: [] }, { name: 'Torso #1', exercises: [] })).label,
    ).toBe('Empuje, tirón y pierna + torso y pierna')
  })

  it('material: casa sin barras ni máquinas; el curl deslizante con toalla es de casa', () => {
    expect(
      equipmentOf(program({ name: 'x', exercises: [ex('Sliding Leg Curl', 3), ex('Push-Up', 3)] })),
    ).toBe('home')
    expect(equipmentOf(program({ name: 'x', exercises: [ex('Barbell Bench Press', 3)] }))).toBe('gym')
    expect(equipmentOf(program({ name: 'x', exercises: [ex('Sentadilla hack', 3)] }))).toBe('gym')
  })

  it('volumen: bajo, medio o alto frente a «desarrollar» intermedio', () => {
    expect(volumeTier({ pecho: 3, dorsal: 3, cuadriceps: 3 }).tier).toBe('bajo')
    expect(volumeTier({ pecho: 8, dorsal: 7, cuadriceps: 10 }).tier).toBe('medio')
    expect(volumeTier({ pecho: 14, dorsal: 12, cuadriceps: 16 }).tier).toBe('alto')
  })

  it('variante: bloques y sesiones que le tocan de un archivo con varias rutinas', () => {
    const p: ProgramData = {
      blocks: [
        {
          title: 'A',
          weeks: [
            week([
              { name: 'Sesión 1', exercises: [] },
              { name: 'Cuerpo completo #1 mancuernas', exercises: [] },
            ]),
          ],
        },
        { title: 'B', weeks: [week([{ name: 'Pierna #1', exercises: [] }])] },
      ],
    }
    const v = selectVariant(p, { blocks: [0], sessions: '^Sesión' })
    expect(v.blocks).toHaveLength(1)
    expect(v.blocks[0].weeks[0].days.map((d) => ('name' in d ? d.name : 'D'))).toEqual(['Sesión 1'])
  })
})

describe('tipos de entrenamiento', () => {
  const gymHyp = program(
    {
      name: 'Cuerpo completo #1',
      exercises: [ex('Barbell Bench Press', 3), ex('Lat Pulldown', 3), ex('Leg Press', 3)],
    },
    {
      name: 'Cuerpo completo #2',
      exercises: [ex('Incline DB Press', 3), ex('Seated Cable Row', 3), ex('Hack Squat', 3)],
    },
  )

  it('hipertrofia: gimnasio, sin porcentajes ni especialización', () => {
    expect(categorize(infoOf(gymHyp, 2))).toEqual(['hipertrofia'])
  })

  it('fuerza: al menos un 12 % de las series por %1RM', () => {
    const strong = program({
      name: 'Cuerpo completo #1',
      exercises: [ex('Back Squat', 4, { percent1RM: '75 %' }), ex('Lat Pulldown', 3), ex('Leg Press', 3)],
    })
    expect(categorize(infoOf(strong, 3))).toContain('fuerza')
  })

  it('minimalista: ≤ 2 series por ejercicio y ≤ 50 min', () => {
    const minimal = program({
      name: 'Cuerpo completo',
      exercises: [ex('Hack Squat', 2), ex('Barbell Bench Press', 1)],
    })
    expect(categorize(infoOf(minimal, 2))).toEqual(['minimalista'])
  })

  it('en casa y primeros pasos (curada)', () => {
    const home = program({ name: 'Sesión 1', exercises: [ex('Push-Up', 3), ex('Bodyweight Squat', 3)] })
    expect(categorize(infoOf(home, 3), { foundation: true })).toEqual(['casa', 'primeros-pasos'])
  })

  it('glúteo y pierna: el glúteo es músculo prioritario', () => {
    const glute = program(
      {
        name: 'Pierna #1',
        exercises: [
          ex('Barbell Hip Thrust', 4),
          ex('Cable Glute Kickback', 4),
          ex('Machine Hip Abduction', 4),
        ],
      },
      { name: 'Pierna #2', exercises: [ex('Barbell Hip Thrust', 4), ex('Cable Pull-Through', 4)] },
      { name: 'Torso #1', exercises: [ex('Lat Pulldown', 3), ex('Machine Chest Press', 3)] },
    )
    expect(categorize(infoOf(glute, 3))).toContain('gluteo')
  })
})
