import { feedback, platform, type Moment } from '../../../shared/platform/index.ts'

// Sonido y vibración de la sesión en curso, y la pantalla encendida mientras dura.
// Hasta que el perfil tenga sus preferencias, suena y vibra siempre.
const PREFS = { sound: true, vibration: true }

/** Vibra y suena según el momento (serie apuntada, mejor que la vez anterior, récord, fin del descanso, error). */
export function avisar(momento: Moment): void {
  feedback(platform, momento, PREFS)
}

/** Pide que la pantalla no se apague durante la sesión (y lo suelta al salir). */
export function pantallaEncendida(on: boolean): void {
  void platform.keepScreenOn(on)
}

/** Comparte el resumen de la sesión (o lo copia si el móvil no deja compartir). */
export function compartir(titulo: string, texto: string) {
  return platform.share(titulo, texto)
}
