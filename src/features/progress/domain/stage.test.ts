import { describe, expect, it } from 'vitest'
import {
  cifrasDe,
  comidaEnTramo,
  cuerpoEnTramo,
  desdeElPrincipio,
  ejercicioEnMes,
  fuerzaDelMes,
  mesesEntre,
  otroMes,
  diasConFotosEn,
  fotosDelTramo,
  fotosEnTramo,
  frenteALaAnterior,
  mesComoTramo,
} from './stage.ts'

const etapa = { desde: '2026-10-01', hasta: '2026-10-31' }

describe('una etapa', () => {
  it('las cifras de un tramo: inicio, fin, cambio y ritmo por semana', () => {
    const serie = [
      { date: '2026-09-30', v: 81 },
      { date: '2026-10-01', v: 80 },
      { date: '2026-10-15', v: 79 },
      { date: '2026-11-01', v: 78.5 },
    ]
    expect(cifrasDe(serie, (p) => p.v, etapa)).toEqual({
      inicio: 80,
      fin: 79,
      cambio: -1,
      porSemana: -0.5,
      desde: '2026-10-01',
      hasta: '2026-10-15',
    })
    expect(cifrasDe(serie, (p) => p.v, { desde: '2026-11-01', hasta: null })?.porSemana).toBeNull()
    expect(cifrasDe(serie, (p) => p.v, { desde: '2027-01-01', hasta: null })).toBeNull()
  })

  it('tu cuerpo al empezar (el último de antes, si lo hay) y ahora: peso, cintura (también la de la consulta), grasa y medidas', () => {
    const filas = cuerpoEnTramo(
      {
        peso: [
          { date: '2026-10-02', tendencia: 80.6 },
          { date: '2026-10-30', tendencia: 79 },
        ],
        grasa: [{ date: '2026-10-05', grasa: 14.5 }],
        medidas: [
          { date: '2026-10-05', brazo: 38.7, cintura: 84.8 },
          { date: '2026-10-29', brazo: 38.6 },
          { date: '2026-11-05', brazo: 39 },
          { date: '2026-09-20', gemelo: 38 },
          { date: '2026-10-20', gemelo: 38.4 },
        ],
        cinturas: [{ date: '2026-10-26', cm: 82.6 }],
      },
      etapa,
    )
    expect(filas.map((f) => [f.id, f.inicio, f.fin, f.cambio])).toEqual([
      ['peso', 80.6, 79, -1.6],
      ['cintura', 84.8, 82.6, -2.2],
      ['grasa', 14.5, 14.5, null],
      ['brazo', 38.7, 38.6, -0.1],
      // Al empezar: el último de antes de la etapa
      ['gemelo', 38, 38.4, 0.4],
    ])
  })

  it('tu comida de media en la etapa (y tu objetivo); null sin días apuntados', () => {
    const dias = [
      { date: '2026-10-02', kcal: 2300, protein: 150, objetivo: 2350 },
      { date: '2026-10-03', kcal: 2400, protein: 170, objetivo: null },
      { date: '2026-11-02', kcal: 3000, protein: 100, objetivo: 2350 },
    ]
    expect(comidaEnTramo(dias, etapa)).toEqual({ kcal: 2350, proteina: 160, objetivo: 2350, apuntados: 2 })
    expect(comidaEnTramo(dias, { desde: '2027-01-01', hasta: null })).toBeNull()
  })

  it('tus fotos de antes y de ahora (frente primero) y cuántos días con fotos', () => {
    const fotos = [
      { id: 'a', date: '2026-10-02', pose: 'perfil' as const },
      { id: 'b', date: '2026-10-28', pose: 'perfil' as const },
      { id: 'c', date: '2026-10-28', pose: 'frente' as const },
    ]
    expect(fotosEnTramo(fotos, etapa)).toMatchObject({ antes: { id: 'a' }, ahora: { id: 'b' } })
    expect(fotosEnTramo(fotos.slice(1), etapa)).toBeNull()
    expect(diasConFotosEn(fotos, etapa)).toBe(2)
  })

  it('tu fuerza contada desde el principio de la etapa', () => {
    const serie = [
      { date: '2026-09-28', cambio: 0.1 },
      { date: '2026-10-05', cambio: 0.1 },
      { date: '2026-10-12', cambio: 0.155 },
    ]
    expect(desdeElPrincipio(serie, etapa)).toEqual([
      { date: '2026-10-05', cambio: 0 },
      { date: '2026-10-12', cambio: 0.05 },
    ])
    expect(desdeElPrincipio(serie, { desde: '2027-01-01', hasta: null })).toEqual([])
  })

  it('las fotos de un mes: la última de cada postura', () => {
    const fotos = [
      { id: 'a', date: '2026-11-01', pose: 'frente' as const },
      { id: 'b', date: '2026-11-20', pose: 'frente' as const },
      { id: 'c', date: '2026-10-20', pose: 'perfil' as const },
    ]
    const nov = fotosDelTramo(fotos, mesComoTramo('2026-11'))
    expect(nov.frente?.id).toBe('b')
    expect(nov.perfil).toBeUndefined()
    expect(mesComoTramo('2026-02')).toEqual({ desde: '2026-02-01', hasta: '2026-02-31' })
  })

  it('moverse entre meses', () => {
    expect(otroMes('2026-11', -1)).toBe('2026-10')
    expect(otroMes('2026-01', -1)).toBe('2025-12')
    expect(otroMes('2026-12', 1)).toBe('2027-01')
    expect(mesesEntre('2026-10', '2027-01')).toEqual(['2026-10', '2026-11', '2026-12', '2027-01'])
  })

  it('un ejercicio en un mes: su mejor del mes frente al del mes anterior (o el último de antes) y si fue récord', () => {
    const puntos = [
      { fecha: '2026-09-10', e1rm: 100 },
      { fecha: '2026-10-05', e1rm: 98 },
      { fecha: '2026-10-20', e1rm: 99 },
      { fecha: '2026-11-03', e1rm: 104 },
      { fecha: '2026-11-17', e1rm: 103 },
    ]
    expect(ejercicioEnMes(puntos, '2026-11')).toMatchObject({ a: 104, de: 99, cambio: 0.051, record: true })
    expect(ejercicioEnMes(puntos, '2026-11')?.mejor.e1rm).toBe(104)
    expect(ejercicioEnMes(puntos, '2026-10')).toMatchObject({ a: 99, de: 100, cambio: -0.01, record: false })
    // Sin el mes anterior, frente al último de antes
    expect(
      ejercicioEnMes(
        puntos.filter((p) => !p.fecha.startsWith('2026-10')),
        '2026-11',
      )?.de,
    ).toBe(100)
    expect(ejercicioEnMes(puntos, '2026-12')).toBeNull()
    expect(ejercicioEnMes(puntos, '2026-09')).toMatchObject({
      anterior: null,
      a: 100,
      de: null,
      cambio: null,
      record: false,
    })
  })

  it('tu fuerza del mes: su última semana frente a la última de antes', () => {
    const semanal = [
      { date: '2026-10-26', cambio: 0.1 },
      { date: '2026-11-02', cambio: 0.12 },
      { date: '2026-11-09', cambio: 0.133 },
    ]
    expect(fuerzaDelMes(semanal, '2026-11')).toBe(0.03)
    expect(fuerzaDelMes(semanal, '2026-10')).toBeNull()
  })

  it('un ejercicio un día frente a la vez anterior', () => {
    const puntos = [
      { fecha: '2026-11-03', e1rm: 100 },
      { fecha: '2026-11-07', e1rm: 105 },
    ]
    expect(frenteALaAnterior(puntos, '2026-11-07')).toBe(0.05)
    expect(frenteALaAnterior(puntos, '2026-11-03')).toBeNull()
    expect(frenteALaAnterior(puntos, '2026-11-05')).toBeNull()
  })
})
