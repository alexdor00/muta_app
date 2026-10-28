// Una fila que se puede cambiar desde la propia rutina: se pinta con un tono suave y, al pulsarla,
// se despliega con las opciones. Los huecos no se borran: se quedan visibles para poder volver a elegir.

export type Slot =
  /** Ejercicio opcional de MUTA: entra o no según tus prioridades, el tiempo o lo que decidas. */
  | { kind: 'optional'; key: string; off: boolean; why: 'rule' | 'hand' | 'time' | null }
  /** Hueco de «punto débil» de Culturismo (ejercicio 1 o 2). */
  | { kind: 'weak'; which: 1 | 2; filled: boolean }
  /** Hueco de «tus puntos débiles» de Torso y pierna: uno por día. */
  | { kind: 'pick'; day: string; filled: boolean }
  /** Ejercicio con sustitutos que da el propio programa: puedes dejar el original o poner uno de ellos. */
  | { kind: 'swap'; key: string; options: string[]; chosen: string | null }
