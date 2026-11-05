import { describe, expect, it } from 'vitest'
import { mismoCodigo, productoDeOff, variantesDeCodigo } from './barcode.ts'

describe('códigos de barras', () => {
  it('prueba el código con y sin el 0 de delante y rellena el EAN-8', () => {
    expect(variantesDeCodigo('0123456789012')).toEqual(['0123456789012', '123456789012'])
    expect(variantesDeCodigo('123456789012')).toEqual(['123456789012', '0123456789012'])
    expect(variantesDeCodigo('1234-5670')).toEqual(['12345670', '0000012345670'])
    expect(variantesDeCodigo('123')).toEqual([])
  })

  it('el mismo código sin los ceros de delante', () => {
    expect(mismoCodigo('0123456789012', '123456789012')).toBe(true)
    expect(mismoCodigo(undefined, '1')).toBe(false)
  })
})

describe('Open Food Facts', () => {
  it('lee el nombre, la marca y los valores por 100 g', () => {
    const p = productoDeOff({
      status: 1,
      product: {
        product_name: 'Skyr natural',
        brands: 'Marca, Otra',
        serving_quantity: '150',
        nutriments: { 'energy-kcal_100g': 63, proteins_100g: 11, carbohydrates_100g: 4, fat_100g: 0.2 },
      },
    })
    expect(p).toEqual({
      nombre: 'Skyr natural',
      marca: 'Marca',
      por100: { kcal: 63, protein: 11, carbs: 4, fat: 0.2 },
      racionG: 150,
    })
  })

  it('las kcal, de los kJ si no vienen; sin un valor, por100 es null', () => {
    const conKj = productoDeOff({
      product: {
        product_name: 'X',
        nutriments: { energy_100g: 418.4, proteins_100g: 1, carbohydrates_100g: 2, fat_100g: 3 },
      },
    })
    expect(conKj?.por100?.kcal).toBe(100)
    expect(
      productoDeOff({ product: { product_name: 'Y', nutriments: { proteins_100g: 1 } } })?.por100,
    ).toBeNull()
  })

  it('no está', () => {
    expect(productoDeOff({ status: 0 })).toBeNull()
    expect(productoDeOff(null)).toBeNull()
  })
})
