import { describe, expect, it } from 'vitest'
import { leerRutinaCsv } from './csvRoutine.ts'
import { INSTRUCCIONES_IA_RUTINA } from './routinePrompt.ts'

describe('instrucciones para una IA', () => {
  it('traen un ejemplo que la app lee', () => {
    const ejemplo = INSTRUCCIONES_IA_RUTINA.split('EJEMPLO\n')[1]!.split('\n\nMI RUTINA')[0]!
    const r = leerRutinaCsv(ejemplo)
    expect(r.errores).toEqual([])
    expect(r.sesiones).toBe(3)
  })
})
