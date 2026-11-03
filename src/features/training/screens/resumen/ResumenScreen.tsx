import { useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { formatDayDate, formatDecimal, formatTons } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Pending } from '../../../../shared/ui/Pending.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { WorkoutSummary } from '../../components/WorkoutSummary.tsx'
import { MUESTRA, sesionMuestra } from '../../state/muestra/datos.ts'
import { guardarSesion, resumenDe, segundosSesion, sesionEnCurso } from '../../state/muestra/sesionEnCurso.ts'
import { diasDeRacha } from '../../state/routines.ts'
import { compartir } from '../../use-cases/workoutFeedback.ts'

type Serie = { kg: number | null; reps: number }

const serieTexto = (s: Serie) =>
  s.kg !== null && s.kg > 0 ? `${formatDecimal(s.kg)} kg × ${s.reps}` : `${s.reps} reps`

/**
 * Frente a la vez anterior, como en el prototipo: ↑ si subió el peso de la mejor serie, + si con el mismo peso hizo
 * más repeticiones, ↓ si bajó, = si igual.
 */
function cambioDe(hoy: Serie, antes: Serie | null) {
  if (!antes) return null
  const kg = (hoy.kg ?? 0) - (antes.kg ?? 0)
  if (kg > 0) return { texto: `${formatDecimal(kg)} kg`, tipo: 'kg' as const }
  if (kg < 0) return { texto: `${formatDecimal(-kg)} kg`, tipo: 'baja' as const }
  const reps = hoy.reps - antes.reps
  if (reps > 0) return { texto: `${reps} reps`, tipo: 'reps' as const }
  if (reps < 0) return { texto: `${-reps} reps`, tipo: 'baja' as const }
  return { texto: 'igual', tipo: 'igual' as const }
}

/**
 * Resumen de la sesión que se acaba de terminar (C24): la racha con su fuego y la semana, series superadas, récords,
 * volumen y duración, y cada ejercicio frente a la última vez. «Hecho» la cierra; «Me faltó un ejercicio» vuelve a la
 * sesión. Datos de prueba (state/muestra/).
 */
export function ResumenScreen(props: { sessionId: string }) {
  const { route } = useLocation()
  const [aviso, setAviso] = useState<string | null>(null)
  const sesion = sesionMuestra(props.sessionId)
  const en = sesionEnCurso.value
  if (!sesion || !en || en.sigla !== sesion.sigla || en.terminada === null) {
    return (
      <Pending code="C24" title="No hay ninguna sesión terminada">
        <a href={paths.training}>Volver a Tu plan</a>
      </Pending>
    )
  }
  const r = resumenDe(sesion, en)
  const fecha = formatDayDate(MUESTRA.hoy).toLowerCase()
  const minutos = Math.max(1, Math.round(segundosSesion(en, en.terminada) / 60))
  // La semana y la racha de prueba, con la sesión de hoy ya hecha
  const semana = MUESTRA.semana.map((d) => ({
    letra: d.letra,
    hecho: d.estado === 'hecho' || d.sigla === sesion.sigla,
    hoy: d.estado === 'hoy',
  }))
  // Los días de descanso del plan cuentan (lunes = 0)
  const descansos = MUESTRA.semana.flatMap((d, i) => (d.estado === 'descanso' ? [i] : []))
  const racha = diasDeRacha([...MUESTRA.entrenos.map((x) => x.fecha), MUESTRA.hoy], descansos, MUESTRA.hoy)
  const comparados = r.ejercicios.filter((e) => e.cambio !== null)

  return (
    <>
      <WorkoutSummary
        sigla={sesion.sigla}
        subtitulo={`${sesion.nombre} · ${fecha}`}
        racha={racha}
        semanaTexto={`${semana.filter((d) => d.hecho).length} de ${MUESTRA.semana.filter((d) => d.sigla).length} esta semana`}
        semana={semana}
        cifras={[
          { valor: String(r.superadas), unidad: `de ${r.comparables}`, nombre: 'Series superadas' },
          { valor: String(r.records.length), unidad: '', nombre: 'Récords' },
          { valor: formatTons(r.volumen / 1000).replace(' t', ''), unidad: 't', nombre: 'Volumen' },
          { valor: String(minutos), unidad: 'min', nombre: 'Duración' },
        ]}
        suben={`${r.suben} de ${comparados.length} suben`}
        ejercicios={r.ejercicios.map((e) => ({
          nombre: e.nombre,
          series: e.series.map((s) => ({ texto: serieTexto(s), mejor: s.mejor })),
          cambio: cambioDe(e.mejor, e.mejorAntes),
        }))}
        onHecho={() => {
          guardarSesion(null)
          route(paths.training)
        }}
        onCompartir={async () => {
          const texto = [
            `${sesion.sigla} ${sesion.nombre} · ${fecha}`,
            `🔥 ${racha} ${racha === 1 ? 'día' : 'días'} de racha`,
            `${formatTons(r.volumen / 1000)} · ${r.series} series · ${minutos} min`,
            ...r.records.map((x) => `★ ${x.nombre}: ${serieTexto(x.mejor)}`),
          ].join('\n')
          if ((await compartir(`Sesión ${sesion.sigla} completada`, texto)) === 'copied') {
            setAviso('Resumen copiado')
          }
        }}
        onVolver={() => {
          guardarSesion({ ...en, terminada: null })
          route(paths.session(sesion.sigla.toLowerCase()))
        }}
      />
      <Toast message={aviso} />
    </>
  )
}
