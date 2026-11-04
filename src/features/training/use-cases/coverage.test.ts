import { describe, expect, it } from 'vitest'
import reglas from '../../../shared/content/coverage.json'
import LIBRARY from '../../../shared/content/exercises.json'
import type { ReglaCobertura } from '../domain/coverage.ts'
import { MUSCLE_IDS } from '../domain/muscles.ts'
import { coberturaDelPlan } from './coverage.ts'

const REGLAS = reglas as ReglaCobertura[]

describe('la tabla de cobertura', () => {
  it('solo usa músculos y ejercicios de la biblioteca que existen', () => {
    const ids = new Set((LIBRARY as { id: string }[]).map((e) => e.id))
    const musculos = new Set<string>(MUSCLE_IDS)
    for (const r of REGLAS) {
      expect(musculos.has(r.musculo)).toBe(true)
      for (const p of r.partes)
        for (const id of [...(p.ids ?? []), ...p.sugiere]) expect(ids.has(id), id).toBe(true)
    }
  })
})

describe('coberturaDelPlan', () => {
  it('con los ejercicios de tus sesiones por su nombre, y lo sugerido como ejercicios de la biblioteca', () => {
    const { porRevisar } = coberturaDelPlan([{ ejercicios: [{ nombre: 'Press banca' }] }])
    const pecho = porRevisar.find((r) => r.musculo === 'pecho')
    expect(pecho?.faltan.map((p) => p.falta)).toEqual(['falta un inclinado'])
    expect(pecho?.faltan[0].sugiere.map((e) => e.name)).toContain('Press inclinado con mancuernas')
  })
})
