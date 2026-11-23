import { describe, expect, it } from 'vitest'
import { dietaDesdeCsv } from './dietCsv.ts'
import { resumenDeDieta } from './dietResumen.ts'

const CSV = `Menú;Días;Cocinar;Comida;Nombre;Receta;Ingrediente;Gramos entreno;Gramos descanso;Cantidad;kcal total;Proteína total;Hidratos total;Grasa total;Solo
A;1-2;1;Comida;Comida 1;Wrap;Huevos;110;110;2 huevos (≈110 g, estimado);156;13;1;11;
A;;;Comida;Comida 1;Wrap;Sal;;;al gusto;;;;;
B;3;3;Cena;Comida 2;Bowl;Arroz;130;80;;464;9;102;1;
Todos;;;Desayuno;Batido;Batido;Leche;300;300;;105;10;15;0;
Todos;;;Merienda;Preentreno;Preentreno;Miel;20;20;;65;0;17;0;Entreno`

describe('lo que MUTA ha entendido de tu dieta', () => {
  it('menús, ciclo, días de cocinar, lo de todos los días y lo que hay que revisar', () => {
    const r = dietaDesdeCsv(CSV, 'Prueba', 'csv-1', () => null)
    if (!r.dieta) throw new Error(r.errores.join(' '))
    const x = resumenDeDieta(r.dieta)
    expect(x.menus).toBe(2)
    expect(x.ciclo).toEqual(['A', 'A', 'B'])
    expect(x.cocinar).toEqual([1, 3])
    expect(x.todosLosDias).toEqual(['Batido'])
    expect(x.soloEntreno).toEqual(['Preentreno'])
    expect(x.estimados).toEqual(['Huevos'])
    expect(x.alGusto).toEqual(['Sal'])
  })
})
