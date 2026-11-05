import { describe, expect, it } from 'vitest'
import { isFullScreen, paths, tabOf } from './paths.ts'

describe('isFullScreen', () => {
  it('la sesión en curso y el resumen van a pantalla completa', () => {
    expect(isFullScreen(paths.session('a1'))).toBe(true)
    expect(isFullScreen(paths.summary('a1'))).toBe(true)
  })

  it('la bienvenida y sus pasos van a pantalla completa', () => {
    expect(isFullScreen(paths.welcome)).toBe(true)
    expect(isFullScreen(paths.onboarding(2))).toBe(true)
  })

  it('ver una sesión va a pantalla completa; Tu rutina, no', () => {
    expect(isFullScreen(paths.sessionView('b1'))).toBe(true)
    expect(isFullScreen(paths.routine)).toBe(false)
  })

  it('el inicio de sesión y el resto de Entreno llevan pestañas', () => {
    expect(isFullScreen(paths.sessionStart('a1'))).toBe(false)
    expect(isFullScreen(paths.training)).toBe(false)
    expect(isFullScreen(paths.routine)).toBe(false)
  })

  it('la ficha de un ejercicio va a pantalla completa (con o sin la sesión de la que viene)', () => {
    expect(isFullScreen(paths.exercise('press_banca'))).toBe(true)
    expect(paths.exercise('press_banca', { sesion: 'b1', ejercicio: 2 })).toBe(
      '/entreno/ejercicio/press_banca?sesion=b1&ej=2',
    )
  })
})

describe('Comida', () => {
  it('«Tu objetivo» va a pantalla completa y marca la pestaña Comida; Comida lleva pestañas', () => {
    expect(isFullScreen(paths.nutritionTarget)).toBe(true)
    expect(isFullScreen(paths.nutrition)).toBe(false)
    expect(tabOf(paths.nutritionTarget)).toBe('nutrition')
  })
})

describe('tabOf', () => {
  it('cada ruta marca su pestaña', () => {
    expect(tabOf(paths.today)).toBe('today')
    expect(tabOf(paths.routine)).toBe('training')
    expect(tabOf(paths.exercise('remo'))).toBe('training')
    expect(tabOf(paths.nutrition)).toBe('nutrition')
    expect(tabOf(paths.progress)).toBe('progress')
  })

  it('una ruta que empieza igual no se confunde de pestaña', () => {
    expect(tabOf('/hoyos')).toBe(null)
  })

  it('la bienvenida y el perfil no marcan pestaña', () => {
    expect(tabOf(paths.welcome)).toBe(null)
    expect(tabOf(paths.profile)).toBe(null)
  })
})

describe('secciones de un tipo', () => {
  it('la ruta de una sección cuelga del tipo y marca la pestaña Entreno', () => {
    expect(paths.routineSection('mujer', 'base')).toBe('/entreno/rutinas/mujer/base')
    expect(tabOf(paths.routineSection('mujer', 'todas'))).toBe('training')
  })
})
