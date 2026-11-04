import { describe, expect, it } from 'vitest'
import { notasEjercicio } from '../state/notas.ts'
import { claveNota, notaDe } from './exerciseNotes.ts'

describe('tus notas', () => {
  it('la clave es el ejercicio de la biblioteca, con cualquiera de sus nombres', () => {
    expect(claveNota('Laterales en polea')).toBe(claveNota('Elevaciones laterales en polea'))
    expect(claveNota('Uno que no existe')).toBe('uno que no existe')
  })
  it('la nota de un ejercicio sale con cualquiera de sus nombres', () => {
    notasEjercicio.value = { [claveNota('Elevaciones laterales en polea')]: 'Polea a la altura de la cadera' }
    expect(notaDe('Laterales en polea')).toBe('Polea a la altura de la cadera')
    expect(notaDe('Press banca')).toBe('')
    notasEjercicio.value = {}
  })
})
