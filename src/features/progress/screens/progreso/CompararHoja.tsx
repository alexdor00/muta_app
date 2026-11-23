import { useEffect, useState } from 'preact/hooks'
import { formatDecimal } from '../../../../shared/lib/format.ts'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import type { Comparacion } from '../../../training/index.ts'
import { entreno } from '../../state/progreso.ts'
import { comparar } from '../../use-cases/mesocycles.ts'
import styles from './Progreso.module.css'

const kg = (n: number | null) => (n === null ? '—' : `${n >= 0 ? '+' : '−'}${formatDecimal(Math.abs(n))} kg`)

/** Comparar dos etapas (mesociclos) por semana (duran distinto): barras, lo que dicen los datos y el 1RM de los mismos ejercicios. */
export function CompararHoja({ onClose }: { onClose: () => void }) {
  const e = entreno.value
  const lista = [...(e?.mesoActual ? [e.mesoActual] : []), ...(e?.anteriores ?? [])]
  const [ids, setIds] = useState<[string, string]>([lista[1]?.id ?? '', lista[0]?.id ?? ''])
  const [c, setC] = useState<Comparacion | null>(null)
  const [idA, idB] = ids
  useEffect(() => {
    if (idA && idB) void comparar(idA, idB).then(setC)
  }, [idA, idB])
  if (lista.length < 2) return null
  return (
    <Sheet title="Comparar etapas" onClose={onClose} large>
      <div class={styles.hoja}>
        <div class={styles.fotos}>
          {([0, 1] as const).map((k) => (
            <select
              key={k}
              class={styles.select}
              aria-label={k ? 'Segunda etapa' : 'Primera etapa'}
              value={ids[k]}
              onChange={(ev) => {
                const v = ev.currentTarget.value
                setIds((x) => (k ? [x[0], v] : [v, x[1]]))
              }}
            >
              {lista.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          ))}
        </div>
        {c && (
          <>
            <section class={styles.card} aria-label="Lo que dicen los datos">
              <h3 class={styles.eti}>Lo que dicen los datos</h3>
              <p class={styles.cifra}>
                <span class={styles.filaTitulo}>{c.veredicto}</span>
              </p>
              <p class={styles.nota}>
                Por semana, porque duran distinto ({c.a.semanas} y {c.b.semanas} semanas).
              </p>
            </section>
            <p class={styles.leyenda}>
              <span>
                ■ <b>{c.a.nombre}</b>
              </span>
              <span>
                ▪ <b>{c.b.nombre}</b>
              </span>
            </p>
            {c.barras.map((b) => {
              const max = Math.max(b.a, b.b, 1e-9)
              return (
                <div key={b.nombre}>
                  <div class={styles.cabecera}>
                    <span class={styles.filaTitulo}>{b.nombre}</span>
                    <span class={styles.nota}>
                      {b.gana ? `Gana ${b.gana === 'a' ? c.a.nombre : c.b.nombre}` : 'Casi igual'}
                    </span>
                  </div>
                  <div class={styles.barraCmp}>
                    <span class={styles.pista}>
                      <i style={{ width: `${(b.a / max) * 100}%` }} />
                    </span>
                    <span>{b.textoA}</span>
                    <span class={`${styles.pista} ${styles.otra}`}>
                      <i style={{ width: `${(b.b / max) * 100}%` }} />
                    </span>
                    <span>{b.textoB}</span>
                  </div>
                </div>
              )
            })}
            <ul class={styles.cajas}>
              <li>
                Peso en {c.a.nombre}
                <b>{kg(c.peso.a)}</b>
              </li>
              <li>
                Peso en {c.b.nombre}
                <b>{kg(c.peso.b)}</b>
              </li>
            </ul>
            {c.comunes.length > 0 && (
              <>
                <h3 class={styles.subtitulo}>Mismos ejercicios, mejor 1RM estimado</h3>
                <ul class={styles.lista}>
                  {c.comunes.map((x) => (
                    <li key={x.nombre} class={styles.fila}>
                      <span class={styles.filaTexto}>
                        <span class={styles.filaTitulo}>{x.nombre}</span>
                      </span>
                      <span class={styles.valor}>
                        {x.a} · {x.b} kg
                        <small>
                          {x.a === x.b
                            ? 'igual'
                            : x.a > x.b
                              ? `mejor en ${c.a.nombre}`
                              : `mejor en ${c.b.nombre}`}
                        </small>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </Sheet>
  )
}
