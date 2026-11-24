import { describe, expect, it } from 'vitest'
import {
  historialDe,
  progresoDeSesion,
  semanaDe,
  seriesPorMusculo,
  ultimaVez,
  unificarNombres,
  type Entreno,
} from './workoutHistory.ts'
import type { SesionPlan } from './workoutPlan.ts'

const entreno = (fecha: string, sigla: string, kg: number, puesto = 1): Entreno => ({
  id: fecha,
  fecha,
  inicio: Date.parse(`${fecha}T18:00:00Z`),
  segundos: 3600,
  sigla,
  nombre: sigla,
  programId: 'p',
  ejercicios: [
    {
      nombre: 'Prensa',
      musculo: 'cuadriceps',
      puesto,
      series: [
        { kg, reps: 10 },
        { kg, reps: 8 },
      ],
    },
  ],
})

// Lunes 26 y martes 27 de octubre de 2026
const ENTRENOS = [
  entreno('2026-10-27', 'B1', 105, 2),
  entreno('2026-10-20', 'A1', 100),
  entreno('2026-10-26', 'A1', 102.5),
]

describe('historial', () => {
  it('la última vez de un ejercicio y cada vez que se hizo, en orden', () => {
    expect(ultimaVez(ENTRENOS, 'Prensa')).toEqual([
      { kg: 105, reps: 10 },
      { kg: 105, reps: 8 },
    ])
    expect(ultimaVez(ENTRENOS, 'Otro')).toEqual([])
    expect(historialDe(ENTRENOS, 'Prensa').map((v) => [v.fecha, v.puesto])).toEqual([
      ['2026-10-20', 1],
      ['2026-10-26', 1],
      ['2026-10-27', 2],
    ])
  })

  it('el progreso de una sesión: toneladas, repeticiones y minutos', () => {
    expect(progresoDeSesion(ENTRENOS, 'A1')).toEqual([
      { fecha: '2026-10-20', toneladas: 1.8, reps: 18, minutos: 60 },
      { fecha: '2026-10-26', toneladas: 1.8, reps: 18, minutos: 60 },
    ])
  })
})

describe('tu semana', () => {
  it('sin plan: lo hecho, lo pasado sin entrenar como descanso y lo que falta vacío', () => {
    const semana = semanaDe(ENTRENOS.slice(1), '2026-10-28')
    expect(semana.map((d) => [d.letra, d.dia, d.sigla, d.estado])).toEqual([
      ['L', 26, 'A1', 'hecho'],
      ['M', 27, '', 'descanso'],
      ['X', 28, '', 'hoy'],
      ['J', 29, '', 'pendiente'],
      ['V', 30, '', 'pendiente'],
      ['S', 31, '', 'pendiente'],
      ['D', 1, '', 'pendiente'],
    ])
  })

  it('con tu plan: desde hoy, las sesiones en su orden con sus descansos detrás', () => {
    // A1 · B1 · descanso · A2 · B2 · descanso; hecha A1 el lunes, hoy (miércoles) toca B1
    const plan = { orden: ['A1', 'B1', 'A2', 'B2'], siguiente: 1, tras: [2, 4], pendientes: 0 }
    expect(semanaDe(ENTRENOS.slice(1), '2026-10-28', plan).map((d) => [d.letra, d.sigla, d.estado])).toEqual([
      ['L', 'A1', 'hecho'],
      ['M', '', 'descanso'],
      ['X', 'B1', 'hoy'],
      ['J', '', 'descanso'],
      ['V', 'A2', 'pendiente'],
      ['S', 'B2', 'pendiente'],
      ['D', '', 'descanso'],
    ])
  })

  it('si hoy toca descanso, hoy es descanso y la sesión que toca va después', () => {
    const plan = { orden: ['A1', 'B1'], siguiente: 1, tras: [2], pendientes: 1 }
    expect(
      semanaDe([], '2026-10-28', plan)
        .slice(2, 5)
        .map((d) => [d.sigla, d.estado]),
    ).toEqual([
      ['', 'descanso'],
      ['B1', 'pendiente'],
      ['', 'descanso'],
    ])
  })

  it('series por músculo: hoy lo que toca y la semana lo hecho más lo de hoy', () => {
    const toca: SesionPlan = {
      sigla: 'B1',
      nombre: 'B1',
      minutos: 60,
      ejercicios: [
        { nombre: 'Press', series: 3, musculo: 'pecho' },
        { nombre: '¿?', series: 2, musculo: null },
      ] as SesionPlan['ejercicios'],
    }
    expect(seriesPorMusculo(ENTRENOS.slice(1), '2026-10-28', toca)).toEqual({
      hoy: { pecho: 3 },
      semana: { cuadriceps: 2, pecho: 3 },
    })
    // Ya entrenaste hoy: cuenta lo hecho, no lo que tocaba
    expect(seriesPorMusculo(ENTRENOS, '2026-10-27', toca).hoy).toEqual({ cuadriceps: 2 })
  })
})

describe('el mismo ejercicio con otro nombre (usuario, 2026-11-23)', () => {
  // «A1: Press banca» y «Press banca con barra» son el mismo de la biblioteca; la serie de descarga, también
  const clave = (n: string) => (/press banca/i.test(n) ? 'press_banca' : n)
  const con = (fecha: string, programId: string, ejercicios: [string, number][]): Entreno => ({
    id: `${fecha}-${programId}`,
    fecha,
    inicio: Date.parse(`${fecha}T18:00:00Z`),
    segundos: 3600,
    sigla: 'A1',
    nombre: 'Torso',
    programId,
    ejercicios: ejercicios.map(([nombre, kg], i) => ({
      nombre,
      musculo: 'pecho',
      puesto: i + 1,
      series: [{ kg, reps: 8 }],
    })),
  })
  const lista = [
    con('2026-01-05', 'vieja', [['Press banca con barra', 80]]),
    con('2026-03-02', 'nueva', [
      ['Serie top: Press banca', 90],
      ['Press banca (serie de descarga)', 70],
    ]),
  ]

  it('al cambiar de rutina, la vez anterior sale de la otra aunque se llame distinto', () => {
    expect(ultimaVez(lista.slice(0, 1), 'A1: Press banca', clave)).toEqual([{ kg: 80, reps: 8 }])
  })

  it('pero si ya lo hiciste con su nombre exacto, manda ese: la serie top no toma la de descarga', () => {
    expect(ultimaVez(lista, 'Serie top: Press banca', clave)).toEqual([{ kg: 90, reps: 8 }])
    expect(ultimaVez(lista, 'Press banca (serie de descarga)', clave)).toEqual([{ kg: 70, reps: 8 }])
  })

  it('la ficha (todo): cada día con todas sus variantes juntas', () => {
    const h = historialDe(lista, 'Press banca', clave, true)
    expect(h.map((v) => [v.fecha, v.series.length])).toEqual([
      ['2026-01-05', 1],
      ['2026-03-02', 2],
    ])
  })

  it('Progreso: un solo nombre por ejercicio, el de la biblioteca (y, sin él, el último que usaste)', () => {
    const u = unificarNombres(lista, clave, (k) => (k === 'press_banca' ? 'Press banca' : null))
    expect(u.flatMap((x) => x.ejercicios.map((e) => e.nombre))).toEqual([
      'Press banca',
      'Press banca',
      'Press banca',
    ])
    const sinBiblioteca = unificarNombres(lista, clave)
    expect(sinBiblioteca[0].ejercicios[0].nombre).toBe('Press banca (serie de descarga)')
  })

  it('la gráfica de una sesión, por rutina: la A1 de otra rutina no se mezcla', () => {
    expect(progresoDeSesion(lista, 'A1').length).toBe(2)
    expect(progresoDeSesion(lista, 'A1', 'nueva').length).toBe(1)
  })
})
