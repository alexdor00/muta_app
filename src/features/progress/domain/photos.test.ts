import { describe, expect, it } from 'vitest'
import { fotosPorMes, POSES } from './photos.ts'

describe('tus fotos', () => {
  it('frente, lado y espalda, en ese orden', () => {
    expect(POSES.map((p) => p.id)).toEqual(['frente', 'perfil', 'espalda'])
    expect(POSES.map((p) => p.nombre)).toEqual(['Frente', 'Perfil', 'Espalda'])
  })

  it('una por mes (la última de cada mes) de una postura', () => {
    const fotos = [
      { id: 'a', date: '2026-10-02', pose: 'frente' as const },
      { id: 'b', date: '2026-10-28', pose: 'frente' as const },
      { id: 'c', date: '2026-11-04', pose: 'frente' as const },
      { id: 'd', date: '2026-11-04', pose: 'perfil' as const },
    ]
    expect(fotosPorMes(fotos, 'frente').map((x) => [x.mes, x.foto.id])).toEqual([
      ['2026-10', 'b'],
      ['2026-11', 'c'],
    ])
  })
})
