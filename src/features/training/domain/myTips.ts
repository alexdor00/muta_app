// Los consejos de antes de empezar que ocultas en «Consejos de hoy». Los originales no se tocan: lo oculto se guarda aparte.

export type AjustesConsejos = {
  /** Claves de los ocultos. */
  ocultos: string[]
}

export const SIN_AJUSTES: AjustesConsejos = { ocultos: [] }

/** Un consejo de antes de empezar con su clave («b0»…, por su puesto) y si lo ocultaste. */
export type MiConsejo = { clave: string; text: string; why: string; oculto: boolean }

export function misConsejos(base: readonly { text: string; why: string }[], a: AjustesConsejos): MiConsejo[] {
  return base.map((c, i) => ({
    clave: `b${i}`,
    text: c.text,
    why: c.why,
    oculto: a.ocultos.includes(`b${i}`),
  }))
}
