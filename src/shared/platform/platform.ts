// Todo lo que depende del dispositivo. Las pantallas y los casos de uso usan esta interfaz;
// la versión web la implementa con las API del navegador y la de Capacitor con sus complementos.

export type Haptic = 'light' | 'medium' | 'success' | 'warning' | 'error'
export type Sound = 'click' | 'twoNotes' | 'risingThree' | 'threeBeeps'

export interface Platform {
  /** Vibración. En iPhone (web) no hace nada: Safari no permite vibrar. */
  haptic(kind: Haptic): void
  sound(kind: Sound): void
  /** Pantalla siempre encendida durante la sesión. */
  keepScreenOn(on: boolean): Promise<void>
  /** Aviso del sistema (fin del descanso con la app en segundo plano). */
  notify(title: string, body: string): Promise<void>
  saveFile(fileName: string, contents: Blob): Promise<void>
  pickFile(accept: string): Promise<File | null>
}
