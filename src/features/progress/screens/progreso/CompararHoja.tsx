import { useEffect, useState } from 'preact/hooks'
import { formatChange, formatDecimal } from '../../../../shared/lib/format.ts'
import { MenuDesplegable } from '../../../../shared/ui/MenuDesplegable.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { curva } from '../../../../shared/ui/SessionProgress.tsx'
import type { Comparacion, DetalleMeso, SerieHecha } from '../../../training/index.ts'
import { comparar } from '../../use-cases/mesocycles.ts'
import { cambioTexto, fuerzaTexto, textoSerie } from './formato.ts'
import propios from './CompararHoja.module.css'
import styles from './Progreso.module.css'

/** Tu etapa frente a otra vuelta de su misma rutina: el veredicto en una frase, para la fila de la hoja de la etapa. */
export function veredicto(c: Comparacion): string {
  const n = c.comparados
  if (!n) return `Aún sin ejercicios que comparar en la semana ${c.semana}`
  const ej = (k: number) => (k === 1 ? 'ejercicio' : 'ejercicios')
  const detras = c.ejercicios.filter((e) => e.cambio === -1).length
  if (c.delante) return `Vas por delante en ${c.delante} de ${n} ${ej(n)}`
  if (!detras)
    return n === 1 ? 'Igual que entonces en tu ejercicio' : `Igual que entonces en los ${n} ejercicios`
  return `Por detrás en ${detras} de ${n} ${ej(n)}`
}

/**
 * Comparar etapas (usuario, 2026-11-23; `Desktop/MUTA-Fin-de-rutina-propuesta.png`): solo vueltas de una misma rutina,
 * a la misma semana —la semana 4 de una frente a la semana 4 de la otra—: el veredicto, tu fuerza semana a semana de las
 * dos («la carrera contra ti mismo»), las cifras, cada sesión y cada ejercicio. Rutinas distintas no se comparan.
 */
export function CompararHoja({ d, onClose }: { d: DetalleMeso; onClose: () => void }) {
  const [otra, setOtra] = useState(d.pareja?.id ?? d.comparables[0]?.id ?? '')
  const [c, setC] = useState<Comparacion | null>(null)
  useEffect(() => {
    if (otra) void comparar(d.meso.id, otra).then(setC)
  }, [d.meso.id, otra])
  if (!d.comparables.length) return null
  return (
    <Sheet title="Comparar etapas" onClose={onClose} large>
      <div class={styles.hoja}>
        <p class={styles.sub}>
          «{d.meso.nombre}» frente a{d.comparables.length > 1 ? '' : ` «${d.comparables[0].nombre}»`} ·{' '}
          {d.meso.rutina}
        </p>
        {d.comparables.length > 1 && (
          <MenuDesplegable
            etiqueta="Etapa con la que comparas"
            valor={otra}
            opciones={d.comparables.map((m) => ({ value: m.id, label: m.nombre }))}
            onChange={setOtra}
            lado="izquierda"
          />
        )}
        {c && <Vueltas c={c} />}
      </div>
    </Sheet>
  )
}

function Vueltas({ c }: { c: Comparacion }) {
  return (
    <>
      <section class={styles.card} aria-label="A la misma semana">
        <p class={styles.nota}>La misma rutina · a la semana {c.semana} de las dos</p>
        <p class={styles.nota}>
          Antes, «{c.a.nombre}»; ahora, «{c.b.nombre}».
        </p>
        <h3 class={propios.veredicto}>{veredicto(c)}</h3>
        <p class={styles.sub}>Tu mejor serie de cada ejercicio, en la misma semana de las dos.</p>
        <Carrera c={c} />
      </section>

      <ul class={`${styles.card} ${propios.cifras}`} aria-label="Hasta la misma semana">
        <Fila nombre="Fuerza en tus básicos" a={fuerzaTexto(c.fuerza.a)} b={fuerzaTexto(c.fuerza.b)} />
        {c.toneladas && (
          <Fila
            nombre="Toneladas por semana"
            a={formatDecimal(Math.round(c.toneladas.a * 10) / 10)}
            b={`${formatDecimal(Math.round(c.toneladas.b * 10) / 10)} t`}
          />
        )}
        {c.constancia && (
          <Fila
            nombre="Constancia"
            a={c.constancia.a === null ? '—' : `${c.constancia.a} %`}
            b={c.constancia.b === null ? '—' : `${c.constancia.b} %`}
          />
        )}
        {(c.peso.a !== null || c.peso.b !== null) && (
          <Fila
            nombre="Peso"
            a={c.peso.a === null ? '—' : cambioTexto(c.peso.a, 'kg')}
            b={c.peso.b === null ? '—' : cambioTexto(c.peso.b, 'kg')}
          />
        )}
      </ul>

      {c.sesiones.some((s) => s.a !== null || s.b !== null) && (
        <>
          <h3 class={styles.subtitulo}>Sesión a sesión · semana {c.semana}</h3>
          <ul class={`${styles.card} ${propios.sesiones}`}>
            {c.sesiones
              .filter((s) => s.a !== null || s.b !== null)
              .map((s) => {
                const max = Math.max(s.a ?? 0, s.b ?? 0, 1e-9)
                const cambio = s.a && s.b ? s.b / s.a - 1 : null
                return (
                  <li key={s.sigla}>
                    <div class={propios.cabeza}>
                      <span class={propios.sigla}>{s.sigla}</span>
                      <span class={cambio !== null && cambio > 0.005 ? propios.mejora : propios.gris}>
                        {cambio === null
                          ? s.b === null
                            ? 'Aún no'
                            : ''
                          : Math.round(cambio * 100) === 0
                            ? '='
                            : formatChange(cambio)}
                      </span>
                    </div>
                    <Barra nombre="Antes" valor={s.a} max={max} antes />
                    <Barra nombre="Ahora" valor={s.b} max={max} />
                  </li>
                )
              })}
          </ul>
        </>
      )}

      {c.ejercicios.length > 0 && (
        <>
          <h3 class={styles.subtitulo}>Ejercicio a ejercicio</h3>
          <div class={styles.card}>
            <table class={propios.tabla} aria-label="Ejercicio a ejercicio">
              <thead>
                <tr>
                  <th scope="col">Ejercicio</th>
                  <th scope="col">Antes</th>
                  <th scope="col">Ahora</th>
                  <th scope="col">
                    <span class={styles.oculto}>Cambio</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {c.ejercicios.map((e) => (
                  <tr key={e.nombre}>
                    <td>{e.nombre}</td>
                    <td class={propios.gris}>{serie(e.a)}</td>
                    <td>
                      <b>{serie(e.b)}</b>
                    </td>
                    <td class={e.cambio === 1 ? propios.mejora : propios.gris}>
                      {e.cambio === 1 ? '↑' : e.cambio === -1 ? '↓' : e.cambio === 0 ? '=' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p class={styles.nota}>Tu mejor serie de esa semana en cada una.</p>
          </div>
        </>
      )}
    </>
  )
}

const serie = (s: SerieHecha | null) => (s ? textoSerie(s) : '—')

function Fila({ nombre, a, b }: { nombre: string; a: string; b: string }) {
  return (
    <li>
      <span>{nombre}</span>
      <span>
        <span class={propios.gris}>{a} → </span>
        <b>{b}</b>
      </span>
    </li>
  )
}

function Barra({
  nombre,
  valor,
  max,
  antes,
}: {
  nombre: string
  valor: number | null
  max: number
  antes?: boolean
}) {
  return (
    <div class={propios.barra}>
      <span class={propios.barraNombre}>
        {nombre} · {valor === null ? '—' : `${formatDecimal(Math.round(valor * 10) / 10)} t`}
      </span>
      <span class={`${propios.pista} ${antes ? propios.antes : ''}`}>
        <i style={{ width: `${((valor ?? 0) / max) * 100}%` }} />
      </span>
    </div>
  )
}

const W = 300
const H = 120

/**
 * La carrera contra ti mismo: tu fuerza semana a semana en las dos vueltas (la anterior, en gris discontinuo; la de ahora,
 * en negro) y, en la semana que se compara, la diferencia (en verde si vas por delante).
 */
function Carrera({ c }: { c: Comparacion }) {
  const semanas = Math.max(c.carrera.a.length, c.carrera.b.length, 2)
  const valores = [...c.carrera.a, ...c.carrera.b].filter((x): x is number => x !== null)
  if (valores.length < 2) return null
  const [lo, hi] = [Math.min(0, ...valores), Math.max(0.01, ...valores)]
  const x = (i: number) => (i / (semanas - 1)) * W
  const y = (v: number) => H - ((v - lo) / (hi - lo)) * (H - 10) - 5
  const puntos = (l: readonly (number | null)[]) =>
    l.flatMap((v, i) => (v === null ? [] : [[x(i), y(v)] as const]))
  const [pa, pb] = [puntos(c.carrera.a), puntos(c.carrera.b)]
  if (pa.length < 2 && pb.length < 2) return null
  const i = c.semana - 1
  const [va, vb] = [c.fuerza.a, c.fuerza.b]
  const delante = va !== null && vb !== null ? vb - va : null
  return (
    <figure class={propios.carrera}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Tu fuerza semana a semana: «${c.b.nombre}» frente a «${c.a.nombre}»`}
      >
        <path class={propios.lineaAntes} d={curva(pa)} />
        <path class={propios.lineaAhora} d={curva(pb)} />
        {vb !== null && <circle class={propios.punto} cx={x(i)} cy={y(vb)} r="4" />}
        {va !== null && vb !== null && (
          <line
            class={delante !== null && delante > 0 ? propios.ventaja : propios.desventaja}
            x1={x(i)}
            x2={x(i)}
            y1={y(va)}
            y2={y(vb)}
          />
        )}
      </svg>
      <figcaption class={propios.leyenda}>
        <span>
          <i class={propios.marcaAhora} /> {c.b.nombre}
        </span>
        <span>
          <i class={propios.marcaAntes} /> {c.a.nombre}
        </span>
        {delante !== null && Math.round(delante * 100) !== 0 && (
          <b class={delante > 0 ? propios.mejora : propios.gris}>
            {formatChange(delante)} en la semana {c.semana}
          </b>
        )}
      </figcaption>
    </figure>
  )
}
