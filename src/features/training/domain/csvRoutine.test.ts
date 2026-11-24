import { describe, expect, it } from 'vitest'
import { leerRutinaCsv, rutinaParecida, segundosDeDescanso } from './csvRoutine.ts'
import { rirDe, descansoDe } from './workoutPlan.ts'

const CSV = `Sesión;Ejercicio;Series;Repeticiones;RIR;Descanso
Torso;Press banca;3;6-10;2;3:00
Torso;Remo con barra;3;8 a 12;1;2 min
Descanso
Pierna;Sentadilla;4;5;2;180
Pierna;"Curl femoral; sentado";3;10-15;1;90 s`

describe('leerRutinaCsv', () => {
  it('las sesiones en orden, sus ejercicios con su pauta y los descansos donde van', () => {
    const r = leerRutinaCsv(CSV)
    expect(r.errores).toEqual([])
    expect([r.sesiones, r.ejercicios]).toEqual([2, 4])
    const dias = r.programa.blocks[0].weeks[0].days
    expect(dias.map((d) => ('rest' in d ? 'descanso' : d.name))).toEqual(['Torso', 'descanso', 'Pierna'])
    const [press, remo] = 'exercises' in dias[0] ? dias[0].exercises : []
    expect(press).toMatchObject({ name: 'Press banca', sets: 3, reps: '6-10' })
    expect(rirDe(press.rpe)).toBe(2)
    expect(descansoDe(press.rest)).toBe(180)
    expect(remo.reps).toBe('8-12')
    const curl = 'exercises' in dias[2] ? dias[2].exercises[1] : null
    expect(curl?.name).toBe('Curl femoral; sentado')
    expect(descansoDe(curl?.rest)).toBe(90)
  })
  it('también con comas y sin las columnas que no hacen falta', () => {
    const r = leerRutinaCsv('sesion,ejercicio\nA,Press banca\nA,Remo')
    expect(r.errores).toEqual([])
    expect(r.ejercicios).toBe(2)
  })
  it('dice qué falla y en qué fila', () => {
    expect(leerRutinaCsv('').errores[0]).toMatch(/vacío/)
    expect(leerRutinaCsv('nombre;series\nPress;3').errores).toEqual(['Falta la columna «sesión».'])
    expect(leerRutinaCsv('sesion;ejercicio;series;rir;descanso\nA;Press;tres;12;mucho').errores).toEqual([
      'Fila 2: «tres» no es un número de series.',
      'Fila 2: el RIR «12» tiene que ser de 0 a 9.',
      'Fila 2: no entiendo el descanso «mucho» (2:30, 90 s o 2 min).',
    ])
  })
})

describe('segundosDeDescanso', () => {
  it('reloj, segundos o minutos', () => {
    expect(segundosDeDescanso('2:30')).toBe(150)
    expect(segundosDeDescanso('90')).toBe(90)
    expect(segundosDeDescanso('3')).toBe(180)
    expect(segundosDeDescanso('1,5 min')).toBe(90)
    expect(segundosDeDescanso('45 s')).toBe(45)
    expect(segundosDeDescanso('nada')).toBeNull()
  })
})

describe('repeticiones serie a serie en el CSV', () => {
  it('«4,6,8» vale: cada serie distinta', () => {
    const r = leerRutinaCsv('sesion;ejercicio;series;repeticiones\nPierna;Sentadilla hack;3;4,6,8')
    expect(r.errores).toEqual([])
    const d = r.programa.blocks[0].weeks[0].days[0]
    expect('exercises' in d ? d.exercises[0].reps : null).toBe('4,6,8')
  })
})

describe('¿es tu rutina de antes? (usuario, 2026-11-23)', () => {
  const programa = leerRutinaCsv(CSV).programa
  const mia = (id: string, title: string, csv = CSV) => ({ ...leerRutinaCsv(csv).programa, id, title })
  const otra = mia('mia:2', 'Fuerza', 'Sesión;Ejercicio;Series;Repeticiones\nDía;Peso muerto;3;5')

  it('se llama igual (sin mayúsculas, tildes ni espacios de más): la misma', () => {
    expect(
      rutinaParecida(
        '  mi RUTINA  ',
        leerRutinaCsv('Sesión;Ejercicio;Series;Repeticiones\nA;Curl;3;10').programa,
        [mia('mia:1', 'Mi rutina')],
      )?.id,
    ).toBe('mia:1')
    expect(rutinaParecida('Definición', programa, [mia('mia:1', 'Definicion')])?.id).toBe('mia:1')
  })

  it('lleva los mismos ejercicios aunque se llame distinto: la misma', () => {
    expect(rutinaParecida('Otro nombre', programa, [otra, mia('mia:1', 'X')])?.id).toBe('mia:1')
  })

  it('ni el nombre ni los ejercicios: no se pregunta', () => {
    expect(rutinaParecida('Nueva', programa, [otra])).toBeNull()
    expect(rutinaParecida('Nueva', programa, [])).toBeNull()
  })

  it('si hay varias, la más reciente', () => {
    expect(rutinaParecida('X', programa, [mia('mia:1', 'X'), mia('mia:5', 'X')])?.id).toBe('mia:5')
  })
})
