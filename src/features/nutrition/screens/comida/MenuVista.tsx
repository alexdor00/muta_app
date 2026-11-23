import { useLocation } from 'preact-iso'
import { useEffect, useState } from 'preact/hooks'
import { addDays, formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { DotsIcon } from '../../../../shared/ui/icons.tsx'
import type { Origen } from '../../components/FilaComida.tsx'
import { GrupoComida, GrupoVacio, ListaGrupos } from '../../components/GrupoComida.tsx'
import { piloto, preparacion } from '../../state/autopilot.ts'
import { COMIDAS, dieta, hoy, tipoDe, type ComidaId } from '../../state/comida.ts'
import {
  editandoDescanso,
  platosDelMenu,
  estadoRecetas,
  esComun,
  extrasDelDia,
  fotos,
  horaDeComida,
  huecoDe,
  MAX_MENUS,
  menu,
  menuDelDia,
  nombreDeComida,
  platoPorId,
  propuestas,
  totalDeExtras,
  totalDelHueco,
  totalDeMenu,
} from '../../state/recetas.ts'
import { cuantosMenus } from '../../use-cases/menu.ts'
import { TiraDelMenu } from './TiraDelMenu.tsx'
import styles from './Semana.module.css'

type Props = {
  /** Tocar una comida: su hoja (nombre, hora, qué días va, lo que lleva). */
  onComida: (menu: string, comida: ComidaId) => void
  /** Tocar el plato: lo que lleva, con tus gramos (usuario, 2026-11-21). */
  onPlato: (menu: string, comida: ComidaId) => void
  /** Tocar un alimento que va de más: su cantidad. */
  onExtra: (menu: string, comida: ComidaId, i: number) => void
  /** El «+» de una comida: algo más (con plato) o su hoja (sin él). */
  onAnadir: (menu: string, comida: ComidaId) => void
  /** Deslizar una cosa: el plato (null) o lo de más (su número), con «Deshacer». */
  onQuitar: (menu: string, comida: ComidaId, extra: number | null) => void
  onOpciones: (menu: string) => void
  onDeDieta: () => void
  /** El menú que se abre (el que tocaste en Tu dieta). */
  inicial?: string
  /** Mantener pulsado un día: ese día suelto. */
  onDia: (fecha: string) => void
}

type Tipo = 'entreno' | 'descanso'

/** La opción «+» del control de menús: añade uno. */
const MAS = '+'

/** Hasta dónde se busca un día de este menú (y de cada tipo) para enseñar sus kcal. */
const BUSCA = 28

/**
 * Un menú (Plan, usuario 2026-11-18): A · B · C · +, cómo es un día de entreno o de descanso (sus kcal y macros), qué
 * días va y sus comidas en orden, cada una con su hora, su plato, sus kcal y si se cocina con antelación o al momento.
 * Tocar una comida abre su hoja; las que no tienen nada, «Añadir». Como en tu día (usuario, 2026-11-20): el «+» añade y
 * deslizar quita (vale para todos los días con este menú).
 */
export function MenuVista({
  onComida,
  onPlato,
  onExtra,
  onAnadir,
  onQuitar,
  onOpciones,
  onDeDieta,
  inicial,
  onDia,
}: Props) {
  const { query, route } = useLocation()
  const [elegido, setElegido] = useState<string | null>(inicial ?? null)
  const [tipo, setTipo] = useState<Tipo>(() => tipoDe(hoy.value))
  // Lo que cambias en sus comidas va al tipo de día que miras; al salir, otra vez entreno
  useEffect(() => {
    editandoDescanso.value = tipo === 'descanso'
    return () => void (editandoDescanso.value = false)
  }, [tipo])
  if (estadoRecetas.value !== 'listo') return null
  const m = menu.value
  const x = m.menus.find((k) => k.id === elegido) ?? m.menus[0]
  const hoyEs = hoy.value
  // Un día de este menú del tipo que miras (si no hay, cualquiera de este menú)
  const dias = Array.from({ length: BUSCA }, (_, i) => addDays(hoyEs, i)).filter(
    (f) => menuDelDia(m, f)?.id === x.id,
  )
  const dia = dias.find((f) => tipoDe(f) === tipo) ?? dias[0] ?? null
  const total = dia ? totalDeMenu(dia) : null
  const p = piloto.value
  const comoSeCocina = (c: ComidaId, plato: string | null): Origen | null => {
    if (!p || p.cocina.modo === 'no') return null
    if (!plato) return { tipo: 'momento', texto: 'Al momento' }
    const como = preparacion(p, { fecha: dia ?? hoyEs, comida: c, menu: x.id, plato, cocinado: null })
    return como === 'momento'
      ? { tipo: 'momento', texto: 'Al momento' }
      : { tipo: 'olla', texto: 'Con antelación' }
  }
  // Desde «Tu nutricionista» (Ver dónde se edita): lo que propone, arriba, y su comida marcada
  const marca = x.id === query.menu ? query.marca : undefined
  const consejo = marca ? propuestas.value.find((k) => k.id === query.p) : undefined
  const titulo = propuestas.value.find((k) => k.menu === x.id)?.titulo.replace(/^[^:]*:\s*/, '')

  return (
    <div class={`${styles.stack} ${styles.dentro}`}>
      <div class={styles.pestanas}>
        <div class={styles.letras}>
          <ChoiceSegmented<string>
            name="tus-menus"
            legend="Tus menús"
            options={[
              ...m.menus.map((k) => ({
                value: k.id,
                label: k.id === x.id && m.menus.length <= 4 ? k.nombre : k.id,
              })),
              ...(m.menus.length < MAX_MENUS ? [{ value: MAS, label: '+' }] : []),
            ]}
            value={x.id}
            onChange={async (v) => {
              if (v !== MAS) return setElegido(v)
              await cuantosMenus(m.menus.length + 1)
              setElegido(menu.value.menus.at(-1)?.id ?? null)
            }}
          />
        </div>
        <button
          type="button"
          class={styles.opciones}
          aria-label={`Opciones de ${x.nombre}`}
          onClick={() => onOpciones(x.id)}
        >
          <DotsIcon />
        </button>
      </div>

      {marca && (
        <p class={styles.marcaAviso}>
          {consejo ? `${consejo.detalle} ` : ''}Toca la comida marcada y cámbiala.
        </p>
      )}
      <TiraDelMenu menuId={x.id} onDia={onDia} />

      <ChoiceSegmented<Tipo>
        name="tipo-menu"
        legend="Cómo es este menú un día de"
        value={tipo}
        onChange={setTipo}
        options={[
          { value: 'entreno', label: 'Día de entreno' },
          { value: 'descanso', label: 'Día de descanso' },
        ]}
      />

      <div class={styles.pie}>
        <span class={styles.vaDias}>
          {total && total.kcal > 0 && (
            <small>
              {formatInt(total.protein)} g prot. · {formatInt(total.carbs)} g hidr. · {formatInt(total.fat)} g
              grasa
            </small>
          )}
        </span>
        <span class={styles.kcal}>
          {total && total.kcal ? formatInt(total.kcal) : '—'} <small>kcal</small>
        </span>
      </div>
      {dia && tipoDe(dia) !== tipo && (
        <p class={styles.nota}>Este menú no cae en un día de {tipo} en las próximas semanas.</p>
      )}

      <ListaGrupos etiqueta={x.nombre}>
        {COMIDAS.map((c) => {
          const id = platosDelMenu(x)[c.id]
          const pl = id ? platoPorId(id, dia ?? hoyEs) : null
          const extras = dia ? extrasDelDia(dia, c.id) : (x.extras?.[c.id] ?? [])
          const todos = x.extras?.[c.id] ?? []
          const nombre = nombreDeComida(m, c.id)
          if (!pl && !todos.length)
            return (
              <GrupoVacio
                key={c.id}
                marcada={marca === c.id}
                titulo={nombre}
                meta={horaDeComida(m, c.id)}
                onClick={() => onComida(x.id, c.id)}
              />
            )
          const h = dia ? huecoDe(m, dia, c.id) : null
          const kcalPlato = h && h.menu === x.id ? (totalDelHueco(h)?.kcal ?? 0) : (pl?.total.kcal ?? 0)
          const solo =
            todos.length && !pl && todos.every((e) => e.solo === todos[0].solo) ? todos[0].solo : undefined
          const meta = [
            horaDeComida(m, c.id),
            esComun(m, c.id) ? 'en todos los menús' : null,
            solo ? `solo ${solo}` : null,
          ]
            .filter(Boolean)
            .join(' · ')
          const cosas = [
            ...(pl
              ? [
                  {
                    nombre: pl.nombre,
                    foto: fotos.value[pl.id] ?? null,
                    kcal: Math.round(kcalPlato),
                    onQuitar: () => onQuitar(x.id, c.id, null),
                    // Tocar el plato abre su receta (usuario, 2026-11-21: lo de la comida, en su cabecera)
                    onTocar: () => onPlato(x.id, c.id),
                  },
                ]
              : []),
            ...extras.map((e) => ({
              nombre: e.nombre,
              foto: e.platoId ? (fotos.value[e.platoId] ?? null) : null,
              kcal: Math.round(totalDeExtras([e]).kcal),
              onQuitar: () => onQuitar(x.id, c.id, todos.indexOf(e)),
              onTocar: e.platoId
                ? () => route(paths.dish(e.platoId!, { comida: c.id }))
                : () => onExtra(x.id, c.id, todos.indexOf(e)),
            })),
          ]
          return (
            <GrupoComida
              key={c.id}
              marcada={marca === c.id}
              titulo={nombre}
              meta={meta}
              kcal={Math.round(kcalPlato + totalDeExtras(extras).kcal)}
              cosas={cosas}
              origen={comoSeCocina(c.id, id ?? null)}
              etiquetaAccesible={`${nombre}: ${cosas.map((k) => k.nombre).join(', ')}`}
              onClick={() => onComida(x.id, c.id)}
              onAnadir={() => onAnadir(x.id, c.id)}
            />
          )
        })}
      </ListaGrupos>

      {titulo && (
        <a class={styles.propuesta} href={`${paths.nutrition}?vista=plan&paso=come`}>
          Tu nutricionista te propone un cambio: {titulo.charAt(0).toLowerCase() + titulo.slice(1)}.{' '}
          <b>Ver ›</b>
        </a>
      )}
      {dieta.value && (
        <button type="button" class={styles.deDieta} onClick={onDeDieta}>
          Pasar los menús de tu dieta a tus menús
        </button>
      )}
    </div>
  )
}
