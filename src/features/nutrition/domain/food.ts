// Alimentos y lo que apuntas: macros de una cantidad, la suma del día, la búsqueda y los recientes.
// La base (1.493 alimentos por 100 g, BEDCA y USDA) es shared/content/foods.json; las reglas del buscador y de la
// comida según la hora salen del prototipo anterior (js/comida/comida.js).
import { plainText } from '../../../shared/lib/format.ts'

/** Un alimento, con sus valores por 100 g y su ración habitual. */
export type Alimento = {
  id: string
  name: string
  category: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  servingG: number
  servingLabel: string
}

export type Macros = { kcal: number; protein: number; carbs: number; fat: number }

export type ComidaId = 'desayuno' | 'comida' | 'merienda' | 'cena'

/** Las comidas del día (nombres sugeridos: los documentos no las fijan). */
export const COMIDAS: { id: ComidaId; nombre: string; el: string; al: string }[] = [
  { id: 'desayuno', nombre: 'Desayuno', el: 'el desayuno', al: 'al desayuno' },
  { id: 'comida', nombre: 'Comida', el: 'la comida', al: 'a la comida' },
  { id: 'merienda', nombre: 'Merienda', el: 'la merienda', al: 'a la merienda' },
  { id: 'cena', nombre: 'Cena', el: 'la cena', al: 'a la cena' },
]

/** Lo que apuntas: un alimento con su cantidad, o solo las kcal y la proteína (sin alimento). */
export type Apunte = Macros & {
  id: string
  comida: ComidaId
  nombre: string
  alimentoId: string | null
  gramos: number | null
  /** En raciones (1,5 filetes); null si se apuntó en gramos. */
  raciones: number | null
  racion: string | null
}

/** Cómo se escribe la cantidad: en raciones del alimento o en gramos. */
export type Modo = 'racion' | 'gramos'

/** Los más habituales, para cuando aún no has apuntado nada (lista del prototipo). */
export const POPULARES = [
  'f_huevo_entero',
  'f_pechuga_de_pollo_cruda',
  'f_arroz_blanco_cocido',
  'f_copos_de_avena',
  'f_platano',
  'f_skyr_yogur_proteico',
  'f_pan_de_barra',
  'f_aceite_de_oliva',
  'f_leche_semidesnatada',
  'f_atun_al_natural_lata_escurrido',
  'f_patata_cruda',
  'f_proteina_whey_polvo',
  'f_yogur_griego_natural',
  'f_salmon_crudo',
  'f_brocoli',
]

const r1 = (n: number) => Math.round(n * 10) / 10

/** Macros de `gramos` de un alimento: kcal enteras, el resto con un decimal. */
export function macrosDe(alimento: Macros, gramos: number): Macros {
  const k = gramos / 100
  return {
    kcal: Math.round(alimento.kcal * k),
    protein: r1(alimento.protein * k),
    carbs: r1(alimento.carbs * k),
    fat: r1(alimento.fat * k),
  }
}

/** Suma de lo apuntado. */
export function sumar(apuntes: readonly Macros[]): Macros {
  const t = apuntes.reduce(
    (s, a) => ({
      kcal: s.kcal + a.kcal,
      protein: s.protein + a.protein,
      carbs: s.carbs + a.carbs,
      fat: s.fat + a.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )
  return { kcal: Math.round(t.kcal), protein: r1(t.protein), carbs: r1(t.carbs), fat: r1(t.fat) }
}

/** La comida que toca por la hora: antes de las 11, desayuno; de 11 a 16, comida; de 16 a 19, merienda; después, cena. */
export function comidaPorHora(hora: number): ComidaId {
  return hora < 11 ? 'desayuno' : hora < 16 ? 'comida' : hora < 19 ? 'merienda' : 'cena'
}

/** Gramos de una cantidad: en raciones, por el peso de la ración. */
export function gramosDe(alimento: Alimento, cantidad: number, modo: Modo): number {
  return modo === 'racion' ? cantidad * alimento.servingG : cantidad
}

/** Lo que suma o resta cada toque de − / +: media ración o 10 g. */
export function pasoDe(modo: Modo): number {
  return modo === 'racion' ? 0.5 : 10
}

/** Al cambiar de raciones a gramos (o al revés), la misma cantidad: en raciones, al cuarto más cercano. */
export function cantidadAlCambiar(alimento: Alimento, cantidad: number, a: Modo): number {
  if (a === 'gramos') return Math.round(cantidad * alimento.servingG)
  return Math.max(0.25, Math.round((cantidad / alimento.servingG) * 4) / 4)
}

/** Se apunta en gramos lo que se pesa (ración de 100 g o escrita en gramos); el resto, en raciones. */
export function modoInicial(alimento: Alimento): Modo {
  return alimento.servingG === 100 || /^\d+([.,]\d+)?\s*g\b/i.test(alimento.servingLabel)
    ? 'gramos'
    : 'racion'
}

/**
 * Busca sin tildes, con todas las palabras escritas en el nombre. Primero lo que empieza por lo escrito, luego una palabra que empieza así y luego el resto; entre
 * iguales, lo cocinado antes que lo crudo (se come cocinado).
 */
export function buscarAlimentos(lista: readonly Alimento[], texto: string, max = 40): Alimento[] {
  const q = plainText(texto).trim()
  if (!q) return []
  // Cada palabra, en cualquier parte del nombre («salmon plancha» → «Salmón a la plancha»)
  const palabras = q.split(/\s+/)
  const rango = (a: Alimento) => {
    const n = plainText(a.name)
    const donde = n.startsWith(q) ? 0 : n.split(/\s+/).some((w) => w.startsWith(q)) ? 1 : 2
    const coccion = /cocid|hervid|plancha|cocin/.test(n) ? 0 : /crud/.test(n) ? 2 : 1
    return donde * 10 + coccion
  }
  return lista
    .filter((a) => {
      const n = plainText(a.name)
      return palabras.every((p) => n.includes(p))
    })
    .map((a) => [rango(a), a] as const)
    .sort((x, y) => x[0] - y[0])
    .slice(0, max)
    .map(([, a]) => a)
}

/** Los alimentos que más apuntas (los 30 últimos días con algo), del más repetido al menos. */
export function recientes(
  dias: readonly { date: string; apuntes: readonly Apunte[] }[],
  limite = 15,
): string[] {
  const veces = new Map<string, number>()
  const ultimos = [...dias].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30)
  for (const d of ultimos)
    for (const a of d.apuntes) if (a.alimentoId) veces.set(a.alimentoId, (veces.get(a.alimentoId) ?? 0) + 1)
  return [...veces.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([id]) => id)
}

/** Cada comida con lo suyo, en el orden del día. */
export function porComida(apuntes: readonly Apunte[]): ((typeof COMIDAS)[number] & { apuntes: Apunte[] })[] {
  return COMIDAS.map((c) => ({ ...c, apuntes: apuntes.filter((a) => a.comida === c.id) }))
}

/** Faltan hidratos o grasa en el alimento: las kcal cuentan, pero los macros pueden quedar cortos (aviso del prototipo). */
export function macrosIncompletos(a: Macros): boolean {
  return a.carbs === 0 && a.fat === 0 && a.kcal > a.protein * 4 + 20
}
