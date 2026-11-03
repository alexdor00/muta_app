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
  PlusIcon,
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

/** «···» de un ejercicio en la sesión (C11): ficha, cambiarlo hoy, nota, discos y cronómetro de la serie. */
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
  return (
    <Sheet title={props.nombre} onClose={props.onClose} large>
      <Opciones
        opciones={[
          {
            titulo: 'Ver ficha del ejercicio',
            detalle: 'Técnica, consejos, historial y récords',
            icono: <InfoIcon />,
            href: props.fichaHref,
          },
          {
            titulo: 'Hacer ahora',
            detalle: props.onAhora ? 'Lo pasa delante y lo abre, solo hoy' : 'Ya es el siguiente',
            icono: <ArrowUpIcon />,
            onClick: props.onAhora ?? undefined,
            deshabilitado: !props.onAhora,
          },
          {
            titulo: 'Cambiar ejercicio',
            detalle: 'Solo para hoy: tu plan no cambia',
            icono: <SwapIcon />,
            onClick: props.onCambiar,
          },
          {
            titulo: 'Nota de técnica',
            detalle: props.nota || 'Agujero, agarre, sensaciones…',
            icono: <PencilIcon />,
            onClick: props.onNota,
          },
          {
            titulo: 'Calculadora de discos',
            detalle: 'Qué discos poner a cada lado',
            icono: <PlatesIcon />,
            onClick: props.onDiscos,
          },
          {
            titulo: 'Cronómetro de serie',
            detalle: 'Cuenta atrás, cadencia o tiempo',
            icono: <StopwatchIcon />,
            onClick: props.onCronometro,
          },
        ]}
      />
    </Sheet>
  )
}

/** Nota de técnica del ejercicio (C13). */
export function NoteSheet(props: { nota: string; onGuardar: (nota: string) => void; onClose: () => void }) {
  const [texto, setTexto] = useState(props.nota)
  return (
    <Sheet title="Nota" onClose={props.onClose} large>
      <textarea
        class={styles.note}
        aria-label="Nota de técnica"
        placeholder="Agujero 11, agarre neutro…"
        value={texto}
        onInput={(e) => setTexto(e.currentTarget.value)}
      />
      <div class={styles.actions}>
        <Button onClick={() => props.onGuardar(texto.trim())}>Guardar nota</Button>
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

/** «Esta sesión» (C08): tiempo, consejos de hoy, cambiar de sesión, añadir un ejercicio y descartarla. */
export function SessionSheet(props: {
  onTiempo: () => void
  onConsejos: () => void
  onCambiar: () => void
  onAnadir: () => void
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
          {
            titulo: 'Añadir un ejercicio',
            detalle: 'De la biblioteca, solo para hoy',
            icono: <PlusIcon />,
            onClick: props.onAnadir,
          },
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

const DESCANSOS = [30, 45, 60, 75, 90, 120, 150, 180, 240, 300] as const

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
