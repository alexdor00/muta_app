import { describe, expect, it } from 'vitest'
import { adaptToLevel, volumeChange } from './adaptVolume.ts'
import { programLevel } from './programLevel.ts'

const ex = (originalName: string, sets: number, kind: 'heavy' | 'compound' | 'isolation' = 'compound') => ({
  name: originalName,
  originalName,
  sets,
  kind,
  rpe: '9',
  percent1RM: null as string | null,
})
const program = (days: ReturnType<typeof ex>[][]) => ({
  blocks: [{ weeks: [{ week: 1, days: days.map((exercises, i) => ({ name: `Día ${i + 1}`, exercises })) }] }],
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

describe('rutinas especiales', () => {
  it('los básicos por %1RM no se tocan; solo los accesorios', () => {
    const p = program([
      [
        { ...ex('Back Squat', 5, 'heavy'), percent1RM: '80 %' },
        ex('Leg Press', 4),
        ex('Leg Extension', 4, 'isolation'),
      ],
      [{ ...ex('Back Squat', 5, 'heavy'), percent1RM: '75 %' }, ex('Hack Squat', 4)],
    ])
    const out = adaptToLevel(p, 'beginner', 2)
    const day = out.blocks[0].weeks[0].days[0] as {
      exercises: { sets: unknown; percent1RM: string | null }[]
    }
    expect(day.exercises[0].sets).toBe(5)
    expect(day.exercises.slice(1).some((e) => e.sets !== 4)).toBe(true)
  })

  it('conserva las olas de volumen: la semana de descarga sigue siendo más ligera', () => {
    const week = (n: number, sets: number) => ({
      week: n,
      days: [
        {
          name: 'Día 1',
          exercises: [
            ex('Bench Press', sets),
            ex('Incline DB Press', sets),
            ex('Cable Fly', sets, 'isolation'),
          ],
        },
      ],
    })
    const p = { blocks: [{ weeks: [week(1, 4), week(2, 4), week(3, 4), week(4, 2)] }] }
    const out = adaptToLevel(p, 'beginner', 1)
    const total = (i: number) =>
      (out.blocks[0].weeks[i].days[0] as { exercises: { sets: number }[] }).exercises.reduce(
        (n, e) => n + e.sets,
        0,
      )
    expect(total(3)).toBeLessThan(total(0))
  })
})

describe('cambio de volumen', () => {
  it('enseña solo los músculos cuyas series han cambiado', () => {
    const original = program([[ex('Bench Press', 4), ex('Cable Fly', 4, 'isolation'), ex('Lat Pulldown', 3)]])
    const same = volumeChange(original, original, 1)
    expect(same).toEqual([])
    const adapted = adaptToLevel(original, 'beginner', 1)
    const changes = volumeChange(original, adapted, 1)
    expect(changes.length).toBeGreaterThan(0)
    for (const c of changes) expect(c.before).not.toBe(c.after)
  })
})
