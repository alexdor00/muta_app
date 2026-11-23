import {
  addDays,
  daysBetween,
  formatDayDate,
  formatInt,
  formatLongDate,
} from '../../../../shared/lib/format.ts'
import { useState } from 'preact/hooks'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { CoachCard } from '../../components/CoachCard.tsx'
import { DayHero } from '../../components/DayHero.tsx'
import { MealList } from '../../components/MealList.tsx'
import { MenuList } from '../../components/MenuList.tsx'
import {
  ajustes,
  comidasDia,
  diaVisto,
  hoy,
  objetivoDelDia,
  objetivoDia,
  pendiente,
  totalDe,
  tipoDe,
  dieta,
  totalDia,
  type ComidaId,
} from '../../state/comida.ts'
import { recargaDeHoy, recargaPropuesta } from '../../state/entrenador.ts'
import { sinAvisoDeMenu, tipoDelDia } from '../../use-cases/plan.ts'
import type { Aviso } from '../comun/useAviso.ts'
import { descartarRecarga, empezarRecarga, terminarRecarga, volverARecarga } from '../../use-cases/target.ts'
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
  totalCon,
  totalDeExtras,
} from '../../state/recetas.ts'
import { platoApuntado } from '../../use-cases/recipes.ts'
import { extrasPorApuntar } from '../../use-cases/menu.ts'
import { devolver, quitar } from '../../use-cases/foodLog.ts'
import { HoyToca } from './HoyCocinas.tsx'
import { ExtraCantidadHoja } from './ExtraCantidadHoja.tsx'
import { AvisoDia } from './AvisoDia.tsx'
import styles from './Vistas.module.css'
import { CarruselCocina } from '../tanda/Cocinar.tsx'

/**
 * Hoy, entreno ⇄ descanso desde la tarjeta del día (usuario, 2026-11-19: «mucho más eficiente» que en Mi plan): cambia
 * solo hoy, con «Deshacer». Solo con hidratos según el día o con dieta (usuario, 2026-11-19): con dieta, ese día va entero la de ese tipo.
 */
async function cambiarTipo(f: string, avisar: (t: string, a?: Aviso['accion']) => void) {
  const antes = tipoDe(f)
  const nuevo = antes === 'entreno' ? 'descanso' : 'entreno'
  await tipoDelDia(f, nuevo)
  const texto = dieta.value
    ? `Hoy, ${nuevo}: tu dieta de ${nuevo}`
    : nuevo === 'descanso'
      ? 'Hoy, descanso: menos hidratos'
      : 'Hoy, entreno: más hidratos'
  avisar(texto, { label: 'Deshacer', onClick: () => void tipoDelDia(f, antes) })
}

type Props = {
  /** El aviso de abajo, con «Deshacer». */
  avisar: (texto: string, accion?: Aviso['accion']) => void
  onAnadir: (comida: ComidaId) => void
  onAbrirComida: (comida: ComidaId) => void
  /** Tocar un alimento suelto apuntado: su cantidad (usuario, 2026-11-21). */
  onAbrirApunte: (comida: ComidaId, apunte: string) => void
  /** Abre la sugerencia del entrenador; null si no hay ninguna esperando. */
  onSugerencia: (() => void) | null
  onAbrirReceta: (id: string) => void
  onApuntarReceta: (id: string) => void
  onConsulta: () => void
  /** Cuadrar el día con recetas (lo que falta, en las comidas que quedan). */
  onCuadrar: () => void
  /** El tick de una comida con plato de tu menú. */
  /** El tick del plato de tu menú o de una cosa de más (su número). */
  onTick: (comida: ComidaId, solo: 'plato' | number) => void
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
  onAbrirApunte,
  onSugerencia,
  onAbrirReceta,
  onApuntarReceta,
  onConsulta,
  onCuadrar,
  onTick,
  onQuitar,
  avisar,
}: Props) {
  const [sinAjuste, setSinAjuste] = useState(false)
  // Lo de más de tu menú que tocas: su cantidad (usuario, 2026-11-21)
  const [extraEn, setExtraEn] = useState<{ comida: ComidaId; i: number } | null>(null)
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
  const quedan = Math.max(0, objetivo.kcal - total.kcal)
  // Si la cena aún está por apuntar
  const cenaLibre = !comidasDia.value.find((c) => c.id === 'cena')?.apuntes.length
  // Día redondo (usuario, 2026-11-17): lo comido, a un 5 % del objetivo; la racha, los días seguidos así hasta hoy
  const redondo = (f: string) => {
    const o = objetivoDelDia(f)
    const t = totalDe(f)
    return !!o && t.kcal > 0 && Math.abs(o.kcal - t.kcal) <= o.kcal * 0.05
  }
  let racha = 0
  while (racha < 60 && redondo(addDays(hoy.value, -racha))) racha++
  // Los días del carrusel: los siete hasta hoy, o desde el que ves si es de antes
  const primero = fecha < addDays(hoy.value, -6) ? fecha : addDays(hoy.value, -6)
  const fechas: string[] = []
  for (let f = primero; f <= hoy.value; f = addDays(f, 1)) fechas.push(f)
  return (
    <div class={styles.stack}>
      {/* Lo que toca hacer hoy, arriba y con foto: cocinar o la compra (usuario, 2026-11-17) */}
      {esHoy && <HoyToca />}
      {/* Una tarjeta por día que se desliza, como las de Entreno y las de cocinar (usuario, 2026-11-15) */}
      <CarruselCocina
        etiqueta="Tus días"
        puntosAbajo
        diapositivas={fechas.map((f) => {
          const o = objetivoDelDia(f)
          const t = totalDe(f)
          return (
            o && (
              <DayHero
                dia={{ titulo: tituloDia(f, hoy.value), detalle: formatLongDate(f) }}
                etiqueta={tipoDe(f) === 'entreno' ? 'Entreno' : 'Descanso'}
                onEtiqueta={
                  f === hoy.value && (ajustes.value?.onOff || dieta.value)
                    ? () => void cambiarTipo(f, avisar)
                    : undefined
                }
                completo={redondo(f)}
                // Tu objetivo, desde tu día (nutrition/CLAUDE.md: «Tu objetivo ›» de tu día)
                objetivoHref={f === hoy.value ? paths.nutritionTarget : undefined}
                frase={
                  f === hoy.value && redondo(f)
                    ? `Día redondo: ${formatInt(t.kcal)} de ${formatInt(o.kcal)} kcal${t.protein >= o.protein * 0.95 ? ' y toda tu proteína' : ''}.${racha > 1 ? ` Llevas ${racha} días seguidos en tu objetivo.` : ''}`
                    : undefined
                }
                comidas={t.kcal}
                objetivo={o.kcal}
                macros={[
                  { nombre: 'Proteína', hecho: t.protein, objetivo: o.protein },
                  { nombre: 'Hidratos', hecho: t.carbs, objetivo: o.carbs },
                  { nombre: 'Grasa', hecho: t.fat, objetivo: o.fat },
                ]}
              />
            )
          )
        })}
        visible={fechas.indexOf(fecha)}
        inicio={fechas.indexOf(fecha)}
        onVisible={(k) => {
          if (fechas[k] && fechas[k] !== diaVisto.value) diaVisto.value = fechas[k]
        }}
      />
      {/* Sin menú: hazlo, o cuadra lo que queda con recetas (usuario, 2026-11-17) */}
      {esHoy && !tuMenu && !enDieta && !ajustes.value?.sinAvisoMenu && (
        <AvisoDia
          titulo="Aún no tienes menú para hoy"
          texto="Con un menú te digo qué comer, qué comprar y qué cocinar. O apunta lo que comas con el «+» de cada comida."
          onQuitar={() => void sinAvisoDeMenu(true)}
        >
          <Button href={`${paths.nutrition}?vista=plan`}>Hacer mi menú</Button>
          {siguiente.value && platos.value.length > 0 && (
            <Button variant="secondary" onClick={onCuadrar}>
              Cuadrar con recetas
            </Button>
          )}
        </AvisoDia>
      )}
      {/* Pasado del objetivo, sin rojo ni «lo has estropeado»: un recordatorio de que no hace falta compensar (usuario, 2026-11-17) */}
      {esHoy && quedan === 0 && total.kcal - objetivo.kcal > objetivo.kcal * 0.05 && !sinAjuste && (
        <AvisoDia
          titulo={`Hoy llevas ${formatInt(total.kcal - objetivo.kcal)} kcal de más`}
          texto="No hace falta compensarlo mañana: vuelve a tu plan como siempre."
        >
          {cenaLibre && <Button onClick={onCuadrar}>Ajustar la cena</Button>}
          <Button variant="secondary" onClick={() => setSinAjuste(true)}>
            Ahora no
          </Button>
        </AvisoDia>
      )}
      {esHoy && enDieta && tocaConsulta.value && (
        <CoachCard
          titulo="Tu nutricionista · consulta semanal"
          texto="Toca la consulta: báscula, cinta y cómo te has sentido"
          ver="Empezar"
          onVer={onConsulta}
        />
      )}
      {/* La recarga (usuario, 2026-11-22): «Empezar / Ahora no», con «Deshacer»; mientras dura, una línea con «Terminar» */}
      {esHoy && recargaPropuesta.value && (
        <AvisoDia
          titulo="El entrenador · recarga de hidratos"
          texto={`Recarga de hidratos recomendada hasta el ${formatDayDate(recargaPropuesta.value.hasta)}: mantenimiento los días de entreno.`}
        >
          <Button
            onClick={async () => {
              const p = recargaPropuesta.value
              const antes = await empezarRecarga(p?.hasta ?? fecha, p?.sesiones)
              avisar('Recarga de hidratos empezada', {
                label: 'Deshacer',
                onClick: () => void volverARecarga(antes),
              })
            }}
          >
            Empezar
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              const antes = await descartarRecarga()
              avisar('No te la vuelvo a proponer en 7 días', {
                label: 'Deshacer',
                onClick: () => void volverARecarga(antes),
              })
            }}
          >
            Ahora no
          </Button>
        </AvisoDia>
      )}
      {esHoy && recargaDeHoy.value && (
        <AvisoDia
          titulo={`Recarga de hidratos · hasta el ${formatDayDate(recargaDeHoy.value.hasta)}`}
          texto={
            recargaDeHoy.value.entrena
              ? `Hoy entrenas: +${formatInt(recargaDeHoy.value.hidratos)} g de hidratos.`
              : 'Hoy no entrenas: tus kcal de definición.'
          }
        >
          <Button
            variant="secondary"
            onClick={async () => {
              const antes = await terminarRecarga()
              avisar('Recarga terminada: vuelves a tu definición', {
                label: 'Deshacer',
                onClick: () => void volverARecarga(antes),
              })
            }}
          >
            Terminar
          </Button>
        </AvisoDia>
      )}
      {esHoy && !enDieta && sugerencia && onSugerencia && (
        <CoachCard
          titulo="El entrenador · revisión semanal"
          texto={
            sugerencia.a === sugerencia.de
              ? sugerencia.texto
              : `Te propongo un cambio: ${sugerencia.a > (sugerencia.de ?? 0) ? '+' : '−'}${formatInt(Math.abs(sugerencia.a - (sugerencia.de ?? 0)))} kcal`
          }
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
            apuntes: c.apuntes.map((a) => ({
              id: a.id,
              nombre: a.nombre,
              kcal: a.kcal,
              proteina: a.protein,
              foto: fotoDeApunte(a.receta),
              delMenu: !!a.receta && !!p && a.receta === p.id,
              suelto: !a.receta,
            })),
            menu:
              h && p && !platoApuntado(p.id, c.id, fecha)
                ? {
                    nombre: p.nombre,
                    kcal: totalCon(p, gramosDeHueco(h, p)).kcal,
                    proteina: totalCon(p, gramosDeHueco(h, p)).protein,
                    foto: fotos.value[p.id] ?? null,
                  }
                : undefined,
            // Lo de más, una fila cada cosa con su tick (usuario, 2026-11-20)
            extras: tuMenu
              ? extrasPorApuntar(fecha, c.id).map(({ extra: x, i }) => ({
                  i,
                  nombre: x.nombre,
                  kcal: totalDeExtras([x]).kcal,
                  proteina: totalDeExtras([x]).protein,
                  foto: x.platoId ? (fotos.value[x.platoId] ?? null) : null,
                  suelto: !x.platoId,
                }))
              : [],
          }
        })}
        onAbrir={(id) => onAbrirComida(id as ComidaId)}
        onAnadir={(id) => onAnadir(id as ComidaId)}
        onTick={(id) => onTick(id as ComidaId, 'plato')}
        onTickExtra={(id, i) => onTick(id as ComidaId, i)}
        onQuitar={(id) => onQuitar(id as ComidaId)}
        onAbrirApunte={(c, id) => onAbrirApunte(c as ComidaId, id)}
        onAbrirExtra={(c, i) => setExtraEn({ comida: c as ComidaId, i })}
        onQuitarApunte={(_, id) =>
          void quitar([id], fecha).then((ya) =>
            avisar(`${ya[0]?.nombre ?? 'Apunte'}: quitado`, {
              label: 'Deshacer',
              onClick: () => void devolver(ya, fecha),
            }),
          )
        }
      />
      {extraEn &&
        tuMenu &&
        (() => {
          const e = extrasPorApuntar(fecha, extraEn.comida).find((y) => y.i === extraEn.i)?.extra
          const i = e ? (tuMenu.extras?.[extraEn.comida] ?? []).indexOf(e) : -1
          return e && i >= 0 ? (
            <ExtraCantidadHoja
              menuId={tuMenu.id}
              comida={extraEn.comida}
              i={i}
              extra={e}
              onClose={() => setExtraEn(null)}
              avisar={avisar}
            />
          ) : null
        })()}
    </div>
  )
}
