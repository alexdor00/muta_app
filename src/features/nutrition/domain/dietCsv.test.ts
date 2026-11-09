import { describe, expect, it } from 'vitest'
import { dietaDesdeCsv } from './dietCsv.ts'
import type { Alimento } from './food.ts'

const arroz: Alimento = {
  id: 'f_arroz',
  name: 'Arroz blanco',
  category: 'Cereales',
  kcal: 354,
  protein: 7,
  carbs: 78,
  fat: 1,
  servingG: 80,
  servingLabel: '1 ración',
}
const buscar = (n: string) => (/arroz/i.test(n) ? arroz : null)

const CSV = `Menú;Comida;Receta;Ingrediente;Gramos entreno;Gramos descanso;kcal;Proteína;Hidratos;Grasa;Días
A;Comida;Arroz con pollo;Arroz;100;70;;;;;1 3 5
A;Comida;Arroz con pollo;Pechuga de pollo;150;150;110;23;0;1,5;
B;Cena;Tortilla;Huevo;120;120;143;12,6;0,7;9,5;2`

describe('dietaDesdeCsv', () => {
  it('menús, recetas e ingredientes; los valores que faltan, de la base; el ciclo con los días de cada menú', () => {
    const r = dietaDesdeCsv(CSV, 'Mi dieta', 'csv-1', buscar)
    expect(r.errores).toEqual([])
    expect(r.recetas).toBe(2)
    const d = r.dieta!
    expect(d.menus.map((m) => m.nombre)).toEqual(['A', 'B'])
    expect(d.ciclo.slice(0, 5)).toEqual(['a', 'b', 'a', 'a', 'a'])
    const arrozConPollo = d.recetas.find((x) => x.nombre === 'Arroz con pollo')!
    expect(arrozConPollo.comida).toBe('comida')
    expect(arrozConPollo.ingredientes[0]).toMatchObject({
      nombre: 'Arroz blanco',
      alimentoId: 'f_arroz',
      gramos: { entreno: 100, descanso: 70 },
      ajusta: true,
    })
    expect(arrozConPollo.ingredientes[1].por100).toEqual({ kcal: 110, protein: 23, carbs: 0, fat: 1.5 })
  })

  it('dice qué fila falla: comida que no existe, sin gramos o un alimento que no está en la base', () => {
    const malo = `Menú;Comida;Receta;Ingrediente;Gramos
A;Brunch;X;Arroz;100
A;Cena;X;Arroz;
A;Cena;X;Quinoa rara;50`
    const r = dietaDesdeCsv(malo, 'Mala', 'csv-2', buscar)
    expect(r.dieta).toBeNull()
    expect(r.errores).toHaveLength(3)
    expect(r.errores[0]).toContain('Fila 2')
    expect(r.errores[2]).toContain('Quinoa rara')
  })

  it('sin las columnas que hacen falta, no lee nada', () => {
    expect(dietaDesdeCsv('Menú;Receta\nA;X', 'x', 'x', buscar).errores[0]).toContain('comida')
  })
})
