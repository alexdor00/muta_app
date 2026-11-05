import { describe, expect, it } from 'vitest'
import { decidir, diaCumplido, mediasSemanales, perdidas, senales, type EntradaConsulta } from './consult.ts'

const base: EntradaConsulta = {
  semana: 3,
  fases: [
    { id: 'f1', nombre: 'Fase 1', desdeSemana: 1, kcal: 0 },
    { id: 'f2', nombre: 'Fase 2', desdeSemana: 5, kcal: 150 },
  ],
  fase: { id: 'f1', nombre: 'Fase 1', desdeSemana: 1, kcal: 0 },
  medias: [81, 80.4, 79.9, 79.4],
  cintura: { ahora: 84, antes: 84.5 },
  cumplido: 0.86,
  fuerza: 0,
  revision: { hambre: 4, energia: 7 },
  umbrales: { rapido: 0.9, lento: 0.3 },
  pesoKg: 79.4,
}

describe('la consulta semanal con dieta', () => {
  it('vas bien: no cambia nada', () => {
    const d = decidir(base)
    expect(d.titulo).toBe('Vas como esperaba')
    expect(d.propuestas).toEqual([])
  })

  it('1. al llegar a la siguiente fase, propone empezarla', () => {
    const d = decidir({ ...base, semana: 5 })
    expect(d.propuestas[0].cambio).toEqual({ tipo: 'fase', fase: 'f2' })
    expect(d.propuestas[0].detalle).toContain('+150 kcal')
  })

  it('2. la semana 1, nada', () => {
    expect(decidir({ ...base, semana: 1 }).titulo).toBe('Semana 1: no se cambia nada')
  })

  it('3. con menos del 60 % cumplido, primero cumplir', () => {
    expect(decidir({ ...base, cumplido: 0.5 }).titulo).toBe('Primero, cumplir el plan')
  })

  it('4. dos semanas bajando más de 0,9 kg: +150 kcal', () => {
    const d = decidir({ ...base, medias: [82, 81, 80] })
    expect(d.propuestas[0].cambio).toEqual({ tipo: 'kcal', kcal: { entreno: 150, descanso: 150 } })
    expect(decidir({ ...base, fuerza: -0.03 }).propuestas[0].id).toBe('kcal-mas')
  })

  it('5. dos semanas despacio: si la cintura baja, nada; si no, pasos o −100 en descanso', () => {
    const lento = { ...base, medias: [80, 79.9, 79.8] }
    expect(decidir(lento).titulo).toBe('El peso apenas baja, pero la cintura sí')
    const d = decidir({ ...lento, cintura: { ahora: 84, antes: 84 } })
    expect(d.eligeUna).toBe(true)
    expect(d.propuestas.map((p) => p.cambio)).toEqual([
      { tipo: 'pasos', pasos: 2000 },
      { tipo: 'kcal', kcal: { entreno: 0, descanso: -100 } },
    ])
  })

  it('6. fase final y fuerza −2 %: consejo de proteína', () => {
    const d = decidir({ ...base, semana: 9, fuerza: -0.02, fase: base.fases[1] })
    expect(d.consejos[0]).toContain('151 g')
  })

  it('7. una sola semana fuera: esperar', () => {
    expect(decidir({ ...base, medias: [81, 80.5, 79.3] }).titulo).toContain('esperamos')
  })

  it('8. hambre alta: consejos, sin cambiar la decisión', () => {
    const d = decidir({ ...base, revision: { hambre: 8, energia: 7 } })
    expect(d.titulo).toBe('Vas como esperaba')
    expect(d.consejos).toHaveLength(3)
  })

  it('sin dos semanas de pesajes no compara', () => {
    expect(decidir({ ...base, medias: [null, 80, null] }).titulo).toBe('Aún no puedo comparar semanas')
  })
})

describe('lo que se mira', () => {
  it('lo que bajas cada semana', () => {
    expect(perdidas([81, 80.4, null, 79])).toEqual([0.6, null, null])
  })

  it('medias de cada semana desde la de antes de empezar', () => {
    const pesajes = [
      { date: '2026-10-30', kg: 81 },
      { date: '2026-11-05', kg: 80 },
      { date: '2026-11-07', kg: 79 },
      { date: '2026-11-13', kg: 78.5 },
    ]
    expect(mediasSemanales(pesajes, '2026-11-05', 2)).toEqual([81, 79.5, 78.5])
  })

  it('señales de recuperación (sección 5)', () => {
    expect(senales({ sueno: 5.5, fatiga: 7, energia: 6, dolor: 2, ganas: 8 })).toEqual([
      'duermes 5,5 h',
      'la fatiga está en 7',
    ])
    expect(senales({ sueno: 7, fatiga: 3, energia: 7, dolor: 1, ganas: 8 })).toEqual([])
  })

  it('un día cumplido: 3 de 4 recetas, o kcal y proteína cerca', () => {
    const apunte = (receta: string) => ({
      id: receta,
      comida: 'comida' as const,
      nombre: receta,
      alimentoId: null,
      gramos: null,
      raciones: null,
      racion: null,
      kcal: 500,
      protein: 30,
      carbs: 50,
      fat: 10,
      receta,
    })
    const objetivo = { kcal: 2000, protein: 150, carbs: 200, fat: 60 }
    const ids = ['a', 'b', 'c', 'd']
    expect(
      diaCumplido(ids, ['a', 'b', 'c'].map(apunte), { kcal: 1500, protein: 90, carbs: 0, fat: 0 }, objetivo),
    ).toBe(true)
    expect(diaCumplido(ids, [apunte('a')], { kcal: 1950, protein: 140, carbs: 0, fat: 0 }, objetivo)).toBe(
      true,
    )
    expect(diaCumplido(ids, [apunte('a')], { kcal: 1500, protein: 140, carbs: 0, fat: 0 }, objetivo)).toBe(
      false,
    )
  })
})
