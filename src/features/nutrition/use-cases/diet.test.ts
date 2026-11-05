// El dominio de la dieta con la base de alimentos de verdad (por eso va aquí: el dominio no lee contenido).
import { describe, expect, it } from 'vitest'
import foods from '../../../shared/content/foods.json'
import type { Alimento } from '../domain/food.ts'
import {
  aArchivo,
  ajusteDe,
  diaDeDieta,
  diaDelCiclo,
  dietaNueva,
  inicioSi,
  leerDieta,
  mediaDelTipo,
  menuDe,
  recetaDelDia,
  repartoSinRutina,
  semanaDeDieta,
  siguienteMenu,
  type DietaActiva,
} from '../domain/diet.ts'
import { dietaDeEjemplo } from '../domain/dietSample.ts'

const base = foods as Alimento[]
const ejemplo = dietaDeEjemplo(base)
if (!ejemplo) throw new Error('falta un alimento de la dieta de ejemplo en la base')

const activa = (extra: Partial<DietaActiva> = {}): DietaActiva => ({
  id: 'dieta',
  target: 'nutricion',
  dieta: ejemplo,
  inicio: '2026-11-05',
  ajustes: [],
  tipoElegido: {},
  factorArroz: 3,
  originales: {},
  ...extra,
})

describe('el ciclo de la dieta', () => {
  it('cuenta el día del menú y la semana desde el inicio', () => {
    expect(diaDelCiclo('2026-11-05', '2026-11-05')).toBe(1)
    expect(diaDelCiclo('2026-11-05', '2026-11-11')).toBe(7)
    expect(diaDelCiclo('2026-11-05', '2026-11-12')).toBe(1)
    expect(diaDelCiclo('2026-11-05', '2026-11-04')).toBe(7)
    expect(semanaDeDieta('2026-11-05', '2026-11-18')).toBe(2)
    expect(inicioSi('2026-11-05', 3)).toBe('2026-11-03')
  })

  it('A A B B C C A, como en el prototipo', () => {
    const menus = Array.from({ length: 7 }, (_, i) => menuDe(ejemplo, '2026-11-01', `2026-11-0${i + 1}`).id)
    expect(menus).toEqual(['A', 'A', 'B', 'B', 'C', 'C', 'A'])
  })
})

describe('la receta de cada tipo de día', () => {
  const pollo = ejemplo.recetas.find((r) => r.id === 'pollo_arroz')
  if (!pollo) throw new Error('sin receta')

  it('entreno 681 kcal; descanso, con 60 g de arroz, 539', () => {
    expect(recetaDelDia(pollo, 'entreno').total.kcal).toBe(681)
    const descanso = recetaDelDia(pollo, 'descanso')
    expect(descanso.total.kcal).toBe(539)
    expect(descanso.lista.find((i) => i.ajusta)?.cambia).toBe(true)
  })

  it('las kcal de la consulta van al arroz, de 5 en 5', () => {
    const mas = recetaDelDia(pollo, 'entreno', 150)
    // 150 kcal ÷ 3,55 kcal/g = 42 g → 140 g
    expect(mas.lista.find((i) => i.ajusta)?.g).toBe(140)
    expect(recetaDelDia(pollo, 'entreno', -1000).lista.find((i) => i.ajusta)?.g).toBe(0)
  })

  it('las raciones multiplican los gramos', () => {
    expect(recetaDelDia(pollo, 'entreno', 0, 2).lista[0].g).toBe(340)
  })
})

describe('el día con tu dieta', () => {
  it('entreno: menú A, batido, merienda y preentreno (2.149 kcal); descanso, sin preentreno', () => {
    const entreno = diaDeDieta(activa(), '2026-11-05', 'entreno')
    expect(entreno.menu.id).toBe('A')
    expect(entreno.recetas.map((r) => r.id)).toEqual([
      'batido',
      'pollo_arroz',
      'merienda',
      'preentreno',
      'salmon_patata',
    ])
    expect(entreno.total.kcal).toBe(2149)
    const descanso = diaDeDieta(activa(), '2026-11-05', 'descanso')
    expect(descanso.recetas.some((r) => r.id === 'preentreno')).toBe(false)
    expect(descanso.total.kcal).toBe(1780)
  })

  it('un ajuste vale desde su día y la fase suma sus kcal', () => {
    const a = activa({
      ajustes: [
        { id: 'a1', desde: '2026-11-06', kcal: { entreno: 150, descanso: 0 }, pasos: 10000, fase: 'f2' },
      ],
    })
    expect(ajusteDe(a, '2026-11-05').kcal.entreno).toBe(0)
    // +150 de la fase 2 y +150 del ajuste → arroz de 100 a 185 g (300 kcal ÷ 3,55 = 84,5 → 185)
    const dia = diaDeDieta(a, '2026-11-06', 'entreno')
    expect(dia.recetas.find((r) => r.id === 'pollo_arroz')?.lista.find((i) => i.ajusta)?.g).toBe(185)
  })

  it('la media de entreno del ciclo', () => {
    expect(mediaDelTipo(activa(), '2026-11-05', 'entreno').kcal).toBeGreaterThan(1900)
  })
})

describe('sin rutina, los días de entreno repartidos', () => {
  it('4 días a la semana dan 4 de entreno en 7', () => {
    const dias = Array.from({ length: 7 }, (_, i) => repartoSinRutina(`2026-11-0${i + 2}`, 4))
    expect(dias.filter((d) => d === 'entreno')).toHaveLength(4)
  })
})

describe('el archivo de la dieta', () => {
  it('se guarda y se vuelve a leer igual', () => {
    const leida = leerDieta(JSON.parse(aArchivo(ejemplo)))
    expect(leida).toEqual({ ok: true, dieta: ejemplo })
  })

  it('dice por qué no vale un archivo', () => {
    expect(leerDieta({ format: 'muta-diet' })).toEqual({
      ok: false,
      motivo: 'No es un archivo de dieta de MUTA',
    })
    expect(leerDieta({ ...ejemplo, ciclo: ['A'] })).toMatchObject({ ok: false })
    expect(leerDieta({ ...ejemplo, recetas: [{ ...ejemplo.recetas[0], comida: 'almuerzo' }] })).toMatchObject(
      {
        ok: false,
        motivo: 'Una receta no se puede leer: Pollo con arroz y verduras',
      },
    )
  })

  it('una dieta nueva tiene un menú para todos los días y el siguiente es el B', () => {
    const d = dietaNueva('mia', '  ')
    expect(d.nombre).toBe('Mi dieta')
    expect(d.ciclo).toEqual(Array(7).fill('A'))
    expect(siguienteMenu(d)).toEqual({ id: 'B', nombre: 'Menú B' })
  })
})
