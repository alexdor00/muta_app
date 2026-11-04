import { describe, expect, it } from 'vitest'
import { cobertura, type EjercicioCubre, type ReglaCobertura } from './coverage.ts'

// Como la fila de pecho y la de hombro lateral de la tabla (shared/content/coverage.json)
const REGLAS: ReglaCobertura[] = [
  {
    musculo: 'pecho',
    pide: 'Un inclinado y trabajo horizontal',
    fuente: '',
    partes: [
      { falta: 'falta un inclinado', patron: 'empuje_inc', sugiere: [] },
      {
        falta: 'falta trabajo horizontal',
        patron: 'empuje_h',
        primario: 'pecho',
        ids: ['cruces_en_polea'],
        sugiere: [],
      },
    ],
  },
  {
    musculo: 'hombro_lat',
    pide: 'Elevaciones laterales',
    fuente: '',
    partes: [{ falta: 'faltan', primario: 'hombro_lat', sugiere: [] }],
  },
]
const ej = (id: string, pattern = 'aislamiento', primary: EjercicioCubre['primary'] = 'pecho') => ({
  id,
  pattern,
  primary,
})

describe('cobertura', () => {
  const pecho = REGLAS.filter((r) => r.musculo === 'pecho')
  it('falta lo que ningún ejercicio cubre, por id o por patrón', () => {
    const { porRevisar, bien } = cobertura(pecho, [ej('press_banca', 'empuje_h')])
    expect(bien).toEqual([])
    expect(porRevisar[0].faltan.map((p) => p.falta)).toEqual(['falta un inclinado'])
  })
  it('con un inclinado y uno horizontal, bien cubierto', () => {
    const { porRevisar, bien } = cobertura(pecho, [
      ej('press_inclinado_con_mancuernas', 'empuje_inc'),
      ej('cruces_en_polea'),
    ])
    expect(porRevisar).toEqual([])
    expect(bien.map((r) => r.musculo)).toEqual(['pecho'])
  })
  it('el patrón con su músculo: un press de tríceps no cuenta como trabajo horizontal de pecho', () => {
    const { porRevisar } = cobertura(pecho, [
      ej('press_inclinado_con_mancuernas', 'empuje_inc'),
      ej('press_banca_agarre_cerrado', 'empuje_h', 'triceps'),
    ])
    expect(porRevisar[0].faltan.map((p) => p.falta)).toEqual(['falta trabajo horizontal'])
  })
  it('solo con el músculo principal (hombro lateral)', () => {
    const lateral = REGLAS.filter((r) => r.musculo === 'hombro_lat')
    expect(cobertura(lateral, [ej('x', 'aislamiento', 'hombro_lat')]).bien).toHaveLength(1)
  })
})
