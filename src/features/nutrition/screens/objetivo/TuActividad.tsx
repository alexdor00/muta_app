import { formatInt } from '../../../../shared/lib/format.ts'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { MinusIcon, PlusIcon } from '../../../../shared/ui/icons.tsx'
import { ajustes, TRABAJOS, type Intensidad } from '../../state/comida.ts'
import h from '../comun/Hojas.module.css'
import sec from './Seccion.module.css'
import styles from './Objetivo.module.css'

export type Actividad = {
  trabajo: 'sentado' | 'de-pie' | 'fisico'
  horas: number
  intensidad: Intensidad
}

/** Lo más que se cuenta de otros deportes a la semana. */
const MAX_HORAS = 20

/**
 * Tu actividad, lo primero de Editar tu objetivo (usuario, 2026-11-19: «pregunta primero por su actividad», como otras
 * apps: la vida diaria aparte del ejercicio): tu trabajo y otros deportes, además de tus pasos y tus entrenos. Solo sirve
 * para empezar: con dos semanas de pesajes y comida, MUTA aprende lo que gastas de verdad.
 */
export function TuActividad(props: { valor: Actividad; onChange: (a: Actividad) => void }) {
  const { valor, onChange } = props
  const a = ajustes.value
  return (
    <div class={sec.card}>
      <span class={styles.actTitulo}>Tu trabajo</span>
      <div class={styles.trabajos} role="group" aria-label="Tu trabajo">
        {TRABAJOS.map((t) => (
          <button
            key={t.id}
            type="button"
            class={styles.trabajo}
            aria-pressed={valor.trabajo === t.id}
            onClick={() => onChange({ ...valor, trabajo: t.id })}
          >
            <b>{t.nombre}</b>
            <small>{t.detalle}</small>
          </button>
        ))}
      </div>
      <div class={styles.deporte}>
        <span>
          <b>Otros deportes</b>
          <small>Fútbol, correr, nadar…</small>
        </span>
        <span class={styles.horas}>
          <button
            type="button"
            aria-label="Una hora menos a la semana"
            disabled={valor.horas <= 0}
            onClick={() => onChange({ ...valor, horas: valor.horas - 1 })}
          >
            <MinusIcon />
          </button>
          <b>{valor.horas ? `${valor.horas} h/sem` : 'Ninguno'}</b>
          <button
            type="button"
            aria-label="Una hora más a la semana"
            disabled={valor.horas >= MAX_HORAS}
            onClick={() => onChange({ ...valor, horas: valor.horas + 1 })}
          >
            <PlusIcon />
          </button>
        </span>
      </div>
      {valor.horas > 0 && (
        <ChoiceSegmented<Intensidad>
          name="intensidad-deporte"
          legend="Cómo de fuerte"
          options={[
            { value: 'suave', label: 'Suave' },
            { value: 'media', label: 'Media' },
            { value: 'intensa', label: 'Intensa' },
          ]}
          value={valor.intensidad}
          onChange={(intensidad) => onChange({ ...valor, intensidad })}
        />
      )}
      {a && (
        <p class={h.foot}>
          Además, {formatInt(a.pasos)} pasos al día · {a.diasEntreno} entrenos por semana
        </p>
      )}
    </div>
  )
}
