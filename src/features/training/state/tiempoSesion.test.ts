import { describe, expect, it } from 'vitest'
import type { SesionEnCurso } from './sesionEnCurso.ts'
import { finDeLaSesion, HUECO_SIN_APUNTAR, segundosSesion, sinTiempoMuerto } from './tiempoSesion.ts'

const MIN = 60_000
const sesion = (extra: Partial<SesionEnCurso> = {}): SesionEnCurso =>
  ({ inicio: 0, pausadaEn: null, pausaMs: 0, terminada: null, ...extra }) as SesionEnCurso

describe('el tiempo de la sesión (usuario, 2026-11-23)', () => {
  it('sin huecos, todo cuenta', () => {
    const en = sinTiempoMuerto(sesion(), 10 * MIN, 120)
    expect(en.pausaMs).toBe(0)
    expect(en.conHueco).toBeUndefined()
    expect(segundosSesion(en, 20 * MIN)).toBe(20 * 60)
  })

  it('más de 30 min sin apuntar nada: ese rato cuenta como pausa, menos el descanso del ejercicio', () => {
    const a = sinTiempoMuerto(sesion(), 10 * MIN, 120)
    // La dejas a medias y vuelves 5 horas después
    const b = sinTiempoMuerto(a, 10 * MIN + 5 * 60 * MIN, 120)
    expect(b.pausaMs).toBe(5 * 60 * MIN - 2 * MIN)
    expect(b.conHueco).toBe(true)
    expect(segundosSesion(b, b.ultimoApunte!.en)).toBe(12 * 60)
  })

  it('justo 30 min no es un hueco (un descanso muy largo, sí cuenta)', () => {
    const a = sinTiempoMuerto(sesion(), 10 * MIN, 120)
    expect(sinTiempoMuerto(a, 10 * MIN + HUECO_SIN_APUNTAR, 120).pausaMs).toBe(0)
  })

  it('la pausa que hiciste tú no se cuenta dos veces', () => {
    const a = sinTiempoMuerto(sesion(), 10 * MIN, 120)
    // Pausas 2 horas y vuelves: no hay tiempo muerto
    const enPausa = { ...a, pausaMs: 120 * MIN }
    expect(sinTiempoMuerto(enPausa, 10 * MIN + 125 * MIN, 120).pausaMs).toBe(120 * MIN)
  })

  it('al terminar tras un hueco, la sesión acaba con tu última serie', () => {
    const a = sinTiempoMuerto(sinTiempoMuerto(sesion(), 20 * MIN, 120), 40 * MIN, 120)
    const fin = finDeLaSesion(a, 40 * MIN + 16 * 60 * MIN)
    expect(fin).toBe(40 * MIN)
    expect(segundosSesion({ ...a, terminada: fin }, fin)).toBe(40 * 60)
    // Sin hueco, acaba cuando terminas
    expect(finDeLaSesion(a, 45 * MIN)).toBe(45 * MIN)
  })

  it('si tu primera serie llega más de 30 min después de empezar, ese rato tampoco cuenta', () => {
    const a = sinTiempoMuerto(sesion(), 45 * MIN, 120)
    expect(a.pausaMs).toBe(45 * MIN - 2 * MIN)
  })

  it('terminar con la sesión en pausa no cuenta la pausa', () => {
    const en = sesion({ pausadaEn: 30 * MIN })
    expect(segundosSesion({ ...en, terminada: 90 * MIN }, 90 * MIN)).toBe(30 * 60)
  })
})
