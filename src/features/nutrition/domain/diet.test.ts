// La dieta con recetas hechas a mano (las cifras de la base de verdad, en use-cases/diet.test.ts).
import { describe, expect, it } from 'vitest'
import {
  aArchivo,
  ajusteDe,
  diaDeDieta,
  diaDelCiclo,
  dietaNueva,
  inicioSi,
  leerDieta,
  menuDe,
  recetaDelDia,
  recetaQueAjusta,
  recetasDe,
  repartoSinRutina,
  semanaDeDieta,
  siguienteMenu,
  type Dieta,
  type DietaActiva,
  type Ingrediente,
  type Receta,
} from './diet.ts'

const ing = (nombre: string, kcal: number, entreno: number, descanso = entreno): Ingrediente => ({
  nombre,
  alimentoId: nombre,
  categoria: 'Cereales',
  por100: { kcal, protein: 10, carbs: 10, fat: 1 },
  gramos: { entreno, descanso },
  ajusta: entreno !== descanso,
  nota: '',
})

const receta = (
  id: string,
  menu: string | null,
  comida: Receta['comida'],
  ingredientes: Ingrediente[],
  soloEntreno = false,
): Receta => ({
  id,
  nombre: id,
  comida,
  rotulo: id,
  menu,
  soloEntreno,
  ingredientes,
  pasos: [],
  notas: [],
  propia: false,
})

const dieta: Dieta = {
  ...dietaNueva('d', 'Prueba'),
  menus: [
    { id: 'A', nombre: 'Menú A' },
    { id: 'B', nombre: 'Menú B' },
  ],
  ciclo: ['A', 'A', 'B', 'B', 'A', 'A', 'B'],
  recetas: [
    receta('cena-a', 'A', 'cena', [ing('pescado', 100, 200)]),
    receta('comida-a', 'A', 'comida', [ing('arroz', 400, 100, 50), ing('sal', 0, 0)]),
    receta('batido', null, 'desayuno', [ing('leche', 50, 300)]),
    receta('pre', null, 'merienda', [ing('miel', 300, 20)], true),
  ],
  fases: [{ id: 'f2', nombre: 'Fase 2', desdeSemana: 5, kcal: 100 }],
}

const activa: DietaActiva = {
  id: 'dieta',
  target: 'nutricion',
  dieta,
  inicio: '2026-11-02',
  ajustes: [],
  tipoElegido: {},
  factorArroz: 3,
  originales: {},
}

describe('el ciclo', () => {
  it('día y semana desde el inicio; el menú de cada día', () => {
    expect(diaDelCiclo('2026-11-02', '2026-11-09')).toBe(1)
    expect(semanaDeDieta('2026-11-02', '2026-11-09')).toBe(2)
    expect(inicioSi('2026-11-05', 1)).toBe('2026-11-05')
    expect(menuDe(dieta, '2026-11-02', '2026-11-04').id).toBe('B')
  })
})

describe('las recetas del día', () => {
  it('por comidas; el preentreno, solo si entrenas', () => {
    expect(recetasDe(dieta, 'A', 'entreno').map((r) => r.id)).toEqual(['batido', 'comida-a', 'pre', 'cena-a'])
    expect(recetasDe(dieta, 'A', 'descanso').map((r) => r.id)).toEqual(['batido', 'comida-a', 'cena-a'])
  })

  it('la que ajusta es la primera del menú con un ingrediente que ajusta', () => {
    expect(recetaQueAjusta(dieta, 'A')?.id).toBe('comida-a')
    expect(recetaQueAjusta(dieta, 'B')).toBeNull()
  })

  it('entreno y descanso, y las kcal de más al ingrediente que ajusta (de 5 en 5)', () => {
    const r = dieta.recetas[1]
    expect(recetaDelDia(r, 'entreno').total.kcal).toBe(400)
    expect(recetaDelDia(r, 'descanso').total.kcal).toBe(200)
    // +100 kcal a 4 kcal/g = 25 g
    expect(recetaDelDia(r, 'entreno', 100).lista[0].g).toBe(125)
  })

  it('un ajuste vale desde su día; la fase suma', () => {
    const a: DietaActiva = {
      ...activa,
      ajustes: [
        { id: 'x', desde: '2026-11-10', kcal: { entreno: 100, descanso: 0 }, pasos: 12000, fase: 'f2' },
      ],
    }
    expect(ajusteDe(a, '2026-11-09').pasos).toBe(10000)
    const dia = diaDeDieta(a, '2026-11-10', 'entreno')
    expect(dia.pasos).toBe(12000)
    // +100 del ajuste y +100 de la fase: arroz 100 + 50 g
    expect(dia.recetas.find((r) => r.id === 'comida-a')?.lista[0].g).toBe(150)
  })
})

describe('sin rutina', () => {
  it('reparte los días de entreno: 3 de 7', () => {
    const dias = Array.from({ length: 7 }, (_, i) => repartoSinRutina(`2026-11-0${i + 2}`, 3))
    expect(dias.filter((d) => d === 'entreno')).toHaveLength(3)
  })
})

describe('el archivo', () => {
  it('se guarda y se lee igual', () => {
    expect(leerDieta(JSON.parse(aArchivo(dieta)))).toEqual({ ok: true, dieta })
  })

  it('no vale sin formato, con un ciclo que no es de 7 o con un menú que no existe', () => {
    expect(leerDieta(null)).toMatchObject({ ok: false })
    expect(leerDieta({ ...dieta, version: 2 })).toEqual({
      ok: false,
      motivo: 'Es de una versión de MUTA más nueva',
    })
    expect(leerDieta({ ...dieta, ciclo: ['A', 'C', 'A', 'A', 'A', 'A', 'A'] })).toMatchObject({ ok: false })
    expect(leerDieta({ ...dieta, menus: [] })).toEqual({ ok: false, motivo: 'La dieta no trae menús' })
  })

  it('una nueva y el siguiente menú libre', () => {
    expect(siguienteMenu(dieta)).toEqual({ id: 'C', nombre: 'Menú C' })
  })
})
