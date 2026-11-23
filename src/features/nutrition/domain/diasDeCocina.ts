// Qué días cocinas (de tu semana resuelta, domain/autopilot.ts): por tus descansos, los días que elijas, al empezar cada
// menú, las veces a la semana que digas o como diga tu dieta; con los que añadas o quites a mano.
import { addDays, daysBetween } from '../../../shared/lib/format.ts'
import type { Piloto } from './autopilot.ts'
import { diaSemana, menuDelDia, seCocinaEl, type MenuSemanal } from './menu.ts'
import { DIAS_NEVERA } from './menuCocina.ts'
import { HORA_COMIDA } from './menuCalendar.ts'

/**
 * Cómo se eligen tus días de cocina entre tus descansos (sugerido): cada tanda cuenta 1; cocinar un día de entreno, 0,8;
 * cada día que pasa de los 3 de nevera (sin congelador: ese día se cocina al momento), 0,5. Así, un día al momento antes
 * que cocinar un día de entreno; dos días al momento, como una tanda más; y, si empatan, menos tandas.
 */
const COSTE = { tanda: 1, entreno: 0.8, alMomento: 0.5 }
/** Lo más que cubre una tanda (una semana). */
export const MAX_DIAS = 7

const costeDe = (dias: number) => COSTE.tanda + COSTE.alMomento * Math.max(0, dias - DIAS_NEVERA)

/**
 * Tus días de cocina entre tus descansos, de `desde` a `hasta`, después de la última tanda (`ultima`; sin ella, como si
 * hubieras cocinado el día antes de `desde`). Elige los que menos cuestan (ver COSTE) mirando una semana más allá.
 */
export function porDescanso(
  ultima: string | null,
  desde: string,
  hasta: string,
  esDescanso: (fecha: string) => boolean,
): string[] {
  const ancla = ultima && ultima < desde ? ultima : addDays(desde, -1)
  const n = daysBetween(ancla, hasta) + MAX_DIAS
  const primero = daysBetween(ancla, desde)
  const coste: number[] = [0]
  const antes: number[] = [-1]
  for (let i = 1; i <= n; i++) {
    coste[i] = Infinity
    antes[i] = -1
    if (i < primero) continue
    const extra = esDescanso(addDays(ancla, i)) ? 0 : COSTE.entreno
    // Desde el ancla vale cualquier distancia (pudo pasar tiempo); entre tandas, como mucho una semana. De lejos a cerca:
    // si empatan, gana la que deja menos tandas
    for (let j = 0; j < i; j++) {
      if (j > 0 && (i - j > MAX_DIAS || j < primero)) continue
      if (coste[j] === Infinity) continue
      const c = coste[j] + costeDe(i - j) + extra
      if (c < coste[i]) {
        coste[i] = c
        antes[i] = j
      }
    }
  }
  // El final: la última tanda, con lo que le quede hasta el final (la semana de más no se cuenta entera)
  let fin = 0
  let mejor = Infinity
  for (let i = Math.max(1, n - MAX_DIAS + 1); i <= n; i++) {
    const c = coste[i] + COSTE.alMomento * Math.max(0, n - i - DIAS_NEVERA)
    if (c < mejor) {
      mejor = c
      fin = i
    }
  }
  const dias: string[] = []
  for (let i = fin; i > 0; i = antes[i]) dias.push(addDays(ancla, i))
  return dias.reverse().filter((f) => f >= desde && f <= hasta)
}

/**
 * Al empezar cada menú: los días en que cambia el menú (y `desde`, si nadie cocinó antes: `ultimaFija` null), de `desde`
 * a `hasta`. Si pasan 3 días desde la última vez que cocinaste (la fija o la anterior de aquí), se vuelve a cocinar: nada
 * pasa de 3 días en la nevera.
 */
export function porMenu(m: MenuSemanal, desde: string, hasta: string, ultimaFija: string | null): string[] {
  const dias: string[] = []
  let ultima = ultimaFija
  for (let f = desde; f <= hasta; f = addDays(f, 1)) {
    const cambia = menuDelDia(m, f)?.id !== menuDelDia(m, addDays(f, -1))?.id
    const primero = ultima === null
    const largo = ultima !== null && daysBetween(ultima, f) >= DIAS_NEVERA
    if (cambia || primero || largo) {
      dias.push(f)
      ultima = f
    }
  }
  return dias
}

/**
 * Lo que cuesta cada cosa al colocar tus días de cocina (sugerido): cocinar un día que no empieza menú, 0,5; un día de
 * entreno, 0,3; cada día que pasa de los 3 de nevera (se cocina al momento), 0,4; y que las tandas no queden igual de repartidas, 0,1 por cada
 * día de diferencia al cuadrado. Lo que no cubre ninguna tanda al principio, 1 por día.
 */
const PESO = { sinMenu: 0.5, entreno: 0.3, alMomento: 0.4, reparto: 0.1, sinCubrir: 1 }

/**
 * Tus días de cocina con «¿Cuántas veces a la semana cocinas?» (usuario, 2026-11-17): `veces` por semana entre `desde` y
 * `hasta`, colocadas donde menos cuestan (ver PESO): mejor el día que empieza un menú y tus descansos, repartidas y sin
 * pasar de 3 días en la nevera. `ultima`: la última vez que cocinaste (las tandas siguen desde ahí).
 */
export function porVeces(
  m: MenuSemanal,
  desde: string,
  hasta: string,
  veces: number,
  ultima: string | null,
  esDescanso: (fecha: string) => boolean,
): string[] {
  const n = daysBetween(desde, hasta) + 1
  if (n <= 0 || veces <= 0) return []
  const dias = Array.from({ length: n }, (_, i) => addDays(desde, i))
  const k = Math.max(1, Math.min(n, Math.round((veces * n) / 7)))
  const ideal = 7 / veces
  const coste = (f: string) =>
    (menuDelDia(m, f)?.id !== menuDelDia(m, addDays(f, -1))?.id ? 0 : PESO.sinMenu) +
    (esDescanso(f) ? 0 : PESO.entreno)
  const hueco = (g: number) =>
    PESO.alMomento * Math.max(0, g - DIAS_NEVERA) + PESO.reparto * (g - ideal) * (g - ideal)
  // Desde la última vez: su hueco; sin ella, lo que queda sin cubrir antes de la primera
  const inicio = (i: number) =>
    ultima && ultima < desde ? hueco(daysBetween(ultima, dias[i])) : PESO.sinCubrir * i
  // c[j][i]: lo mejor con j + 1 tandas, la última el día i
  const c: number[][] = [dias.map((f, i) => inicio(i) + coste(f))]
  const de: number[][] = [dias.map(() => -1)]
  for (let j = 1; j < k; j++) {
    c[j] = dias.map(() => Infinity)
    de[j] = dias.map(() => -1)
    for (let i = j; i < n; i++)
      for (let a = j - 1; a < i; a++) {
        const v = c[j - 1][a] + hueco(i - a) + coste(dias[i])
        if (v < c[j][i]) {
          c[j][i] = v
          de[j][i] = a
        }
      }
  }
  // La última, con lo que le quede hasta el final
  let fin = -1
  let mejor = Infinity
  for (let i = k - 1; i < n; i++) {
    const v = c[k - 1][i] + PESO.alMomento * Math.max(0, n - 1 - i - DIAS_NEVERA)
    if (v < mejor) {
      mejor = v
      fin = i
    }
  }
  const out: string[] = []
  for (let j = k - 1, i = fin; j >= 0 && i >= 0; i = de[j][i], j--) out.push(dias[i])
  return out.reverse()
}

/** Los días de la semana que elegiste, de `desde` a `hasta`. */
export function porDias(dias: readonly number[], desde: string, hasta: string): string[] {
  const n = daysBetween(desde, hasta)
  return Array.from({ length: n + 1 }, (_, i) => addDays(desde, i)).filter((f) => dias.includes(diaSemana(f)))
}

/**
 * Los días de tus tandas hasta `hasta`: los ya fijos (sin los que pasaste a otro día) y, después del último, los que
 * salen de tu regla (tus descansos o tus días).
 */
export function fechasDeTandas(
  p: Piloto,
  hasta: string,
  esDescanso: (fecha: string) => boolean,
  m?: MenuSemanal,
): string[] {
  if (p.cocina.modo === 'no') return []
  const fijas = p.tandas.filter((f) => !p.saltadas.includes(f))
  const ultima = fijas.length ? fijas.reduce((a, b) => (a > b ? a : b)) : null
  // Desde el día siguiente a la última fija, pero nunca antes de aplicarlo (lo de antes no se inventa)
  const desde = ultima && addDays(ultima, 1) > p.desde ? addDays(ultima, 1) : p.desde
  if (desde > hasta) return [...fijas].sort()
  const nuevas =
    p.cocina.modo === 'dias'
      ? porDias(p.cocina.dias, desde, hasta)
      : p.cocina.modo === 'menu' && m
        ? porMenu(m, desde, hasta, ultima)
        : p.cocina.modo === 'dieta' && m?.ciclo?.cocinar?.length
          ? Array.from({ length: daysBetween(desde, hasta) + 1 }, (_, i) => addDays(desde, i)).filter((f) =>
              seCocinaEl(m.ciclo!, f),
            )
          : (p.cocina.modo === 'veces' || p.cocina.modo === 'dieta') && m
            ? porVeces(m, desde, hasta, p.cocina.veces ?? 2, ultima, esDescanso)
            : porDescanso(ultima, desde, hasta, esDescanso)
  // Por bloques de menú y cocinando después de comer: la tarde de antes de cada bloque (si no es antes de aplicarlo)
  const conVispera =
    porBloques(p) && vispera(p)
      ? nuevas.map((f) => (addDays(f, -1) >= p.desde && addDays(f, -1) > (ultima ?? '') ? addDays(f, -1) : f))
      : nuevas
  // Y los que añadiste a mano en el calendario (los que quitaste no van)
  const aMano = p.anadidas.filter((f) => f >= desde && f <= hasta)
  return [...new Set([...fijas, ...[...conVispera, ...aMano].filter((f) => !p.saltadas.includes(f))])].sort()
}

/** ¿Tus tandas van por bloques de días enteros? (al empezar cada menú, las veces que elijas o como diga tu dieta). */
export const porBloques = (p: Piloto) =>
  p.cocina.modo === 'menu' || p.cocina.modo === 'veces' || p.cocina.modo === 'dieta'

/** ¿Cocinas después de comer? Entonces, la tarde de antes de cada bloque. */
export const vispera = (p: Piloto) => p.cocina.hora > HORA_COMIDA.comida
