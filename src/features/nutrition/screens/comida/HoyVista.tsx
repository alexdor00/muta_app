import {
  addDays,
  daysBetween,
  formatDayDate,
  formatDecimal,
  formatInt,
} from '../../../../shared/lib/format.ts'
import { CoachCard } from '../../components/CoachCard.tsx'
import { DayHero } from '../../components/DayHero.tsx'
import { DayNav } from '../../components/DayNav.tsx'
import { MealList } from '../../components/MealList.tsx'
import { MenuList } from '../../components/MenuList.tsx'
import {
  comidasDia,
  diaVisto,
  hoy,
  objetivoDia,
  pendiente,
  pesajes,
  totalDia,
  type ComidaId,
} from '../../state/comida.ts'
import { apuntada, menuDelDia, tocaConsulta } from '../../state/dieta.ts'
import styles from './Vistas.module.css'

type Props = {
  /** Apuntar el peso de hoy (hasta que exista la pestaña Hoy). */
  onPesarme: () => void
  onAnadir: (comida: ComidaId) => void
  onAbrirComida: (comida: ComidaId) => void
  /** Abre la sugerencia del entrenador; null si no hay ninguna esperando. */
  onSugerencia: (() => void) | null
  onAbrirReceta: (id: string) => void
  onApuntarReceta: (id: string) => void
  onConsulta: () => void
}

function tituloDia(fecha: string, hoyEs: string): string {
  const n = daysBetween(fecha, hoyEs)
  return n === 0 ? 'Hoy' : n === 1 ? 'Ayer' : formatDayDate(fecha)
}

/**
 * Hoy (o el día que elijas con ‹ ›): el anillo con lo que llevas, el aviso del entrenador si tiene algo, el menú de tu
 * dieta si sigues una y tus comidas.
 */
export function HoyVista({
  onPesarme,
  onAnadir,
  onAbrirComida,
  onSugerencia,
  onAbrirReceta,
  onApuntarReceta,
  onConsulta,
}: Props) {
  const objetivo = objetivoDia.value
  if (!objetivo) return null
  const fecha = diaVisto.value
  const esHoy = fecha === hoy.value
  const total = totalDia.value
  const sugerencia = pendiente.value
  const menu = menuDelDia.value
  const pesoDeHoy = pesajes.value.find((p) => p.date === hoy.value)
  const quedan = Math.max(0, objetivo.kcal - total.kcal)
  const faltaProteina = Math.max(0, Math.round(objetivo.protein - total.protein))
  return (
    <div class={styles.stack}>
      <DayNav
        titulo={tituloDia(fecha, hoy.value)}
        etiqueta={esHoy ? `Hoy, ${formatDayDate(fecha)}` : formatDayDate(fecha)}
        onAntes={() => (diaVisto.value = addDays(fecha, -1))}
        onDespues={esHoy ? null : () => (diaVisto.value = addDays(fecha, 1))}
      />
      <DayHero
        comidas={total.kcal}
        objetivo={objetivo.kcal}
        macros={[
          { nombre: 'Proteína', hecho: total.protein, objetivo: objetivo.protein },
          { nombre: 'Hidratos', hecho: total.carbs, objetivo: objetivo.carbs },
          { nombre: 'Grasa', hecho: total.fat, objetivo: objetivo.fat },
        ]}
      />
      {esHoy && (
        <p class={`${styles.pad} ${styles.sub}`}>
          {pesoDeHoy
            ? `Hoy pesas ${formatDecimal(pesoDeHoy.kg)} kg. `
            : 'Pésate cada mañana: lo mira el entrenador. '}
          <button type="button" class={styles.link} onClick={onPesarme}>
            {pesoDeHoy ? 'Cambiar' : '+ Pesarme'}
          </button>
        </p>
      )}
      {esHoy && menu && tocaConsulta.value && (
        <CoachCard
          titulo="Tu nutricionista · consulta semanal"
          texto="Toca la consulta: báscula, cinta y cómo te has sentido"
          ver="Empezar"
          onVer={onConsulta}
        />
      )}
      {esHoy && !menu && sugerencia && onSugerencia && (
        <CoachCard
          titulo="El entrenador · revisión semanal"
          texto={`Te propongo un cambio: ${sugerencia.a > (sugerencia.de ?? 0) ? '+' : '−'}${formatInt(Math.abs(sugerencia.a - (sugerencia.de ?? 0)))} kcal`}
          onVer={onSugerencia}
        />
      )}
      {menu && (
        <MenuList
          titulo={`Tu menú · ${menu.menu.id}`}
          detalle={`${menu.tipo === 'entreno' ? 'Día de entreno' : 'Día de descanso'} · día ${menu.diaCiclo} del menú`}
          filas={menu.recetas.map((r) => ({
            id: r.id,
            rotulo: r.rotulo,
            nombre: r.nombre,
            kcal: r.total.kcal,
            proteina: r.total.protein,
            apuntada: apuntada(r.id, fecha),
          }))}
          onAbrir={onAbrirReceta}
          onApuntar={onApuntarReceta}
        />
      )}
      <MealList
        comidas={comidasDia.value.map((c) => ({
          id: c.id,
          nombre: c.nombre,
          al: c.al,
          kcal: c.total.kcal,
          proteina: c.total.protein,
          alimentos: c.apuntes.map((a) => a.nombre).join(' · '),
        }))}
        quedan={
          quedan > 0
            ? `Te quedan ${formatInt(quedan)} kcal${faltaProteina ? ` y ${faltaProteina} g de proteína` : ''}`
            : 'Ya llegas a tu objetivo del día'
        }
        onAbrir={(id) => onAbrirComida(id as ComidaId)}
        onAnadir={(id) => onAnadir(id as ComidaId)}
      />
    </div>
  )
}
