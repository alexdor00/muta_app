import { formatInt } from '../../../shared/lib/format.ts'
import { useState } from 'preact/hooks'
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ForkIcon,
  PlusIcon,
} from '../../../shared/ui/icons.tsx'
import { Deslizable } from '../../../shared/ui/Deslizable.tsx'
import styles from './MealList.module.css'

/** Una cosa apuntada en una comida (el bizcocho, el café…). */
export type CosaApuntada = {
  id: string
  nombre: string
  kcal: number
  proteina: number
  foto: string | null
  /** Es el plato de tu menú: su tick lo desapunta como el tick del menú. */
  delMenu: boolean
  /** Un alimento suelto (sin receta): tocarlo abre su cantidad (usuario, 2026-11-21). */
  suelto?: boolean
}

export type FilaComida = {
  id: string
  nombre: string
  /** «a la cena»: para «Añadir a la cena». */
  al: string
  kcal: number
  /** Lo apuntado, una fila por cosa. */
  apuntes: CosaApuntada[]
  /** El plato de tu menú para esta comida aún sin apuntar (con el tick vacío). */
  /** Lo de más de tu menú sin apuntar (el café, el huevo…): una fila cada uno con su tick (usuario, 2026-11-20). */
  extras?: {
    i: number
    nombre: string
    kcal: number
    proteina: number
    foto: string | null
    suelto?: boolean
  }[]
  menu?: {
    nombre: string
    kcal: number
    proteina: number
    foto: string | null
  }
}

type Props = {
  /** «Comidas» o el nombre del menú de hoy. */
  titulo: string
  comidas: FilaComida[]
  onAbrir: (id: string) => void
  onAnadir: (id: string) => void
  /** El tick del plato de tu menú: apuntarlo o quitarlo. */
  onTick: (id: string) => void
  /** El tick de una cosa de más (su número en la comida). */
  onTickExtra: (id: string, i: number) => void
  /** Deslizar el plato del menú sin apuntar: lo quita ese día. */
  onQuitar: (id: string) => void
  /** Quitar una cosa apuntada (su tick o deslizarla). */
  onQuitarApunte: (comida: string, apunte: string) => void
  /** Tocar un alimento suelto apuntado: su cantidad. */
  onAbrirApunte?: (comida: string, apunte: string) => void
  /** Tocar un alimento suelto de más de tu menú: su cantidad. */
  onAbrirExtra?: (comida: string, i: number) => void
}

/**
 * Las comidas del día, una tarjeta por comida (usuario, 2026-11-19, `Desktop/MUTA-Comidas-tarjetas.png`): arriba su nombre
 * con las kcal y el «+»; debajo, una fila por cosa (lo apuntado y el plato del menú sin apuntar), con su foto y su tick.
 */
export function MealList({
  titulo,
  comidas,
  onAbrir,
  onAnadir,
  onTick,
  onTickExtra,
  onQuitar,
  onQuitarApunte,
  onAbrirApunte,
  onAbrirExtra,
}: Props) {
  const hechas = comidas.filter((c) => c.apuntes.length).length
  // Cada comida se pliega y se despliega tocando su título (usuario, 2026-11-21)
  const [plegadas, setPlegadas] = useState<string[]>([])
  return (
    <section class={styles.block} aria-labelledby="comidas-titulo">
      <div class={styles.head}>
        <h2 id="comidas-titulo" class={styles.title}>
          {titulo}
        </h2>
        <span class={styles.count}>
          {hechas} de {comidas.length}
        </span>
      </div>
      <ul class={styles.list}>
        {comidas.map((c) => {
          const kcal = c.apuntes.length
            ? c.kcal
            : (c.menu?.kcal ?? 0) + (c.extras ?? []).reduce((t, x) => t + x.kcal, 0)
          const plegada = plegadas.includes(c.id)
          const cosas = c.apuntes.length + (c.menu ? 1 : 0) + (c.extras?.length ?? 0)
          return (
            <li key={c.id} class={styles.grupo}>
              <div class={styles.cabeza}>
                <h3 class={styles.comida}>
                  <button
                    type="button"
                    class={styles.plegar}
                    aria-expanded={!plegada}
                    onClick={() =>
                      setPlegadas(plegada ? plegadas.filter((x) => x !== c.id) : [...plegadas, c.id])
                    }
                  >
                    {c.nombre}
                    {kcal > 0 && <span class={styles.total}>{formatInt(kcal)} kcal</span>}
                    {cosas > 0 && (plegada ? <ChevronRightIcon /> : <ChevronDownIcon />)}
                  </button>
                </h3>
                <button
                  type="button"
                  class={styles.add}
                  aria-label={`Añadir ${c.al}`}
                  onClick={() => onAnadir(c.id)}
                >
                  <PlusIcon />
                </button>
              </div>
              {!plegada && (
                <>
                  {c.apuntes.map((a) => (
                    <Deslizable
                      key={a.id}
                      fondo="surface"
                      ariaLabel={`Quitar ${a.nombre}`}
                      onQuitar={() => (a.delMenu ? onTick(c.id) : onQuitarApunte(c.id, a.id))}
                    >
                      <Cosa
                        nombre={a.nombre}
                        detalle={`${formatInt(a.kcal)} kcal · ${formatInt(a.proteina)} g de proteína`}
                        foto={a.foto}
                        hecho
                        onAbrir={() =>
                          a.suelto && onAbrirApunte ? onAbrirApunte(c.id, a.id) : onAbrir(c.id)
                        }
                        onTick={() => (a.delMenu ? onTick(c.id) : onQuitarApunte(c.id, a.id))}
                      />
                    </Deslizable>
                  ))}
                  {c.menu && (
                    <Deslizable
                      fondo="surface"
                      ariaLabel={`Quitar ${c.nombre.toLowerCase()} de este día`}
                      onQuitar={() => onQuitar(c.id)}
                    >
                      <Cosa
                        nombre={c.menu.nombre}
                        detalle={`${formatInt(c.menu.kcal)} kcal · ${formatInt(c.menu.proteina)} g de proteína`}
                        foto={c.menu.foto}
                        hecho={false}
                        onAbrir={() => onAbrir(c.id)}
                        onTick={() => onTick(c.id)}
                      />
                    </Deslizable>
                  )}
                  {c.extras?.map((x) => (
                    <Cosa
                      key={`${x.nombre}-${x.i}`}
                      nombre={x.nombre}
                      detalle={`${formatInt(x.kcal)} kcal · ${formatInt(x.proteina)} g de proteína`}
                      foto={x.foto}
                      hecho={false}
                      onAbrir={() => (x.suelto && onAbrirExtra ? onAbrirExtra(c.id, x.i) : onAbrir(c.id))}
                      onTick={() => onTickExtra(c.id, x.i)}
                    />
                  ))}
                </>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Cosa(props: {
  nombre: string
  detalle: string
  foto: string | null
  hecho: boolean
  onAbrir: () => void
  onTick: () => void
}) {
  return (
    <div class={styles.fila}>
      <button type="button" class={styles.open} onClick={props.onAbrir}>
        <span class={styles.thumb} aria-hidden="true">
          {props.foto ? <img src={props.foto} alt="" loading="lazy" /> : <ForkIcon />}
        </span>
        <span class={styles.text}>
          <span class={styles.cosa}>{props.nombre}</span>
          <span class={styles.detail}>{props.detalle}</span>
        </span>
      </button>
      <button
        type="button"
        class={`${styles.tick} ${props.hecho ? styles.tickOn : ''}`}
        aria-pressed={props.hecho}
        aria-label={props.hecho ? `${props.nombre}: hecho, quitar` : `Apuntar ${props.nombre}`}
        onClick={props.onTick}
      >
        {props.hecho && <CheckIcon />}
      </button>
    </div>
  )
}
