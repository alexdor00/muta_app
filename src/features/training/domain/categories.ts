import type { About } from './about.ts'

// Los grupos que se eligen (CATEGORIES) y las familias de origen (FamilyId).
// Cada rutina tiene una familia (catalog.ts): la carpeta del programa original, o MUTA. Cada familia pertenece a un
// grupo (CATEGORY_OF_FAMILY). El grupo sale del objetivo que dice el documento original de cada programa y de los
// ejercicios que trae (porcentajes de tu máximo, repeticiones), no de una opinión; lo verificado está más abajo.
// La «!» de cada grupo (`about`) ayuda a elegir: qué es, para quién y por cuál empezar. Todo sale de lo que dicen los
// documentos de sus programas (about.ts), resumido; los días salen del catálogo.

/** La carpeta de los programas originales de la que sale una rutina (más MUTA). */
export type FamilyId =
  | 'muta'
  | 'mujer'
  | 'culturismo'
  | 'extras'
  | 'frecuencia-alta'
  | 'fuerza-hipertrofia'
  | 'fuerza'
  | 'ppl'
  | 'esencial'
  | 'torso-pierna'

export type CategoryId = 'hipertrofia' | 'powerbuilding' | 'powerlifting' | 'mujer' | 'vuelta'

export type Category = {
  id: CategoryId
  title: string
  /** Para quién es y qué tiene, en una frase (cabecera de la categoría). */
  description: string
  /** La «!» de la tarjeta: qué es y cómo elegir dentro del grupo. */
  about: About
  tone: 1 | 2 | 3 | 4 | 5 | 6
}

export const CATEGORIES: Category[] = [
  {
    id: 'hipertrofia',
    title: 'Hipertrofia',
    description:
      'Programas para ganar músculo: MUTA, culturismo, cuerpo completo de frecuencia alta, empuje, tirón y pierna, y el de 45 minutos.',
    about: {
      summary: 'Programas cuyo objetivo principal es ganar músculo.',
      forWho:
        'Desde cualquier nivel con poco tiempo (Esencial, MUTA) hasta intermedio-avanzado (Culturismo, Frecuencia alta, Empuje, tirón y pierna).',
      how: [
        'Poco tiempo: Esencial, una rutina minimalista de unos 45 minutos, de 2 a 5 días por semana.',
        'Cualquier nivel: las de MUTA, cuerpo completo de 3–4 días o empuje, tirón y pierna de 5–6.',
        'Intermedio-avanzado: Culturismo (5–6 días), Frecuencia alta (4–5) o Empuje, tirón y pierna (4–6).',
      ],
    },
    tone: 4,
  },
  {
    id: 'powerbuilding',
    title: 'Powerbuilding',
    description:
      'Fuerza y tamaño a la vez: sentadilla, banca y peso muerto por porcentajes de tu máximo, con accesorios para el músculo.',
    about: {
      summary:
        'Fuerza y músculo a la vez: básicos por porcentaje de tu máximo y accesorios para la hipertrofia.',
      forWho: 'Intermedio-avanzado: unos 2–5 años entrenando en serio.',
      how: [
        '«Fuerza e hipertrofia» son tres fases de una serie, para hacer en orden: la 1 (base), la 2 (acumulación) y la 3 (pico).',
        'La 1 tiene igual foco en fuerza y tamaño; la 2 acumula volumen con más hipertrofia; la 3 convierte todo en fuerza máxima.',
        'La fase 3 puedes hacerla sola si solo buscas fuerza máxima; para sacar el máximo en fuerza y tamaño, haz las tres.',
        'Con menos de 2 años entrenando, empieza por Torso y pierna o Frecuencia alta (el autor lo recomienda antes de la 2 y la 3).',
        'Torso y pierna (6 días, 9 semanas) busca tamaño y fuerza, con técnicas de intensidad y puntos débiles.',
        'Conviene conocer o estimar tu máximo antes de empezar.',
      ],
    },
    tone: 6,
  },
  {
    id: 'powerlifting',
    title: 'Powerlifting',
    description: 'Especialización en un básico: subir tu sentadilla o tu press banca, con test al final.',
    about: {
      summary:
        'Subir un solo levantamiento: la sentadilla (10 semanas) o el press banca (8), con un pico de fuerza máxima al final.',
      forWho: 'Quien ya entrena con regularidad y quiere priorizar ese levantamiento.',
      how: [
        'Sentadilla: 4 días de pierna por semana y test de fuerza máxima en la semana 10.',
        'Press banca: 5 días y luego 4, de cuerpo completo, con la banca tres veces por semana al principio.',
        'Para saber si funciona, mide tu fuerza: si cada semana levantas más, vas bien.',
      ],
    },
    tone: 2,
  },
  {
    id: 'mujer',
    title: 'Mujer',
    description:
      'Programas pensados para mujeres: base, glúteo, desarrollo completo, físico equilibrado y en casa.',
    about: {
      summary:
        'Programas pensados para mujeres: una base para aprender los ejercicios, la especialización y una versión para entrenar en casa.',
      forWho:
        'Desde quien nunca ha pisado un gimnasio hasta quien lleva entre 1 y 3 años entrenando en serio.',
      how: [
        'Si empiezas: Base, de 3, 4 o 5 días según los que tengas.',
        'Si entrenas en casa: En casa, principiante (3 días), intermedia o avanzada (4 días).',
        'Si ya entrenas y quieres priorizar el glúteo y el tren inferior: Especialización.',
      ],
    },
    tone: 3,
  },
  {
    id: 'vuelta',
    title: 'Vuelta al gimnasio',
    description: 'Para volver a entrenar después de un parón: 4 semanas hasta tu ritmo normal.',
    about: {
      summary:
        'Puente para volver a entrenar después de un parón: en 4 semanas te devuelve a un entrenamiento progresivo normal.',
      forWho: 'Quien ha dejado de entrenar, del todo o en parte, durante un tiempo.',
      how: [
        'Parón completo de un mes o más: haz las 4 semanas en orden.',
        'Parón parcial (con peso corporal) de 1–2 meses: haz solo las semanas 1 y 4.',
        'Si seguiste con cargas, no hace falta: una semana ligera y a tu siguiente rutina.',
        'Hay versión de 4 días (torso y pierna) y de 6 (empuje, tirón y pierna): misma progresión, elige según tus días.',
      ],
    },
    tone: 5,
  },
]

/**
 * A qué grupo va cada familia, y por qué (lo que dice su documento original):
 * - muta (rutinas propias): hipertrofia por decisión tuya; sus ejercicios lo respaldan: 0 % de series por porcentaje
 *   de tu máximo y todas en 6–10 repeticiones.
 * - culturismo (Pure Bodybuilding): programa de hipertrofia; 0 % de series por porcentaje de tu máximo.
 * - frecuencia-alta (Full Body): «el objetivo principal es maximizar la hipertrofia muscular».
 * - ppl: «Hypertrophy Program»; el Ultimate PPL «prioriza la hipertrofia sobre la fuerza».
 * - esencial (The Essentials): «maximizar la hipertrofia para quien solo tiene 45 minutos», con poco volumen; el
 *   documento no habla de mantenimiento: es hipertrofia con volumen bajo.
 * - fuerza-hipertrofia (Powerbuilding): «igual foco en fuerza y tamaño».
 * - torso-pierna (UpperLower «Size and Strength»): «maximizar la hipertrofia y la fuerza» a la vez.
 * - fuerza (Specialization de sentadilla y de banca): carpeta «Powerlifting and Strength»; «más enfocado en la fuerza».
 * - extras (Comeback Bridge): «puentear a quien viene de un periodo sin entrenar».
 */
export const CATEGORY_OF_FAMILY: Record<FamilyId, CategoryId> = {
  muta: 'hipertrofia',
  mujer: 'mujer',
  culturismo: 'hipertrofia',
  'frecuencia-alta': 'hipertrofia',
  ppl: 'hipertrofia',
  esencial: 'hipertrofia',
  'fuerza-hipertrofia': 'powerbuilding',
  'torso-pierna': 'powerbuilding',
  fuerza: 'powerlifting',
  extras: 'vuelta',
}

export const categoryOf = (family: FamilyId): CategoryId => CATEGORY_OF_FAMILY[family]

/**
 * Rutinas especiales que el coach no ajusta: las esenciales (su poco volumen es intencionado) y la
 * vuelta al gimnasio (su volumen sube a propósito semana a semana). En las de fuerza solo se ajustan
 * los accesorios: los básicos por %1RM no se tocan (adaptVolume).
 */
export function isAdaptable(families: FamilyId[]): boolean {
  return !families.includes('esencial') && !families.includes('extras')
}
