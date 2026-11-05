import {
  addDays,
  daysBetween,
  formatChange,
  formatInt,
  formatShortDate,
} from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { CheckIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { TrendChart } from '../../components/TrendChart.tsx'
import { ajustes, calculo, hoy, pendiente, serie, tituloCambio } from '../../state/comida.ts'
import { aplicarSugerencia, deshacerCambio, descartarSugerencia, macrosCon } from '../../use-cases/target.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'
import styles from './Objetivo.module.css'

type Props = { onClose: () => void; avisar: (texto: string, accion?: Aviso['accion']) => void }

const pct = (n: number) => formatChange(n / 100, 2)

/**
 * La sugerencia del entrenador: qué cambia, por qué (tu ritmo frente al previsto) y lo que ha comprobado antes.
 * Nada cambia hasta que tocas «Aplicar»; con «Ahora no» se queda como está.
 */
export function SugerenciaHoja({ onClose, avisar }: Props) {
  const s = pendiente.value
  const a = ajustes.value
  const r = s?.revision
  if (!s || !a || !r) return null
  const antes = macrosCon(r.de)
  const despues = macrosCon(r.a)
  const desde = addDays(s.fecha, -13)
  const puntos = serie.value.filter((p) => p.date >= desde && p.date <= s.fecha)
  const inicio = puntos[0]?.tendencia ?? 0
  // Lo previsto en dos semanas, desde la tendencia del primer día
  const banda = {
    inicio: [inicio, inicio] as [number, number],
    fin: [inicio * (1 + (r.previsto.min * 2) / 100), inicio * (1 + (r.previsto.max * 2) / 100)] as [
      number,
      number,
    ],
  }
  const diferencia = r.a - r.de

  return (
    <Sheet
      title="El entrenador"
      onClose={onClose}
      large
      footer={
        <div class={h.actions}>
          <Button
            onClick={async () => {
              await aplicarSugerencia(s.id)
              onClose()
              avisar(`Objetivo: ${formatInt(r.a)} kcal desde mañana`, {
                label: 'Deshacer',
                onClick: () => void deshacerCambio(s.id),
              })
            }}
          >
            Aplicar desde mañana
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              await descartarSugerencia(s.id)
              onClose()
              avisar('Tu objetivo se queda como está')
            }}
          >
            Ahora no
          </Button>
        </div>
      }
    >
      <div class={h.stack}>
        <div>
          <p class={h.eyebrow}>
            Revisión · {formatShortDate(desde)} – {formatShortDate(s.fecha)}
          </p>
          <h3 class={styles.suggestionTitle}>{tituloCambio(r, a.fase)}</h3>
        </div>
        <p class={styles.change}>
          <span class={styles.from}>{formatInt(r.de)}</span>
          <span aria-label="pasa a">→</span>
          <span class={styles.to}>{formatInt(r.a)}</span>
          <span class={h.sub}>kcal</span>
        </p>
        {antes && despues && (
          <p class={h.figures}>
            {diferencia > 0 ? '+' : '−'}
            {formatInt(Math.abs(diferencia))} kcal, todo en los hidratos:{' '}
            <b>
              {formatInt(antes.carbs)} → {formatInt(despues.carbs)} g
            </b>
            . La proteína y la grasa no cambian.
          </p>
        )}
        {/* Se puede enfocar: la hoja se desplaza y sin esto no tendría nada que alcanzar con el teclado */}
        <section class={h.card} aria-label="Tu ritmo" tabIndex={0}>
          <span class={h.eyebrow}>Tu ritmo</span>
          <p class={h.figures}>
            <b>{pct(r.pct)}</b> por semana · previsto de {pct(r.previsto.min)} a {pct(r.previsto.max)}
          </p>
          {puntos.length > 1 && (
            <TrendChart
              puntos={puntos.map((p) => ({
                dia: daysBetween(desde, p.date),
                kg: null,
                tendencia: p.tendencia,
              }))}
              dias={14}
              banda={banda}
              desde={formatShortDate(desde)}
              hasta={formatShortDate(s.fecha)}
              resumen={`Tu peso cambia un ${pct(r.pct)} por semana; lo previsto para tu fase es de ${pct(r.previsto.min)} a ${pct(r.previsto.max)}`}
            />
          )}
          <p class={h.foot}>En gris, lo previsto para tu fase; la línea, la tendencia de tu peso.</p>
        </section>
        <div>
          <p class={h.eyebrow}>Antes de proponerlo he comprobado</p>
          <ul class={styles.checks}>
            {r.comprobaciones.map((c) => (
              <li key={c.texto}>
                <span class={h.check} aria-hidden="true">
                  <CheckIcon />
                </span>
                <span>
                  {c.texto} <span class={h.foot}>({c.detalle})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        {calculo.value && (
          <p class={h.foot}>
            Nunca bajaré de {formatInt(calculo.value.suelo)} kcal (
            {calculo.value.suelo === Math.round(calculo.value.basal * 1.1)
              ? 'tu gasto en reposo × 1,1'
              : 'lo mínimo recomendado'}
            ). Si lo aplicas, lo puedes deshacer en «Tu objetivo».
          </p>
        )}
        {hoy.value !== s.fecha && <p class={h.foot}>Propuesta del {formatShortDate(s.fecha)}.</p>}
      </div>
    </Sheet>
  )
}
