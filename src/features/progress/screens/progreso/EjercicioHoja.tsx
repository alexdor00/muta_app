import { formatDecimal, formatMonthName, formatShortDate } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { ejercicioEnMes, entreno, otroMes } from '../../state/progreso.ts'
import { textoSerie } from './formato.ts'
import { Cambio, Grafica, Record } from './Piezas.tsx'
import styles from './Progreso.module.css'

/**
 * Un ejercicio en un mes (desde Fuerza): su mejor serie frente a la de antes, la gráfica de su 1RM estimado hasta ese mes,
 * cada día del mes con sus series (cada día lleva a su pantalla) y su ficha.
 */
export function EjercicioHoja({
  nombre,
  mes,
  onClose,
}: {
  nombre: string
  mes: string
  onClose: () => void
}) {
  const e = entreno.value
  const x = e?.ejercicios.find((y) => y.nombre === nombre)
  const en = x ? ejercicioEnMes(x.puntos, mes) : null
  if (!e || !x || !en) return null
  const hastaMes = x.puntos.filter((p) => p.fecha <= `${mes}-31`)
  const anterior = formatMonthName(otroMes(mes, -1)).toLowerCase()
  const dias = e.entrenos
    .filter((y) => y.fecha.startsWith(mes))
    .flatMap((y) => {
      const ej = y.ejercicios.find((z) => z.nombre === nombre)
      return ej ? [{ fecha: y.fecha, series: ej.series }] : []
    })
    .reverse()
  return (
    <Sheet title={nombre} onClose={onClose} large>
      <div class={styles.hoja}>
        <section class={styles.card} aria-label="Tu mejor serie del mes">
          <div class={styles.cifraCab}>
            <b>{textoSerie(en.mejor.serie)}</b>
            <Cambio cambio={en.cambio} que={anterior} />
            {en.record && <Record />}
          </div>
          <p class={styles.filaDetalle}>
            Tu mejor serie de {formatMonthName(mes).toLowerCase()}
            {en.anterior ? ` · antes, ${textoSerie(en.anterior.serie)}` : ''}
          </p>
        </section>
        {hastaMes.length > 1 && (
          <Grafica
            etiqueta="1RM estimado"
            titulo="1RM estimado"
            valor={`${formatDecimal(en.a)} kg`}
            texto={(v) => `${formatDecimal(Math.round(v * 10) / 10)} kg`}
            fecha={formatShortDate(en.mejor.fecha)}
            puntos={hastaMes.map((p) => ({ date: p.fecha, v: p.e1rm, dato: p.e1rm }))}
            resumen={`${nombre}: 1RM estimado de ${formatDecimal(hastaMes[0].e1rm)} a ${formatDecimal(en.a)} kg`}
          />
        )}
        <table class={styles.tablaSeries}>
          <caption class={styles.seccionTabla}>Cada día de {formatMonthName(mes).toLowerCase()}</caption>
          <thead>
            <tr>
              <th scope="col">Día</th>
              <th scope="col">Series</th>
            </tr>
          </thead>
          <tbody>
            {dias.map((d) => (
              <tr key={d.fecha}>
                <td>
                  <a href={paths.progressDay(d.fecha)}>{formatShortDate(d.fecha)}</a>
                </td>
                <td>{d.series.map(textoSerie).join(' · ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {x.ejercicioId && (
          <Button variant="secondary" href={paths.exercise(x.ejercicioId)}>
            Ver su ficha
          </Button>
        )}
      </div>
    </Sheet>
  )
}
