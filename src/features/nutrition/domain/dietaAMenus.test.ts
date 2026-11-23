// Tu dieta como tus menús, exacta (usuario, 2026-11-17).
import { describe, expect, it } from 'vitest'
import { dietaDesdeCsv } from './dietCsv.ts'
import { menusDesdeDieta, platoDeReceta, preparacionDeLaDieta } from './dietaAMenus.ts'
import { extrasDe } from './menuExtras.ts'
import { menuDelDia, menuVacio, seCocinaEl } from './menu.ts'

const PLAN = `Menú;Días;Cocinar;Comida;Nombre;Receta;Ingrediente;Gramos entreno;Gramos descanso;kcal total;Proteína total;Hidratos total;Grasa total;Solo
A;1-2 7;1 7;Comida;Comida 1;Egg salad wrap;Tortillas de trigo;120;120;360;10;60;8,6;
A;;;Cena;Comida 2;Burrito bowl;Arroz (en crudo);130;80;464,1;9;102,7;0,8;
B;3-4;3;Comida;Comida 1;Butter chicken;Arroz basmati (en crudo);110;65;392,7;7,6;86,9;0,7;
C;5-6;5;Comida;Comida 1;Shakshuka;Pan de barra;145;80;377;13;72,5;2,2;
Todos;;;Merienda;Batido;Batido;Plátano;120;120;105;1;27;0,4;
Todos;;;Merienda;Preentreno;Preentreno;Miel;20;20;65;0;17;0;Entreno`

const dieta = dietaDesdeCsv(PLAN, 'Fase 1', 'fase-1', () => null).dieta!
const lunes = '2026-11-16'
const { menus, ciclo } = menusDesdeDieta(dieta, lunes, (r) => `dieta-${r.id}`)
const m = { ...menuVacio(), menus, ciclo }

describe('la dieta como tus menús', () => {
  it('un menú tuyo por menú de la dieta, con su receta en cada comida y los gramos tal cual', () => {
    expect(menus.map((x) => x.nombre)).toEqual(['A', 'B', 'C'])
    expect(menus[0].platos).toMatchObject({
      comida: 'dieta-a-comida-egg-salad-wrap',
      cena: 'dieta-a-cena-burrito-bowl',
    })
    expect(menus[0].fijos).toEqual(['desayuno', 'comida', 'merienda', 'cena'])
  })
  it('el batido es la merienda de todos los días y el preentreno, un extra solo de entreno', () => {
    for (const x of menus) expect(x.platos.merienda).toBe('dieta-todos-merienda-batido')
    const tipo = (f: string) => (f === lunes ? 'entreno' : 'descanso')
    expect(extrasDe(m, lunes, 'merienda', tipo).map((x) => x.solo)).toEqual(['entreno'])
    expect(extrasDe(m, '2026-11-17', 'merienda', tipo)).toEqual([])
  })
  it('el ciclo de la dieta (A A B B C C A, aunque cambie la semana) y sus días de cocinar', () => {
    expect(ciclo.menus).toEqual(['A', 'A', 'B', 'B', 'C', 'C', 'A'])
    expect(menuDelDia(m, '2026-11-18')?.id).toBe('B')
    expect(seCocinaEl(ciclo, lunes)).toBe(true)
    expect(seCocinaEl(ciclo, '2026-11-17')).toBe(false)
    expect(seCocinaEl(ciclo, '2026-11-18')).toBe(true)
  })
  it('el plato guarda los gramos de descanso (el arroz baja de 130 a 80 g)', () => {
    const bowl = dieta.recetas.find((r) => r.nombre === 'Burrito bowl')!
    expect(platoDeReceta(bowl).gramosDescanso).toEqual([80])
    const wrap = dieta.recetas.find((r) => r.nombre === 'Egg salad wrap')!
    expect(platoDeReceta(wrap).gramosDescanso).toBeUndefined()
  })
})

describe('cómo se prepara cada plato', () => {
  it('lee «Preparar» y «Al momento» del CSV', () => {
    const csv = [
      'Menú;Días;Cocinar;Comida;Receta;Ingrediente;Gramos;kcal;Proteína;Hidratos;Grasa;Preparar;Al momento',
      'A;1-2;1;Comida;Arroz con merluza;Arroz;80;354;7;78;1;Antelación;',
      'A;;;Comida;Arroz con merluza;Merluza;150;80;17;0;1;;sí',
      'A;;;Cena;Tortilla;Huevos;120;143;12;1;10;Al momento;',
      'A;;;Desayuno;Avena;Avena;60;370;13;60;7;Antelación;',
    ].join(String.fromCharCode(10))
    const r = dietaDesdeCsv(csv, 'D', 'd1', () => null)
    expect(r.errores).toEqual([])
    const p = preparacionDeLaDieta(r.dieta!.recetas)
    const id = (n: string) => Object.keys(p.porPlato).find((k) => k.includes(n))!
    expect(p.porPlato[id('merluza')]).toBe('mixto')
    expect(p.frescos[id('merluza')]).toEqual(['Merluza'])
    expect(p.porPlato[id('tortilla')]).toBe('momento')
    expect(p.porPlato[id('avena')]).toBe('taper')
  })
})
