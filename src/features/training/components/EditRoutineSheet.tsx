import { useState } from 'preact/hooks'
import { CameraIcon, PencilIcon, PlusIcon } from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import { EditList, FilaAnadir } from './EditList.tsx'
import styles from './EditRoutineSheet.module.css'

export type FilaEditar = {
  nombre: string
  /** «3 × 6–10 · 3:00». */
  detalle: string
  /** «En lugar de …» si lo cambiaste por otro, o «Añadido por ti». */
  nota: string | null
  /** En superserie: el primero, uno de en medio o el último (null si va solo). */
  superserie: 'inicio' | 'medio' | 'fin' | null
  /** Desde «Tu entrenador»: entrena ese músculo (su nombre, o null). */
  marca?: string | null
}

/**
 * Editar rutina, una sesión: «‹ Tu semana» arriba; su nombre (el lápiz lo cambia, la cámara pone su foto) y sus cifras;
 * sus ejercicios en la lista de Editar rutina (tocar uno lo edita, el asa lo
 * mueve, deslizar lo quita) con «Añadir ejercicio» al final; y volver esta sesión a la original.
 */
export function EditRoutineSheet(props: {
  /** El nombre de la sesión («Torso 1»). */
  nombre: string
  /** «8 ejercicios · 20 series · 65 min». */
  detalle: string
  /** Si la sesión tiene foto tuya (la cámara dice «Cambiar» o «Poner»). */
  fotoPropia: boolean
  onSemana: () => void
  onFoto: () => void
  onRenombrar: (nombre: string) => void
  /** Desde «Tu entrenador»: qué tocar en esta sesión (null si no lleva ese músculo o se abre desde «Tu rutina»). */
  guia?: string | null
  filas: FilaEditar[]
  onAbrir: (i: number) => void
  onMover: (de: number, a: number) => void
  onQuitar: (i: number) => void
  onAnadir: () => void
  onVolver: () => void
  onClose: () => void
}) {
  const [renombrando, setRenombrando] = useState<string | null>(null)
  const nombre = props.nombre
  const guardarNombre = () => {
    if (renombrando !== null && renombrando.trim() && renombrando.trim() !== nombre)
      props.onRenombrar(renombrando.trim())
    setRenombrando(null)
  }

  return (
    <Sheet
      alta
      title="Editar rutina"
      onClose={props.onClose}
      large
      atras={{ label: 'Tu semana', onClick: props.onSemana }}
    >
      {/* Su nombre (el lápiz lo cambia), la cámara para su foto y sus cifras; sin foto grande ni consejos */}
      <div class={styles.cabecera}>
        {renombrando !== null ? (
          <input
            class={styles.nameInput}
            aria-label="Nombre de la sesión"
            value={renombrando}
            maxLength={40}
            ref={(el) => el?.focus()}
            onInput={(e) => setRenombrando(e.currentTarget.value)}
            onBlur={guardarNombre}
            onKeyDown={(e) => {
              if (e.key === 'Enter') guardarNombre()
              if (e.key === 'Escape') setRenombrando(null)
            }}
          />
        ) : (
          <div class={styles.nombreFila}>
            <h3 class={styles.title}>{nombre}</h3>
            <button
              type="button"
              class={styles.icono}
              aria-label={`Cambiar el nombre de ${nombre}`}
              onClick={() => setRenombrando(nombre)}
            >
              <PencilIcon />
            </button>
            <button
              type="button"
              class={styles.icono}
              aria-label={props.fotoPropia ? `Cambiar la foto de ${nombre}` : `Poner una foto a ${nombre}`}
              onClick={props.onFoto}
            >
              <CameraIcon />
            </button>
          </div>
        )}
        <p class={styles.cifras}>{props.detalle}</p>
      </div>

      {props.guia && <p class={styles.guia}>{props.guia}</p>}

      <EditList
        etiqueta={`Ejercicios de ${nombre}`}
        onMover={props.onMover}
        filas={props.filas.map((f, i) => ({
          key: f.nombre,
          insignia: i + 1,
          titulo: f.nombre,
          detalle: f.detalle,
          nota: f.nota,
          unida: f.superserie,
          marca: f.marca ? `Entrena ${f.marca.toLowerCase()} · toca para cambiar sus series` : null,
          onAbrir: () => props.onAbrir(i),
          quitar: { ariaLabel: `Quitar ${f.nombre}`, onQuitar: () => props.onQuitar(i) },
        }))}
        pie={<FilaAnadir texto="Añadir ejercicio" icono={<PlusIcon />} onClick={props.onAnadir} />}
      />
      <button type="button" class={styles.restore} onClick={props.onVolver}>
        Volver esta sesión a la original
      </button>
    </Sheet>
  )
}
