import { describe, expect, it } from 'vitest'
import { dietaDesdeCsv } from './dietCsv.ts'
import { INSTRUCCIONES_IA_DIETA } from './dietPrompt.ts'

describe('instrucciones para una IA', () => {
  it('traen los títulos del CSV y un ejemplo que la app lee', () => {
    const titulos = INSTRUCCIONES_IA_DIETA.split('\n').find((l) => l.startsWith('Menú;Días;Cocinar'))
    expect(titulos?.split(';')).toContain('Ajusta')
    const ejemplo = INSTRUCCIONES_IA_DIETA.split('EJEMPLO\n')[1]!.split('\n\nMI DIETA')[0]!
    const r = dietaDesdeCsv(ejemplo, 'Ejemplo', 'ia-1', () => null)
    expect(r.errores).toEqual([])
    expect(r.dieta).not.toBeNull()
  })
})
