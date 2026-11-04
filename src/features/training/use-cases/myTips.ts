import { computed, effect } from '@preact/signals'
import { getDb } from '../../../shared/data/db.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { misConsejos, type AjustesConsejos } from '../domain/myTips.ts'
import { ajustesConsejos } from '../state/misConsejos.ts'
import { consejosAlEmpezar } from '../state/ordenHoy.ts'
import { CONSEJOS_ANTES } from './sessionTips.ts'

/** Los de antes de empezar con lo que ocultaste marcado. */
const todos = computed(() => misConsejos(CONSEJOS_ANTES, ajustesConsejos.value))

/** Los que se enseñan en «Antes de la primera serie»: sin los ocultos. */
export const consejosAntesVisibles = computed(() => todos.value.filter((c) => !c.oculto))

/** Cuántos ocultaste (para «Volver a enseñar»). */
export const consejosOcultos = computed(() => todos.value.length - consejosAntesVisibles.value.length)

/** En `userContent`: los consejos que ocultaste y «Mostrar al empezar». */
const ID = 'consejos-antes'
type Guardado = AjustesConsejos & { id: typeof ID; target: 'consejos'; alEmpezar: boolean }

let cargado = false

/** Carga lo que ocultaste (una vez) y, desde entonces, guarda solo cada cambio. */
export async function cargarMisConsejos(): Promise<void> {
  if (cargado) return
  cargado = true
  try {
    const db = await getDb()
    const g = (await db.get('userContent', ID)) as Guardado | undefined
    if (g) {
      ajustesConsejos.value = { ocultos: g.ocultos ?? [] }
      consejosAlEmpezar.value = g.alEmpezar
    }
  } catch (error) {
    logError(error, 'cargar tus consejos')
  }
  let primera = true
  effect(() => {
    const fila: Guardado = {
      id: ID,
      target: 'consejos',
      ocultos: ajustesConsejos.value.ocultos,
      alEmpezar: consejosAlEmpezar.value,
    }
    // La primera vez solo lee (para que el efecto siga los cambios): no hay nada nuevo que guardar
    if (primera) return void (primera = false)
    void getDb()
      .then((db) => db.put('userContent', fila))
      .catch((error) => logError(error, 'guardar tus consejos'))
  })
}

/** Oculta un consejo de antes de empezar (por su clave). */
export function ocultarConsejo(clave: string): void {
  ajustesConsejos.value = { ocultos: [...ajustesConsejos.value.ocultos.filter((k) => k !== clave), clave] }
}

/** Vuelve a enseñar todos los que ocultaste. */
export function mostrarConsejos(): void {
  ajustesConsejos.value = { ocultos: [] }
}
