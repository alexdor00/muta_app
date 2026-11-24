import { useEffect, useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { formatLongDate, formatShortDate } from '../../../../shared/lib/format.ts'
import { paths, vieneDeHoy } from '../../../../shared/lib/paths.ts'
import { ChevronRightIcon } from '../../../../shared/ui/icons.tsx'
import { Pending } from '../../../../shared/ui/Pending.tsx'
import { SessionChart } from '../../../../shared/ui/SessionChart.tsx'
import { SessionHero } from '../../../../shared/ui/SessionHero.tsx'
import type { EntrenoDelDia } from '../../../training/index.ts'
import {
  entreno,
  estado,
  etapaDelMes,
  frenteALaAnterior,
  laVezAnterior,
  resumenSensaciones,
  sensaciones,
} from '../../state/progreso.ts'
import {
  cargarProgreso,
  encuadreDelEntreno,
  fotoDelEntreno,
  fotoDeSerieDelEntreno,
} from '../../use-cases/progress.ts'
import propios from '../mesociclo/Mesociclo.module.css'
import { textoSerie } from '../progreso/formato.ts'
import { Cambio, TituloSeccion } from '../progreso/Piezas.tsx'
import comun from '../progreso/Progreso.module.css'
import styles from './Dia.module.css'

/**
 * Un día de entreno (`/progreso/dia/2026-10-29`, desde Días), como Ver sesión: la cabecera con el color de esa sesión y la
 * hoja blanca encima; arriba, la gráfica de Ver sesión con lo que moviste en esa sesión hasta ese día; debajo, «Ejercicios»: cada uno con su
 * cambio y una tabla, serie a serie, frente a la vez anterior. Si ese día hubo dos entrenos, salen los dos.
 */
export function DiaScreen({ fecha }: { fecha: string }) {
  // Siempre se vuelve a leer (usuario, 2026-11-23): si acabas de entrenar, el día tiene que traer lo de hoy, igual que Hoy
  // y Tu plan (sin esto, con Progreso ya abierto antes, salía sin la sesión recién hecha)
  useEffect(() => {
    void cargarProgreso()
  }, [])
  // Desde Hoy, «‹» vuelve a Hoy; si no, a Días de ese mes
  const deHoy = vieneDeHoy(useLocation().query)
  const volver = deHoy ? paths.today : `${paths.progress}?mes=${fecha.slice(0, 7)}&ver=dias`
  const etiqueta = deHoy ? 'Volver a Hoy' : 'Volver'
  const delDia =
    estado.value === 'listo' ? (entreno.value?.entrenos ?? []).filter((x) => x.fecha === fecha) : []
  const [primero] = delDia
  // La foto de su sesión: la tuya o, si no pusiste ninguna, la de serie de su tono (como en Tu plan)
  const [foto, setFoto] = useState<string | null>(null)
  const [encuadre, setEncuadre] = useState('50% 50%')
  const [rutina, sigla, tono] = [primero?.programId, primero?.sigla, primero?.tono]
  useEffect(() => {
    if (!rutina || !sigla || !tono) return
    let url: string | null = null
    let vivo = true
    void fotoDelEntreno(rutina, sigla).then(async (b) => {
      if (!vivo) return
      url = b ? URL.createObjectURL(b) : null
      const deSerie = url ? null : await fotoDeSerieDelEntreno(rutina, sigla)
      if (vivo) setFoto(url ?? deSerie)
      const centro = await encuadreDelEntreno(rutina, sigla)
      if (vivo) setEncuadre(centro)
    })
    return () => {
      vivo = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [rutina, sigla, tono])
  if (estado.value !== 'listo') return <div class={propios.page} />
  if (!primero)
    return (
      <Pending code="Progreso" title="Ese día no entrenaste">
        <a href={volver}>{etiqueta}</a>
      </Pending>
    )
  const etapa = etapaDelMes(fecha.slice(0, 7))
  // Cómo estabas ese día (¿Cómo estás hoy?, de la pestaña Hoy)
  const como = resumenSensaciones(sensaciones.value.find((s) => s.date === fecha))
  return (
    <div class={styles.pagina}>
      <SessionHero
        sigla={delDia.map((x) => x.sigla).join(' + ')}
        nombre={delDia.map((x) => x.nombre).join(' + ')}
        detalle={`${formatLongDate(fecha)}${etapa ? ` · etapa ${etapa.nombre}` : ''}`}
        tono={primero.tono}
        foto={foto}
        encuadre={encuadre}
        backHref={volver}
        backLabel={etiqueta}
      />
      <div class={styles.panel}>
        {/* Arriba la gráfica, debajo los ejercicios (usuario, 2026-11-23); cómo estabas, al final */}
        {delDia.map((x) => (
          <ElEntreno key={x.id} x={x} varios={delDia.length > 1} />
        ))}
        {como && <p class={styles.como}>Cómo estabas: {como.charAt(0).toLowerCase() + como.slice(1)}</p>}
      </div>
    </div>
  )
}

function ElEntreno({ x, varios }: { x: EntrenoDelDia; varios: boolean }) {
  const e = entreno.value
  const lista = e?.entrenos ?? []
  const ejercicios = x.ejercicios.map((ej) => ({
    ...ej,
    antes: laVezAnterior(lista, ej.nombre, x.fecha),
    cambio: frenteALaAnterior(e?.ejercicios.find((y) => y.nombre === ej.nombre)?.puntos ?? [], x.fecha),
  }))
  const comparados = ejercicios.filter((ej) => ej.cambio !== null)
  const suben = comparados.filter((ej) => Math.round((ej.cambio ?? 0) * 100) > 0).length
  return (
    <>
      {/* La misma gráfica que Ver sesión, hasta este día */}
      <SessionChart veces={x.veces} etiqueta={varios ? `Progreso de ${x.sigla}` : 'Progreso de la sesión'} />
      <TituloSeccion
        titulo={varios ? `Ejercicios de ${x.sigla}` : 'Ejercicios'}
        dato={comparados.length ? `${suben} de ${comparados.length} suben` : null}
      />
      <ul class={comun.plana}>
        {ejercicios.map((ej) => {
          const filas = Math.max(ej.series.length, ej.antes?.series.length ?? 0)
          return (
            <li key={ej.nombre} class={styles.ejercicio}>
              <div class={styles.cabeza}>
                <h3 class={styles.titulo}>
                  {ej.ejercicioId ? (
                    <a href={paths.exercise(ej.ejercicioId)}>
                      {ej.nombre} <ChevronRightIcon />
                    </a>
                  ) : (
                    ej.nombre
                  )}
                </h3>
                <Cambio cambio={ej.cambio} que="la sesión anterior" />
              </div>
              <table class={styles.tabla} aria-label={ej.nombre}>
                <thead>
                  <tr>
                    <th scope="col">
                      <span class={propios.oculto}>Serie</span>
                    </th>
                    <th scope="col">Este día</th>
                    <th scope="col">
                      {ej.antes ? `Sesión anterior · ${formatShortDate(ej.antes.fecha)}` : 'Sesión anterior'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: filas }, (_, i) => {
                    const hoy = ej.series[i]
                    const antes = ej.antes?.series[i]
                    return (
                      <tr key={i}>
                        <td class={styles.numero}>{i + 1}</td>
                        <td class={styles.hoy}>{hoy ? textoSerie(hoy) : '—'}</td>
                        <td class={styles.antes}>
                          {antes ? textoSerie(antes) : i === 0 && !ej.antes ? 'Primera vez' : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </li>
          )
        })}
      </ul>
    </>
  )
}
