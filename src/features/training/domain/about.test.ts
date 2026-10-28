import { describe, expect, it } from 'vitest'
import { aboutOf } from './about.ts'
import { CATALOG } from './catalog.ts'

describe('de qué trata cada rutina', () => {
  it('todas las rutinas del catálogo tienen su información', () => {
    const missing = CATALOG.filter((e) => !aboutOf(e)).map((e) => e.id)
    expect(missing).toEqual([])
  })

  it('las versiones de un mismo programa comparten texto y añaden su nota', () => {
    const six = aboutOf({ id: 'vuelta-ppl' })!
    const four = aboutOf({ id: 'vuelta-torso-pierna' })!
    expect(six.summary).toBe(four.summary)
    expect(six.note).toMatch(/6 días/)
    expect(four.note).toMatch(/4 días/)
  })

  it('sin nombres de personas', () => {
    const text = JSON.stringify(CATALOG.map(aboutOf))
    expect(text).not.toMatch(/nippard|buttermore|jeff|stephanie|yates|meadows/i)
  })
})
