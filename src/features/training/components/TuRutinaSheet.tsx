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

type Accion = 'biblioteca' | 'editar'

/** Sin `accion` ni `href`, la fila aún no existe: se ve apagada con «Pronto» y no se puede tocar. */
const ROWS: { label: string; Icon: () => JSX.Element; accion?: Accion; href?: string }[] = [
  { label: 'Editar rutina', Icon: PencilIcon, accion: 'editar' },
  { label: 'Cambiar de rutina', Icon: SwapIcon, href: paths.chooseRoutine },
  { label: 'Biblioteca de ejercicios', Icon: BookIcon, accion: 'biblioteca' },
  { label: 'Añadir foto a la sesión', Icon: CameraIcon },
  { label: 'Cobertura muscular', Icon: BodyIcon },
  { label: 'Rehacer el plan con mis respuestas', Icon: SparkIcon },
  { label: 'Mis consejos', Icon: ChatIcon },
]

/** Hoja «Tu rutina»: las opciones de la rutina. Editar, cambiar de rutina y la biblioteca funcionan; el resto, «Pronto». */
export function TuRutinaSheet({
  onClose,
  onBiblioteca,
  onEditar,
}: {
  onClose: () => void
  onBiblioteca: () => void
  onEditar: () => void
}) {
  const acciones: Record<Accion, () => void> = { biblioteca: onBiblioteca, editar: onEditar }
  return (
    <Sheet title="Tu rutina" onClose={onClose} large>
      <ul class={styles.list}>
        {ROWS.map(({ label, Icon, accion, href }) => {
          const contenido = (pronto: boolean) => (
            <>
              <span class={styles.icon}>
                <Icon />
              </span>
              <span class={styles.label}>{label}</span>
              {pronto ? (
                <span class={styles.soon}>Pronto</span>
              ) : (
                <span class={styles.chevron}>
                  <ChevronRightIcon />
                </span>
              )}
            </>
          )
          return (
            <li key={label}>
              {href ? (
                <a class={styles.row} href={href}>
                  {contenido(false)}
                </a>
              ) : accion ? (
                <button type="button" class={styles.row} onClick={acciones[accion]}>
                  {contenido(false)}
                </button>
              ) : (
                <div class={`${styles.row} ${styles.off}`} aria-disabled="true">
                  {contenido(true)}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}
