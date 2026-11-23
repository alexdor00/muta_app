import { describe, expect, it } from 'vitest'
import { addDays } from '../../../shared/lib/format.ts'
import {
  cambioDePerimetro,
  consejosDeLaSemana,
  findesDeMas,
  grasaFinal,
  parteDelGasto,
  proteinaPorKilo,
  semanasConSenales,
  senalesDeLaSemana,
  type Animo,
} from './senales.ts'

const HOY = '2026-11-22' // domingo

/** `n` días de ¿Cómo estás hoy? hasta `hasta`, con lo mismo cada día. */
const dias = (n: number, a: Omit<Animo, 'date'>, hasta = HOY): Animo[] =>
  Array.from({ length: n }, (_, i) => ({ date: addDays(hasta, -i), ...a }))

describe('cómo estás (señales de § 5 y la regla 8)', () => {
  it('cuenta una señal si sale en la mitad o más de los días contestados, con 3 o más', () => {
    expect(senalesDeLaSemana(dias(4, { sueno: 0, hambre: 2, energia: 1 }), HOY)).toEqual(['sueno', 'hambre'])
    expect(senalesDeLaSemana(dias(2, { sueno: 0 }), HOY)).toEqual([])
    const mezcla = [...dias(2, { estres: 2 }), ...dias(3, { estres: 0 }, addDays(HOY, -2))]
    expect(senalesDeLaSemana(mezcla, HOY)).toEqual([])
  })

  it('las semanas seguidas con 2 señales o más', () => {
    const malas = [
      ...dias(4, { sueno: 0, energia: 0 }),
      ...dias(4, { sueno: 0, energia: 0 }, addDays(HOY, -7)),
      ...dias(4, { sueno: 2 }, addDays(HOY, -14)),
    ]
    expect(semanasConSenales(malas, HOY)).toBe(2)
    expect(semanasConSenales([], HOY)).toBe(0)
  })
})

describe('perímetros', () => {
  it('la última medida (de las 2 últimas semanas) frente a una de al menos 10 días antes', () => {
    const m = [
      { date: addDays(HOY, -20), cintura: 86 },
      { date: addDays(HOY, -2), cintura: 85.2 },
    ]
    expect(cambioDePerimetro(m, 'cintura', HOY)).toBe(-0.8)
    expect(cambioDePerimetro([{ date: addDays(HOY, -2), cintura: 85 }], 'cintura', HOY)).toBeNull()
    expect(cambioDePerimetro([{ date: addDays(HOY, -30), cintura: 85 }], 'cintura', HOY)).toBeNull()
  })
})

describe('comida', () => {
  const semana = (finde: number, diario: number) =>
    Array.from({ length: 14 }, (_, i) => {
      const date = addDays(HOY, -i)
      const dia = new Date(`${date}T12:00:00Z`).getUTCDay()
      return { date, kcal: dia === 0 || dia === 6 ? finde : diario, protein: 120, objetivo: 2000 }
    })

  it('fines de semana de más y entre semana bien', () => {
    expect(findesDeMas(semana(2800, 2000), HOY)).toBe(true)
    expect(findesDeMas(semana(2100, 2000), HOY)).toBe(false)
    expect(findesDeMas(semana(2800, 2500), HOY)).toBe(false)
  })

  it('proteína por kilo (7 días, 4 apuntados) y qué parte de lo que gastas comes', () => {
    expect(proteinaPorKilo(semana(2000, 2000), HOY, 80)).toBe(1.5)
    expect(proteinaPorKilo(semana(2000, 2000).slice(10), HOY, 80)).toBeNull()
    expect(parteDelGasto(semana(1800, 1800), HOY, 2600)).toBe(0.69)
  })
})

describe('grasa y fase final (regla 6)', () => {
  it('a 3 puntos del objetivo, fase final; por debajo, llegaste', () => {
    expect(grasaFinal({ actual: 15, objetivo: 12 })).toEqual({ final: true, llegaste: false })
    expect(grasaFinal({ actual: 11.5, objetivo: 12 })).toEqual({ final: true, llegaste: true })
    expect(grasaFinal({ actual: 20, objetivo: 12 })).toEqual({ final: false, llegaste: false })
    expect(grasaFinal({ actual: 20, objetivo: null })).toEqual({ final: false, llegaste: false })
  })
})

describe('consejosDeLaSemana', () => {
  it('si la grasa no baja, solo en definición', () => {
    expect(consejosDeLaSemana({ fase: 'definicion', lento: true })[0]).toContain('Si la grasa no baja')
    expect(consejosDeLaSemana({ fase: 'definicion', lento: false })).toEqual([])
    expect(consejosDeLaSemana({ fase: 'volumen', lento: true })).toEqual([])
  })

  it('proteína baja, señales, fuerza al final y perímetros', () => {
    const c = consejosDeLaSemana({
      fase: 'definicion',
      lento: false,
      hoy: HOY,
      proteina: 1.2,
      animo: dias(4, { sueno: 0 }),
      final: true,
      fuerza: -0.025,
      medidas: [
        { date: addDays(HOY, -20), brazo: 38 },
        { date: addDays(HOY, -2), brazo: 38 },
      ],
    })
    expect(c[0]).toContain('1,2 g de proteína por kilo')
    expect(c[1]).toContain('duermes poco')
    expect(c.some((x) => x.includes('Fuerza a la baja'))).toBe(true)
    expect(c.at(-1)).toContain('conservas el músculo')
  })
})
