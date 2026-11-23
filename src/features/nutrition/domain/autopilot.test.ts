import { describe, expect, it } from 'vitest'
import {
  compraQueToca,
  esFresco,
  esProteina,
  partesDeTanda,
  preparacion,
  fechasDeTandas,
  huecosDeLaCompra,
  leerPiloto,
  paraQueDias,
  pilotoNuevo,
  platosDeTanda,
  porDescanso,
  porDias,
  tandaPerdida,
  tandasDe,
  type Piloto,
} from './autopilot.ts'
import { conPlato, diaSemana, menuVacio, type MenuSemanal } from './menu.ts'

// 2026-11-09 es lunes
const lunes = '2026-11-09'
const fecha = (n: number) => {
  const d = new Date(`${lunes}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Descansas los días de la semana que digas (0 = lunes). */
const descansos = (dias: number[]) => (f: string) => dias.includes(diaSemana(f))

/** Un menú con desayuno, comida y cena todos los días. */
function menuCompleto(): MenuSemanal {
  let m = conPlato(menuVacio(), 'A', 'desayuno', 'avena')
  m = conPlato(m, 'A', 'comida', 'pollo')
  return conPlato(m, 'A', 'cena', 'salmon')
}

const piloto = (p: Partial<Piloto> = {}): Piloto => ({ ...pilotoNuevo(lunes), ...p })

describe('qué días cocinas', () => {
  it('en tus descansos: los justos para que nada pase de 3 días (o lo menos posible al momento)', () => {
    // Descansas miércoles y domingo (rutina de 5 días): cocinas esos dos días
    const dias = porDescanso(null, lunes, fecha(13), descansos([2, 6]))
    expect(dias.map(diaSemana)).toEqual([2, 6, 2, 6])
    // Sin descansos seguidos que sobren: con miércoles, sábado y domingo, dos tandas por semana, no tres
    const tres = porDescanso(null, lunes, fecha(13), descansos([2, 5, 6]))
    expect(tres.filter((f) => f <= fecha(6))).toHaveLength(2)
    expect(tres.every((f) => [2, 5, 6].includes(diaSemana(f)))).toBe(true)
  })

  it('cambian con tu rutina: con un solo descanso, ese día (lo que pasa de 3 días, al momento)', () => {
    const uno = porDescanso(null, lunes, fecha(13), descansos([6]))
    expect(uno.map(diaSemana)).toEqual([6, 6])
  })

  it('los días que eliges tú', () => {
    expect(porDias([0, 3], lunes, fecha(6))).toEqual([lunes, fecha(3)])
  })

  it('lo ya fijo se queda; lo que pasaste a otro día no vuelve; sin tandas, ninguna', () => {
    const p = piloto({
      cocina: { modo: 'dias', dias: [6], hora: '19:00' },
      tandas: [fecha(-1)],
      saltadas: [fecha(6)],
    })
    expect(fechasDeTandas(p, fecha(14), () => false)).toEqual([fecha(-1), fecha(13)])
    expect(
      fechasDeTandas(piloto({ cocina: { modo: 'no', dias: [], hora: '19:00' } }), fecha(14), () => true),
    ).toEqual([])
  })
})

describe('qué cubre cada tanda', () => {
  const m = menuCompleto()
  const p = piloto({ cocina: { modo: 'dias', dias: [6, 2], hora: '19:00' } })
  // Domingo 15 y miércoles 18
  const tandas = tandasDe(m, p, [fecha(6), fecha(9), fecha(13)])

  it('las comidas en táper desde que cocinas hasta la siguiente tanda (la cena de ese día, también)', () => {
    const t = tandas[0]
    // Domingo 19:00 → miércoles 19:00: cena del domingo, comida y cena de lunes y martes, comida del miércoles
    expect(t.huecos.map((h) => `${h.fecha}|${h.comida}`)).toEqual([
      `${fecha(6)}|cena`,
      `${fecha(7)}|comida`,
      `${fecha(7)}|cena`,
      `${fecha(8)}|comida`,
      `${fecha(8)}|cena`,
      `${fecha(9)}|comida`,
    ])
    // El desayuno se prepara al momento
    expect(t.huecos.some((h) => h.comida === 'desayuno')).toBe(false)
    expect(platosDeTanda(t)).toEqual([
      { plato: 'salmon', raciones: 3 },
      { plato: 'pollo', raciones: 3 },
    ])
    expect(paraQueDias(t)).toBe('para dom–mié')
  })

  it('lo que pasa de 3 días en la nevera no va en la tanda: se hace al momento', () => {
    // Miércoles → domingo: la comida del domingo es al cuarto día
    const t = tandas[1]
    expect(t.huecos.some((h) => h.fecha === fecha(13) && h.comida === 'comida')).toBe(false)
  })

  it('la tanda que no hiciste y aún te da de comer se propone pasar a hoy (una vez)', () => {
    expect(tandaPerdida(p, tandas, fecha(7))?.fecha).toBe(fecha(6))
    expect(tandaPerdida({ ...p, descartadas: [fecha(6)] }, tandas, fecha(7))).toBeNull()
    expect(tandaPerdida({ ...p, hechas: [fecha(6)] }, tandas, fecha(7))).toBeNull()
  })

  it('la compra: tu próximo día y lo que pide (las tandas de esa semana y lo que se prepara al momento)', () => {
    const conCompra = piloto({ ...p, compra: { dia: 5, hora: '11:00' } })
    expect(compraQueToca(conCompra, lunes)).toBe(fecha(5))
    expect(compraQueToca(piloto(), lunes)).toBeNull()
    const huecos = huecosDeLaCompra(m, tandas, fecha(5))
    // Las dos tandas de esa semana (domingo y miércoles), los desayunos de sábado a viernes y lo de antes de la primera
    // tanda (sábado y la comida del domingo: aquí no hay una tanda de antes que lo cubra)
    expect(huecos.filter((h) => h.comida === 'desayuno')).toHaveLength(7)
    expect(huecos.filter((h) => h.comida !== 'desayuno')).toHaveLength(
      tandas[0].huecos.length + tandas[1].huecos.length + 3,
    )
  })

  it('táper con la proteína al momento: va en la tanda (su base); al momento, no; un plato puede ir distinto', () => {
    const mixto = piloto({
      ...p,
      preparar: { comida: 'taper', cena: 'mixto' },
      porPlato: { pollo: 'momento' },
    })
    const [t] = tandasDe(m, mixto, [fecha(6), fecha(9)])
    expect(t.huecos.every((h) => h.comida === 'cena')).toBe(true)
    expect(t.mixtos).toHaveLength(t.huecos.length)
    expect(preparacion(mixto, t.huecos[0])).toBe('mixto')
    expect(esProteina({ macro: 'protein' })).toBe(true)
    // En cada plato puedes elegir qué se hace ese día (la verdura, en vez de la carne)
    const brocoli = { nombre: 'Brócoli', macro: null }
    const pollo = { nombre: 'Pollo', macro: 'protein' }
    expect(esFresco(mixto, 'pollo', pollo)).toBe(true)
    expect(esFresco({ ...mixto, frescos: { pollo: ['Brócoli'] } }, 'pollo', brocoli)).toBe(true)
    expect(esFresco({ ...mixto, frescos: { pollo: ['Brócoli'] } }, 'pollo', pollo)).toBe(false)
    expect(esProteina({ macro: 'carbs' })).toBe(false)
    // Sin elegir, también la verdura que va cruda (el aguacate); la que se cocina (la cebolla), no
    expect(esFresco(mixto, 'bowl', { nombre: 'Aguacate', macro: null })).toBe(true)
    expect(esFresco(mixto, 'bowl', { nombre: 'Cebolla', macro: null })).toBe(false)
  })

  it('lo marcado en un día de cocina ya no cuenta: una sola capa decide (usuario, 2026-11-21)', () => {
    const pd = { ...pilotoNuevo(lunes), cocina: { modo: 'dias' as const, dias: [6], hora: '19:00' } }
    const [t0] = tandasDe(m, pd, [fecha(6)])
    expect(t0.candidatos.length).toBeGreaterThan(t0.huecos.length)
    const fuera = t0.huecos[0]
    const dentro = t0.candidatos.find((h) => !t0.huecos.includes(h))!
    const marcado = {
      ...pd,
      marcadas: { [`${fuera.fecha}|${fuera.comida}`]: false, [`${dentro.fecha}|${dentro.comida}`]: true },
    }
    const [t1] = tandasDe(m, marcado, [fecha(6)])
    expect(t1.huecos).toEqual(t0.huecos)
    expect(leerPiloto({ desde: lunes, marcadas: { x: true } })?.marcadas).toEqual({})
  })

  it('cada día de cocina con su hora, y de cada plato lo que va ese día y lo que va al comer', () => {
    const pd = { ...pilotoNuevo(lunes), cocina: { modo: 'dias' as const, dias: [6], hora: '19:00' } }
    const conHora = { ...pd, horas: { [fecha(6)]: '10:00' } }
    expect(tandasDe(m, conHora, [fecha(6)])[0].hora).toBe('10:00')
    expect(tandasDe(m, pd, [fecha(6)])[0].hora).toBe('19:00')
    const [t0] = tandasDe(m, { ...pd, preparar: { comida: 'mixto', cena: 'mixto' } }, [fecha(6)])
    const plato = (id: string) => ({
      ingredientes: [
        { nombre: `Pollo ${id}`, macro: 'protein', cuenta: true },
        { nombre: 'Arroz', macro: 'carbs', cuenta: true },
        { nombre: 'Sal', macro: null, cuenta: false },
      ],
    })
    const [primero] = partesDeTanda(t0, { ...pd, preparar: { comida: 'mixto', cena: 'mixto' } }, plato)
    expect(primero.luego).toEqual([`Pollo ${primero.plato}`])
    expect(primero.ahora).toEqual(['Arroz'])
  })

  it('lo guardado a medias se completa', () => {
    expect(leerPiloto(null)).toBeNull()
    const leido = leerPiloto({ compra: { dia: 5, hora: '10:00' }, desde: lunes })
    expect(leido?.cocina.modo).toBe('descanso')
    expect(leido?.preparar).toMatchObject({ desayuno: 'momento', comida: 'taper', cena: 'taper' })
    // Lo de antes (las comidas en táper) pasa a cómo se prepara cada una
    expect(leerPiloto({ comidas: ['cena'], desde: lunes })?.preparar).toMatchObject({
      comida: 'momento',
      cena: 'taper',
    })
    expect(leido?.compra).toEqual({ dia: 5, hora: '10:00' })
  })
})
