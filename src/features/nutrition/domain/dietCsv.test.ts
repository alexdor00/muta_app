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

describe('cualquier dieta en CSV (usuario, 2026-11-17)', () => {
  // Como el «Plan de dieta · Fase 1»: menús de 2 días (el 7 repite A), cocinar el día 1, 3, 5 y 7, el batido todos los
  // días, el preentreno solo los de entreno, el arroz que cambia según el día, cantidades «al gusto» y valores totales
  const PLAN = `Menú;Días;Cocinar;Comida;Nombre;Receta;Ingrediente;Gramos entreno;Gramos descanso;Cantidad;kcal total;Proteína total;Hidratos total;Grasa total;Solo;Paso
A;1-2 7;1 7;Comida;Comida 1;Egg salad wrap;Tortillas de trigo;120;120;2 tortillas;360;10;60;8,6;;
A;;;Comida;Comida 1;Egg salad wrap;Perejil, orégano, sal;;;al gusto;;;;;;
;;;;;Egg salad wrap;;;;;;;;;;Cuece los huevos 10-11 minutos.
A;;;Cena;Comida 2;Burrito bowl;Arroz (en crudo);130;80;;464,1;9;102,7;0,8;;
B;3-4;3;Comida;Comida 1;Butter chicken;Pechuga de pollo (en crudo);180;180;;198;41,4;0;2,7;;
C;5-6;5;Comida;Comida 1;Shakshuka;Pan de barra;145;80;;377;13;72,5;2,2;;
Todos;;;Merienda;Batido;Batido;Plátano;120;120;1 plátano;105;1;27;0,4;;
Todos;;;Merienda;Preentreno;Preentreno;Miel;20;20;;65;0;17;0;Entreno;`
  const r = dietaDesdeCsv(PLAN, 'Fase 1', 'fase-1', () => null)
  const d = r.dieta!

  it('el ciclo de 7 días con A A B B C C A y los días de cocinar', () => {
    expect(r.errores).toEqual([])
    expect(d.ciclo).toEqual(['a', 'a', 'b', 'b', 'c', 'c', 'a'])
    expect(d.cocinar).toEqual([1, 3, 5, 7])
  })
  it('lo de todos los días, solo entreno, su nombre en el menú, pasos y «al gusto»', () => {
    const batido = d.recetas.find((x) => x.nombre === 'Batido')!
    expect(batido).toMatchObject({ menu: null, rotulo: 'Batido', soloEntreno: false })
    expect(d.recetas.find((x) => x.nombre === 'Preentreno')!.soloEntreno).toBe(true)
    const wrap = d.recetas.find((x) => x.nombre === 'Egg salad wrap')!
    expect(wrap.rotulo).toBe('Comida 1')
    expect(wrap.pasos).toEqual(['Cuece los huevos 10-11 minutos.'])
    expect(wrap.ingredientes[1]).toMatchObject({ gramos: null, nota: 'al gusto' })
    expect(wrap.ingredientes[0].nota).toBe('2 tortillas')
  })
  it('los valores totales pasan a 100 g y el arroz, que cambia según el día, es lo que ajusta', () => {
    const bowl = d.recetas.find((x) => x.nombre === 'Burrito bowl')!
    expect(bowl.ingredientes[0].gramos).toEqual({ entreno: 130, descanso: 80 })
    expect(Math.round(bowl.ingredientes[0].por100.kcal)).toBe(357)
    expect(bowl.ingredientes[0].ajusta).toBe(true)
  })
  it('un ciclo de 6 días si la dieta no dice el séptimo', () => {
    const seis = PLAN.replace('A;1-2 7;1 7;', 'A;1-2;1;')
    expect(dietaDesdeCsv(seis, 'x', 'x', () => null).dieta!.ciclo).toEqual(['a', 'a', 'b', 'b', 'c', 'c'])
  })
})
