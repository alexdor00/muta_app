import type { JSX } from 'preact'
import { paths } from '../../../shared/lib/paths.ts'
import {
  BodyIcon,
  BookIcon,
  CameraIcon,
  ChatIcon,
  ChevronRightIcon,
  PencilIcon,
  SparkIcon,
  SwapIcon,
} from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import styles from './TuRutinaSheet.module.css'

type Accion = 'biblioteca' | 'editar' | 'foto' | 'cobertura' | 'rehacer' | 'consejos'

/** Cada fila abre su hoja (`accion`) o lleva a otra pantalla (`href`). */
const ROWS: ({ label: string; Icon: () => JSX.Element } & ({ accion: Accion } | { href: string }))[] = [
  { label: 'Editar rutina', Icon: PencilIcon, accion: 'editar' },
  { label: 'Cambiar de rutina', Icon: SwapIcon, href: paths.chooseRoutine },
  { label: 'Biblioteca de ejercicios', Icon: BookIcon, accion: 'biblioteca' },
  { label: 'Añadir foto a la sesión', Icon: CameraIcon, accion: 'foto' },
  { label: 'Cobertura muscular', Icon: BodyIcon, accion: 'cobertura' },
  { label: 'Rehacer el plan con mis respuestas', Icon: SparkIcon, accion: 'rehacer' },
  { label: 'Mis consejos', Icon: ChatIcon, accion: 'consejos' },
]

/** Hoja «Tu rutina»: las opciones de la rutina; cada una abre su hoja (`acciones`) o lleva a su pantalla. */
export function TuRutinaSheet({
  onClose,
  acciones,
}: {
  onClose: () => void
  acciones: Record<Accion, () => void>
}) {
  return (
    <Sheet title="Tu rutina" onClose={onClose} large>
      <ul class={styles.list}>
        {ROWS.map((r) => {
          const contenido = (
            <>
              <span class={styles.icon}>
                <r.Icon />
              </span>
              <span class={styles.label}>{r.label}</span>
              <span class={styles.chevron}>
                <ChevronRightIcon />
              </span>
            </>
          )
          return (
            <li key={r.label}>
              {'href' in r ? (
                <a class={styles.row} href={r.href}>
                  {contenido}
                </a>
              ) : (
                <button type="button" class={styles.row} onClick={acciones[r.accion]}>
                  {contenido}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}
