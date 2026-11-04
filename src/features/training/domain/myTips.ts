// «Mis consejos»: los consejos de antes de empezar con lo que cambias tú (ocultar, cambiar el texto, añadir los tuyos).
// Los originales no se tocan: tus cambios se guardan aparte y se aplican al enseñarlos.

export type AjustesConsejos = {
  /** Claves de los ocultos. */
  ocultos: string[]
  /** Texto cambiado, por clave. */
  editados: Record<string, string>
  /** Los tuyos, en el orden en que los añadiste. */
  propios: { clave: string; text: string }[]
}

export const SIN_AJUSTES: AjustesConsejos = { ocultos: [], editados: {}, propios: [] }

export type MiConsejo = {
  /** «b0»…«b8» los de MUTA (por su puesto); «p…» los tuyos. */
  clave: string
  text: string
  why: string
  propio: boolean
  oculto: boolean
  /** ¿Cambiaste el texto de uno de MUTA? */
  editado: boolean
}

/** Los de MUTA y, detrás, los tuyos, con tus cambios. Incluye los ocultos (marcados): la hoja los enseña para volver a activarlos. */
export function misConsejos(base: readonly { text: string; why: string }[], a: AjustesConsejos): MiConsejo[] {
  const de = (clave: string, text: string, why: string, propio: boolean): MiConsejo => ({
    clave,
    text: a.editados[clave] ?? text,
    why,
    propio,
    oculto: a.ocultos.includes(clave),
    editado: !propio && clave in a.editados,
  })
  return [
    ...base.map((c, i) => de(`b${i}`, c.text, c.why, false)),
    ...a.propios.map((p) => de(p.clave, p.text, '', true)),
  ]
}
