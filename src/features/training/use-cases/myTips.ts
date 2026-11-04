import { computed, effect } from '@preact/signals'
import { getDb } from '../../../shared/data/db.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { sinClaves } from '../../../shared/lib/object.ts'
import { misConsejos, type AjustesConsejos } from '../domain/myTips.ts'
import { ajustesConsejos } from '../state/misConsejos.ts'
import { consejosAlEmpezar } from '../state/ordenHoy.ts'
import { CONSEJOS_ANTES } from './sessionTips.ts'

/** Todos los de antes de empezar con tus cambios (también los ocultos, marcados), para la hoja «Mis consejos». */
export const todosMisConsejos = computed(() => misConsejos(CONSEJOS_ANTES, ajustesConsejos.value))

/** Los que se enseñan en «Antes de la primera serie»: sin los ocultos. */
export const consejosAntesVisibles = computed(() => todosMisConsejos.value.filter((c) => !c.oculto))

/** En `userContent`: tus cambios a los consejos de antes de empezar y «Mostrar al empezar». */
const ID = 'consejos-antes'
type Guardado = AjustesConsejos & { id: typeof ID; target: 'consejos'; alEmpezar: boolean }

let cargado = false

/** Carga tus consejos (una vez) y, desde entonces, guarda solo cada cambio. */
export async function cargarMisConsejos(): Promise<void> {
  if (cargado) return
  cargado = true
  try {
    const db = await getDb()
    const g = (await db.get('userContent', ID)) as Guardado | undefined
    if (g) {
      ajustesConsejos.value = { ocultos: g.ocultos, editados: g.editados, propios: g.propios }
      consejosAlEmpezar.value = g.alEmpezar
    }
  } catch (error) {
    logError(error, 'cargar mis consejos')
  }
  let primera = true
  effect(() => {
    const fila: Guardado = {
      id: ID,
      target: 'consejos',
      ...ajustesConsejos.value,
      alEmpezar: consejosAlEmpezar.value,
    }
    // La primera vez solo lee (para que el efecto siga los cambios): no hay nada nuevo que guardar
    if (primera) return void (primera = false)
    void getDb()
      .then((db) => db.put('userContent', fila))
      .catch((error) => logError(error, 'guardar mis consejos'))
  })
}

const cambia = (c: Partial<AjustesConsejos>) => (ajustesConsejos.value = { ...ajustesConsejos.value, ...c })

/** Ocultar o volver a enseñar un consejo. */
export function ocultarConsejo(clave: string, oculto: boolean): void {
  const resto = ajustesConsejos.value.ocultos.filter((k) => k !== clave)
  cambia({ ocultos: oculto ? [...resto, clave] : resto })
}

/** Cambiar el texto de un consejo (vacío o null: vuelve al original). */
export function editarConsejo(clave: string, texto: string | null): void {
  const resto = sinClaves(ajustesConsejos.value.editados, [clave])
  cambia({ editados: texto?.trim() ? { ...resto, [clave]: texto.trim() } : resto })
}

/** Añadir un consejo tuyo al final. */
export function anadirConsejo(texto: string, ahora = Date.now()): void {
  if (!texto.trim()) return
  cambia({ propios: [...ajustesConsejos.value.propios, { clave: `p${ahora}`, text: texto.trim() }] })
}

/** Borrar uno tuyo (con lo que tuviera cambiado u oculto). */
export function borrarConsejo(clave: string): void {
  const a = ajustesConsejos.value
  const editados = sinClaves(a.editados, [clave])
  cambia({
    propios: a.propios.filter((p) => p.clave !== clave),
    ocultos: a.ocultos.filter((k) => k !== clave),
    editados,
  })
}
