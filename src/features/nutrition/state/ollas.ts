import { signal } from '@preact/signals'
import { SIN_OLLAS, type Ollas } from '../domain/ollas.ts'

export { pesoDeLaComida, rindeDe, type ModoReparto, type Olla } from '../domain/ollas.ts'

/** Tus ollas y la última de cada receta (`use-cases/ollas.ts` las carga y guarda). */
export const ollas = signal<Ollas>(SIN_OLLAS)

/** «Ahora no» al aviso de pesar la olla: ese día ya no sale (en memoria). */
export const avisoOllaFuera = signal('')
