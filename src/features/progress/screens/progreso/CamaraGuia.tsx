import { useEffect, useRef, useState } from 'preact/hooks'
import { RoundButton } from '../../../../shared/ui/RoundButton.tsx'
import { CloseIcon } from '../../../../shared/ui/icons.tsx'
import { POSES, type Pose } from '../../state/progreso.ts'
import { abrirCamara } from '../../use-cases/progress.ts'
import styles from './CamaraGuia.module.css'

type Props = {
  /** La foto de cada postura de tu último mes, para ponerla encima como guía (null si no hay). */
  guias: Partial<Record<Pose, string>>
  onFoto: (pose: Pose, foto: Blob) => void
  onClose: () => void
}

/**
 * La cámara para las fotos del mes, con guía: encima de lo que ves, tu foto del mes anterior de esa postura, transparente,
 * para ponerte igual (misma distancia, misma postura). Va de frente a perfil y espalda; cada foto pasa a la hoja del mes.
 * Sin cámara (o sin permiso), se elige de la galería.
 */
export function CamaraGuia({ guias, onFoto, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [paso, setPaso] = useState(0)
  const [facing, setFacing] = useState<'user' | 'environment'>('user')
  const [conGuia, setConGuia] = useState(true)
  const [estado, setEstado] = useState<'abriendo' | 'lista' | 'sin-camara'>('abriendo')
  const [hechas, setHechas] = useState<Pose[]>([])
  const pose = POSES[paso]
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let apagar: (() => void) | null = null
    let vivo = true
    setEstado('abriendo')
    void abrirCamara(video, facing).then((off) => {
      if (!vivo) return off?.()
      apagar = off
      setEstado(off ? 'lista' : 'sin-camara')
    })
    return () => {
      vivo = false
      apagar?.()
    }
  }, [facing])
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const guardar = (foto: Blob) => {
    onFoto(pose.id, foto)
    setHechas((x) => [...x.filter((p) => p !== pose.id), pose.id])
    if (paso < POSES.length - 1) setPaso(paso + 1)
    else onClose()
  }
  const disparar = () => {
    const video = videoRef.current
    if (!video?.videoWidth) return
    const lienzo = document.createElement('canvas')
    lienzo.width = video.videoWidth
    lienzo.height = video.videoHeight
    lienzo.getContext('2d')?.drawImage(video, 0, 0)
    lienzo.toBlob((b) => b && guardar(b), 'image/jpeg', 0.9)
  }
  const guia = guias[pose.id]
  return (
    <div class={styles.velo}>
      <div
        class={styles.fondo}
        role="dialog"
        aria-modal="true"
        aria-label={`Foto de ${pose.nombre.toLowerCase()}`}
      >
        <div class={styles.arriba}>
          <ol class={styles.poses} aria-label="Posturas">
            {POSES.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  class={styles.pose}
                  aria-current={i === paso ? 'step' : undefined}
                  onClick={() => setPaso(i)}
                >
                  {hechas.includes(p.id) ? '✓ ' : ''}
                  {p.nombre}
                </button>
              </li>
            ))}
          </ol>
          <RoundButton label="Cerrar" variant="ghost" onClick={onClose}>
            <CloseIcon />
          </RoundButton>
        </div>
        <div class={`${styles.visor} ${facing === 'user' ? styles.espejo : ''}`}>
          <video ref={videoRef} class={styles.video} muted playsInline aria-hidden="true" />
          {guia && conGuia && estado === 'lista' && <img class={styles.guia} src={guia} alt="" />}
          {estado !== 'lista' && (
            <p class={styles.aviso}>
              {estado === 'abriendo'
                ? 'Abriendo la cámara…'
                : 'No se puede abrir la cámara aquí. Elige la foto de la galería.'}
            </p>
          )}
        </div>
        <p class={styles.consejo}>
          {guia
            ? 'Ponte como en la foto del mes pasado: misma distancia, misma luz y postura relajada.'
            : 'Misma luz, misma distancia y postura relajada: el mes que viene te servirá de guía.'}
        </p>
        <div class={styles.botones}>
          <label class={styles.lateral}>
            Galería
            <input
              type="file"
              accept="image/*"
              aria-label={`Elegir la foto de ${pose.nombre.toLowerCase()} de la galería`}
              onChange={(e) => {
                const archivo = e.currentTarget.files?.[0]
                if (archivo) guardar(archivo)
              }}
            />
          </label>
          <button
            type="button"
            class={styles.disparar}
            aria-label={`Hacer la foto de ${pose.nombre.toLowerCase()}`}
            disabled={estado !== 'lista'}
            onClick={disparar}
          />
          <div class={styles.derecha}>
            {guia && (
              <button
                type="button"
                class={styles.lateral}
                aria-pressed={conGuia}
                onClick={() => setConGuia(!conGuia)}
              >
                Guía
              </button>
            )}
            <button
              type="button"
              class={styles.lateral}
              onClick={() => setFacing(facing === 'user' ? 'environment' : 'user')}
            >
              Girar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
