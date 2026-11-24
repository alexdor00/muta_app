import { describe, expect, it } from 'vitest'
import { semanasDelPrograma, terminaLaRutina } from './finDeRutina.ts'
import type { ProgramData } from './program.ts'

/** Una rutina con fases de N semanas (cada semana, dos sesiones). */
const rutina = (...fases: number[]): ProgramData =>
  ({
    blocks: fases.map((n) => ({
      title: null,
      weeks: Array.from({ length: n }, (_, w) => ({
        week: w + 1,
        days: [
          { name: 'A', exercises: [] },
          { name: 'B', exercises: [] },
        ],
      })),
    })),
  }) as unknown as ProgramData

describe('el final de una rutina', () => {
  it('cuenta las semanas de todas sus fases', () => {
    expect(semanasDelPrograma(rutina(6, 4, 3))).toBe(13)
    expect(semanasDelPrograma(rutina(1))).toBe(1)
  })

  it('termina con la última sesión de la última semana de la última fase', () => {
    const p = rutina(6, 4)
    expect(terminaLaRutina(p, { bloque: 1, semana: 3, siguiente: 1 }, 1, 2)).toBe(true)
  })

  it('no termina antes: otra sesión, otra semana u otra fase', () => {
    const p = rutina(6, 4)
    expect(terminaLaRutina(p, { bloque: 1, semana: 3, siguiente: 0 }, 0, 2)).toBe(false)
    expect(terminaLaRutina(p, { bloque: 1, semana: 2, siguiente: 1 }, 1, 2)).toBe(false)
    expect(terminaLaRutina(p, { bloque: 0, semana: 5, siguiente: 1 }, 1, 2)).toBe(false)
  })

  it('las de una sola semana que se repite (MUTA y las tuyas en CSV) no terminan nunca', () => {
    expect(terminaLaRutina(rutina(1), { bloque: 0, semana: 0, siguiente: 1 }, 1, 2)).toBe(false)
  })

  it('una sesión que no está en tu semana (hecha = −1) no termina nada', () => {
    expect(terminaLaRutina(rutina(2), { bloque: 0, semana: 1, siguiente: 1 }, -1, 2)).toBe(false)
  })
})
