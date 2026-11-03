/**
 * El esfuerzo de una serie sin siglas (documento de rediseño: «RIR 2» = «a 2 del fallo»).
 * Se guarda en RIR (repeticiones que quedan); en pantalla se dice así.
 */
export function effortLabel(rir: number): string {
  return rir <= 0 ? 'al fallo' : `a ${rir} del fallo`
}

/**
 * Un texto del contenido sin la sigla (ficha-ejercicio.js · plainRir del prototipo): «RIR 2» → «a 2 del fallo»,
 * «RIR 1–2» → «a 1–2 del fallo», «RIR 0» → «al fallo»; con mayúscula si empieza la frase.
 */
export function plainEffort(text: string): string {
  // «a RIR 2» y «0–3 RIR» también («a» ya va en las palabras); «al fallo o fallo» se queda en «al fallo»
  return text
    .replace(
      /\b(?:a )?RIR (\d+(?:–\d+)?)|\b(\d+(?:–\d+)?) RIR\b/g,
      (_, n1: string, n2: string, at: number) => {
        const n = n1 ?? n2
        const words = n === '0' ? 'al fallo' : `a ${n} del fallo`
        return /(^|[.!?:]\s*)$/.test(text.slice(0, at))
          ? words.charAt(0).toUpperCase() + words.slice(1)
          : words
      },
    )
    .replace(/al fallo o fallo/g, 'al fallo')
}
