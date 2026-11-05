// La dieta de ejemplo del prototipo anterior (js/comida/dieta.js · sampleDiet), para probar la dieta sin tener una:
// tres menús que se repiten cada dos días, batido, merienda y preentreno. Recetas, gramos, pasos, fases y reglas son
// los del prototipo; los macros salen de la base de alimentos. No es una dieta pautada: la app la marca «de ejemplo».
import type { Alimento, ComidaId } from './food.ts'
import { FORMATO, UMBRALES, type Dieta, type Ingrediente, type Receta } from './diet.ts'

type Fila = [id: string, entreno: number, descanso: number | null, nombre?: string]

function ingrediente(base: readonly Alimento[], [id, entreno, descanso, nombre]: Fila): Ingrediente | null {
  const a = base.find((x) => x.id === id)
  if (!a) return null
  return {
    nombre: nombre ?? a.name,
    alimentoId: a.id,
    categoria: a.category,
    por100: { kcal: a.kcal, protein: a.protein, carbs: a.carbs, fat: a.fat },
    gramos: { entreno, descanso: descanso ?? entreno },
    // Lo que cambia el día de descanso es lo que se mueve con la consulta (el `flex` del prototipo)
    ajusta: descanso !== null && descanso !== entreno,
    nota: '',
  }
}

const RECETAS: {
  id: string
  nombre: string
  menu: string | null
  rotulo: string
  comida: ComidaId
  soloEntreno?: boolean
  filas: Fila[]
  pasos: string[]
}[] = [
  {
    id: 'pollo_arroz',
    nombre: 'Pollo con arroz y verduras',
    menu: 'A',
    rotulo: 'Comida 1',
    comida: 'comida',
    filas: [
      ['f_pechuga_de_pollo_cruda', 170, null],
      ['f_arroz_blanco_crudo', 100, 60, 'Arroz (en crudo)'],
      ['f_brocoli', 150, null],
      ['f_aceite_de_oliva', 10, null],
    ],
    pasos: ['Cuece el arroz.', 'Haz el pollo a la plancha con el aceite.', 'Saltea el brócoli y sirve.'],
  },
  {
    id: 'salmon_patata',
    nombre: 'Salmón con patata asada',
    menu: 'A',
    rotulo: 'Comida 2',
    comida: 'cena',
    filas: [
      ['f_salmon_crudo', 150, null],
      ['f_patata_cruda', 300, 200, 'Patata (en crudo)'],
      ['f_lechuga', 80, null],
      ['f_tomate', 120, null],
    ],
    pasos: ['Asa la patata 35 min a 200 °C.', 'Salmón a la plancha 3–4 min por lado.', 'Ensalada al lado.'],
  },
  {
    id: 'pasta_ternera',
    nombre: 'Pasta con ternera y tomate',
    menu: 'B',
    rotulo: 'Comida 1',
    comida: 'comida',
    filas: [
      ['f_pasta_cruda', 100, 60, 'Pasta (en crudo)'],
      ['f_ternera_magra_cruda', 150, null],
      ['f_tomate', 150, null],
      ['f_cebolla', 60, null],
      ['f_aceite_de_oliva', 10, null],
    ],
    pasos: ['Cuece la pasta.', 'Sofríe cebolla y tomate, añade la ternera.', 'Mezcla y sirve.'],
  },
  {
    id: 'merluza_boniato',
    nombre: 'Merluza con boniato y calabacín',
    menu: 'B',
    rotulo: 'Comida 2',
    comida: 'cena',
    filas: [
      ['f_merluza_cruda', 220, null],
      ['f_boniato_crudo', 250, 150, 'Boniato (en crudo)'],
      ['f_calabacin', 200, null],
      ['f_aceite_de_oliva', 10, null],
    ],
    pasos: ['Boniato al horno 40 min.', 'Merluza al horno 12 min.', 'Calabacín a la plancha.'],
  },
  {
    id: 'lentejas',
    nombre: 'Lentejas con arroz',
    menu: 'C',
    rotulo: 'Comida 1',
    comida: 'comida',
    filas: [
      ['f_lentejas_cocidas', 300, null],
      ['f_arroz_blanco_crudo', 60, 30, 'Arroz (en crudo)'],
      ['f_pimiento', 80, null],
      ['f_aceite_de_oliva', 10, null],
      ['f_huevo_entero', 60, null, 'Huevo'],
    ],
    pasos: ['Sofríe el pimiento.', 'Añade lentejas y arroz cocido.', 'Huevo cocido por encima.'],
  },
  {
    id: 'wrap_atun',
    nombre: 'Wraps de atún y aguacate',
    menu: 'C',
    rotulo: 'Comida 2',
    comida: 'cena',
    filas: [
      ['f_tortilla_de_trigo_wrap', 120, 60, 'Tortillas de trigo'],
      ['f_atun_al_natural_lata_escurrido', 112, null],
      ['f_aguacate', 60, null],
      ['f_tomate', 100, null],
      ['f_skyr_yogur_proteico', 100, null, 'Skyr (salsa)'],
    ],
    pasos: ['Mezcla el atún con el skyr.', 'Rellena con tomate y aguacate.'],
  },
  {
    id: 'batido',
    nombre: 'Batido',
    menu: null,
    rotulo: 'Batido',
    comida: 'desayuno',
    filas: [
      ['f_proteina_whey_polvo', 30, null, 'Proteína whey'],
      ['f_platano', 120, null],
      ['f_leche_desnatada', 300, null],
    ],
    pasos: ['Bátelo todo.'],
  },
  {
    id: 'merienda',
    nombre: 'Skyr con avena y nueces',
    menu: null,
    rotulo: 'Merienda',
    comida: 'merienda',
    filas: [
      ['f_skyr_yogur_proteico', 200, null, 'Skyr'],
      ['f_copos_de_avena', 30, null],
      ['f_arandanos', 100, null],
      ['f_nueces', 20, null],
    ],
    pasos: ['Mézclalo todo en un bol.'],
  },
  {
    id: 'preentreno',
    nombre: 'Preentreno',
    menu: null,
    rotulo: 'Preentreno',
    comida: 'merienda',
    soloEntreno: true,
    filas: [
      ['f_tortitas_de_arroz', 27, null, 'Tortitas de arroz (3)'],
      ['f_miel', 15, null],
    ],
    pasos: ['30–45 min antes de entrenar.'],
  },
]

/** Los alimentos de la base que usa la dieta de ejemplo. */
export const ALIMENTOS_DEL_EJEMPLO = [...new Set(RECETAS.flatMap((r) => r.filas.map(([id]) => id)))]

/** La dieta de ejemplo con los valores de la base de alimentos (null si falta alguno en la base). */
export function dietaDeEjemplo(base: readonly Alimento[]): Dieta | null {
  const recetas: Receta[] = []
  for (const r of RECETAS) {
    const ingredientes = r.filas.map((f) => ingrediente(base, f))
    if (ingredientes.some((i) => !i)) return null
    recetas.push({
      id: r.id,
      nombre: r.nombre,
      comida: r.comida,
      rotulo: r.rotulo,
      menu: r.menu,
      soloEntreno: r.soloEntreno ?? false,
      ingredientes: ingredientes as Ingrediente[],
      pasos: r.pasos,
      notas: [],
      propia: false,
    })
  }
  return {
    formato: FORMATO,
    version: 1,
    id: 'ejemplo',
    nombre: 'Dieta de ejemplo',
    descripcion: 'Para probar: tres menús que se repiten cada dos días',
    menus: [
      { id: 'A', nombre: 'Menú A' },
      { id: 'B', nombre: 'Menú B' },
      { id: 'C', nombre: 'Menú C' },
    ],
    ciclo: ['A', 'A', 'B', 'B', 'C', 'C', 'A'],
    recetas,
    fases: [
      { id: 'f1', nombre: 'Fase 1', desdeSemana: 1, kcal: 0 },
      { id: 'f2', nombre: 'Fase 2', desdeSemana: 5, kcal: 150 },
    ],
    umbrales: UMBRALES,
    ejemplo: true,
  }
}
