import type { ComponentChildren } from 'preact'
import { useState } from 'preact/hooks'
import { Button } from '../../../shared/ui/Button.tsx'
import {
  ArrowUpIcon,
  BookIcon,
  ChevronRightIcon,
  InfoIcon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  TrashIcon,
  PencilIcon,
  PlatesIcon,
  StopwatchIcon,
  SwapIcon,
} from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import styles from './WorkoutSheets.module.css'

type Opcion = {
  titulo: string
  detalle?: string
  icono: ComponentChildren
  onClick?: () => void
  href?: string
  /** Se ve, pero aún no se puede usar (el detalle dice por qué). */
  deshabilitado?: boolean
  /** Acción que borra algo: en rojo. */
  peligro?: boolean
}

function Opciones(props: { opciones: Opcion[] }) {
  return (
    <ul class={styles.options}>
      {props.opciones.map((o) => {
        const contenido = (
          <>
            <span class={styles.icon}>{o.icono}</span>
            <span class={styles.text}>
              <span class={`${styles.title} ${o.peligro ? styles.danger : ''}`}>{o.titulo}</span>
              {o.detalle && <span class={styles.detail}>{o.detalle}</span>}
            </span>
            <span class={styles.chevron} aria-hidden="true">
              <ChevronRightIcon />
            </span>
          </>
        )
        return (
          <li key={o.titulo}>
            {o.href ? (
              <a class={styles.option} href={o.href}>
                {contenido}
              </a>
            ) : (
              <button type="button" class={styles.option} onClick={o.onClick} disabled={o.deshabilitado}>
                {contenido}
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * «···» de un ejercicio en la sesión (C11): arriba, tus notas de ese ejercicio (se tocan para escribirlas); debajo, en
 * cuadrícula, la ficha, hacerlo ahora, cambiarlo (hoy o en tu plan), los discos y el cronómetro de la serie.
 */
export function ExerciseOptionsSheet(props: {
  nombre: string
  fichaHref: string
  nota: string
  /** «Hacer ahora»: null si ya es el siguiente (o está hecho). */
  onAhora: (() => void) | null
  onCambiar: () => void
  onNota: () => void
  onDiscos: () => void
  onCronometro: () => void
  onClose: () => void
}) {
  const tiles: { label: string; icono: ComponentChildren; href?: string; onClick?: (() => void) | null }[] = [
    { label: 'Ficha', icono: <InfoIcon />, href: props.fichaHref },
    {
      label: 'Hacer ahora',
      icono: <ArrowUpIcon />,
      onClick: props.onAhora,
    },
    { label: 'Cambiar', icono: <SwapIcon />, onClick: props.onCambiar },
    { label: 'Discos', icono: <PlatesIcon />, onClick: props.onDiscos },
    { label: 'Cronómetro', icono: <StopwatchIcon />, onClick: props.onCronometro },
  ]
  return (
    <Sheet title={props.nombre} onClose={props.onClose} large>
      <button type="button" class={styles.myNote} onClick={props.onNota}>
        <span class={styles.myNoteHead}>
          <PencilIcon />
          Tus notas
        </span>
        <span class={props.nota ? styles.myNoteText : styles.myNoteEmpty}>
          {props.nota || 'Agujero, agarre, sensaciones… Se quedan en la ficha y salen cada vez que lo hagas.'}
        </span>
      </button>
      <ul class={styles.tiles}>
        {tiles.map((t) => (
          <li key={t.label}>
            {t.href ? (
              <a class={styles.tile} href={t.href}>
                {t.icono}
                {t.label}
              </a>
            ) : (
              <button
                type="button"
                class={styles.tile}
                disabled={!t.onClick}
                onClick={t.onClick ?? undefined}
              >
                {t.icono}
                {t.label}
              </button>
            )}
          </li>
        ))}
      </ul>
    </Sheet>
  )
}

/** Tus notas de un ejercicio (C13): se guardan en su ficha para siempre y salen en la sesión cada vez que lo hagas. */
export function NoteSheet(props: {
  nombre: string
  nota: string
  onGuardar: (nota: string) => void
  onClose: () => void
}) {
  const [texto, setTexto] = useState(props.nota)
  return (
    <Sheet title="Tus notas" onClose={props.onClose} large>
      <p class={styles.lead}>De {props.nombre}. Se quedan en su ficha y las verás cada vez que lo hagas.</p>
      <textarea
        class={styles.note}
        aria-label="Tus notas"
        placeholder="Agujero 11, agarre neutro, apoyar bien la espalda…"
        value={texto}
        onInput={(e) => setTexto(e.currentTarget.value)}
      />
      <div class={styles.actions}>
        <Button onClick={() => props.onGuardar(texto.trim())}>Guardar</Button>
      </div>
    </Sheet>
  )
}

/** ¿Seguro? (C07): un número muy alto se confirma antes de apuntarlo. */
export function ConfirmSheet(props: { texto: string; onSi: () => void; onClose: () => void }) {
  return (
    <Sheet title="¿Seguro?" onClose={props.onClose} large>
      <p class={styles.lead}>{props.texto}</p>
      <div class={styles.pair}>
        <Button variant="secondary" onClick={props.onClose}>
          Corregir
        </Button>
        <Button onClick={props.onSi}>Sí, es correcto</Button>
      </div>
    </Sheet>
  )
}

/** «Esta sesión» (C08): tiempo, consejos de hoy, cambiar de sesión y descartarla (añadir ejercicios, en Editar rutina). */
export function SessionSheet(props: {
  onTiempo: () => void
  onConsejos: () => void
  onCambiar: () => void
  onDescartar: () => void
  onClose: () => void
}) {
  return (
    <Sheet title="Esta sesión" onClose={props.onClose} large>
      <Opciones
        opciones={[
          {
            titulo: 'Tiempo de la sesión',
            detalle: 'Pausar o ajustar el cronómetro',
            icono: <StopwatchIcon />,
            onClick: props.onTiempo,
          },
          {
            titulo: 'Consejos de hoy',
            detalle: 'Los de esta sesión y antes de la primera serie',
            icono: <BookIcon />,
            onClick: props.onConsejos,
          },
          { titulo: 'Cambiar de sesión', icono: <RepeatIcon />, onClick: props.onCambiar },
          { titulo: 'Descartar la sesión', icono: <TrashIcon />, onClick: props.onDescartar, peligro: true },
        ]}
      />
    </Sheet>
  )
}

/** Tiempo de la sesión (C09): cuánto lleva, pausarlo y volver a contarlo desde ahora. */
export function SessionTimeSheet(props: {
  tiempo: string
  pausada: boolean
  onPausa: () => void
  onDesdeAhora: () => void
  onClose: () => void
}) {
  return (
    <Sheet title="Tiempo de sesión" onClose={props.onClose} large>
      <p class={styles.lead}>
        Llevas <b class={styles.strong}>{props.tiempo}</b>
        {props.pausada ? ', en pausa' : ''}. Si la empezaste sin querer, puedes pausar el tiempo o volver a
        contarlo desde ahora.
      </p>
      <div class={styles.stack}>
        <Button onClick={props.onPausa}>
          <span class={styles.withIcon}>
            {props.pausada ? <PlayIcon /> : <PauseIcon />}
            {props.pausada ? 'Reanudar el tiempo' : 'Pausar el tiempo'}
          </span>
        </Button>
        <Button variant="secondary" onClick={props.onDesdeAhora}>
          <span class={styles.withIcon}>
            <RepeatIcon />
            Contar desde ahora
          </span>
        </Button>
      </div>
    </Sheet>
  )
}

/** Los descansos que se pueden elegir (también en Editar ejercicio). */
export const DESCANSOS = [30, 45, 60, 75, 90, 120, 150, 180, 240, 300] as const

/** Descanso del ejercicio (C18): se guarda para ese ejercicio en todas las sesiones. */
export function RestChoiceSheet(props: {
  nombre: string
  segundos: number
  formato: (s: number) => string
  onElegir: (s: number) => void
  onClose: () => void
}) {
  return (
    <Sheet title="Descanso" onClose={props.onClose} large>
      <p class={styles.lead}>
        Se guarda para {props.nombre} en todas tus sesiones y en las próximas semanas.
      </p>
      <div class={styles.rests} role="group" aria-label="Descanso entre series">
        {DESCANSOS.map((s) => (
          <button
            key={s}
            type="button"
            class={`${styles.rest} ${s === props.segundos ? styles.restOn : ''}`}
            aria-pressed={s === props.segundos}
            onClick={() => props.onElegir(s)}
          >
            {props.formato(s)}
          </button>
        ))}
      </div>
    </Sheet>
  )
}

/** Confirmar algo que borra (C20 cambiar de sesión, C21 descartar): Cancelar y la acción en rojo. */
export function DangerSheet(props: {
  titulo: string
  texto: string
  accion: string
  onSi: () => void
  onClose: () => void
}) {
  return (
    <Sheet title={props.titulo} onClose={props.onClose} large>
      <p class={styles.lead}>{props.texto}</p>
      <div class={styles.pair}>
        <Button variant="secondary" onClick={props.onClose}>
          Cancelar
        </Button>
        <button type="button" class={styles.dangerButton} onClick={props.onSi}>
          {props.accion}
        </button>
      </div>
    </Sheet>
  )
}

/** ¿Terminar ya? (C23): si quedan series sin marcar, se guarda solo lo hecho. */
export function FinishSheet(props: {
  titulo: string
  texto: string
  onTerminar: () => void
  onClose: () => void
}) {
  return (
    <Sheet title={props.titulo} onClose={props.onClose} large>
      <p class={styles.lead}>{props.texto}</p>
      <div class={styles.pair}>
        <Button variant="secondary" onClick={props.onClose}>
          Cancelar
        </Button>
        <Button onClick={props.onTerminar}>Terminar</Button>
      </div>
    </Sheet>
  )
}
