import { describe, expect, it } from 'vitest'
import type { Revision } from '../../state/entrenador.ts'
import { resumenRevision } from './textoRevision.ts'

const previsto = { min: -0.7, max: -0.3 }

/** Un caso de cada tipo de revisión (menos `cambio`, que pinta la sugerencia). */
const CASOS: Revision[] = [
  { tipo: 'faltan', pesajes: 1, faltanPesajes: 9, dias: 0, faltanDias: 12 },
  { tipo: 'cumplir', cumplido: 0.7 },
  { tipo: 'bien', pct: -0.5, kgSemana: -0.4, previsto },
  { tipo: 'esperar', dias: 4 },
  { tipo: 'pasos', pct: -0.1, kgSemana: -0.1, previsto, pasos: 6000 },
  { tipo: 'progresas', pct: 0.02, fuerza: 0.03 },
  { tipo: 'meseta', pct: 0, hechas: 1 },
  { tipo: 'mesetasHechas', hechas: 2 },
  { tipo: 'recarga', vuelve: '2026-12-01' },
  { tipo: 'unaSemana', pct: -1.5 },
  { tipo: 'cintura', pct: -0.1, cm: -1.2 },
  { tipo: 'senales', pct: -0.1, senales: ['sueno', 'hambre'] },
  { tipo: 'findes', pct: -0.1 },
  { tipo: 'deficit', pct: -0.1, parte: 0.74 },
  { tipo: 'suelo', pct: -0.1, suelo: 1500 },
]

describe('resumenRevision', () => {
  it('cada tipo da estado, titular corto y cifras sin huecos', () => {
    for (const r of CASOS)
      for (const fase of ['definicion', 'mantenimiento', 'volumen', null]) {
        const s = resumenRevision(r, fase)
        expect(s.estado, r.tipo).toBeTruthy()
        expect(s.titulo.length, r.tipo).toBeLessThanOrEqual(40)
        expect(s.titulo).not.toMatch(/undefined|NaN|null/)
        for (const [k, v] of s.datos) {
          expect(k, r.tipo).toBeTruthy()
          expect(v, r.tipo).not.toMatch(/undefined|NaN|null|Infinity/)
          expect(v.trim(), r.tipo).not.toBe('')
        }
        if (s.nota) expect(s.nota.length, r.tipo).toBeLessThanOrEqual(80)
      }
  })

  it('sin revisión o con un cambio, el texto por defecto', () => {
    expect(resumenRevision(null, null).titulo).toBe('Todo en orden')
    expect(resumenRevision(null, 'definicion').datos).toEqual([])
  })

  it('faltan datos: lo que llevas de lo que hace falta', () => {
    const s = resumenRevision(CASOS[0] ?? null, 'definicion')
    expect(s.estado).toBe('Faltan datos')
    expect(s.datos).toEqual([
      ['Pesajes en 14 días', '1 de 10'],
      ['Días apuntados en 4 semanas', '0 de 12'],
    ])
  })

  it('al ritmo en definición: tu ritmo, el objetivo y el margen; cerca del límite lento, avisa', () => {
    const s = resumenRevision({ tipo: 'bien', pct: -0.5, kgSemana: -0.4, previsto }, 'definicion')
    expect(s.datos).toEqual([
      ['Tu ritmo', '−0,5 % / sem'],
      ['Objetivo', '−0,5 %'],
      ['Margen', '0,3 % – 1,2 %'],
    ])
    expect(s.nota).toBeUndefined()
    const lento = resumenRevision({ tipo: 'bien', pct: -0.28, kgSemana: -0.2, previsto }, 'definicion')
    expect(lento.nota).toMatch(/límite lento/)
  })

  it('al ritmo fuera de definición: sin objetivo de bajada, con su margen con signo', () => {
    const s = resumenRevision(
      { tipo: 'bien', pct: 0.1, kgSemana: 0.1, previsto: { min: -0.06, max: 0.24 } },
      'volumen',
    )
    expect(s.datos.map(([k]) => k)).toEqual(['Tu ritmo', 'Margen'])
    expect(s.datos[1]?.[1]).toBe('−0,06 % a +0,24 %')
  })

  it('ritmo cero, sin signo', () => {
    const s = resumenRevision({ tipo: 'meseta', pct: 0, hechas: 0 }, 'mantenimiento')
    expect(s.datos[0]).toEqual(['Tu ritmo', '0 % / sem'])
    expect(s.datos[1]).toEqual(['Mesetas', '0 de 2'])
  })

  it('un día de espera, en singular', () => {
    expect(resumenRevision({ tipo: 'esperar', dias: 1 }, null).datos[0]?.[1]).toBe('en 1 día')
  })

  it('señales: todas, separadas; sin ninguna, no deja la fila vacía', () => {
    const s = resumenRevision({ tipo: 'senales', pct: -0.1, senales: ['sueno', 'hambre'] }, 'definicion')
    expect(s.datos[1]).toEqual(['Recuperación', 'duermes poco, pasas mucha hambre'])
    const vacia = resumenRevision({ tipo: 'senales', pct: -0.1, senales: [] }, 'definicion')
    expect(vacia.datos.map(([k]) => k)).toEqual(['Tu ritmo'])
  })

  it('progresas: la fuerza sube o se mantiene', () => {
    expect(resumenRevision({ tipo: 'progresas', pct: 0, fuerza: 0 }, 'volumen').datos[1]?.[1]).toBe('Estable')
    expect(resumenRevision({ tipo: 'progresas', pct: 0, fuerza: 0.01 }, 'volumen').datos[1]?.[1]).toBe('Sube')
  })

  it('cintura: siempre como bajada, venga con el signo que venga', () => {
    expect(resumenRevision({ tipo: 'cintura', pct: 0, cm: -0.8 }, 'definicion').datos[1]?.[1]).toBe('−0,8 cm')
    expect(resumenRevision({ tipo: 'cintura', pct: 0, cm: 0.8 }, 'definicion').datos[1]?.[1]).toBe('−0,8 cm')
  })
})
