import { describe, expect, it } from 'vitest'
import { cambioHaciaObjetivo } from './dietTarget.ts'

describe('ajustar la dieta a tu objetivo', () => {
  it('lo que falta en cada tipo de día, en decenas; null si ya coincide', () => {
    expect(cambioHaciaObjetivo({ entreno: 2150, descanso: 1950 }, { entreno: 2405, descanso: 2059 })).toEqual(
      {
        entreno: 260,
        descanso: 110,
      },
    )
    expect(cambioHaciaObjetivo({ entreno: 2400, descanso: 2000 }, { entreno: 2300, descanso: 2000 })).toEqual(
      {
        entreno: -100,
        descanso: 0,
      },
    )
    expect(
      cambioHaciaObjetivo({ entreno: 2000, descanso: 2000 }, { entreno: 2003, descanso: 1998 }),
    ).toBeNull()
  })

  it('si tu objetivo no distingue el tipo de día, la dieta conserva su reparto y su media llega a la tuya', () => {
    // 4 días de entreno: media de la dieta (2.180 × 4 + 1.790 × 3) / 7 ≈ 2.013; tu objetivo, 2.943 → +930 los dos
    expect(
      cambioHaciaObjetivo({ entreno: 2180, descanso: 1790 }, { entreno: 2943, descanso: 2943 }, 4),
    ).toEqual({ entreno: 930, descanso: 930 })
  })
})
