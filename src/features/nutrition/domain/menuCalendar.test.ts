import { describe, expect, it } from 'vitest'
import { calendarioDelMenu } from './menuCalendar.ts'
import { clave, conCocinado, conPlato, menuVacio, type MenuSemanal } from './menu.ts'

// 2026-11-09 es lunes
const lunes = '2026-11-09'

describe('el calendario de tu menú', () => {
  const m0: MenuSemanal = {
    ...conPlato(menuVacio(), 'A', 'comida', 'rec-1'),
    compraEl: { fecha: lunes, hora: '11:00' },
  }
  const m = conCocinado(m0, {
    id: 'c1',
    plato: 'rec-1',
    fecha: lunes,
    hora: '18:00',
    para: [clave(lunes, 'comida')],
  })

  it('lleva cada hora con su alarma antes', () => {
    const ics = calendarioDelMenu(m, [lunes], () => 'Pollo al chipotle', '20261106T120000Z')
    expect(ics).toContain('DTSTART:20261109T110000')
    expect(ics).toContain('SUMMARY:Cocinar: Pollo al chipotle')
    expect(ics).toContain('TRIGGER:-PT30M')
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2)
  })

  it('con tu semana resuelta, también tus tandas y tu compra de cada semana (si quieres esos avisos)', () => {
    const extra = [
      {
        uid: 'tanda-x',
        tipo: 'cocinar' as const,
        fecha: lunes,
        hora: '19:00',
        titulo: 'Cocinar para lun–mié',
        detalle: '',
      },
      {
        uid: 'compra-x',
        tipo: 'compra' as const,
        fecha: lunes,
        hora: '10:00',
        titulo: 'Hacer la compra',
        detalle: '',
      },
    ]
    const ics = calendarioDelMenu(m, [lunes], () => 'Plato', '20261106T120000Z', extra)
    expect(ics).toContain('SUMMARY:Cocinar para lun–mié')
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(4)
    const sinCompra = { ...m, avisos: { ...m.avisos, compra: false } }
    expect(calendarioDelMenu(sinCompra, [lunes], () => 'Plato', '1', extra)).not.toContain('T100000')
  })
})
