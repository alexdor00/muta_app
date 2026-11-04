import { useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { formatDayDate, formatDecimal, formatTons, localDate } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Pending } from '../../../../shared/ui/Pending.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { WorkoutSummary } from '../../components/WorkoutSummary.tsx'
import { descansosPorSemana, entrenos, semanaDe, sesiones } from '../../state/plan.ts'
import { guardarSesion, resumenDe, segundosSesion, sesionEnCurso } from '../../state/sesionEnCurso.ts'
import { diasDeRacha } from '../../state/routines.ts'
import { reabrirEntreno } from '../../use-cases/training.ts'
import { compartir } from '../../use-cases/workoutFeedback.ts'
import { usePlan } from '../comun/usePlan.ts'

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
 * sesión (y deshace su guardado).
 */
export function ResumenScreen(props: { sessionId: string }) {
  const { route } = useLocation()
  const [aviso, setAviso] = useState<string | null>(null)
  usePlan()
  const en = sesionEnCurso.value
  if (!en || en.sigla.toLowerCase() !== props.sessionId.toLowerCase() || en.terminada === null) {
    return (
      <Pending code="C24" title="No hay ninguna sesión terminada">
        <a href={paths.training}>Volver a Tu plan</a>
      </Pending>
    )
  }
  const sesion = en
  const r = resumenDe(en)
  const hoy = localDate(new Date(en.terminada))
  const fecha = formatDayDate(hoy).toLowerCase()
  const minutos = Math.max(1, Math.round(segundosSesion(en, en.terminada) / 60))
  // Tu semana y la racha con lo guardado (el entreno de hoy ya está dentro)
  const diaHoy = (new Date(`${hoy}T00:00:00Z`).getUTCDay() + 6) % 7
  const semana = semanaDe(entrenos.value, hoy).map((d, i) => ({
    letra: d.letra,
    hecho: d.estado === 'hecho',
    hoy: i === diaHoy,
  }))
  const racha = diasDeRacha([...entrenos.value.map((x) => x.fecha), hoy], descansosPorSemana.value, hoy)
  const comparados = r.ejercicios.filter((e) => e.cambio !== null)

  return (
    <>
      <WorkoutSummary
        sigla={sesion.sigla}
        subtitulo={`${sesion.nombre} · ${fecha}`}
        racha={racha}
        semanaTexto={`${semana.filter((d) => d.hecho).length} de ${sesiones.value.length} esta semana`}
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
          // Primero se deshace lo guardado y luego se vuelve a la sesión (si no, una recarga podría cortarlo)
          void reabrirEntreno(en).then(() => route(paths.session(sesion.sigla.toLowerCase())))
        }}
      />
      <Toast message={aviso} />
    </>
  )
}
