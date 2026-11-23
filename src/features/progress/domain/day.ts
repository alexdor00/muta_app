// Un día de entreno en Progreso: lo que hiciste en cada ejercicio frente a la vez anterior que lo hiciste.

type EntrenoConSeries<S> = { fecha: string; ejercicios: readonly { nombre: string; series: readonly S[] }[] }

/** La vez anterior a un día en la que hiciste un ejercicio: su día y sus series. null si no lo habías hecho antes. */
export function laVezAnterior<S>(
  entrenos: readonly EntrenoConSeries<S>[],
  nombre: string,
  fecha: string,
): { fecha: string; series: readonly S[] } | null {
  let mejor: { fecha: string; series: readonly S[] } | null = null
  for (const x of entrenos) {
    if (x.fecha >= fecha || (mejor && x.fecha <= mejor.fecha)) continue
    const ej = x.ejercicios.find((e) => e.nombre === nombre && e.series.length)
    if (ej) mejor = { fecha: x.fecha, series: ej.series }
  }
  return mejor
}
