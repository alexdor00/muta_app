import { describe, expect, it } from 'vitest'
import {
  anadir,
  aplicarEdicion,
  cambiarPauta,
  claveDe,
  mover,
  pautaDe,
  quitar,
  superserieDe,
  superseries,
  unirEnSuperserie,
} from './routineEdit.ts'
import { ejercicioDelPlan, type EjercicioPlan, type SesionPlan } from './workoutPlan.ts'

const ej = (name: string, sets = 3, reps = '8-12', rpe = '8') =>
  ejercicioDelPlan({ name, sets, reps, rpe, rest: '~2 min' }, null)
const B1: SesionPlan = {
  sigla: 'B1',
  nombre: 'Torso',
  minutos: 40,
  ejercicios: [ej('Press'), ej('Remo'), ej('Curl', 2, '10-15', '9')],
}
const nombres = (s: SesionPlan) => s.ejercicios.map((e) => e.nombre)

describe('aplicarEdicion', () => {
  it('sin ediciones, la sesión tal cual', () => {
    expect(aplicarEdicion(B1, undefined, () => null)).toBe(B1)
  })

  it('quita, añade detrás, cambia la pauta y ordena', () => {
    let ed = quitar({}, 'Remo')
    ed = anadir(ed, { nombre: 'Face pull', series: 3, reps: [12, 15], rir: 1, descanso: 90 }, nombres(B1))
    ed = cambiarPauta(ed, 'Press', { series: 4, reps: [6, 8], rir: 1, salto: 2.5, nota: 'Agarre cerrado' })
    const s1 = aplicarEdicion(B1, ed, () => null)
    expect(nombres(s1)).toEqual(['Press', 'Curl', 'Face pull'])
    expect(s1.ejercicios[0]).toMatchObject({
      series: 4,
      reps: '6–8',
      rir: 1,
      salto: 2.5,
      nota: 'Agarre cerrado',
    })
    expect(s1.ejercicios[2]).toMatchObject({ series: 3, reps: '12–15', rir: 1, descanso: 90, anadido: true })
    const s2 = aplicarEdicion(B1, mover(ed, s1.ejercicios, 2, 0), () => null)
    expect(nombres(s2)).toEqual(['Face pull', 'Press', 'Curl'])
    expect(s2.minutos).toBeGreaterThan(0)
  })

  it('la técnica de intensidad: la pones a cualquier ejercicio o quitas la de la rutina', () => {
    const conDropset = aplicarEdicion(B1, cambiarPauta({}, 'Curl', { tecnica: 'dropset' }), () => null)
    expect(conDropset.ejercicios[2].tecnica).toBe('dropset')
    const curl = { ...ej('Curl'), tecnica: 'pausa' as const }
    const sin = aplicarEdicion(
      { ...B1, ejercicios: [curl] },
      cambiarPauta({}, 'Curl', { tecnica: null }),
      () => null,
    )
    expect(sin.ejercicios[0].tecnica).toBeUndefined()
  })

  it('quitar un añadido lo borra de los añadidos; añadir uno que ya está no lo repite', () => {
    const ed = anadir({}, { nombre: 'Face pull', series: 3, reps: [12, 15], rir: 1, descanso: 90 }, [])
    expect(quitar(ed, 'Face pull').anadidos).toEqual([])
    expect(
      anadir({}, { nombre: 'Press', series: 3, reps: [8, 12], rir: 2, descanso: 120 }, nombres(B1)),
    ).toEqual({})
  })

  it('un ejercicio cambiado por otro se reconoce por el de la rutina', () => {
    expect(claveDe({ nombre: 'Prensa', enLugarDe: 'Sentadilla hack' })).toBe('Sentadilla hack')
    expect(claveDe({ nombre: 'Prensa' })).toBe('Prensa')
  })

  it('la pauta de un ejercicio, para editarla', () => {
    expect(pautaDe(B1.ejercicios[2])).toEqual({ series: 2, reps: [10, 15], rir: 1, salto: 2.5, nota: '' })
  })
})

describe('superseries', () => {
  const de = (nombre: string, extra: Partial<EjercicioPlan> = {}) =>
    ({ ...ejercicioDelPlan({ name: nombre }, null), ...extra }) as EjercicioPlan
  it('A1 y A2 seguidos, unidos; los demás, solos', () => {
    const lista = [de('Sentadilla'), de('A1: Press francés'), de('A2: Curl'), de('Gemelo')]
    expect(superseries(lista)).toEqual([null, [1, 2], [1, 2], null])
  })
  it('lo que eliges manda: separar (null) o unir con el de al lado', () => {
    const a1 = de('A1: Press francés', { superserieCon: null })
    expect(superseries([a1, de('A2: Curl')])).toEqual([null, null])
    const solo = de('Gemelo', { superserieCon: 'Crunch' })
    expect(superseries([solo, de('Crunch')])).toEqual([
      [0, 1],
      [0, 1],
    ])
  })
})

describe('superserieDe y unirEnSuperserie', () => {
  const de = (nombre: string) => ejercicioDelPlan({ name: nombre }, null)
  const lista = [de('Sentadilla'), de('A1: Press francés'), de('A2: Curl')]
  it('las opciones son ninguno y los de al lado, y vale la que está unida', () => {
    const s = superserieDe(lista, 1)
    expect(s.opciones.map((o) => o.label)).toEqual(['Ninguno', 'Con Sentadilla', 'Con A2: Curl'])
    expect(s.valor).toBe('siguiente')
    expect(superserieDe(lista, 0).valor).toBe('ninguno')
  })
  it('unir con el anterior y volver a dejarlo solo', () => {
    const unida = aplicarEdicion(
      { sigla: 'S', nombre: 'S', minutos: 0, ejercicios: lista },
      unirEnSuperserie({}, lista, 1, 'anterior'),
      () => null,
    ).ejercicios
    expect(superseries(unida)[0]).toEqual([0, 1])
    const sola = aplicarEdicion(
      { sigla: 'S', nombre: 'S', minutos: 0, ejercicios: lista },
      unirEnSuperserie({}, lista, 2, 'ninguno'),
      () => null,
    ).ejercicios
    expect(superseries(sola)).toEqual([null, null, null])
  })
})
