import { describe, expect, it } from 'vitest'
import {
  filasDeSemana,
  moverFila,
  ordenarSemana,
  semanaDeFilas,
  sesionVacia,
  siglaNueva,
  type FilaSemana,
} from './weekOrder.ts'

const S = (sigla: string): FilaSemana => ({ tipo: 'sesion', sigla })
const D: FilaSemana = { tipo: 'descanso' }

describe('tu semana como lista', () => {
  it('cada sesión con sus descansos detrás', () => {
    expect(filasDeSemana(['A1', 'B1', 'A2'], [1, 0, 2])).toEqual([S('A1'), D, S('B1'), S('A2'), D, D])
  })

  it('de la lista al orden y los descansos, ida y vuelta', () => {
    const filas = filasDeSemana(['A1', 'B1', 'A2'], [1, 0, 2])
    expect(semanaDeFilas(filas)).toEqual({ orden: ['A1', 'B1', 'A2'], porSesion: [1, 0, 2] })
  })

  it('mover un descanso lo pone tras otra sesión', () => {
    // A1 · D · B1 → el descanso baja tras B1
    const filas = moverFila([S('A1'), D, S('B1')], 1, 2)
    expect(semanaDeFilas(filas)).toEqual({ orden: ['A1', 'B1'], porSesion: [0, 1] })
  })

  it('mover una sesión cambia el orden; sus descansos se quedan donde estaban', () => {
    const filas = moverFila([S('A1'), D, S('B1'), S('A2')], 3, 0)
    expect(semanaDeFilas(filas)).toEqual({ orden: ['A2', 'A1', 'B1'], porSesion: [0, 1, 0] })
  })

  it('un descanso arriba del todo va tras la última sesión', () => {
    expect(semanaDeFilas([D, S('A1'), S('B1')])).toEqual({ orden: ['A1', 'B1'], porSesion: [0, 1] })
  })
})

describe('tu orden y tus sesiones', () => {
  it('ordena por tu orden; lo que no está, detrás en el suyo', () => {
    const semana = [{ sigla: 'A1' }, { sigla: 'B1' }, { sigla: 'A2' }, { sigla: 'B2' }]
    expect(ordenarSemana(semana, ['B1', 'A1']).map((s) => s.sigla)).toEqual(['B1', 'A1', 'A2', 'B2'])
    expect(ordenarSemana(semana, null).map((s) => s.sigla)).toEqual(['A1', 'B1', 'A2', 'B2'])
  })

  it('la sigla nueva no repite ninguna', () => {
    expect(siglaNueva(['A1', 'B1', 'A2', 'B2'])).toBe('S5')
    expect(siglaNueva(['S1', 'S2', 'S3', 'S5'])).toBe('S6')
  })

  it('una sesión tuya empieza vacía', () => {
    expect(sesionVacia({ sigla: 'S5', nombre: 'Sesión 5' })).toEqual({
      sigla: 'S5',
      nombre: 'Sesión 5',
      minutos: 0,
      ejercicios: [],
    })
  })
})
