// Solo para probar: un perfil inventado (no es de nadie) con unos 100 días de vida en la app, para ver Progreso, Hoy,
// Entreno y Nutrición como se verían de verdad. Borra lo que haya en este móvil y escribe en IndexedDB: entrenos de la
// rutina MUTA Cuerpo completo A/B (4 por semana, subiendo poco a poco), tres mesociclos (volumen, mantenimiento y la
// definición de ahora), pesajes diarios, medidas y fotos cada mes (dibujadas), consultas semanales y lo que comió.
import { getDb } from '../../shared/data/db.ts'
import { menuDemo } from './perfilDemoMenu.ts'
import { readLocalRecipes } from '../../shared/data/localRecipes.ts'

const PROGRAMA = 'muta-cuerpo-completo-4d'
const DIAS = 100
const DIA = 86_400_000

/** La fecha de hace `n` días (AAAA-MM-DD, hora local) y su instante a las 18:00. */
function hace(n: number): { fecha: string; inicio: number } {
  const d = new Date(Date.now() - n * DIA)
  d.setHours(18, 0, 0, 0)
  return {
    fecha: new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10),
    inicio: d.getTime(),
  }
}
const fecha = (n: number) => hace(n).fecha

/** Ruido fijo (siempre el mismo perfil): de −1 a 1. */
const ruido = (n: number) => Math.sin(n * 12.9898) * 0.5 + Math.sin(n * 78.233) * 0.5

/** Las tres etapas, de la más antigua a la de ahora (días desde hoy). */
const ETAPAS = [
  {
    id: 'demo-volumen',
    nombre: 'Volumen de verano',
    objetivo: 'bulk',
    desde: DIAS,
    hasta: 56,
    peso: [77.4, 80.4],
  },
  {
    id: 'demo-mantener',
    nombre: 'Mantener',
    objetivo: 'maintenance',
    desde: 55,
    hasta: 29,
    peso: [80.4, 80.6],
  },
  { id: 'demo-definicion', nombre: 'Definición', objetivo: 'cut', desde: 28, hasta: 0, peso: [80.6, 78.9] },
] as const

/** Tu peso de tendencia hace `n` días (sigue las etapas). */
function pesoDe(n: number): number {
  const e = ETAPAS.find((x) => n <= x.desde && n >= x.hasta) ?? ETAPAS[2]
  const k = (e.desde - n) / Math.max(1, e.desde - e.hasta)
  return e.peso[0] + (e.peso[1] - e.peso[0]) * k
}

type Ej = { nombre: string; musculo: string; kg: number; reps: number[]; paso: number }

/** Las cuatro sesiones (los ejercicios principales de cada una y su carga al empezar). */
const SESIONES: { sigla: string; nombre: string; ejercicios: Ej[] }[] = [
  {
    sigla: 'A1',
    nombre: 'Cuádriceps y espalda',
    ejercicios: [
      { nombre: 'Sentadilla hack', musculo: 'cuadriceps', kg: 85, reps: [10, 9, 8], paso: 2.5 },
      {
        nombre: 'Remo con pecho apoyado (codos abiertos)',
        musculo: 'espalda_alta',
        kg: 42.5,
        reps: [12, 11, 10],
        paso: 2.5,
      },
      { nombre: 'Jalón al pecho', musculo: 'dorsal', kg: 55, reps: [12, 10, 9], paso: 2.5 },
      { nombre: 'Curl predicador', musculo: 'biceps', kg: 27.5, reps: [14, 12], paso: 2.5 },
      { nombre: 'Crunch en máquina', musculo: 'core', kg: 35, reps: [12, 11], paso: 2.5 },
    ],
  },
  {
    sigla: 'B1',
    nombre: 'Isquios, glúteo y pecho',
    ejercicios: [
      { nombre: 'Peso muerto rumano', musculo: 'femoral', kg: 52.5, reps: [10, 8, 7], paso: 2.5 },
      { nombre: 'Press inclinado con mancuernas', musculo: 'pecho', kg: 18, reps: [12, 11, 10], paso: 2 },
      { nombre: 'Curl femoral tumbado', musculo: 'femoral', kg: 32.5, reps: [12, 10], paso: 2.5 },
      { nombre: 'Laterales en polea', musculo: 'hombro_lat', kg: 10, reps: [15, 13, 12], paso: 1.25 },
      { nombre: 'Curl inclinado con mancuernas', musculo: 'biceps', kg: 10, reps: [12, 10], paso: 1 },
    ],
  },
  {
    sigla: 'A2',
    nombre: 'Espalda y cuádriceps',
    ejercicios: [
      { nombre: 'Remo con barra', musculo: 'dorsal', kg: 60, reps: [10, 9, 8], paso: 2.5 },
      { nombre: 'Prensa', musculo: 'cuadriceps', kg: 150, reps: [12, 11, 10], paso: 5 },
      { nombre: 'Press militar con mancuernas', musculo: 'hombro_ant', kg: 20, reps: [10, 9, 8], paso: 2 },
      { nombre: 'Sentadilla búlgara', musculo: 'cuadriceps', kg: 14, reps: [10, 9], paso: 2 },
    ],
  },
  {
    sigla: 'B2',
    nombre: 'Pecho, glúteo e isquios',
    ejercicios: [
      { nombre: 'Press banca', musculo: 'pecho', kg: 72.5, reps: [8, 7, 6], paso: 2.5 },
      { nombre: 'Hip thrust', musculo: 'gluteo', kg: 100, reps: [12, 10, 9], paso: 5 },
      { nombre: 'Press plano con mancuernas', musculo: 'pecho', kg: 26, reps: [11, 10], paso: 2 },
      { nombre: 'Curl femoral tumbado', musculo: 'femoral', kg: 32.5, reps: [12, 11], paso: 2.5 },
    ],
  },
]

/** Qué sesión toca cada día de la semana (lunes A1, martes B1, jueves A2, sábado B2). */
const POR_DIA: Record<number, number> = { 1: 0, 2: 1, 4: 2, 6: 3 }

/** Un entreno: la carga sube un paso cada ~3 semanas en volumen y mantener; en la definición, se sostiene. */
function entreno(n: number, i: number) {
  const { fecha: f, inicio } = hace(n)
  const s = SESIONES[i]
  const semanas = Math.min(DIAS - n, DIAS - 28) / 7
  return {
    id: `demo-${f}`,
    date: f,
    status: 'finished',
    fecha: f,
    inicio,
    segundos: (55 + Math.round(ruido(n) * 8)) * 60,
    sigla: s.sigla,
    nombre: s.nombre,
    programId: PROGRAMA,
    ejercicios: s.ejercicios.map((e, j) => {
      const kg = Math.round((e.kg + Math.floor(semanas / 3) * e.paso) / 0.25) * 0.25
      return {
        nombre: e.nombre,
        musculo: e.musculo,
        puesto: j + 1,
        series: e.reps.map((r, k) => ({
          kg,
          reps: Math.max(5, r + Math.round(ruido(n + j + k))),
          rir: n <= 28 ? 1 : 2,
        })),
      }
    }),
  }
}

/** Las medidas de cada mes (de la más antigua a la última, días desde hoy). */
const MEDIDAS = [
  { n: 98, brazo: 37.8, pecho: 103.5, cintura: 83, muslo: 58, gemelo: 38, cadera: 98.5, cuello: 38.3 },
  { n: 68, brazo: 38.4, pecho: 105, cintura: 84.5, muslo: 59, gemelo: 38.3, cadera: 99.5, cuello: 38.8 },
  { n: 38, brazo: 38.7, pecho: 105.5, cintura: 84.8, muslo: 59.3, gemelo: 38.4, cadera: 99.8, cuello: 39 },
  { n: 6, brazo: 38.6, pecho: 105, cintura: 82.6, muslo: 59, gemelo: 38.4, cadera: 98.8, cuello: 38.8 },
]

/** Una foto dibujada (no hay fotos reales): la silueta de una postura, un poco más ancha cuanto más volumen. */
async function foto(pose: 'frente' | 'perfil' | 'espalda', ancho: number, texto: string): Promise<Blob> {
  const c = document.createElement('canvas')
  c.width = 600
  c.height = 900
  const g = c.getContext('2d')
  if (!g) return new Blob()
  const fondo = g.createLinearGradient(0, 0, 0, 900)
  fondo.addColorStop(0, '#d9d4cc')
  fondo.addColorStop(1, '#a9a197')
  g.fillStyle = fondo
  g.fillRect(0, 0, 600, 900)
  g.fillStyle = '#3b3029'
  const w = pose === 'perfil' ? ancho * 0.55 : ancho
  g.beginPath()
  g.arc(300, 170, 62, 0, Math.PI * 2)
  g.fill()
  g.beginPath()
  g.roundRect(300 - w / 2, 250, w, 330, 80)
  g.fill()
  g.fillRect(300 - w / 2 + 20, 560, w / 2 - 30, 300)
  g.fillRect(310, 560, w / 2 - 30, 300)
  if (pose !== 'perfil') {
    g.fillRect(300 - w / 2 - 55, 270, 50, 260)
    g.fillRect(300 + w / 2 + 5, 270, 50, 260)
  }
  g.fillStyle = '#ffffff'
  g.font = 'bold 34px sans-serif'
  g.fillText(texto, 32, 60)
  return new Promise((ok) => c.toBlob((b) => ok(b ?? new Blob()), 'image/jpeg', 0.8))
}

/** Pide permiso implícito: borra todo lo de este móvil (menos el esquema y las rutinas) y escribe el perfil inventado. */
export async function cargarPerfilDemo(): Promise<void> {
  await getDb() // la base existe y está al día
  // Con el recetario de la app, el menú de prueba usa sus recetas (antes de abrir la transacción: no admite esperas)
  const conRecetario = (await readLocalRecipes()) !== null
  const db = await new Promise<IDBDatabase>((ok, ko) => {
    const r = indexedDB.open('muta')
    r.onsuccess = () => ok(r.result)
    r.onerror = () => ko(r.error)
  })
  const ahora = new Date().toISOString()
  // Las fotos se dibujan antes de abrir la transacción (si no, se cerraría sola mientras tanto)
  const fotos: { id: string; date: string; pose: string; imagen: Blob; createdAt: string }[] = []
  for (const [k, m] of MEDIDAS.entries())
    for (const pose of ['frente', 'perfil', 'espalda'] as const)
      fotos.push({
        id: `demo-foto-${k}-${pose}`,
        date: fecha(m.n),
        pose,
        imagen: await foto(pose, 210 + k * 8 - (k === 3 ? 14 : 0), fecha(m.n)),
        createdAt: ahora,
      })
  const borrar = [
    'workouts',
    'exerciseHistory',
    'plans',
    'rotation',
    'mesocycles',
    'profile',
    'bodyLog',
    'foodLog',
    'coach',
    'userContent',
    'photos',
  ]
  const tx = db.transaction(borrar, 'readwrite')
  for (const s of borrar) tx.objectStore(s).clear()
  const put = (s: string, v: object) => tx.objectStore(s).put(v)

  put('profile', {
    id: 'me',
    daysPerWeek: 4,
    level: 'intermediate',
    goal: 'lose_fat',
    createdAt: ahora,
    updatedAt: ahora,
    deletedAt: null,
  })
  const plan = {
    id: 'current',
    programId: PROGRAMA,
    source: PROGRAMA,
    variant: null,
    adaptation: null,
    weakPoints: null,
    priorities: null,
    chosenAt: ahora,
  }
  put('plans', plan)
  put('rotation', { id: 'current', programId: PROGRAMA, bloque: 0, semana: 0, siguiente: 0 })

  // Entrenos: lunes, martes, jueves y sábado, hasta ayer (alguna semana falla uno: la vida real)
  for (let n = DIAS; n >= 1; n--) {
    const dia = new Date(Date.now() - n * DIA).getDay()
    const i = POR_DIA[dia]
    if (i === undefined || ruido(n) > 0.85) continue
    put('workouts', entreno(n, i))
  }

  // Mesociclos: dos archivados (con su rutina) y el de ahora
  const sesiones = SESIONES.map((s) => ({
    sigla: s.sigla,
    nombre: s.nombre,
    ejercicios: s.ejercicios.map((e) => ({ nombre: e.nombre, series: e.reps.length, reps: '8–12', rir: 2 })),
  }))
  for (const e of ETAPAS)
    put('mesocycles', {
      id: e.id,
      nombre: e.nombre,
      inicio: fecha(e.desde),
      fin: e.hasta === 0 ? null : fecha(e.hasta),
      objetivo: e.objetivo,
      rutina: 'MUTA · Cuerpo completo A/B',
      programId: PROGRAMA,
      plan,
      sesiones,
      sesionesPorSemana: 4,
      startDate: fecha(e.desde),
    })

  // Pesajes de cada mañana (con el agua del día a día) y las medidas del mes
  for (let n = DIAS; n >= 0; n--)
    put('bodyLog', {
      date: fecha(n),
      type: 'weight',
      kg: Math.round((pesoDe(n) + ruido(n) * 0.45) * 10) / 10,
      createdAt: ahora,
      updatedAt: ahora,
    })
  for (const { n, ...cm } of MEDIDAS)
    put('bodyLog', { date: fecha(n), ...cm, type: 'perimetros', createdAt: ahora, updatedAt: ahora })
  for (const f of fotos) put('photos', f)

  // Las 3 últimas semanas (hoy no: queda por hacer en Hoy): tus pasos y ¿Cómo estás hoy?
  const tres = (n: number, k: number) =>
    Math.max(0, Math.min(2, Math.round(1 + ruido(n + k) * 0.8))) as 0 | 1 | 2
  for (let n = 21; n >= 1; n--) {
    put('bodyLog', {
      date: fecha(n),
      type: 'steps',
      pasos: Math.round(10_500 + ruido(n + 4) * 2_500),
      createdAt: ahora,
      updatedAt: ahora,
    })
    put('bodyLog', {
      date: fecha(n),
      type: 'sensaciones',
      sueno: tres(n, 5),
      energia: tres(n, 6),
      hambre: n < 29 ? 2 : tres(n, 7),
      digestiones: 0,
      estres: tres(n, 8),
      createdAt: ahora,
      updatedAt: ahora,
    })
  }

  // Consultas de cada domingo (las 8 últimas semanas): sueño, energía, fatiga y ganas
  for (let w = 8; w >= 1; w--) {
    const n = w * 7 - 1
    put('bodyLog', {
      date: fecha(n),
      type: 'checkin',
      fecha: fecha(n),
      cintura: Math.round((84.5 - (n < 29 ? (29 - n) * 0.07 : 0)) * 10) / 10,
      sueno: Math.round((7 + ruido(n) * 0.6) * 10) / 10,
      hambre: n < 29 ? 7 : 4,
      energia: Math.round(7 + ruido(n + 1)),
      fatiga: Math.round(4 + ruido(n + 2) + (n < 29 ? 1 : 0)),
      dolor: 2,
      ganas: Math.round(8 + ruido(n + 3)),
      estres: 4,
      nota: '',
      createdAt: ahora,
      updatedAt: ahora,
    })
  }

  // Nutrición: tu objetivo (definición al −0,5 % desde hace 4 semanas) y lo que comió las 3 últimas semanas
  put('userContent', {
    id: 'nutricion',
    target: 'nutricion',
    cuerpo: { sexo: 'hombre', edad: 29, alturaCm: 178, pesoKg: 80.6 },
    pasos: 10000,
    diasEntreno: 4,
    fase: 'definicion',
    ritmo: 0.5,
    faseDesde: fecha(28),
    proteinaGKg: 2,
    grasaGKg: 0.8,
    kcal: 2350,
    kcalAnterior: null,
    desde: fecha(28),
    aMano: false,
    creado: fecha(DIAS),
  })
  for (let n = 21; n >= 1; n--) {
    const kcal = Math.round(2350 + ruido(n) * 180)
    put('foodLog', {
      date: fecha(n),
      apuntes: [
        {
          id: `demo-c-${n}`,
          comida: 'comida',
          nombre: 'Lo del día',
          alimentoId: null,
          gramos: null,
          raciones: null,
          racion: null,
          kcal,
          protein: Math.round(160 + ruido(n) * 15),
          carbs: Math.round(kcal * 0.11),
          fat: 68,
        },
      ],
      createdAt: ahora,
      updatedAt: ahora,
    })
  }
  // Tu menú: la compra y lo que cocinas hoy (perfilDemoMenu.ts)
  for (const doc of menuDemo(fecha, conRecetario)) put('userContent', doc)
  // Tu objetivo de grasa en Progreso
  put('userContent', { id: 'composicion', target: 'composicion', calibracion: null, objetivo: 12 })

  await new Promise((ok, ko) => {
    tx.oncomplete = ok
    tx.onerror = () => ko(tx.error)
  })
  db.close()
}
