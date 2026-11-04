import { describe, expect, it } from 'vitest'
import { tarjetaCompartir } from './shareCard.ts'

const base = {
  fecha: 'mar 27 oct',
  nombre: 'Isquios, glúteo y pecho',
  racha: 12,
  volumenKg: 4200,
  series: 17,
  minutos: 58,
}

describe('tarjetaCompartir', () => {
  it('cifras, racha y hasta tres récords con su serie y cuánto suben', () => {
    const records = [
      { nombre: 'Curl femoral tumbado', mejor: { kg: 40, reps: 15 }, cambio: 0.125 },
      { nombre: 'Press inclinado', mejor: { kg: 24, reps: 12 }, cambio: 0.091 },
      { nombre: 'Remo', mejor: { kg: 60, reps: 10 }, cambio: 0.05 },
      { nombre: 'Dominadas', mejor: { kg: null, reps: 9 }, cambio: 0.1 },
    ]
    const t = tarjetaCompartir({ ...base, records })
    expect(t.linea).toBe('Sesión completada · 12 días de racha')
    expect(t.cifras.map((c) => `${c.valor} ${c.unidad} ${c.nombre}`.replace(/\s+/g, ' '))).toEqual([
      '4,2 t Volumen',
      '17 Series',
      '58 min Duración',
    ])
    expect(t.tituloRecords).toBe('4 récords nuevos')
    expect(t.records).toHaveLength(3)
    expect(t.records[0]).toEqual({ nombre: 'Curl femoral tumbado', detalle: '40 × 15 · +12,5 %' })
  })

  it('sin peso ni récords ni racha: solo lo que hay', () => {
    const t = tarjetaCompartir({ ...base, racha: 1, volumenKg: 0, records: [] })
    expect(t.linea).toBe('Sesión completada')
    expect(t.cifras.map((c) => c.nombre)).toEqual(['Series', 'Duración'])
    expect(t.tituloRecords).toBeNull()
  })
})
