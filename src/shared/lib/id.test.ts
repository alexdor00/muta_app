import { afterEach, describe, expect, it, vi } from 'vitest'
import { nuevoId } from './id.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('nuevoId', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('da un UUID v4', () => {
    expect(nuevoId()).toMatch(UUID)
  })

  it('sin https (sin crypto.randomUUID) también da un UUID v4 y no se repite', () => {
    vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) })
    const ids = new Set(Array.from({ length: 200 }, () => nuevoId()))
    expect(ids.size).toBe(200)
    for (const id of ids) expect(id).toMatch(UUID)
  })
})
