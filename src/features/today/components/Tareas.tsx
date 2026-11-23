import type { ComponentChildren, JSX } from 'preact'
import { useState } from 'preact/hooks'
import { desdeHoy } from '../../../shared/lib/paths.ts'
import type { IconoTarea, TareaDeHoy } from '../../../shared/lib/tareaDeHoy.ts'
import {
  BodyIcon,
  CameraIcon,
  ChatIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DumbbellIcon,
  ForkIcon,
  MoonIcon,
} from '../../../shared/ui/icons.tsx'
import { CartIcon, PotIcon, ScaleIcon, StepsIcon, TaperIcon } from '../../../shared/ui/iconosHoy.tsx'
import styles from './Tareas.module.css'

const ICONO: Record<IconoTarea, () => JSX.Element> = {
  peso: ScaleIcon,
  sensaciones: MoonIcon,
  entreno: DumbbellIcon,
  comida: ForkIcon,
  pasos: StepsIcon,
  compra: CartIcon,
  cocinar: PotIcon,
  taper: TaperIcon,
  consulta: ChatIcon,
  medidas: CameraIcon,
}

type Props = {
  titulo: string
  tareas: TareaDeHoy[]
  /** Marcar o desmarcar a mano una tarea que su área no sabe cuándo está hecha (la compra, cocinar). */
  onMarcar: (t: TareaDeHoy) => void
}

/**
 * Una lista de Hoy («Te queda» o «Hecho»): una fila por cosa, que lleva a su pantalla (toda la fila; sin botones). Una con
 * partes (Nutrición) sale plegada: al tocarla se despliegan sus partes. Una hecha con `alTerminar`, igual: se despliega
 * su frase en vez de llevar a su pantalla.
 */
export function Tareas({ titulo, tareas, onMarcar }: Props) {
  const [abiertas, setAbiertas] = useState<string[]>([])
  const abierta = (id: string) => abiertas.includes(id)
  const plegar = (id: string) =>
    setAbiertas(abierta(id) ? abiertas.filter((x) => x !== id) : [...abiertas, id])
  if (!tareas.length) return null
  const id = `tareas-${titulo.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <section class={styles.bloque} aria-labelledby={id}>
      <h2 id={id} class={styles.titulo}>
        {titulo}
      </h2>
      <ul class={styles.lista}>
        {tareas.map((t) =>
          t.partes?.length ? (
            // Una tarjeta con sus partes dentro (Nutrición: cada comida, la compra, cocinar…)
            <li key={t.id} class={styles.grupo}>
              <div class={styles.fila}>
                <Contenido t={t} onMarcar={onMarcar} abierta={abierta(t.id)} onPlegar={() => plegar(t.id)} />
              </div>
              {abierta(t.id) && (
                <ul id={`partes-${t.id}`} class={styles.partes} aria-label={`${t.titulo}: lo de hoy`}>
                  {t.partes.map((x) =>
                    x.hecha && x.alTerminar ? (
                      <Hecha
                        key={x.id}
                        t={x}
                        parte
                        onMarcar={onMarcar}
                        abierta={abierta(x.id)}
                        onPlegar={() => plegar(x.id)}
                      />
                    ) : (
                      <li key={x.id} class={`${styles.fila} ${styles.parte}`}>
                        <Contenido t={x} onMarcar={onMarcar} />
                      </li>
                    ),
                  )}
                </ul>
              )}
            </li>
          ) : t.hecha && t.alTerminar ? (
            <Hecha
              key={t.id}
              t={t}
              onMarcar={onMarcar}
              abierta={abierta(t.id)}
              onPlegar={() => plegar(t.id)}
            />
          ) : (
            <li key={t.id} class={styles.fila}>
              <Contenido t={t} onMarcar={onMarcar} />
            </li>
          ),
        )}
      </ul>
    </section>
  )
}

/**
 * Una hecha con su frase (`alTerminar`: tus comidas de hoy, cocinar): no abre su pantalla; al tocarla se despliega la
 * frase debajo, también dentro de la tarjeta de Nutrición (`parte`).
 */
function Hecha(props: {
  t: TareaDeHoy
  parte?: boolean
  onMarcar: (t: TareaDeHoy) => void
  abierta: boolean
  onPlegar: () => void
}) {
  const { t, parte, onMarcar, abierta, onPlegar } = props
  return (
    <li class={parte ? undefined : styles.grupo}>
      <div class={`${styles.fila} ${parte ? styles.parte : ''}`}>
        <Contenido t={t} onMarcar={onMarcar} abierta={abierta} onPlegar={onPlegar} />
      </div>
      {abierta && (
        <p id={`partes-${t.id}`} class={`${styles.alTerminar} ${parte ? styles.alTerminarParte : ''}`}>
          {t.alTerminar}
        </p>
      )}
    </li>
  )
}

/**
 * Lo de una fila: el círculo, su nombre y detalle y la flecha (toda la fila lleva a su sitio). Una que se pliega (con
 * `onPlegar`) despliega sus partes en vez de llevar a ningún sitio, con la flecha hacia abajo.
 */
function Contenido(props: {
  t: TareaDeHoy
  onMarcar: (t: TareaDeHoy) => void
  abierta?: boolean
  onPlegar?: () => void
}) {
  const { t, onMarcar, onPlegar, abierta } = props
  const texto = (
    <>
      <span class={`${styles.nombre} ${t.hecha ? styles.tachada : ''}`}>{t.titulo}</span>
      <span class={styles.detalle}>{t.detalle}</span>
    </>
  )
  return (
    <>
      <Marca t={t} onMarcar={onMarcar} />
      {onPlegar ? (
        <button
          type="button"
          class={styles.enlace}
          aria-expanded={abierta}
          aria-controls={`partes-${t.id}`}
          aria-label={t.hecha && t.alTerminar ? `${t.titulo}: hecha` : undefined}
          onClick={onPlegar}
        >
          {texto}
        </button>
      ) : (
        <Enlace t={t}>{texto}</Enlace>
      )}
      {onPlegar ? (
        <span class={`${styles.flecha} ${abierta ? styles.abierta : ''}`} aria-hidden="true">
          <ChevronDownIcon />
        </span>
      ) : (
        !t.hecha && (
          <span class={styles.flecha} aria-hidden="true">
            <ChevronRightIcon />
          </span>
        )
      )}
    </>
  )
}

/** El círculo de la izquierda: el icono de la tarea o ✓; en las que se marcan (a mano o su área), un botón. */
function Marca({ t, onMarcar }: { t: TareaDeHoy; onMarcar: (t: TareaDeHoy) => void }) {
  const Icono = ICONO[t.icono] ?? BodyIcon
  const dentro = t.hecha ? <CheckIcon /> : <Icono />
  if (!t.aMano && !t.alMarcar)
    return (
      <span class={`${styles.marca} ${t.hecha ? styles.ok : ''}`} aria-hidden="true">
        {dentro}
      </span>
    )
  return (
    <button
      type="button"
      class={`${styles.marca} ${styles.marcable} ${t.hecha ? styles.ok : ''}`}
      aria-pressed={t.hecha}
      aria-label={`${t.titulo}: ${t.hecha ? 'hecha' : 'marcar como hecha'}`}
      onClick={() => (t.alMarcar ? t.alMarcar() : onMarcar(t))}
    >
      {dentro}
    </button>
  )
}

/** Toda la fila lleva a su sitio: un enlace o un botón que abre su hoja (la marca a mano va aparte). */
function Enlace({ t, children }: { t: TareaDeHoy; children: ComponentChildren }) {
  if (t.href)
    return (
      <a
        class={styles.enlace}
        href={desdeHoy(t.href)}
        aria-label={t.hecha ? `${t.titulo}: hecha` : undefined}
      >
        {children}
      </a>
    )
  return (
    <button
      type="button"
      class={styles.enlace}
      onClick={t.onClick}
      aria-label={t.hecha ? `${t.titulo}: hecha` : undefined}
    >
      {children}
    </button>
  )
}
