import { aboutOf, type About } from './about.ts'
import { CATEGORIES, type CategoryId } from './categories.ts'

// Secciones de un tipo: Mujer se recorre por objetivo y contexto (base, especialización, en casa) antes de
// llegar a cada rutina. Los programas salen del título del catálogo (lo anterior a « · »); el nombre y la frase
// de cada sección son los del diseño de Mujer (no vienen de los documentos originales: texto propuesto).
// El texto de la «!» de cada sección resume lo que dicen los documentos de sus rutinas (about.ts), más corto.

export type Section = {
  id: string
  title: string
  /** Frase bajo el título (solo las secciones con tarjeta). */
  description?: string
  /** Lo que te encuentras dentro (la «!» de la tarjeta): breve y sacado de los documentos de sus rutinas. */
  about?: About
  /** Programas que contiene, tal como empiezan sus títulos («Base · torso y pierna» → «Base»); null = todos los del tipo. */
  programs: string[] | null
  /** Se elige primero la frecuencia (días por semana) y luego se enseñan las rutinas de esos días. */
  byDays: boolean
  tone: 1 | 2 | 3 | 4 | 5 | 6
}

/** «Ver todas»: la lista plana de un tipo con sus filtros. */
export const ALL_SECTION = 'todas'

export const SECTIONS: Partial<Record<CategoryId, Section[]>> = {
  mujer: [
    {
      id: 'base',
      title: 'Base y fundamentos',
      description: 'Construye una rutina equilibrada',
      about: {
        summary:
          'Para aprender bien los ejercicios fundamentales, los mismos que seguirás haciendo cuando seas avanzada.',
        forWho:
          'Desde quien nunca ha pisado un gimnasio hasta quien lleva tiempo entrenando sin una buena guía.',
        how: ['Tres rutinas de 8 semanas: cuerpo completo (3 días), torso y pierna (4) o por grupos (5).'],
      },
      programs: ['Base'],
      byDays: true,
      tone: 3,
    },
    {
      id: 'gluteo-tren-inferior',
      title: 'Especialización en glúteo y tren inferior',
      description: 'Desarrollo completo, glúteo y físico equilibrado',
      about: {
        summary: 'Tres rutinas con foco en glúteo y tren inferior, cada una con su propio enfoque.',
        forWho:
          'Glúteo: quien quiere priorizarlo sin descuidar el resto. Desarrollo completo: 1–3 años entrenando en serio. Físico equilibrado: al menos un año entrenando con constancia.',
        how: [
          'Glúteo (5 días): especialización en glúteo.',
          'Desarrollo completo (6 días): foco en glúteo, hombro, abdomen y espalda.',
          'Físico equilibrado (5 días): énfasis en tren inferior, hombro, abdomen y espalda.',
        ],
      },
      programs: ['Desarrollo completo', 'Glúteo', 'Físico equilibrado'],
      byDays: true,
      tone: 6,
    },
    {
      id: 'en-casa',
      title: 'En casa',
      description: 'Peso corporal, mancuernas y tres niveles',
      about: {
        summary:
          'Hipertrofia en casa con material mínimo, centrada en el tren inferior y con el torso suficiente para un físico equilibrado.',
        forWho: 'Quien entrena en casa, desde principiante hasta avanzada.',
        how: [
          'Principiante (3 días): peso corporal, o peso corporal y mancuernas.',
          'Intermedio y avanzado, de 4 días: torso y pierna o cuerpo completo.',
          'Ejercicios elegidos para que funcionen bien sin máquinas.',
        ],
      },
      programs: ['En casa'],
      byDays: true,
      tone: 5,
    },
  ],
  // Los programas de hipertrofia, con el nombre y la frase que ya tenían como tipos (carpetas originales), y MUTA.
  // La «!» es propia donde sus rutinas vienen de documentos distintos; si comparten uno, sale de él (sectionAbout).
  hipertrofia: [
    {
      id: 'muta',
      title: 'MUTA',
      description: 'Las rutinas propias de MUTA: sencillas y equilibradas.',
      about: {
        summary: 'Las rutinas propias de MUTA: sencillas y equilibradas.',
        forWho: 'Cualquier nivel que entrene 3–4 días (cuerpo completo) o 5–6 días (empuje, tirón y pierna).',
        how: [
          'Rotan: haces la siguiente sesión cada día que entrenas, sea el día de la semana que sea.',
          'Los ejercicios opcionales son lo primero que se quita si vas justo de tiempo.',
        ],
      },
      programs: ['Cuerpo completo A/B', 'Empuje, tirón y pierna'],
      byDays: true,
      tone: 1,
    },
    {
      id: 'culturismo',
      title: 'Culturismo',
      description: 'Hipertrofia pura en dos fases: cuerpo completo, torso y pierna o empuje, tirón y pierna.',
      about: {
        summary:
          'Hipertrofia pura en dos fases: la fase 1 construye y la fase 2 sigue con ejercicios, rangos y técnicas nuevas.',
        forWho: 'Intermedio-avanzado que quiere ganar músculo, sin objetivos de fuerza máxima.',
        how: [
          'Haz primero la fase 1: la 2 encaja muy bien después.',
          'Cada fase tiene cuerpo completo (5 días), torso y pierna (5) y empuje, tirón y pierna (6).',
          'Incluye un día de punto débil y brazos para priorizar el músculo que más te cueste.',
        ],
      },
      programs: ['Hipertrofia'],
      byDays: true,
      tone: 4,
    },
    {
      id: 'frecuencia-alta',
      title: 'Cuerpo completo · frecuencia alta',
      description: 'Todo el cuerpo en cada sesión, 4 o 5 días por semana, para ganar músculo.',
      programs: ['Frecuencia alta'],
      byDays: true,
      tone: 5,
    },
    {
      id: 'ppl',
      title: 'Empuje, tirón y pierna',
      description: 'El reparto clásico de 4 a 6 días: en tres fases, o técnica y pico en 16 semanas.',
      about: {
        summary:
          'El reparto clásico de empuje, tirón y pierna, en un sistema de tres fases o en una versión de técnica y pico.',
        forWho: 'Intermedio-avanzado que busca sobre todo músculo.',
        how: [
          'Sistema de 3 fases (4, 5 o 6 días): base, sobrecarga máxima y supercompensación.',
          'Técnica y pico (6 días, 16 semanas): 8 de técnica con mucho volumen y 8 de pico con menos volumen y más esfuerzo.',
          'Si llevas meses entrenando sin estructura, también te sirve la de técnica y pico.',
          'Prioriza el músculo: la fuerza es un objetivo secundario. El sistema de 3 fases le dedica una serie pesada por básico y series de descarga.',
        ],
      },
      programs: ['PPL en 3 fases', 'PPL', 'PPL técnica y pico'],
      byDays: true,
      tone: 2,
    },
    {
      id: 'esencial',
      title: 'Esencial · 45 min',
      description:
        'Rutina minimalista para quien tiene poco tiempo: pocas series muy efectivas y sesiones de unos 45 minutos.',
      programs: ['Esencial'],
      byDays: true,
      tone: 1,
    },
  ],
}

/**
 * La «!» de una sección: la suya, o la del documento de sus rutinas si todas comparten el mismo (por ejemplo, las de
 * Esencial). Si sus rutinas vienen de documentos distintos, ninguna: no se resume lo que no coincide.
 */
export function sectionAbout(section: Section, items: { entry: { id: string } }[]): About | null {
  if (section.about) return section.about
  const abouts = items.map((item) => aboutOf(item.entry))
  const first = abouts[0]
  if (!first || abouts.some((about) => about?.summary !== first.summary)) return null
  return { summary: first.summary, forWho: first.forWho, how: first.how, basics: first.basics }
}

/**
 * Las secciones de un tipo. Mujer e Hipertrofia tienen las suyas (categorías con tarjeta). Los demás tipos tienen una
 * sola, con todas sus rutinas: no hay tarjetas, se elige la frecuencia y se ven las rutinas de esos días. Sin
 * secciones: lo guardado.
 */
export function sectionsOf(category: string): Section[] {
  const own = Object.entries(SECTIONS).find(([id]) => id === category)?.[1]
  if (own) return own
  const type = CATEGORIES.find((c) => c.id === category)
  return type ? [{ id: 'principal', title: type.title, programs: null, byDays: true, tone: type.tone }] : []
}

/** El programa de una rutina: su título hasta « · » (o el título entero si no lo lleva). */
export function programOf(title: string): string {
  const at = title.indexOf(' · ')
  return at < 0 ? title : title.slice(0, at)
}

export function inSection<T extends { entry: { title: string } }>(section: Section, items: T[]): T[] {
  const programs = section.programs
  return programs ? items.filter((item) => programs.includes(programOf(item.entry.title))) : items
}

/** Días por semana que hay en una lista de rutinas, de menos a más y sin repetir. */
export function daysOf(items: { entry: { days: number[] } }[]): number[] {
  return [...new Set(items.flatMap((item) => item.entry.days))].sort((a, b) => a - b)
}

/** Los días que se enseñan: los pedidos si existen; si no, los más cercanos; sin petición, los primeros. */
export function pickDays(days: number[], wanted: number | undefined): number {
  if (wanted === undefined) return days[0]
  if (days.includes(wanted)) return wanted
  return days.reduce((best, d) => (Math.abs(d - wanted) < Math.abs(best - wanted) ? d : best), days[0])
}
