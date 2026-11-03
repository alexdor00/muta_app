// Ejercicios que hacen lo mismo: mismo músculo principal, misma zona de énfasis (docs/conocimiento/02-reglas.md · «Zonas
// de énfasis»: estirado o acortado, cabeza larga, pecho superior…) y, si puede ser, el mismo tipo de movimiento.
// La zona sale del nombre (también el original en inglés), con las palabras de esa tabla.
import type { LibraryExercise } from './exerciseLibrary.ts'
import { MUSCLES, type MuscleId } from './muscles.ts'

type Zona = { id: string; label: string; re: RegExp }

/** Las zonas de cada músculo, en orden: gana la primera que encaja. Los músculos sin zonas no se distinguen. */
const ZONAS: Partial<Record<MuscleId, Zona[]>> = {
  pecho: [
    {
      id: 'superior',
      label: 'pecho superior',
      re: /inclinad|abajo arriba|pecho superior|incline|low[- ]to[- ]high/,
    },
    { id: 'medio', label: 'pecho medio e inferior', re: /./ },
  ],
  triceps: [
    {
      id: 'larga',
      label: 'cabeza larga (brazo por encima)',
      re: /sobre la cabeza|katana|de espaldas|banco inclinado|overhead|french press|press franc[eé]s (sentado|con mancuernas)/,
    },
    { id: 'lateral', label: 'cabezas lateral y medial', re: /./ },
  ],
  biceps: [
    {
      id: 'acortado',
      label: 'acortado (predicador)',
      re: /predicador|scott|araña|concentrad|preacher|spider|concentration/,
    },
    {
      id: 'estirado',
      label: 'estirado (brazo por detrás)',
      re: /inclinad|bayesian|por detr[aá]s|incline|behind/,
    },
  ],
  cuadriceps: [
    {
      id: 'recto',
      label: 'recto femoral (extensiones)',
      re: /extensi[oó]n de cu[aá]driceps|sissy|n[oó]rdico inverso|leg extension|reverse nordic/,
    },
    { id: 'vastos', label: 'vastos (sentadillas y prensas)', re: /./ },
  ],
  femoral: [
    { id: 'curl', label: 'curl femoral', re: /curl|n[oó]rdico|gl[uú]teo-isquio|glute-ham|nordic/ },
    { id: 'estirado', label: 'estirado (bisagras)', re: /./ },
  ],
  gluteo: [
    {
      id: 'acortado',
      label: 'acortado (hip thrust y abducción)',
      re: /hip thrust|puente|abducci|patada|rana|kickback|bridge|abduction|frog|clam|almeja/,
    },
    { id: 'estirado', label: 'estirado (bisagras y sentadillas)', re: /./ },
  ],
  dorsal: [
    { id: 'remo', label: 'remos', re: /remo|row/ },
    { id: 'vertical', label: 'tirones verticales y pullover', re: /./ },
  ],
}

/** La zona de un ejercicio dentro de su músculo, o null si ese músculo no tiene zonas. */
export function zonaDe(musculo: MuscleId | null, ...nombres: (string | undefined)[]): Zona | null {
  const zonas = musculo ? ZONAS[musculo] : undefined
  if (!zonas) return null
  const texto = nombres.filter(Boolean).join(' · ').toLowerCase()
  return zonas.find((z) => z.re.test(texto)) ?? null
}

/** Lo que se sabe del ejercicio que se quiere cambiar. */
export type Objetivo = {
  nombre: string
  /** El nombre original (inglés), si lo trae la rutina. */
  original?: string
  musculo: MuscleId | null
  compuesto: boolean
  secundarios: readonly MuscleId[]
  /** Su ejercicio en la biblioteca (para no proponerlo), y su patrón (bisagra, tracción vertical…), si se saben. */
  id?: string
  patron?: string
}

export type Equivalente = { ex: LibraryExercise; motivo: string }

/**
 * Los ejercicios de la biblioteca que hacen lo mismo, del más parecido al menos. Obligatorio: el mismo músculo principal y,
 * si el músculo tiene zonas, la misma zona. Ordena: mismo patrón o tipo (básico o aislamiento) y secundarios en común.
 * Sin el mismo ejercicio. Sin músculo conocido, ninguno.
 */
export function equivalentes(
  o: Objetivo,
  biblioteca: readonly LibraryExercise[],
  cuantos = 6,
): Equivalente[] {
  if (!o.musculo) return []
  const musculo = o.musculo
  const zona = zonaDe(musculo, o.nombre, o.original)
  const mismo = o.nombre.toLowerCase()
  return biblioteca
    .filter((ex) => ex.primary === musculo && ex.id !== o.id && ex.name.toLowerCase() !== mismo)
    .map((ex) => {
      const z = zonaDe(musculo, ex.name)
      const mismaZona = zona !== null && z?.id === zona.id
      const compuesto = ex.kind === 'compound'
      const mismoTipo = o.patron ? ex.pattern === o.patron : compuesto === o.compuesto
      const comunes = o.secundarios.filter((m) => (ex.contributes[m] ?? 0) >= 0.5).length
      const puntos = (mismoTipo ? 2 : 0) + comunes
      const partes = [
        MUSCLES[musculo].label,
        mismaZona ? zona.label : null,
        mismoTipo ? (compuesto ? 'básico' : 'aislamiento') : null,
      ]
      return { ex, puntos, mismaZona, motivo: partes.filter(Boolean).join(' · ') }
    })
    .filter((x) => !zona || x.mismaZona)
    .sort((a, b) => b.puntos - a.puntos || a.ex.name.localeCompare(b.ex.name, 'es'))
    .slice(0, cuantos)
    .map(({ ex, motivo }) => ({ ex, motivo }))
}
