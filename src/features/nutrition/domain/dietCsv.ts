// Tu dieta desde un CSV (Tu dieta · «Cargar»), además del archivo de MUTA y de crearla en la app (decisión 2026-11-09;
// ampliado el 2026-11-17 para leer cualquier dieta: «que detecte de forma exacta todo»). Una fila por ingrediente; da
// igual el orden de las columnas, las mayúsculas y las tildes. Lo que se puede poner (ver docs/datos.md · Dieta en CSV):
//
// - comida (desayuno, comida o almuerzo, merienda o cena), receta e ingrediente: obligatorias.
// - gramos, o «gramos entreno» y «gramos descanso» (lo que cambia según el día). Sin gramos, la «cantidad» en texto
//   («al gusto», «1 diente»): va sin cantidad que cuente.
// - menú: su nombre; «Todos» (o vacío) si va todos los días (el batido). «días»: los días del ciclo de ese menú («1 2»,
//   «1-2»; el ciclo dura lo que diga el día más alto: 6, 7, 14…). «cocinar»: el día del ciclo en que se cocina ese menú.
// - solo: «entreno» o «descanso» (el preentreno, solo los días de entreno). nombre: cómo sale en el menú («Comida 1»).
// - kcal, proteína, hidratos y grasa por 100 g (si no, se buscan en la base); o «kcal total», «proteína total»… del
//   ingrediente con sus gramos de entreno. «ajusta»: «sí» en el ingrediente que se mueve cuando cambian tus kcal.
// - paso y nota: una fila con solo la receta y su paso (o su nota) añade un paso (o una nota) a esa receta.
import { columnas, leerCsv, limpioCsv } from '../../../shared/lib/csv.ts'
import { FORMATO, MAX_CICLO, UMBRALES, type Dieta, type Ingrediente, type Menu, type Receta } from './diet.ts'
import type { Alimento, ComidaId, Macros } from './food.ts'

const COLUMNAS = {
  menu: ['menu'],
  comida: ['comida', 'momento'],
  receta: ['receta', 'plato'],
  ingrediente: ['ingrediente', 'alimento'],
  gramos: ['gramos', 'g', 'cantidad g', 'gramos (g)'],
  entreno: ['gramos entreno', 'entreno', 'gramos dia de entreno', 'g entreno'],
  descanso: ['gramos descanso', 'descanso', 'gramos dia de descanso', 'g descanso'],
  cantidad: ['cantidad', 'medida', 'unidades'],
  kcal: ['kcal', 'kcal 100 g', 'kcal por 100 g', 'calorias'],
  proteina: ['proteina', 'proteinas', 'proteina 100 g', 'proteina por 100 g'],
  hidratos: ['hidratos', 'carbohidratos', 'hidratos 100 g', 'carbohidratos 100 g'],
  grasa: ['grasa', 'grasas', 'grasa 100 g', 'grasa por 100 g'],
  kcalTotal: ['kcal total', 'kcal racion', 'kcal (total)', 'calorias total'],
  proteinaTotal: ['proteina total', 'proteina racion', 'prot. total'],
  hidratosTotal: ['hidratos total', 'carbohidratos total', 'hidratos racion', 'carb. total'],
  grasaTotal: ['grasa total', 'grasa racion', 'grasas total'],
  dias: ['dias', 'dia', 'dias del ciclo'],
  cocinar: ['cocinar', 'cuando cocinar', 'dia de cocinar', 'cocinar el dia'],
  solo: ['solo', 'tipo de dia', 'solo los dias'],
  nombre: ['nombre', 'rotulo', 'nombre en el menu'],
  ajusta: ['ajusta', 'se ajusta'],
  preparar: ['preparar', 'se prepara', 'como se prepara'],
  alMomento: ['al momento', 'fresco', 'se hace al momento'],
  paso: ['paso', 'pasos', 'preparacion'],
  nota: ['nota', 'notas'],
} as const

const COMIDAS: Record<string, ComidaId> = {
  desayuno: 'desayuno',
  comida: 'comida',
  almuerzo: 'comida',
  merienda: 'merienda',
  cena: 'cena',
}

/** Lo que dice «menú» cuando la receta va todos los días. */
const TODOS = new Set(['', 'todos', 'todos los dias', 'todo', 'cada dia', 'diario'])

/** El primer número de una celda («130», «130 g», «≈ 390», «0,5»); null si no hay. */
const numero = (s: string) => {
  const m = s.replace(/\s/g, '').match(/\d+(?:[.,]\d+)?/)
  if (!m) return null
  const n = Number(m[0].replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : null
}

/** Los días de una celda: «1 2», «1, 3», «1-2», «días 1 y 2». */
function dias(s: string): number[] {
  const out: number[] = []
  for (const parte of limpioCsv(s)
    .split(/[\s,;y]+/)
    .filter(Boolean)) {
    const rango = parte.match(/^(\d+)-(\d+)$/)
    if (rango) for (let d = Number(rango[1]); d <= Number(rango[2]); d++) out.push(d)
    else if (/^\d+$/.test(parte)) out.push(Number(parte))
  }
  return [...new Set(out.filter((d) => d >= 1 && d <= MAX_CICLO))].sort((a, b) => a - b)
}

const id = (s: string) =>
  limpioCsv(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const SI = new Set(['si', 'x', '1', 'true', 'ajusta'])

export type DietaCsv = { dieta: Dieta | null; recetas: number; errores: string[] }

/**
 * Lee el CSV de una dieta. `buscar` encuentra un alimento de la base por su nombre (para los valores por 100 g que no
 * traiga el archivo). Si algo no se puede leer, no hay dieta y se dice qué fila falla.
 */
export function dietaDesdeCsv(
  texto: string,
  nombre: string,
  idDieta: string,
  buscar: (nombre: string) => Alimento | null,
): DietaCsv {
  const { titulos, filas } = leerCsv(texto)
  const errores: string[] = []
  const nada = (): DietaCsv => ({ dieta: null, recetas: 0, errores })
  if (!filas.length) {
    errores.push('El archivo está vacío: hace falta la fila de títulos y al menos un ingrediente.')
    return nada()
  }
  const col = columnas(titulos, COLUMNAS)
  for (const k of ['comida', 'receta', 'ingrediente'] as const)
    if (col[k] < 0) errores.push(`Falta la columna «${k}».`)
  if (col.gramos < 0 && col.entreno < 0 && col.descanso < 0 && col.cantidad < 0)
    errores.push('Falta la columna «gramos» (o «gramos entreno» y «gramos descanso»).')
  if (errores.length) return nada()

  const menus: Menu[] = []
  const diasDe = new Map<string, number[]>()
  const cocinarDe = new Map<string, number[]>()
  const recetas = new Map<string, Receta>()
  /** El ingrediente que dice «ajusta» en cada receta. */
  const ajustaEn = new Map<string, number>()
  /** La última receta de cada nombre (para las filas de solo paso o nota). */
  const porNombre = new Map<string, string>()
  for (const { fila, celdas } of filas) {
    const dato = (k: keyof typeof COLUMNAS) => (col[k] >= 0 ? (celdas[col[k]] ?? '').trim() : '')
    const nombreReceta = dato('receta')
    const ingrediente = dato('ingrediente')
    const paso = dato('paso')
    const nota = dato('nota')
    // Una fila sin ingrediente: un paso o una nota de una receta que ya salió
    if (!ingrediente && nombreReceta && (paso || nota)) {
      const rid = porNombre.get(limpioCsv(nombreReceta))
      const r = rid ? recetas.get(rid) : null
      if (!r) {
        errores.push(`Fila ${fila}: el paso o la nota de «${nombreReceta}» va antes que sus ingredientes.`)
        continue
      }
      recetas.set(r.id, {
        ...r,
        pasos: paso ? [...r.pasos, paso] : r.pasos,
        notas: nota ? [...r.notas, nota] : r.notas,
      })
      continue
    }
    const comida = COMIDAS[limpioCsv(dato('comida'))]
    if (!nombreReceta || !ingrediente) {
      errores.push(`Fila ${fila}: faltan la receta o el ingrediente.`)
      continue
    }
    if (!comida) {
      errores.push(
        `Fila ${fila}: «${dato('comida')}» no es una comida: pon desayuno, comida, merienda o cena (su nombre, como «Batido», va en «nombre»).`,
      )
      continue
    }
    const cantidad = dato('cantidad')
    const gramos = numero(dato('gramos'))
    const entreno = numero(dato('entreno')) ?? gramos
    const descanso = numero(dato('descanso')) ?? gramos ?? entreno
    // Sin gramos, va sin cantidad que cuente («al gusto»), con lo que diga «cantidad»
    const sinGramos = entreno === null && descanso === null
    if (sinGramos && !cantidad) {
      errores.push(`Fila ${fila}: faltan los gramos de «${ingrediente}» (o su «cantidad», como «al gusto»).`)
      continue
    }
    const gEntreno = entreno ?? descanso ?? 0
    const gDescanso = descanso ?? entreno ?? 0
    // Los valores por 100 g: los del archivo, los totales del ingrediente (con sus gramos de entreno) o los de la base
    const por100Archivo = [dato('kcal'), dato('proteina'), dato('hidratos'), dato('grasa')].map(numero)
    const totales = [dato('kcalTotal'), dato('proteinaTotal'), dato('hidratosTotal'), dato('grasaTotal')].map(
      numero,
    )
    let por100: Macros | null = null
    if (por100Archivo.every((v) => v !== null)) {
      const [kcal, protein, carbs, fat] = por100Archivo as number[]
      por100 = { kcal, protein, carbs, fat }
    } else if (totales.every((v) => v !== null) && gEntreno > 0) {
      const [kcal, protein, carbs, fat] = (totales as number[]).map((t) => (t * 100) / gEntreno)
      por100 = { kcal, protein, carbs, fat }
    }
    const deBase = por100 ? null : buscar(ingrediente)
    if (!por100 && deBase)
      por100 = { kcal: deBase.kcal, protein: deBase.protein, carbs: deBase.carbs, fat: deBase.fat }
    // Lo que va sin cantidad («sal al gusto») no cuenta: no hace falta saber lo que aporta
    if (!por100 && sinGramos) por100 = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    if (!por100) {
      errores.push(
        `Fila ${fila}: no encuentro «${ingrediente}» en la base: pon sus kcal, proteína, hidratos y grasa (por 100 g o totales).`,
      )
      continue
    }
    const nombreMenu = dato('menu')
    const todos = TODOS.has(limpioCsv(nombreMenu))
    const menuId = todos ? null : id(nombreMenu)
    if (menuId && !menus.some((m) => m.id === menuId)) menus.push({ id: menuId, nombre: nombreMenu })
    if (menuId) {
      const d = dias(dato('dias'))
      if (d.length) diasDe.set(menuId, [...new Set([...(diasDe.get(menuId) ?? []), ...d])])
      const c = dias(dato('cocinar'))
      if (c.length) cocinarDe.set(menuId, [...new Set([...(cocinarDe.get(menuId) ?? []), ...c])])
    }
    const solo = limpioCsv(dato('solo'))
    const recetaId = `${menuId ?? 'todos'}-${comida}-${id(nombreReceta)}`
    const r = recetas.get(recetaId) ?? {
      id: recetaId,
      nombre: nombreReceta,
      comida,
      rotulo: dato('nombre') || nombreReceta,
      menu: menuId,
      soloEntreno: solo.startsWith('entreno'),
      ...(solo.startsWith('descanso') ? { soloDescanso: true } : {}),
      ingredientes: [],
      pasos: [],
      notas: [],
      propia: false,
    }
    // Cómo se prepara (la primera fila que lo diga): con antelación o al momento
    const prep = limpioCsv(dato('preparar'))
    const preparar = prep.includes('momento')
      ? 'momento'
      : /antel|antes|taper|tupper/.test(prep)
        ? 'antes'
        : null
    if (preparar && !r.preparar) r.preparar = preparar
    porNombre.set(limpioCsv(nombreReceta), recetaId)
    if (SI.has(limpioCsv(dato('ajusta')))) ajustaEn.set(recetaId, r.ingredientes.length)
    const ing: Ingrediente = {
      nombre: deBase?.name ?? ingrediente,
      alimentoId: deBase?.id ?? null,
      categoria: deBase?.category ?? '',
      por100,
      gramos: sinGramos ? null : { entreno: gEntreno, descanso: gDescanso },
      ajusta: false,
      ...(SI.has(limpioCsv(dato('alMomento'))) ? { alMomento: true } : {}),
      nota: sinGramos ? cantidad : cantidad && !/^\d+([.,]\d+)?\s*g?$/i.test(cantidad) ? cantidad : '',
    }
    recetas.set(recetaId, {
      ...r,
      ingredientes: [...r.ingredientes, ing],
      pasos: paso ? [...r.pasos, paso] : r.pasos,
      notas: nota ? [...r.notas, nota] : r.notas,
    })
  }
  if (errores.length || !recetas.size) {
    if (!errores.length) errores.push('El archivo no trae ningún ingrediente.')
    return nada()
  }
  // Una dieta sin menús (todo «Todos»): un solo menú que va todos los días
  if (!menus.length) menus.push({ id: 'unico', nombre: 'Menú' })
  // Lo que se mueve cuando cambian tus kcal: lo que diga «ajusta» o, si no, lo que más hidratos aporta (y cambia según
  // el día, si algo cambia: el arroz, el pan)
  const lista = [...recetas.values()].map((r) => {
    const marcado = ajustaEn.get(r.id)
    const cambia = r.ingredientes.findIndex((x) => x.gramos && x.gramos.entreno !== x.gramos.descanso)
    const masHidratos = r.ingredientes.reduce(
      (m, x, k) =>
        x.por100.carbs * (x.gramos?.entreno ?? 0) >
        r.ingredientes[m].por100.carbs * (r.ingredientes[m].gramos?.entreno ?? 0)
          ? k
          : m,
      0,
    )
    const elegido = marcado ?? (cambia >= 0 ? cambia : masHidratos)
    return {
      ...r,
      ingredientes: r.ingredientes.map((x, k) => ({
        ...x,
        ajusta: k === elegido && !!x.gramos && (marcado !== undefined || x.por100.carbs > 0),
      })),
    }
  })
  // El ciclo: dura lo que diga el día más alto («días» o «cocinar»); sin días, 7 por turnos (como antes)
  const todosLosDias = [...diasDe.values(), ...cocinarDe.values()].flat()
  const largo = todosLosDias.length ? Math.max(...todosLosDias) : 7
  const ciclo: string[] = Array.from({ length: largo }, () => '')
  for (const [m, ds] of diasDe) for (const d of ds) ciclo[d - 1] = m
  // Los días que nadie dice: el menú del día de antes (así «A: 1» y «B: 3» deja A A B…), o por turnos al principio
  let turno = 0
  for (let d = 0; d < largo; d++)
    if (!ciclo[d]) {
      ciclo[d] = diasDe.size && d > 0 ? ciclo[d - 1] : menus[turno % menus.length].id
      turno++
    }
  const cocinar = [...new Set([...cocinarDe.values()].flat())].sort((a, b) => a - b)
  return {
    dieta: {
      formato: FORMATO,
      version: 1,
      id: idDieta,
      nombre,
      descripcion: 'Cargada desde un CSV',
      menus,
      ciclo,
      ...(cocinar.length ? { cocinar } : {}),
      recetas: lista,
      fases: [],
      umbrales: UMBRALES,
      ejemplo: false,
    },
    recetas: lista.length,
    errores,
  }
}

/**
 * La plantilla que se descarga (Tu dieta · «Descargar plantilla»): los títulos y unas filas de ejemplo con todo lo que se
 * puede poner (se cambian por las tuyas). Un ejemplo, no una dieta pautada para nadie.
 */
export const PLANTILLA_DIETA = [
  'Menú;Días;Cocinar;Comida;Nombre;Receta;Ingrediente;Gramos entreno;Gramos descanso;Cantidad;kcal;Proteína;Hidratos;Grasa;Solo;Paso;Nota',
  'A;1-2;1;Comida;Comida 1;Arroz con pollo;Arroz (en crudo);100;70;;354;7;78;1;;;',
  'A;;;Comida;Comida 1;Arroz con pollo;Pechuga de pollo (en crudo);150;150;;110;23;0;1,5;;;',
  'A;;;Comida;Comida 1;Arroz con pollo;Sal y pimienta;;;al gusto;;;;;;;',
  ';;;;;Arroz con pollo;;;;;;;;;;Cuece el arroz y haz el pollo a la plancha.;',
  'B;3-4;3;Cena;Comida 2;Tortilla con pan;Huevos;120;120;2 huevos;143;12,6;0,7;9,5;;;',
  'B;;;Cena;Comida 2;Tortilla con pan;Pan;80;50;;250;9;49;1,5;;;',
  'Todos;;;Desayuno;Batido;Batido;Plátano;120;120;1 plátano;89;1,1;23;0,3;;;',
  'Todos;;;Merienda;Preentreno;Preentreno;Tortitas de arroz;30;30;3 tortitas;380;8;81;3;Entreno;;',
].join('\n')
