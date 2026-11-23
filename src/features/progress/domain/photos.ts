// Tus fotos de progreso: frente, perfil y espalda, con la misma luz, distancia y postura relajada
// (docs/conocimiento/01-contenido.md § 9). Aquí, las posturas y qué es una foto (la de antes y la de ahora, en stage.ts).

export const POSES = [
  { id: 'frente', nombre: 'Frente' },
  { id: 'perfil', nombre: 'Perfil' },
  { id: 'espalda', nombre: 'Espalda' },
] as const

export type Pose = (typeof POSES)[number]['id']

/** Una foto: su día y su postura (la imagen va aparte). */
export type Foto = { id: string; date: string; pose: Pose }

/** Tus fotos de una postura, una por mes (la última de cada mes), del primer mes al último. */
export function fotosPorMes<T extends Foto>(fotos: readonly T[], pose: Pose): { mes: string; foto: T }[] {
  const porMes = new Map<string, T>()
  for (const f of [...fotos].sort((a, b) => a.date.localeCompare(b.date)))
    if (f.pose === pose) porMes.set(f.date.slice(0, 7), f)
  return [...porMes.entries()]
    .map(([mes, foto]) => ({ mes, foto }))
    .sort((a, b) => a.mes.localeCompare(b.mes))
}
