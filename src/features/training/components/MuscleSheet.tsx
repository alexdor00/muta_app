import type { ComponentChildren } from 'preact'
import { ChoiceSegmented } from '../../../shared/ui/Choice.tsx'
import { ChevronDownIcon, ChevronRightIcon, MinusIcon, PlusIcon } from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import { TipList, type ConsejoVisto } from './SessionTips.tsx'
import styles from './MuscleSheet.module.css'

// Ficha del músculo (A17–A21 del prototipo anterior): el rango en una barra recta con el punto naranja de tu plan
// (decisión 2026-11-03), y dos pestañas, Resumen y Consejos. Sin énfasis: lo usa el coach, que aún no está.

type Fila = { id: string; nombre: string; sigla: string; series: number; href: string }

type Props<M extends string> = {
  titulo: string
  /** En hombros: anterior, lateral y posterior para pasar de uno a otro. */
  hermanos: { id: M; label: string }[] | null
  musculo: M
  onMusculo: (m: M) => void
  /** Series por semana en tu plan, tu rango y hasta dónde llega la barra; la frase de cómo vas. */
  series: number
  rango: [number, number]
  max: number
  veredicto: string
  pestana: 'resumen' | 'consejos'
  onPestana: (p: 'resumen' | 'consejos') => void
  /** Mantener · Desarrollar · Prioridad con su rango; ninguno marcado si el rango es tuyo a mano. */
  modos: { id: string; label: string; rango: string; on: boolean }[]
  onModo: (id: string) => void
  propio: boolean
  onPaso: (cual: 0 | 1, paso: number) => void
  directos: Fila[]
  indirectos: Fila[]
  /** Pestaña Consejos (null si el músculo no tiene nada suyo). */
  consejos: { clave: string; tips: ConsejoVisto[]; donde: string | null } | null
  onClose: () => void
}

const N = 3

/** La barra del rango: tu rango en negro, sus números debajo, y lo que hace tu plan como punto naranja. */
function RangeBar(p: { series: number; rango: [number, number]; max: number; veredicto: string }) {
  const pct = (v: number) => `${(Math.min(Math.max(v, 0), p.max) / p.max) * 100}%`
  const [lo, hi] = p.rango
  return (
    <section
      class={styles.meter}
      role="img"
      aria-label={`${p.series} series por semana en tu plan. Tu rango es ${lo}–${hi}. ${p.veredicto}.`}
    >
      <p class={styles.value} aria-hidden="true">
        <b>{p.series}</b>
        <span>series por semana en tu plan</span>
      </p>
      <div class={styles.track} aria-hidden="true">
        <span class={styles.range} style={{ left: pct(lo), width: `calc(${pct(hi)} - ${pct(lo)})` }} />
        <span class={styles.dot} style={{ left: pct(p.series) }} />
      </div>
      <div class={styles.ticks} aria-hidden="true">
        <span style={{ left: pct(lo) }}>{lo}</span>
        <span style={{ left: pct(hi) }}>{hi}</span>
      </div>
      <p class={styles.verdict} aria-hidden="true">
        {p.veredicto}
      </p>
    </section>
  )
}

function Filas({ filas }: { filas: Fila[] }) {
  return (
    <ul class={styles.rows}>
      {filas.map((f) => (
        <li key={`${f.sigla}-${f.id}`}>
          <a class={styles.row} href={f.href}>
            <span class={styles.rowName}>
              {f.nombre} <small>{f.sigla}</small>
            </span>
            <span class={styles.rowSets}>
              {f.series} {f.series === 1 ? 'serie' : 'series'}
            </span>
            <ChevronRightIcon />
          </a>
        </li>
      ))}
    </ul>
  )
}

/** Un plegable con su título y la flecha. */
function Plegable(p: { titulo: string; children: ComponentChildren }) {
  return (
    <details class={styles.fold}>
      <summary>
        <span>{p.titulo}</span>
        <ChevronDownIcon />
      </summary>
      <div class={styles.foldBody}>{p.children}</div>
    </details>
  )
}

export function MuscleSheet<M extends string>(p: Props<M>) {
  const tips = p.consejos?.tips ?? []
  return (
    <Sheet title={p.titulo} onClose={p.onClose} large>
      {p.hermanos && (
        <div class={styles.siblings} role="group" aria-label="Hombro">
          {p.hermanos.map((h) => (
            <button
              key={h.id}
              type="button"
              class={`${styles.chip} ${h.id === p.musculo ? styles.on : ''}`}
              aria-pressed={h.id === p.musculo}
              onClick={() => p.onMusculo(h.id)}
            >
              {h.label}
            </button>
          ))}
        </div>
      )}
      <RangeBar series={p.series} rango={p.rango} max={p.max} veredicto={p.veredicto} />
      {p.consejos && (
        <div class={styles.tabs}>
          <ChoiceSegmented
            name="pestana-musculo"
            legend="Secciones"
            options={[
              { value: 'resumen', label: 'Resumen' },
              { value: 'consejos', label: 'Consejos' },
            ]}
            value={p.pestana}
            onChange={p.onPestana}
          />
        </div>
      )}
      {p.pestana === 'resumen' || !p.consejos ? (
        <>
          <div class={styles.modes} role="group" aria-label="Objetivo">
            {p.modos.map((m) => (
              <button
                key={m.id}
                type="button"
                class={`${styles.mode} ${m.on ? styles.on : ''}`}
                aria-pressed={m.on}
                onClick={() => p.onModo(m.id)}
              >
                <span>{m.label}</span>
                <b>{m.rango}</b>
              </button>
            ))}
          </div>
          <details class={styles.manual} open={p.propio || undefined}>
            <summary>
              <span>
                {p.propio ? 'Tu rango' : 'Ajustar a mano'} · <b>{`${p.rango[0]}–${p.rango[1]}`}</b>
              </span>
              <ChevronDownIcon />
            </summary>
            <div class={styles.steppers}>
              {(['Mínimo', 'Máximo'] as const).map((nombre, cual) => (
                <div key={nombre} class={styles.stepper}>
                  <span>{nombre}</span>
                  <div>
                    <button
                      type="button"
                      aria-label={`${nombre}: menos`}
                      onClick={() => p.onPaso(cual as 0 | 1, -1)}
                    >
                      <MinusIcon />
                    </button>
                    <b>{p.rango[cual]}</b>
                    <button
                      type="button"
                      aria-label={`${nombre}: más`}
                      onClick={() => p.onPaso(cual as 0 | 1, 1)}
                    >
                      <PlusIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p class={styles.note}>
              Se guarda solo. Para volver al recomendado, toca una de las tres opciones.
            </p>
          </details>
          <h3 class={styles.label}>Dónde lo entrenas</h3>
          {p.directos.length ? (
            <Filas filas={p.directos} />
          ) : (
            <p class={styles.note}>Ningún ejercicio de tu plan lo trabaja directamente.</p>
          )}
          {p.indirectos.length > 0 && (
            <Plegable
              titulo={
                p.indirectos.length === 1
                  ? '1 ejercicio lo trabaja de forma indirecta'
                  : `${p.indirectos.length} ejercicios lo trabajan de forma indirecta`
              }
            >
              <Filas filas={p.indirectos} />
            </Plegable>
          )}
        </>
      ) : (
        <>
          <div class={styles.key}>
            <h3 class={styles.label}>La clave</h3>
            <p>{p.consejos.clave}</p>
          </div>
          {tips.length > 0 && (
            <>
              <h3 class={styles.label}>Consejos</h3>
              <TipList consejos={tips.slice(0, N)} />
              {tips.length > N && (
                <Plegable
                  titulo={tips.length - N === 1 ? 'Ver 1 consejo más' : `Ver ${tips.length - N} consejos más`}
                >
                  <TipList consejos={tips.slice(N)} desde={N} />
                </Plegable>
              )}
            </>
          )}
          {p.consejos.donde && (
            <Plegable titulo="Cómo distribuirlo en tu rutina">
              <p class={styles.note}>{p.consejos.donde}</p>
            </Plegable>
          )}
        </>
      )}
    </Sheet>
  )
}
