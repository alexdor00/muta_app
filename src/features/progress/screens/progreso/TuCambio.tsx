import { useEffect, useRef, useState } from 'preact/hooks'
import { formatMonthName } from '../../../../shared/lib/format.ts'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  PauseIcon,
  PlayIcon,
} from '../../../../shared/ui/icons.tsx'
import { RoundButton } from '../../../../shared/ui/RoundButton.tsx'
import { cuerpoEl, fotos, fotosPorMes, POSES, type Pose } from '../../state/progreso.ts'
import { cambioTexto, valorTexto } from './formato.ts'
import styles from './TuCambio.module.css'

/** Cuánto se ve cada mes al pasar solas. */
const POR_MES_MS = 1800

type Props = { pose: Pose; hasta: string; onClose: () => void }

/**
 * «Ver tu cambio»: a pantalla completa, tus fotos de una postura mes a mes (del primero al que miras), con el mes, tu peso y
 * tu cintura de entonces y lo que cambiaron desde el primero. Del ancho de un móvil (también en el ordenador). Empieza
 * parado: ▶ las pasa solas; las flechas y la línea de meses van a uno.
 */
export function TuCambio(props: Props) {
  const [pose, setPose] = useState<Pose>(props.pose)
  const [i, setI] = useState(0)
  const [pasando, setPasando] = useState(false)
  const cerrarRef = useRef<HTMLDivElement>(null)
  const lista = fotosPorMes(fotos.value, pose).filter((x) => x.mes <= props.hasta)
  const n = lista.length
  const actual = lista[Math.min(i, n - 1)]
  useEffect(() => {
    if (!pasando || n < 2) return
    const t = setTimeout(() => {
      if (i >= n - 1) setPasando(false)
      else setI(i + 1)
    }, POR_MES_MS)
    return () => clearTimeout(t)
  }, [pasando, i, n])
  const { onClose } = props
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onClose()
      if (ev.key === 'ArrowLeft') setI((x) => Math.max(0, x - 1))
      if (ev.key === 'ArrowRight') setI((x) => Math.min(n - 1, x + 1))
    }
    document.addEventListener('keydown', onKey)
    cerrarRef.current?.querySelector('button')?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, n])
  const ir = (k: number) => {
    setPasando(false)
    setI(Math.max(0, Math.min(n - 1, k)))
  }
  const c = actual ? cuerpoEl(actual.foto.date) : null
  const primero = lista[0] ? cuerpoEl(lista[0].foto.date) : null
  const desde = lista[0] ? formatMonthName(lista[0].mes).toLowerCase() : ''
  const nombrePose = POSES.find((p) => p.id === pose)?.nombre ?? ''
  return (
    <div class={styles.velo}>
      <div class={styles.fondo} role="dialog" aria-modal="true" aria-label="Tu cambio, mes a mes">
        <div class={styles.rayas} aria-hidden="true">
          {lista.map((x, k) => (
            <i
              key={x.mes}
              class={k < i ? styles.llena : k === i ? (pasando ? styles.pasando : styles.llena) : ''}
            />
          ))}
        </div>
        <div class={styles.arriba}>
          <div class={styles.poses} role="group" aria-label="Postura">
            {POSES.map((p) => (
              <button
                key={p.id}
                type="button"
                class={styles.pose}
                aria-pressed={p.id === pose}
                onClick={() => {
                  setPose(p.id)
                  setI(0)
                  setPasando(false)
                }}
              >
                {p.nombre}
              </button>
            ))}
          </div>
          <div ref={cerrarRef}>
            <RoundButton label="Cerrar" variant="ghost" onClick={onClose}>
              <CloseIcon />
            </RoundButton>
          </div>
        </div>
        {actual ? (
          <>
            <img
              key={actual.foto.id}
              class={styles.foto}
              src={actual.foto.url}
              alt={`${nombrePose} de ${formatMonthName(actual.mes).toLowerCase()} de ${actual.mes.slice(0, 4)}`}
            />
            <div class={styles.pie} aria-live="polite">
              <span class={styles.mes}>
                {formatMonthName(actual.mes)} <span>{actual.mes.slice(0, 4)}</span>
              </span>
              <ul class={styles.datos}>
                {c?.peso != null && (
                  <li>
                    Peso
                    <b>{valorTexto(c.peso, 'kg')}</b>
                    {primero?.peso != null &&
                      i > 0 &&
                      `${cambioTexto(c.peso - primero.peso, 'kg')} desde ${desde}`}
                  </li>
                )}
                {c?.cintura != null && (
                  <li>
                    Cintura
                    <b>{valorTexto(c.cintura, 'cm')}</b>
                    {primero?.cintura != null &&
                      i > 0 &&
                      `${cambioTexto(c.cintura - primero.cintura, 'cm')} desde ${desde}`}
                  </li>
                )}
              </ul>
            </div>
            <div class={styles.meses} role="group" aria-label="Tus meses">
              {lista.map((x, k) => (
                <button
                  key={x.mes}
                  type="button"
                  class={`${styles.paso} ${k < i ? styles.pasado : ''}`}
                  aria-current={k === i ? 'true' : undefined}
                  aria-label={`${formatMonthName(x.mes)} ${x.mes.slice(0, 4)}`}
                  onClick={() => ir(k)}
                >
                  {formatMonthName(x.mes).slice(0, 3).toLowerCase()}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p class={styles.vacio}>Sin fotos de {nombrePose.toLowerCase()} aún.</p>
        )}
        <div class={styles.botones}>
          <RoundButton label="Mes anterior" variant="ghost" onClick={() => ir(i - 1)}>
            <ChevronLeftIcon />
          </RoundButton>
          <RoundButton
            label={pasando ? 'Parar' : 'Pasar solas'}
            variant="onPhoto"
            onClick={() => {
              if (!pasando && i >= n - 1) setI(0)
              setPasando(!pasando)
            }}
          >
            {pasando ? <PauseIcon /> : <PlayIcon />}
          </RoundButton>
          <RoundButton label="Mes siguiente" variant="ghost" onClick={() => ir(i + 1)}>
            <ChevronRightIcon />
          </RoundButton>
        </div>
      </div>
    </div>
  )
}
