// Una fila que se puede cambiar desde la propia rutina: se pinta en gris más oscuro y, al pulsarla,
// se despliega con las opciones. Los huecos no se borran: se quedan visibles para poder volver a elegir.

export type Slot =
  /**
   * Ejercicio «opcional» de MUTA: entra o no según tus prioridades, el tiempo o lo que decidas. `options` son
   * los ejercicios que el documento permite en ese hueco (en su orden) y `chosen`, el que hayas puesto.
   */
  | {
      kind: 'optional'
      key: string
      off: boolean
      why: 'rule' | 'hand' | 'time' | null
      options: string[]
      chosen: string | null
    }
  /** Hueco de «punto débil» de Culturismo (ejercicio 1 o 2). */
  | { kind: 'weak'; which: 1 | 2; filled: boolean }
  /** Hueco de «tus puntos débiles» de Torso y pierna: uno por día. */
  | { kind: 'pick'; day: string; filled: boolean }
