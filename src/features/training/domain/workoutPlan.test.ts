import { describe, expect, it } from 'vitest'
import type { LibraryExercise } from './exerciseLibrary.ts'
import type { ProgramData } from './program.ts'
import {
  avisoTecnica,
  avanzar,
  desdeBiblioteca,
  kilosDeHoy,
  nombresDeSesiones,
  notaSugerido,
  pautaEnPrograma,
  rangoDe,
  descansoDe,
  dondeVas,
  ejercicioDelPlan,
  INICIO,
  repsDe,
  rirDe,
  seriesDe,
  sesionesDeSemana,
  tecnicaDe,
  letraSuperserie,
  mismoPeso,
  esTecnica,
  repsDeSerie,
  repsPorSerie,
  textoReps,
  siglaYNombre,
} from './workoutPlan.ts'

const hack: LibraryExercise = {
  id: 'sentadilla_hack',
  name: 'Sentadilla hack',
  primary: 'cuadriceps',
  contributes: { cuadriceps: 1, gluteo: 0.5, aductores: 0.25 },
  kind: 'compound',
  equipment: 'machine',
  pattern: 'rodilla',
  gyms: ['gym'],
  reps: [6, 10],
  rir: 2,
  restSec: 180,
  stepKg: 5,
  heavy: true,
  stable: true,
  key: '',
  source: '',
}

describe('leer la rutina', () => {
  it('sigla del nombre de MUTA o S y su puesto', () => {
    expect(siglaYNombre('A1 · Cuádriceps y espalda', 0)).toEqual({
      sigla: 'A1',
      nombre: 'Cuádriceps y espalda',
    })
    expect(siglaYNombre('Torso 1', 2)).toEqual({ sigla: 'S3', nombre: 'Torso 1' })
    expect(siglaYNombre('Cuerpo completo · pierna', 0)).toEqual({
      sigla: 'S1',
      nombre: 'Cuerpo completo · pierna',
    })
  })

  it('series, repeticiones, RIR y descanso en los formatos de los documentos', () => {
    expect([seriesDe(3), seriesDe('2-3'), seriesDe('2each'), seriesDe(null), seriesDe(0)]).toEqual([
      3,
      2,
      2,
      null,
      null,
    ])
    expect([repsDe('10-12 (dropset)'), repsDe('12'), repsDe('N/A'), repsDe(null)]).toEqual([
      '10–12 (dropset)',
      '12',
      null,
      null,
    ])
    expect([
      rirDe('8'),
      rirDe('RPE8'),
      rirDe('~9 → 10'),
      rirDe('9, 9, 10'),
      rirDe('7-8'),
      rirDe('N/A'),
    ]).toEqual([2, 2, 0, 0, 2, null])
    expect([descansoDe('~1-2 min'), descansoDe('2-3MIN'), descansoDe('30sec'), descansoDe('N/A')]).toEqual([
      90,
      150,
      30,
      null,
    ])
  })
})

describe('un ejercicio del plan', () => {
  it('lo que trae la rutina manda; lo que falta sale de la biblioteca', () => {
    const e = ejercicioDelPlan(
      { name: 'Sentadilla hack', sets: 3, reps: '6-10', rpe: '8', rest: null, substitutions: ['Prensa'] },
      hack,
    )
    expect(e).toMatchObject({
      nombre: 'Sentadilla hack',
      series: 3,
      reps: '6–10',
      rir: 2,
      descanso: 180,
      musculo: 'cuadriceps',
      secundarios: ['gluteo'],
      compuesto: true,
      salto: 5,
      sustitutos: ['Prensa'],
      sugeridos: [],
    })
  })

  it('lleva la explicación del documento de la rutina, si la trae', () => {
    expect(ejercicioDelPlan({ name: 'Press', tip: 'Codos a 45°.' }, null).explicacion).toBe('Codos a 45°.')
    expect(ejercicioDelPlan({ name: 'Press' }, null).explicacion).toBeUndefined()
  })

  it('sin biblioteca: músculo por el nombre y lo demás sugerido', () => {
    const e = ejercicioDelPlan(
      { name: 'Curl predicador', originalName: 'Preacher curl', kind: 'isolation' },
      null,
    )
    expect(e.musculo).toBe('biceps')
    expect(e.compuesto).toBe(false)
    expect(e).toMatchObject({ series: 3, reps: '8–12', rir: 2, descanso: 90, salto: 2.5 })
    expect(e.sugeridos).toEqual(['series', 'reps', 'rir', 'descanso', 'salto'])
  })
})

const programa: ProgramData = {
  blocks: [
    {
      weeks: [
        {
          week: 1,
          days: [
            {
              name: 'A1 · Pierna',
              exercises: [{ name: 'Sentadilla hack', sets: 3, reps: '6-10', rpe: '8' }],
            },
            { rest: true },
            {
              name: 'B1 · Torso',
              exercises: [
                { name: 'Press', sets: 3 },
                {
                  name: 'Opcional',
                  sets: 2,
                  slot: { kind: 'optional', key: 'k', off: true, why: null, options: [], chosen: null },
                },
                { name: 'Quitado', sets: 2, removed: true },
                { name: 'Nivel 1', sets: 2, group: 'g' },
                { name: 'Nivel 2', sets: 2, group: 'g' },
              ],
            },
          ],
        },
        { week: 2, days: [{ name: 'A1 · Pierna', exercises: [] }] },
      ],
    },
    { weeks: [{ week: 1, days: [{ name: 'Fase 2', exercises: [] }] }] },
  ],
}

describe('la semana y la rotación', () => {
  it('las sesiones de la semana, sin descansos, quitados, apagados ni otros niveles', () => {
    const s = sesionesDeSemana(programa, INICIO, (n) => (n === 'Sentadilla hack' ? hack : null))
    expect(s.map((x) => x.sigla)).toEqual(['A1', 'B1'])
    expect(s[1].ejercicios.map((e) => e.nombre)).toEqual(['Press', 'Nivel 1'])
    expect(s[0].minutos).toBeGreaterThan(0)
  })

  it('avanza a la siguiente sesión, a la semana siguiente al completarla, a la fase siguiente y vuelve a empezar', () => {
    expect(avanzar(programa, INICIO, 0)).toEqual({ bloque: 0, semana: 0, siguiente: 1 })
    expect(avanzar(programa, INICIO, 1)).toEqual({ bloque: 0, semana: 1, siguiente: 0 })
    expect(avanzar(programa, { bloque: 0, semana: 1, siguiente: 0 }, 0)).toEqual({
      bloque: 1,
      semana: 0,
      siguiente: 0,
    })
    expect(avanzar(programa, { bloque: 1, semana: 0, siguiente: 0 }, 0)).toEqual(INICIO)
  })

  it('dónde vas', () => {
    expect(dondeVas(programa, { bloque: 0, semana: 1, siguiente: 0 })).toBe('Fase 1 · semana 2 de 2')
    expect(dondeVas({ blocks: [programa.blocks[0]] }, INICIO)).toBe('Semana 1 de 2')
  })
})

describe('lo que toca hoy', () => {
  it('rango de repeticiones', () => {
    expect([rangoDe('6–10'), rangoDe('12'), rangoDe('10–12 (dropset)'), rangoDe('AMRAP')]).toEqual([
      [6, 10],
      [12, 12],
      [10, 12],
      null,
    ])
  })

  it('el motor sube el peso desde la última vez y, la primera vez, no hay kilos', () => {
    const e = { ...desdeBiblioteca(hack), ultima: [{ kg: 100, reps: 10 }] }
    expect(kilosDeHoy(e)).toBe(105)
    expect(kilosDeHoy(desdeBiblioteca(hack))).toBeNull()
  })

  it('un ejercicio de la biblioteca para hoy: 3 series y lo de la biblioteca', () => {
    expect(desdeBiblioteca(hack)).toMatchObject({
      series: 3,
      reps: '6–10',
      rir: 2,
      descanso: 180,
      salto: 5,
      sustitutos: [],
    })
  })
})

describe('lo sugerido, a la vista', () => {
  it('dice lo que no viene de la rutina, con su valor; nada si todo viene de ella o de la biblioteca', () => {
    const sinNada = ejercicioDelPlan(
      { name: 'Curl predicador', originalName: 'Preacher curl', kind: 'isolation' },
      null,
    )
    expect(notaSugerido(sinNada)).toBe(
      'Sugerido, no lo dice la rutina: 3 series, 8–12 reps, RIR 2, descanso 1:30, salto de 2,5 kg',
    )
    const soloSalto = ejercicioDelPlan(
      { name: 'Curl predicador', sets: 2, reps: '10-15', rpe: '9', rest: '~1-2 min' },
      null,
    )
    expect(notaSugerido(soloSalto)).toBe('Sugerido, no lo dice la rutina: salto de 2,5 kg')
    expect(notaSugerido(desdeBiblioteca(hack))).toBeNull()
  })
})

describe('lo que cambias en tu plan', () => {
  it('el nuevo ejercicio con la pauta de la rutina y a cuál sustituye', () => {
    const [a1] = sesionesDeSemana(programa, INICIO, (n) => (n === 'Sentadilla hack' ? hack : null), {
      'Sentadilla hack': 'Prensa rara',
    })
    expect(a1.ejercicios[0]).toMatchObject({
      nombre: 'Prensa rara',
      series: 3,
      reps: '6–10',
      rir: 2,
      enLugarDe: 'Sentadilla hack',
    })
    const [sin] = sesionesDeSemana(programa, INICIO, () => null)
    expect(sin.ejercicios[0].enLugarDe).toBeUndefined()
  })
})

describe('nombresDeSesiones', () => {
  it('cada sesión por su nombre; si dos se llaman igual, con su número', () => {
    const lista = [
      { sigla: 'S1', nombre: 'Torso' },
      { sigla: 'S2', nombre: 'Pierna' },
      { sigla: 'S3', nombre: 'Torso' },
    ]
    expect(nombresDeSesiones(lista)).toEqual({ S1: 'Torso 1', S2: 'Pierna', S3: 'Torso 2' })
  })
})

describe('pautaEnPrograma', () => {
  const prog = (reps: (string | null)[]): ProgramData => ({
    blocks: [
      {
        weeks: reps.map((r, i) => ({
          week: i + 1,
          days: [
            {
              name: 'A',
              exercises: [
                { name: 'Aperturas', reps: r, rpe: '9' },
                { name: 'Press', reps: '5' },
              ],
            },
          ],
        })),
      },
    ],
  })
  it('las repeticiones y el esfuerzo que más se repiten en todas las semanas', () => {
    expect(pautaEnPrograma(prog(['8-12', '12-15', '12-15']), (n) => n === 'Aperturas')).toEqual({
      reps: [12, 15],
      rir: 1,
    })
  })
  it('null si la rutina no lo lleva o no dice repeticiones', () => {
    expect(pautaEnPrograma(prog(['8-12']), (n) => n === 'Remo')).toBeNull()
    expect(pautaEnPrograma(prog([null]), (n) => n === 'Aperturas')).toBeNull()
  })
})

describe('tecnicaDe', () => {
  it('dropset, mecánico, rest-pause (myo-reps, cluster) y parciales, por la técnica, el nombre, las repeticiones o la explicación', () => {
    expect(tecnicaDe({ name: 'Laterales', technique: 'Dropset' })).toBe('dropset')
    expect(tecnicaDe({ name: 'Pájaros en polea (dropset mecánico)' })).toBe('mecanico')
    expect(tecnicaDe({ name: 'Pájaros', technique: 'Mechanical Dropset (on all sets)' })).toBe('mecanico')
    expect(tecnicaDe({ name: 'Curl', reps: '12-15 (dropset)' })).toBe('dropset')
    expect(tecnicaDe({ name: 'Curl', technique: 'Myo-reps' })).toBe('pausa')
    expect(tecnicaDe({ name: 'Press', tip: 'Haz un rest-pause en la última serie' })).toBe('pausa')
    expect(tecnicaDe({ name: 'Dominada', notes: '6 cluster sets: 3 reps, rest 15s' })).toBe('pausa')
    expect(tecnicaDe({ name: 'Curl', technique: 'Lengthened Partials (Extend Set)' })).toBe('parciales')
    expect(tecnicaDe({ name: 'Curl', technique: 'Parciales en estiramiento' })).toBe('parciales')
    expect(tecnicaDe({ name: 'Sentadilla', reps: '5', technique: 'Fallo' })).toBeNull()
    // Los parciales integrados van dentro de cada repetición: nada que apuntar aparte
    expect(tecnicaDe({ name: 'Curl', technique: 'Integrated Partials (All Sets)' })).toBeNull()
    // «Serie de descarga» no es un dropset
    expect(tecnicaDe({ name: 'Serie de descarga: Sentadilla' })).toBeNull()
  })
})

describe('mismoPeso y esTecnica', () => {
  it('solo el dropset baja el peso', () => {
    expect(mismoPeso('dropset')).toBe(false)
    expect(mismoPeso('pausa')).toBe(true)
    expect(mismoPeso('parciales')).toBe(true)
    expect(mismoPeso(null)).toBe(false)
  })

  it('esTecnica reconoce lo elegido en el desplegable', () => {
    expect(esTecnica('parciales')).toBe(true)
    expect(esTecnica('ninguna')).toBe(false)
    expect(esTecnica('toString')).toBe(false)
  })
})

describe('cada serie distinta y superserie (A14)', () => {
  it('repeticiones serie a serie: la lista, el rango de todas y el de cada serie', () => {
    expect(repsPorSerie('4, 6, 8')).toEqual(['4', '6', '8'])
    expect(repsPorSerie('5,4,3+')).toEqual(['5', '4', '3'])
    expect(repsPorSerie('8-12')).toBeNull()
    const e = ejercicioDelPlan({ name: 'Sentadilla hack', sets: 3, reps: '4, 6, 8' }, null)
    expect([e.reps, e.repsSerie, textoReps(e)]).toEqual(['4–8', ['4', '6', '8'], '4 · 6 · 8'])
    expect([repsDeSerie(e, 0), repsDeSerie(e, 2), repsDeSerie(e, 5)]).toEqual(['4', '8', '8'])
  })
  it('la letra de la superserie, por el nombre de la rutina', () => {
    expect(letraSuperserie('A1: Press francés')).toBe('A')
    expect(letraSuperserie('Superserie + B2: Curl')).toBe('B')
    expect(letraSuperserie('Press francés')).toBeNull()
    expect(ejercicioDelPlan({ name: 'A2: Curl con barra Z' }, null).superserie).toBe('A')
  })
})

describe('avisoTecnica', () => {
  it('solo con técnica y en definición', () => {
    expect(avisoTecnica({ tecnica: 'dropset' }, true)).toContain('serie recta')
    expect(avisoTecnica({ tecnica: 'dropset' }, false)).toBeNull()
    expect(avisoTecnica({}, true)).toBeNull()
  })
})
