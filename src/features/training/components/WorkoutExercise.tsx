import { useEffect, useRef, useState } from 'preact/hooks'
import {
  CheckIcon,
  DotsIcon,
  FlameIcon,
  PencilIcon,
  PlusIcon,
  StopwatchIcon,
} from '../../../shared/ui/icons.tsx'
import { SetExtras } from './SetExtras.tsx'
import styles from './WorkoutExercise.module.css'

export type CampoSerie = 'kg' | 'reps' | 'quedan'

export type SerieVista = {
  /** Lo escrito («62,5»); vacío si aún no se ha tocado. */
  kg: string
  reps: string
  quedan: string
  /** Lo que se ve en gris en la casilla vacía: kilos y reps de la vez anterior, y las que deben quedar. */
  kgGris: string
  repsGris: string
  quedanGris: string
  hecha: boolean
  /** Mejor que la misma serie de la vez anterior: estrella en vez de ✓. */
  record: boolean
  /** Sus bajadas (dropset) o mini-series (rest-pause), con el peso en gris si es el mismo. */
  extra: { kg: string; reps: string; kgGris: string }[]
}

type Props = {
  numero: number
  nombre: string
  /** La pauta en etiquetas: «3 series», «6–10 reps», «a 2 del fallo». */
  pauta: string[]
  /** Descanso entre series: «2:45». */
  descanso: string
  /** Lo que no dice la rutina y se ha puesto por costumbre, o null. */
  sugerido: string | null
  /** Tus notas de este ejercicio (vacía si no hay): se guardan en su ficha. */
  nota: string
  onOpciones: () => void
  /** Tocar el descanso lo cambia (C18). */
  onDescanso: () => void
  /** Vacío si no toca calentar (ya calentó ese músculo o ya empezó las series). */
  calentamiento: { kilos: string; reps: number; hecha: boolean }[]
  onCalentamiento: (i: number) => void
  series: SerieVista[]
  /** La casilla que se está escribiendo con el teclado. */
  activa: { serie: number; campo: CampoSerie } | null
  onFoco: (serie: number, campo: CampoSerie) => void
  onCambio: (serie: number, campo: CampoSerie, valor: string) => void
  onMarcar: (serie: number) => void
  /** Dropset o rest-pause: debajo de cada serie hecha, «+ Bajada» o «+ Mini-serie». */
  /** Cómo se llama cada fila de la técnica («Bajada»…); null sin técnica. */
  fila: string | null
  onAnadirExtra: (serie: number) => void
  onCambioExtra: (serie: number, n: number, campo: 'kg' | 'reps', valor: string) => void
  onQuitarExtra: (serie: number, n: number) => void
  onEliminar: (serie: number) => void
  onAnadirSerie: () => void
}

/** La estrella de una serie récord. */
export function Estrella() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"
      />
    </svg>
  )
}

const CAMPOS = [
  { campo: 'kg', gris: 'kgGris', nombre: 'Kilos' },
  { campo: 'reps', gris: 'repsGris', nombre: 'Repeticiones' },
  { campo: 'quedan', gris: 'quedanGris', nombre: 'Repeticiones que quedaban al fallo' },
] as const

/** Lo que hay que mover una fila a la izquierda para que asome «Eliminar». */
const ABRE = 42

/** Lo que hay que mantener pulsada una serie para borrarla. */
const MANTENER_MS = 500

/**
 * Gestos de una fila: deslizarla a la izquierda (la sigue con el dedo y, al soltar, se queda abierta si pasó de la
 * mitad) o mantenerla pulsada medio segundo sin moverla (onMantener: se borra).
 */
function useDeslizar(abierta: boolean, onAbrir: (abierta: boolean) => void, onMantener: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  // La pantalla se repinta a menudo (el reloj): los escuchadores se ponen una vez y leen lo último de aquí
  const ultimoRef = useRef({ abierta, onAbrir, onMantener })
  useEffect(() => {
    ultimoRef.current = { abierta, onAbrir, onMantener }
  })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const base = () => (ultimoRef.current.abierta ? -ABRE * 2 : 0)
    let gesto: { x: number; y: number; dx: number; eje: 'x' | 'y' | null } | null = null
    let pulsado: ReturnType<typeof setTimeout> | undefined
    // Tras deslizar o mantener, el toque que suelta el dedo no cuenta (no abre el teclado ni marca la serie)
    let ignorarToque = false
    const soltarLuego = () => {
      ignorarToque = true
      setTimeout(() => {
        ignorarToque = false
      }, 0)
    }
    const down = (e: PointerEvent) => {
      gesto = { x: e.clientX, y: e.clientY, dx: 0, eje: null }
      clearTimeout(pulsado)
      pulsado = setTimeout(() => {
        if (!gesto || gesto.eje) return
        gesto = null
        soltarLuego()
        ultimoRef.current.onMantener()
      }, MANTENER_MS)
    }
    const move = (e: PointerEvent) => {
      if (!gesto) return
      const dx = e.clientX - gesto.x
      const dy = e.clientY - gesto.y
      if (!gesto.eje && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        gesto.eje = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
        clearTimeout(pulsado)
        // Aunque el dedo salga de la fila, el gesto sigue siendo suyo
        if (gesto.eje === 'x') el.setPointerCapture(e.pointerId)
      }
      if (gesto.eje !== 'x') return
      gesto.dx = dx
      el.style.transform = `translateX(${Math.min(0, base() + dx)}px)`
    }
    const up = () => {
      clearTimeout(pulsado)
      if (ignorarToque) soltarLuego()
      const g = gesto
      gesto = null
      if (!g || g.eje !== 'x') return
      el.style.transform = ''
      soltarLuego()
      ultimoRef.current.onAbrir(base() + g.dx < -ABRE)
    }
    const click = (e: MouseEvent) => {
      if (!ignorarToque) return
      e.stopPropagation()
      e.preventDefault()
    }
    const cancel = () => {
      clearTimeout(pulsado)
      gesto = null
      el.style.transform = ''
    }
    // Soltar en cualquier sitio corta «mantener»: si algo se abre bajo el dedo (el teclado), el soltar no cae en la fila
    // (va después del soltar de la fila, que ya ha cerrado el deslizar)
    const soltarFuera = () => {
      clearTimeout(pulsado)
      gesto = null
    }
    document.addEventListener('pointerup', soltarFuera)
    document.addEventListener('pointercancel', soltarFuera)
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', cancel)
    // Sin el menú de copiar que sale al mantener pulsado en el móvil
    const menu = (e: Event) => e.preventDefault()
    el.addEventListener('click', click, true)
    el.addEventListener('contextmenu', menu)
    return () => {
      clearTimeout(pulsado)
      document.removeEventListener('pointerup', soltarFuera)
      document.removeEventListener('pointercancel', soltarFuera)
      el.removeEventListener('contextmenu', menu)
      el.removeEventListener('click', click, true)
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', cancel)
    }
  }, [])
  return ref
}

/**
 * Una serie: Nº · Kg · Reps · Quedan · círculo. Deslizada a la izquierda descubre «Eliminar» (C06); mantenida pulsada,
 * se borra (con «Deshacer» en el aviso).
 */
function FilaSerie(props: {
  i: number
  s: SerieVista
  activa: CampoSerie | null
  abierta: boolean
  onAbrir: (abierta: boolean) => void
  onFoco: Props['onFoco']
  onCambio: Props['onCambio']
  onMarcar: Props['onMarcar']
  onEliminar: Props['onEliminar']
  fila: Props['fila']
  onAnadirExtra: Props['onAnadirExtra']
  onCambioExtra: Props['onCambioExtra']
  onQuitarExtra: Props['onQuitarExtra']
}) {
  const { i, s } = props
  const fila = useDeslizar(props.abierta, props.onAbrir, () => props.onEliminar(i))
  return (
    <>
      <div class={styles.swipe}>
        <button
          type="button"
          class={styles.delete}
          tabIndex={props.abierta ? 0 : -1}
          aria-hidden={!props.abierta}
          onClick={() => props.onEliminar(i)}
        >
          Eliminar
        </button>
        <div
          ref={fila}
          class={`${styles.set} ${s.hecha ? styles.doneRow : ''} ${props.abierta ? styles.swiped : ''}`}
        >
          <span class={styles.index}>{i + 1}</span>
          {CAMPOS.map(({ campo, gris, nombre }) => (
            <input
              key={campo}
              class={`${styles.cell} ${props.activa === campo ? styles.active : ''}`}
              inputMode="none"
              aria-label={`${nombre} de la serie ${i + 1}`}
              value={s[campo]}
              placeholder={s[gris]}
              onClick={() => props.onFoco(i, campo)}
              onFocus={(e) => {
                // Con el teclado del ordenador (Tab) también sale; con el dedo, al tocar (así deslizar no lo abre)
                if (e.currentTarget.matches(':focus-visible')) props.onFoco(i, campo)
              }}
              onInput={(e) => props.onCambio(i, campo, e.currentTarget.value)}
            />
          ))}
          <button
            type="button"
            class={`${styles.check} ${s.hecha ? styles.done : ''}`}
            aria-pressed={s.hecha}
            aria-label={s.record ? `Serie ${i + 1} hecha, récord` : `Serie ${i + 1} hecha`}
            onClick={() => props.onMarcar(i)}
          >
            {s.hecha && (s.record ? <Estrella /> : <CheckIcon />)}
          </button>
        </div>
      </div>
      <SetExtras
        serie={i}
        extra={s.extra}
        fila={props.fila}
        onAnadir={props.onAnadirExtra}
        onCambio={props.onCambioExtra}
        onQuitar={props.onQuitarExtra}
      />
    </>
  )
}

/**
 * El ejercicio que se está haciendo en la sesión: número, nombre y pauta, el calentamiento en píldoras y una fila por
 * serie con el peso y las repeticiones de la vez anterior en gris (se escribe encima) y el círculo para marcarla.
 */
export function WorkoutExercise(props: Props) {
  const { numero, nombre, series } = props
  const [abierta, setAbierta] = useState<number | null>(null)
  return (
    <section class={`${styles.exercise} ${styles.open}`} aria-labelledby={`ejercicio-${numero}`}>
      <div class={styles.head}>
        <span class={styles.badge} aria-hidden="true">
          {numero}
        </span>
        <div class={styles.text}>
          <h2 id={`ejercicio-${numero}`} class={styles.name}>
            {nombre}
          </h2>
          <ul class={styles.chips} aria-label="Pauta">
            {props.pauta.map((p) => (
              <li key={p}>{p}</li>
            ))}
            <li>
              <button
                type="button"
                class={styles.restChip}
                aria-label={`Descanso ${props.descanso}, cambiar`}
                onClick={props.onDescanso}
              >
                <StopwatchIcon />
                {props.descanso}
              </button>
            </li>
          </ul>
          {props.sugerido && <p class={styles.suggested}>{props.sugerido}</p>}
          {props.nota && (
            <p class={styles.note}>
              <PencilIcon />
              <span>
                <span class={styles.hidden}>Tus notas: </span>
                {props.nota}
              </span>
            </p>
          )}
        </div>
        <button
          type="button"
          class={styles.more}
          aria-label={`Opciones de ${nombre}`}
          onClick={props.onOpciones}
        >
          <DotsIcon />
        </button>
      </div>

      {props.calentamiento.length > 0 && (
        <div class={styles.warmup}>
          <p class={styles.warmupLabel}>
            <FlameIcon />
            Calentamiento
          </p>
          <div class={styles.warmupSets}>
            {props.calentamiento.map((c, i) => (
              <button
                key={i}
                type="button"
                class={`${styles.warmupSet} ${c.hecha ? styles.done : ''}`}
                aria-pressed={c.hecha}
                onClick={() => props.onCalentamiento(i)}
              >
                <span class={styles.hidden}>Calentamiento: </span>
                <b>{c.kilos}</b>
                <small>kg</small>
                <b>× {c.reps}</b>
                <span class={styles.tick} aria-hidden="true">
                  {c.hecha && <CheckIcon />}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div class={styles.sets}>
        <div class={`${styles.set} ${styles.header}`} aria-hidden="true">
          <span>Nº</span>
          <span>Kg</span>
          <span>Reps</span>
          <span>Quedan</span>
          <span />
        </div>
        {series.map((s, i) => (
          <FilaSerie
            key={i}
            i={i}
            s={s}
            activa={props.activa?.serie === i ? props.activa.campo : null}
            abierta={abierta === i}
            onAbrir={(a) => setAbierta(a ? i : null)}
            onFoco={props.onFoco}
            onCambio={props.onCambio}
            onMarcar={props.onMarcar}
            onEliminar={(j) => {
              setAbierta(null)
              props.onEliminar(j)
            }}
            fila={props.fila}
            onAnadirExtra={props.onAnadirExtra}
            onCambioExtra={props.onCambioExtra}
            onQuitarExtra={props.onQuitarExtra}
          />
        ))}
      </div>

      <button type="button" class={styles.add} onClick={props.onAnadirSerie}>
        <PlusIcon />
        Añadir serie
      </button>
    </section>
  )
}
