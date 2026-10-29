import type { WeakMuscle } from './weakPoints.ts'

// Lo que enseña el desplegable de una fila que se puede cambiar: los datos y qué pasa al elegir. El caso de uso
// slotPanel() lo construye con lo que has elegido; el componente SlotPanel solo lo pinta.

export type SlotPanelModel =
  | {
      kind: 'optional'
      muscle: string
      /** Por qué entra o no por defecto. */
      reason: string | null
      why: 'rule' | 'hand' | 'time' | null
      off: boolean
      minutes: number | null
      onSet: (include: boolean) => void
      /** Ejercicio original del hueco y los que el documento permite en su lugar. */
      original: string
      options: string[]
      value: string | null
      onPick: (name: string | null) => void
    }
  | {
      kind: 'weak'
      which: 1 | 2
      muscles: WeakMuscle[]
      muscle: string | null
      value: string | null
      onMuscle: (id: string) => void
      onOption: (en: string | null) => void
    }
  | {
      kind: 'pick'
      /** «2 o 3 y siempre los mismos»: la recomendación del programa. */
      recommendation: string
      muscles: WeakMuscle[]
      muscle: string | null
      value: string | null
      onMuscle: (id: string) => void
      onOption: (en: string | null) => void
    }
