import { addDays, daysBetween, formatDayDate, formatInt } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
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
  totalDia,
  type ComidaId,
} from '../../state/comida.ts'
import { apuntada, menuDelDia, tocaConsulta } from '../../state/dieta.ts'
import {
  fotoDeApunte,
  fotos,
  gramosDeHueco,
  huecoDe,
  menu as menus,
  menuConPlatos,
  platoPorId,
  platos,
  siguiente,
  tareasDeHoy,
  totalCon,
} from '../../state/recetas.ts'
import { platoApuntado } from '../../use-cases/recipes.ts'
import styles from './Vistas.module.css'

type Props = {
  onAnadir: (comida: ComidaId) => void
  onAbrirComida: (comida: ComidaId) => void
  /** Abre la sugerencia del entrenador; null si no hay ninguna esperando. */
  onSugerencia: (() => void) | null
  onAbrirReceta: (id: string) => void
  onApuntarReceta: (id: string) => void
  onConsulta: () => void
  /** Cuadrar el día con recetas (lo que falta, en las comidas que quedan). */
  onCuadrar: () => void
  onCocinado: (id: string) => void
  /** El tick de una comida con plato de tu menú. */
  onTick: (comida: ComidaId) => void
  onQuitar: (comida: ComidaId) => void
}

function tituloDia(fecha: string, hoyEs: string): string {
  const n = daysBetween(fecha, hoyEs)
  return n === 0 ? 'Hoy' : n === 1 ? 'Ayer' : formatDayDate(fecha)
}

/**
 * Hoy (o el día que elijas con ‹ ›): el anillo con lo que llevas, el aviso del entrenador si tiene algo y tus comidas. Con
 * tu menú, cada comida trae su plato y un tick; con dieta, su menú del día.
 */
export function HoyVista({
  onAnadir,
  onAbrirComida,
  onSugerencia,
  onAbrirReceta,
  onApuntarReceta,
  onConsulta,
  onCuadrar,
  onCocinado,
  onTick,
  onQuitar,
}: Props) {
  const objetivo = objetivoDia.value
  if (!objetivo) return null
  const fecha = diaVisto.value
  const esHoy = fecha === hoy.value
  const total = totalDia.value
  const sugerencia = pendiente.value
  // Si ese día tienes un menú tuyo con platos, manda el tuyo; la dieta, solo los días sin menú tuyo
  const tuMenu = menuConPlatos(fecha)
  const enDieta = menuDelDia.value
  const menu = tuMenu ? null : enDieta
  const cocinas = esHoy ? tareasDeHoy.value.filter((t) => t.tipo === 'cocinar') : []
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
      {esHoy && enDieta && tocaConsulta.value && (
        <CoachCard
          titulo="Tu nutricionista · consulta semanal"
          texto="Toca la consulta: báscula, cinta y cómo te has sentido"
          ver="Empezar"
          onVer={onConsulta}
        />
      )}
      {esHoy && !enDieta && sugerencia && onSugerencia && (
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
        titulo={tuMenu ? tuMenu.nombre : 'Comidas'}
        comidas={comidasDia.value.map((c) => {
          const h = tuMenu ? huecoDe(menus.value, fecha, c.id) : null
          const p = h ? platoPorId(h.plato, fecha) : null
          return {
            id: c.id,
            nombre: c.nombre,
            al: c.al,
            kcal: c.total.kcal,
            proteina: c.total.protein,
            alimentos: c.apuntes.map((a) => a.nombre).join(' · '),
            foto: fotoDeApunte(c.apuntes.find((a) => a.receta)?.receta),
            menu:
              h && p
                ? {
                    nombre: p.nombre,
                    kcal: totalCon(p, gramosDeHueco(h, p)).kcal,
                    foto: fotos.value[p.id] ?? null,
                    hecho: platoApuntado(p.id, c.id, fecha),
                  }
                : undefined,
          }
        })}
        quedan={
          quedan > 0
            ? `Te quedan ${formatInt(quedan)} kcal${faltaProteina ? ` y ${faltaProteina} g de proteína` : ''}`
            : 'Ya llegas a tu objetivo del día'
        }
        onAbrir={(id) => onAbrirComida(id as ComidaId)}
        onAnadir={(id) => onAnadir(id as ComidaId)}
        onTick={(id) => onTick(id as ComidaId)}
        onQuitar={(id) => onQuitar(id as ComidaId)}
      />
      {cocinas.map(
        (t) =>
          t.tipo === 'cocinar' && (
            <p key={t.id} class={styles.pad}>
              <button type="button" class={styles.textButton} onClick={() => onCocinado(t.cocinado.id)}>
                {t.hora} · cocinas {platoPorId(t.cocinado.plato)?.nombre.toLowerCase() ?? 'un plato'} para{' '}
                {t.raciones} {t.raciones === 1 ? 'comida' : 'comidas'} ›
              </button>
            </p>
          ),
      )}
      {!tuMenu && siguiente.value && platos.value.length > 0 && (
        <div class={styles.pad}>
          <Button variant="secondary" onClick={onCuadrar}>
            Cuadrar con recetas
          </Button>
        </div>
      )}
    </div>
  )
}
