import { MUSCLES, type MuscleId } from './muscles.ts'

// Músculo principal de un ejercicio (cuenta 1 serie directa). Se usa el campo `muscle`
// si existe (rutinas de MUTA) y, si no, el nombre original. El orden de las reglas importa:
// «leg curl» es femoral antes de que «curl» lo haga bíceps.

const LABEL_TO_ID = new Map(Object.entries(MUSCLES).map(([id, m]) => [m.label.toLowerCase(), id as MuscleId]))

/** Ejercicios que no son series de trabajo (estiramientos, calentamiento) o no se pueden asignar. */
const SKIP = /STATIC STRETCH|STRETCH \(|WEAK POINT|^N\/A$|CARDIO|WALK-OUT|MOBILITY/

const RULES: [RegExp, MuscleId][] = [
  // Nombres que el PDF trae cortados
  [/^ECCENTRIC-ACCENTUATED$/, 'femoral'],
  [/ROUND-? ?BACK|\bHIP$/, 'gluteo'],
  [/OVERHEAD$/, 'hombro_ant'],
  [/BICEP 21/, 'biceps'],
  [/CALF|TOE PRESS|DONKEY CALF/, 'gemelo'],
  [/NECK/, 'cuello'],
  [
    /CRUNCH|LEG RAISE|PLANK|\bABS?\b|ROLLOUT|HOLLOW|DEAD BUG|TWIST|SIT-UP|L-SIT|VACUUM|PALLOF|MOUNTAIN CLIMB|BIRDDOG|WOOD ?CHOP/,
    'core',
  ],
  [/WRIST|GRIP WORK|ISOMETRIC HOLD|FARMER|PINCH GRIP/, 'antebrazo'],
  [/ADDUCTION|COPENHAGEN/, 'aductores'],
  [
    /REVERSE NORDIC|SISSY|LEG EXTENSION|LEG PRESS|SQUAT|LUNGE|STEP[- ]?UP|BULGARIAN|LEG\.\.\.LEG/,
    'cuadriceps',
  ],
  [
    /LEG CURL|HAM(STRING)? CURL|NORDIC|GLUTE[- ]HAM|SWISS BALL (LEG |HAMSTRING )?CURL|SLIDING LEG CURL|BAND HAMSTRING|RDL|ROMANIAN|STIFF|GOOD MORNING/,
    'femoral',
  ],
  [
    /HIP THRUST|GLUTE|BRIDGE|FROG|ABDUCTION|ABUDCTION|CLAMS|DONKEY KICK|PULL[- ]?THROUGH|SIDE WALK|LATERAL (BAND )?WALK|SUMO WALK|BAND WALK|KETTLEBELL SWING|REVERSE HYPER|HYPEREXTENSION|DEADLIFT|BLOCK PULL/,
    'gluteo',
  ],
  [/BACK EXTENSION/, 'espalda_alta'],
  [
    /REAR DELT|REVERSE (CABLE )?FLYE?|REVERSE PECK? DECK?|REVERSE PEC DEC|FACE ?PULL|PULL-APART|WALL SLIDE/,
    'hombro_post',
  ],
  [
    /TRICEP|SKULL|PUSHDOWN|PRESSDOWN|PRESS DOWN|KICKBACK|FRENCH PRESS|ELBOW EXTENSION|KATANA|HYBRID PRESS|CLOSE[- ]GRIP (BENCH|PRESS|PUSH|BARBELL|INCLINE|MACHINE|DB|DUMBBELL|ASSISTED DIP)|DIAMOND|BENCH DIP|ROPE OVERHEAD ELBOW|TRICEPS PRESS|CALIFORNIA PRESS/,
    'triceps',
  ],
  [/CURL/, 'biceps'],
  [
    /PULLDOWN|PULL DOWN|PULL-?UPS?|PULL UPS?|CHIN[- ]?UP|PULLOVER|PULL-OVER|LAT PRAYER|LAT PULL|ISOLATERAL/,
    'dorsal',
  ],
  [/SHRUG|TRAP RAISE/, 'espalda_alta'],
  [/UPRIGHT ROW|LATERAL RAISE|Y-RAISE|RAISE COMPLEX|LEAN-?AWAY|EGYPTIAN/, 'hombro_lat'],
  [
    /LAT-FOCUSED|SINGLE[- ]ARM .*ROW|1-ARM .*ROW|ONE-ARM .*ROW|UNILATERAL CABLE ROW|ELBOWS-IN|SEATED CABLE ROW|CABLE SEATED ROW|LOW ROW|DB ROW|DUMBBELL ROW|HEAVY CHEAT ROW|MOTO/,
    'dorsal',
  ],
  [/ROW/, 'espalda_alta'],
  [/FRONT RAISE|OVERHEAD PRESS|SHOULDER PRESS|MILITARY|PUSH PRESS|ROTATING PRESS|\bOHP\b/, 'hombro_ant'],
  [
    /BENCH|CHEST|FLYE?S?\b|FLY\b|PEC|CROSSOVER|PUSH[- ]?UPS?|DIP|PRESS-AROUND|INCLINE.*PRESS|FLOOR PRESS|PIN PRESS|DECLINE|FEET-UP|MACHINE PRESS|SMITH.*PRESS|DB PRESS|DUMBBELL PRESS|TORSO ANGLE|FROM FEET|FROM HIPS/,
    'pecho',
  ],
]

export function muscleOf(exercise: {
  originalName?: string
  name: string
  muscle?: string
}): MuscleId | null {
  if (exercise.muscle) return LABEL_TO_ID.get(exercise.muscle.toLowerCase()) ?? null
  const name = (exercise.originalName ?? exercise.name)
    .toUpperCase()
    .replace(/^([A-C]\d|SUPERSET [A-C]\d)[.:]\s*/, '')
  if (SKIP.test(name)) return null
  return RULES.find(([re]) => re.test(name))?.[1] ?? null
}
