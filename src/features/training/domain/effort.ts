/**
 * El esfuerzo de una serie sin siglas (documento de rediseño: «RIR 2» = «a 2 del fallo»).
 * Se guarda en RIR (repeticiones que quedan); en pantalla se dice así.
 */
export function effortLabel(rir: number): string {
  return rir <= 0 ? 'al fallo' : `a ${rir} del fallo`
}
