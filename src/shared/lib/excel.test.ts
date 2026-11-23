import { describe, expect, it } from 'vitest'
import { crc32, libroExcel, zipSinComprimir } from './excel.ts'

const texto = (b: Uint8Array) => new TextDecoder().decode(b)

describe('excel', () => {
  it('crc32 da el valor de referencia', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926)
  })

  it('el zip empieza y acaba con sus firmas y guarda el contenido tal cual', () => {
    const z = zipSinComprimir([['a.txt', new TextEncoder().encode('hola')]])
    expect([...z.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04])
    expect([...z.slice(-22, -18)]).toEqual([0x50, 0x4b, 0x05, 0x06])
    expect(texto(z)).toContain('hola')
  })

  it('el libro lleva su hoja, el título unido a todo el ancho y el texto escapado', () => {
    const z = texto(
      libroExcel(
        'La compra',
        [5, 30, 12, 20],
        [
          { tipo: 'titulo', celdas: ['La compra'] },
          { tipo: 'seccion', celdas: ['Fruta'] },
          { tipo: 'fila', celdas: ['☐', 'Pan & sal', '455 g', ''] },
        ],
      ),
    )
    expect(z).toContain('xl/worksheets/sheet1.xml')
    expect(z).toContain('<mergeCell ref="A1:D1"/>')
    expect(z).toContain('<mergeCell ref="A2:D2"/>')
    expect(z).toContain('Pan &amp; sal')
    expect(z).toContain('<sheet name="La compra"')
  })
})
