import type { CatalogEntry } from './catalog.ts'

// «De qué trata» cada rutina (la «!»): resumen propio, sin nombres, de lo que dice el documento
// original de cada programa (presentación, «program explained» y notas antes de empezar).
// Las semanas, días y minutos no van aquí: salen medidos del propio programa (programInfo.ts).

export type About = {
  /** Qué es, en una o dos frases. */
  summary: string
  /** Para quién está pensada. */
  forWho: string
  /** Cómo funciona: estructura, progresión y lo que la hace distinta. */
  how: string[]
  /** Si el documento dice que busca mejorar los básicos (fuerza), con sus palabras resumidas. */
  basics?: string
  /** Detalle de esta versión concreta (días, nivel, origen). */
  note?: string
}

const PROGRAMS = {
  'muta-fb': {
    summary:
      'Rutina propia de MUTA: cuatro sesiones de cuerpo completo (A1, B1, A2 y B2) que se van turnando. Las A priorizan cuádriceps y espalda; las B, isquios, glúteo y pecho.',
    forWho: 'Cualquier nivel que entrene 3 o 4 días por semana.',
    how: [
      'Rota: cada día que entrenas haces la siguiente sesión, sea el día de la semana que sea.',
      'Cada músculo se trabaja unas dos veces por semana; brazos, hombro, gemelo y abdomen se reparten entre las cuatro.',
      'Sin fecha de fin: se repite mientras sigas progresando y el coach revisa cada vuelta completa.',
      'Los ejercicios opcionales son lo primero que se quita si vas justo de tiempo.',
    ],
  },
  'muta-ppl': {
    summary: 'Rutina propia de MUTA: seis sesiones de empuje, tirón y pierna que se van turnando.',
    forWho: 'Quien entrena 5 o 6 días por semana.',
    how: [
      'Rota: haces la siguiente sesión cada día que entrenas; con 5 días, una vuelta ocupa algo más de una semana.',
      'Cada músculo se trabaja dos veces por vuelta.',
      'Sin fecha de fin: al completar una vuelta, el coach revisa el ciclo.',
    ],
  },
  'culturismo-1': {
    summary:
      'Hipertrofia pura, primera fase. Todo gira en torno a la tensión en el músculo: técnica estricta, bajada controlada de 2–4 segundos y llegar al máximo estiramiento.',
    forWho: 'Intermedio-avanzado que quiere ganar músculo, sin objetivos de fuerza máxima.',
    how: [
      'Fase 1 de 2: la fase 2 continúa con ejercicios, rangos y técnicas nuevas.',
      'Dos bloques de 5 semanas, «construcción» y «novedad»; el segundo cambia ejercicios, rangos y técnicas para dar un estímulo nuevo.',
      'La semana 5 es de semidescarga y separa los dos bloques: algo menos de volumen y sin llegar al fallo.',
      'Las primeras series son algo más suaves y la última se lleva al fallo o casi (RIR 0–1); las técnicas de intensidad, solo en la última.',
      'Incluye un día de punto débil y brazos: eliges el músculo que quieres priorizar.',
    ],
  },
  'culturismo-2': {
    summary: 'Hipertrofia pura, segunda fase: continúa la primera con ejercicios, rangos y técnicas nuevas.',
    forWho: 'Intermedio-avanzado; encaja muy bien después de la fase 1.',
    how: [
      'Fase 2 de 2: continúa la fase 1 y encaja muy bien después de ella.',
      'Semana 1 de introducción (RIR 1–3), bloque «escalada» de 4 semanas, semana 6 de semidescarga y bloque «a fondo» de 4 semanas.',
      'Después de la primera semana, casi todas las series van a RIR 0–1 y la última suele ir al fallo.',
      'Día de punto débil y brazos para priorizar lo que más te cueste.',
      'Si quieres hacer sentadilla, banca o peso muerto, están entre los sustitutos de cada ejercicio.',
    ],
  },
  'frecuencia-alta': {
    summary:
      'Cuerpo completo en todas las sesiones, 4 o 5 días por semana: cada músculo se entrena muy a menudo y el volumen semanal se reparte en dosis pequeñas.',
    forWho:
      'Intermedio-avanzado (unos 2–5 años entrenando en serio) estancado en tamaño o fuerza: tanta frecuencia es un estímulo nuevo.',
    how: [
      'Dos bloques de 4 semanas: el 1 empieza suave para acostumbrarte a tanta frecuencia; el 2 añade fuerza y habilidad, subiendo a un básico muy exigente y haciendo después series más ligeras de otro compuesto.',
      'Al final puedes hacer una semana de descarga y otra de test de máximos.',
      'El objetivo principal es ganar músculo; los básicos van por porcentaje de tu máximo para que la fuerza también suba.',
      'Practicas cada levantamiento muchas veces por semana, así que la técnica mejora rápido.',
      'Si no estás acostumbrado a tanta frecuencia, baja las cargas o añade un día de descanso al principio.',
    ],
  },
  'powerbuilding-1': {
    basics:
      'Uno de sus dos objetivos principales es aumentar la fuerza máxima en los levantamientos fundamentales.',
    summary:
      'Fuerza e hipertrofia a partes iguales: subir sentadilla, banca y peso muerto mientras ganas músculo de forma proporcionada. Es la base de la serie.',
    forWho: 'Intermedio-avanzado (unos 2–5 años entrenando en serio).',
    how: [
      'Fase 1 de 3 del sistema Powerbuilding: la base, con igual foco en fuerza y tamaño. Después vienen la fase 2 y la 3.',
      'Va bien después de Frecuencia alta, aunque puedes hacerla antes o sin ella.',
      'Periodización avanzada y métodos de progresión poco habituales, útiles para romper estancamientos.',
      'Semanas de cuerpo completo alternas, así que cada músculo se entrena con frecuencia alta.',
      'La recuperación manda: técnica impecable y, si al principio cuesta, baja cargas o descansa un día más.',
    ],
  },
  'powerbuilding-2': {
    basics:
      'Desarrolla una gran capacidad de trabajo en los «Big 3» (sentadilla, banca y peso muerto) y sus accesorios, para convertirla en fuerza máxima.',
    summary:
      'Fuerza e hipertrofia, segunda entrega de la serie: construye tolerancia al volumen con más peso en la hipertrofia.',
    forWho: 'Intermedio-avanzado que quiere seguir ganando músculo sin dejar de mejorar los tres básicos.',
    how: [
      'Fase 2 de 3: viene después de la 1 y es la de acumulación. Con menos de 2 años entrenando, el autor recomienda pasar antes por Torso y pierna o Frecuencia alta, y por la fase 1.',
      'Hay dos versiones, de 4 y de 5–6 días: es la misma fase, elige según tus días.',
      'Más variedad de ejercicios y rangos de repeticiones más altos, además del trabajo de fuerza.',
      'Los básicos siguen por porcentaje de tu máximo; los accesorios, por esfuerzo (RIR).',
      'Prepara la tercera entrega, centrada en la fuerza máxima.',
    ],
  },
  'powerbuilding-3': {
    basics:
      'Su objetivo principal es llegar a un pico de fuerza máxima en los «Big 3»: sentadilla, banca y peso muerto.',
    summary:
      'Fuerza e hipertrofia, tercera entrega de la serie: convierte el trabajo acumulado en fuerza máxima en sentadilla, banca y peso muerto.',
    forWho: 'Intermedio-avanzado que ya tiene una buena base de volumen y técnica.',
    how: [
      'Fase 3 de 3, la del pico: pensada para hacerse después de la 1 y la 2. Si solo buscas fuerza máxima, puedes hacerla sin ellas.',
      'Son 8 semanas de carga, 1 de descarga y 1 de test de máximos.',
      'Más intensidad y menos volumen en los básicos, con un pico de fuerza al final.',
      'Se mantiene el trabajo de hipertrofia para no perder músculo.',
      'Los básicos van por porcentaje de tu máximo: conviene conocerlo o estimarlo antes de empezar.',
    ],
  },
  'ppl-sistema': {
    summary:
      'Sistema de empuje, tirón y pierna en tres fases encadenadas, cada una con un objetivo que prepara la siguiente.',
    forWho: 'Intermedio-avanzado que busca sobre todo músculo.',
    how: [
      'Fase 1, base: volumen e intensidad moderados-altos con técnicas avanzadas.',
      'Fase 2, sobrecarga máxima: poco volumen e intensidad muy alta, para conocer el fallo real y asegurar que progresas.',
      'Fase 3, supercompensación: volumen muy alto e intensidad moderada para crecer rápido.',
      'Técnicas como repeticiones solo en la parte baja, series de aproximación, dropsets mecánicos y series en racimo.',
    ],
  },
  'ppl-tecnica': {
    basics:
      'Su objetivo secundario es aumentar la fuerza general en los movimientos compuestos fundamentales.',
    summary:
      'Empuje, tirón y pierna de 16 semanas para maximizar músculo; ganar fuerza en los básicos es el objetivo secundario.',
    forWho:
      'Intermedio-avanzado (unos 2–5 años en serio), o cualquiera que lleve meses entrenando sin estructura.',
    how: [
      'Bloque 1 (8 semanas, técnica): dominar la ejecución de cada ejercicio y acostumbrarte a mucho volumen.',
      'Bloque 2 (8 semanas, pico): empieza con descarga; después, menos volumen y mucho más esfuerzo, con series más cerca del fallo.',
      'Superseries en brazos y pierna para ahorrar tiempo.',
    ],
  },
  'torso-pierna': {
    basics: 'Su objetivo principal es maximizar la hipertrofia y el desarrollo de fuerza.',
    summary:
      'Torso y pierna 6 días para ganar tamaño y fuerza, con técnicas de intensidad avanzadas y trabajo de puntos débiles.',
    forWho:
      'Intermedio-avanzado (unos 2–5 años en serio). Con menos de 2 años entrenando, mejor una rutina más básica primero.',
    how: [
      '9 semanas en 3 olas de 3: la primera semana de cada ola es suave (minidescarga), la segunda más dura y la tercera muy exigente.',
      'Progresión doble en los básicos: +1 repetición por sesión hasta el tope de la ola; en la siguiente vuelves abajo con un 2,5 % más de peso.',
      'Técnicas como myo-reps, 21s, tensión constante, excéntrica acentuada y dropsets.',
      '«Punto débil»: eliges 2–3 músculos al empezar y les haces 2–3 series de un ejercicio, siempre los mismos.',
    ],
  },
  sentadilla: {
    basics: 'Todo el programa busca subir tu sentadilla, con un test de fuerza máxima en la semana 10.',
    summary: 'Especialización para subir tu sentadilla en 10 semanas.',
    forWho: 'Quien ya entrena con regularidad y quiere priorizar la sentadilla durante 10 semanas.',
    how: [
      'Bloque 1 (acumulación): mucho volumen y variantes (trasera dos veces, frontal y con pausa) con esfuerzo moderado para pulir la técnica.',
      'Descarga y bloque 2 (pico): menos volumen y más intensidad para convertir lo acumulado en fuerza máxima.',
      'Semana 10 de test: máximo con RIR 0,5–1, o tantas repeticiones como puedas con el 95 % de tu máximo anterior.',
    ],
    note: 'El original solo trae los 4 días de pierna por semana: dice que no incluye trabajo directo de torso. Para completar la semana propone repartos y entrenos de torso de muestra, que aquí no se incluyen.',
  },
  banca: {
    basics: 'Todo el programa busca subir tu press banca, con un pico de fuerza máxima al final.',
    summary:
      'Especialización para subir tu press banca en 8 semanas, dentro de un programa de cuerpo completo.',
    forWho: 'Quien ya entrena con regularidad y quiere priorizar el press banca.',
    how: [
      'Bloque 1 (acumulación, 4 semanas, 5 días): banca 3 veces por semana con variantes y esfuerzo moderado para perfeccionar la técnica.',
      'Bloque 2 (pico, 4 semanas, 4 días): menos volumen y más intensidad hasta tu fuerza máxima.',
      'Accesorios de hombro, espalda y tríceps que dan estabilidad sin quitar energía a la banca.',
    ],
  },
  esencial: {
    summary:
      'Rutina minimalista para quien tiene poco tiempo: lo imprescindible para ganar músculo en sesiones de unos 45 minutos, de 2 a 5 días por semana.',
    forWho:
      'Cualquier nivel con poco tiempo. Si prefieres más volumen y sesiones de 60–90 minutos, mejor otra rutina.',
    how: [
      'Poco volumen y mucho esfuerzo: 2–3 series duras en los compuestos y 1–2 en los aislamientos.',
      'La clave es superar el cuaderno: más peso o más repeticiones que la vez anterior.',
      '3 bloques de 4 semanas: cada bloque cambia los ejercicios para variar.',
      'Técnicas para ahorrar tiempo sin perder estímulo.',
    ],
  },
  gluteo: {
    summary: 'Especialización en glúteo, para hombres y mujeres.',
    forWho: 'Quien quiere priorizar el glúteo sin descuidar el resto del cuerpo.',
    how: [
      'Bloque 1 de acumulación y bloque 2 metabólico.',
      'Incluye hip thrust y sentadilla por porcentaje de tu máximo.',
      'Superseries (A1/A2): haces las dos seguidas y descansas después de la segunda.',
    ],
  },
  'mujer-especializacion': {
    basics:
      'Su objetivo secundario es aumentar la fuerza general en los movimientos compuestos fundamentales.',
    summary:
      'Desarrollo completo con foco en glúteo, hombro, abdomen y espalda. El objetivo secundario es ganar fuerza en los básicos.',
    forWho: 'Mujeres con al menos 1–3 años entrenando en serio.',
    how: [
      'Dos bloques de 4 semanas.',
      'Bloque 1: gran capacidad de trabajo y tolerancia a mucho volumen.',
      'Bloque 2: menos volumen y más intensidad, aprovechando lo construido.',
    ],
  },
  'mujer-optimizacion': {
    summary:
      'Físico estético y equilibrado con énfasis en tren inferior, hombro, abdomen y espalda, ganando fuerza a la vez.',
    forWho:
      'Intermedias-avanzadas con al menos un año de entrenamiento constante y la técnica de los ejercicios básicos dominada.',
    how: [
      'Bloque 1 (semanas 1–4), acumulación de volumen: la introducción, con menos volumen y más descansos de lo habitual.',
      'Bloque 2 (semanas 5–8), técnicas avanzadas: el más duro y sin descarga; incluye tensión constante y excéntrica acentuada.',
      'Bloque 3 (semanas 9–10): una semana de descarga corta y otra de esfuerzo máximo para batir récords.',
      'Mucho tren inferior, con el volumen justo de torso; los básicos van por porcentaje de tu máximo.',
      'Al acabar puedes repetirla con tus nuevos máximos, o hacer «Desarrollo completo · foco en glúteo» si no la has hecho.',
    ],
  },
  'mujer-base': {
    summary:
      'Programa base para aprender bien los ejercicios fundamentales, los mismos que seguirás haciendo cuando seas avanzada.',
    forWho: 'Desde quien nunca ha pisado un gimnasio hasta quien lleva tiempo entrenando sin una buena guía.',
    how: [
      'Tres rutinas de 8 semanas: cuerpo completo (3 días), torso y pierna (4) y por grupos (5).',
      'Carga en olas de 4 semanas: la primera es la más fácil y acabas con un récord; en los compuestos subes peso cada 4 semanas.',
      'En los aislamientos, el peso se ajusta al esfuerzo (RIR) que indica cada ejercicio.',
    ],
  },
  'mujer-casa': {
    summary:
      'Hipertrofia en casa con material mínimo, centrada en el tren inferior pero con el torso suficiente para un físico equilibrado.',
    forWho: 'Quien entrena en casa, desde principiante hasta avanzada.',
    how: [
      'Seis rutinas por nivel: principiante de 3 días (peso corporal, o peso corporal y mancuernas) e intermedia y avanzada de 4 días (torso y pierna o cuerpo completo).',
      'Ejercicios elegidos para que funcionen bien sin máquinas.',
      'Pensadas para asentar la técnica mientras ganas músculo.',
    ],
  },
  vuelta: {
    summary:
      'Puente para volver a entrenar después de un parón: en 4 semanas te devuelve a un entrenamiento progresivo normal.',
    forWho: 'Quien ha dejado de entrenar, del todo o en parte, durante un tiempo.',
    how: [
      'Parón completo (casi sin pesas) de un mes o más: haz las 4 semanas en orden.',
      'Parón parcial (entrenando con peso corporal) de 1–2 meses: haz solo las semanas 1 y 4.',
      'Si seguiste entrenando con cargas, no hace falta: una semana ligera y pasa a tu siguiente rutina.',
      'Empieza con los básicos al 50 % y sube poco a poco. Es buen momento para ganar músculo y perder grasa a la vez, gracias a la memoria muscular.',
    ],
  },
} satisfies Record<string, About>

type ProgramKey = keyof typeof PROGRAMS

/** Programa de cada rutina (por su id) y, si hace falta, la nota de esa versión. */
const RULES: [RegExp, ProgramKey, string?][] = [
  [/^muta-cuerpo-completo/, 'muta-fb'],
  [/^muta-ppl/, 'muta-ppl'],
  [/^hipertrofia-.*-f1$/, 'culturismo-1'],
  [/^hipertrofia-.*-f2$/, 'culturismo-2'],
  [/^frecuencia-alta/, 'frecuencia-alta'],
  [/^fuerza-hipertrofia-1/, 'powerbuilding-1'],
  [/^fuerza-hipertrofia-2/, 'powerbuilding-2'],
  [/^fuerza-hipertrofia-3/, 'powerbuilding-3'],
  [/^ppl-5d-editado$/, 'ppl-sistema', 'Tu versión editada del sistema de 5 días.'],
  [/^ppl-completo/, 'ppl-sistema'],
  [/^ppl-tecnica$/, 'ppl-tecnica'],
  [/^torso-pierna$/, 'torso-pierna'],
  [/^especializacion-sentadilla$/, 'sentadilla'],
  [/^especializacion-banca$/, 'banca'],
  [/^esencial/, 'esencial'],
  [/^gluteos$/, 'gluteo'],
  [/^mujer-especializacion$/, 'mujer-especializacion'],
  [/^mujer-optimizacion$/, 'mujer-optimizacion'],
  [/^base-/, 'mujer-base'],
  [
    /^casa-peso-corporal$/,
    'mujer-casa',
    'Versión principiante: solo peso corporal, 3 días de cuerpo completo.',
  ],
  [/^casa-mancuernas$/, 'mujer-casa', 'Versión principiante: peso corporal y mancuernas, 3 días.'],
  [/^casa-.*-1$/, 'mujer-casa', 'Versión intermedia, 4 días.'],
  [/^casa-.*-2$/, 'mujer-casa', 'Versión avanzada, 4 días.'],
  [
    /^vuelta-ppl$/,
    'vuelta',
    'Versión de 6 días (empuje, tirón y pierna). Misma progresión que la de 4 días: elige según los días que tengas.',
  ],
  [
    /^vuelta-torso-pierna$/,
    'vuelta',
    'Versión de 4 días (torso y pierna). Misma progresión que la de 6 días: elige según los días que tengas.',
  ],
]

/** «De qué trata» una rutina del catálogo, o null si aún no tiene texto. */
export function aboutOf(entry: Pick<CatalogEntry, 'id'>): About | null {
  const rule = RULES.find(([re]) => re.test(entry.id))
  if (!rule) return null
  const [, key, note] = rule
  const about: About = PROGRAMS[key]
  return note ? { ...about, note: [about.note, note].filter(Boolean).join(' ') } : about
}
