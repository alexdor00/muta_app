import { useEffect, useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import {
  formatChange,
  formatDayDate,
  formatDecimal,
  formatTons,
  localDate,
} from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { WorkoutSummary } from '../../components/WorkoutSummary.tsx'
import {
  claveEjercicio,
  descansosPorSemana,
  entrenos,
  recordsDelEntreno,
  semanaDe,
  sesiones,
} from '../../state/plan.ts'
import { elegirDescanso, guardarSesion, resumenDe, sesionEnCurso } from '../../state/sesionEnCurso.ts'
import { segundosSesion } from '../../state/tiempoSesion.ts'
import { descansosPropuestos, descansosVistos } from '../../state/descansos.ts'
import { diasDeRacha } from '../../state/routines.ts'
import { reabrirEntreno } from '../../use-cases/training.ts'
import { FinDeRutinaCard } from '../../components/FinDeRutinaCard.tsx'
import { finDeRutina } from '../../state/finDeRutina.ts'
import { cifrasDeLaRutina, quitarFinDeRutina } from '../../use-cases/finDeRutina.ts'
import { repetirRutina } from '../../use-cases/mesocycles.ts'
import { compartirImagen } from '../../use-cases/shareImage.ts'
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
  const { route, path } = useLocation()
  const [aviso, setAviso] = useState<string | null>(null)
  const plan = usePlan()
  const en = sesionEnCurso.value
  const sinResumen = !en || en.sigla.toLowerCase() !== props.sessionId.toLowerCase() || en.terminada === null
  // El resumen vive solo mientras la app sigue abierta: si vuelves más tarde (o recargas), te lleva al día de ese
  // entreno en Progreso; si no hay ninguno, a Tu plan
  const ultimo = entrenos.value
    .filter((x) => x.sigla.toLowerCase() === props.sessionId.toLowerCase())
    .sort((a, b) => b.inicio - a.inicio)[0]
  // Solo mientras sigues en el resumen: al tocar «Hecho» ya vas a Tu plan (la pantalla sigue un momento mientras carga)
  const enResumen = path.endsWith('/resumen')
  useEffect(() => {
    if (sinResumen && enResumen && plan.status !== 'loading')
      route(ultimo ? paths.progressDay(ultimo.fecha) : paths.training, true)
  }, [sinResumen, enResumen, plan.status, ultimo, route])
  // Con esta sesión terminaste tu rutina (usuario, 2026-11-23): la tarjeta con las cifras de la etapa y qué hacer ahora
  const fin = finDeRutina.value
  const terminaAqui = !!fin && !!ultimo && fin.entrenoId === ultimo.id
  const [cifrasFin, setCifrasFin] = useState<Awaited<ReturnType<typeof cifrasDeLaRutina>>>(null)
  useEffect(() => {
    if (terminaAqui) void cifrasDeLaRutina(localDate()).then(setCifrasFin)
  }, [terminaAqui])
  if (sinResumen || !en || en.terminada === null) return null
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
  // Los récords de hoy: tu mejor marca de siempre, frente a todos los entrenos de antes (el de hoy ya está guardado)
  const records =
    ultimo && ultimo.fecha === hoy ? recordsDelEntreno(ultimo, entrenos.value, claveEjercicio.value) : []
  // Tus descansos, revisados con lo de hoy (02-reglas § 3): se proponen con «Aplicar»
  const vistos = descansosVistos.value
  const descansos =
    // Con un rato largo sin apuntar, el tiempo no es fiable: no se revisan (usuario, 2026-11-23)
    ultimo && ultimo.fecha === hoy && ultimo.sigla === en.sigla && !en.conHueco
      ? descansosPropuestos(ultimo, sesiones.value.find((x) => x.sigla === en.sigla) ?? null, minutos)
          .filter((d) => vistos[d.nombre] !== 'no')
          .map((d) => ({ ...d, aplicado: vistos[d.nombre] === 'aplicado' }))
      : []

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
          { valor: String(records.length), unidad: '', nombre: 'Récords' },
          { valor: formatTons(r.volumen / 1000).replace(' t', ''), unidad: 't', nombre: 'Volumen' },
          { valor: String(minutos), unidad: 'min', nombre: 'Duración' },
        ]}
        suben={`${r.suben} de ${comparados.length} suben`}
        records={records.map((x) => ({ nombre: x.nombre, marca: serieTexto(x.serie) }))}
        ejercicios={r.ejercicios.map((e) => ({
          nombre: e.nombre,
          series: e.series.map((s) => ({
            texto: serieTexto(s),
            antes: s.antes ? serieTexto(s.antes) : null,
            frente: s.frente,
          })),
          cambio: cambioDe(e.mejor, e.mejorAntes),
        }))}
        aviso={
          terminaAqui &&
          fin && (
            <FinDeRutinaCard
              titulo={`Has completado ${fin.rutina}`}
              texto={`${fin.semanas} semanas. Si la repites, empieza una etapa nueva y verás cada semana frente a la misma de esta.`}
              cifras={
                cifrasFin
                  ? [
                      {
                        valor:
                          cifrasFin.fuerza === null
                            ? '—'
                            : Math.round(cifrasFin.fuerza * 100) === 0
                              ? '='
                              : formatChange(cifrasFin.fuerza),
                        nombre: 'tu fuerza',
                        tono: (cifrasFin.fuerza ?? 0) > 0 ? 'mejora' : undefined,
                      },
                      { valor: String(cifrasFin.sesiones), nombre: 'sesiones' },
                      {
                        valor: String(cifrasFin.records),
                        nombre: 'récords',
                        tono: cifrasFin.records ? 'logro' : undefined,
                      },
                    ]
                  : undefined
              }
              onRepetir={() =>
                void repetirRutina(localDate()).then((ok) => {
                  guardarSesion(null)
                  route(paths.training)
                  if (!ok) setAviso('No se pudo: inténtalo desde Tu plan')
                })
              }
              hrefCambiar={paths.chooseRoutine}
              onAhoraNo={() => void quitarFinDeRutina()}
            />
          )
        }
        descansos={descansos}
        onDescanso={(nombre, segundos) => {
          elegirDescanso(nombre, segundos)
          descansosVistos.value = { ...descansosVistos.value, [nombre]: 'aplicado' }
        }}
        onDejarDescanso={(nombre) => {
          descansosVistos.value = { ...descansosVistos.value, [nombre]: 'no' }
        }}
        onHecho={() => {
          guardarSesion(null)
          route(paths.training)
        }}
        onCompartir={async () => {
          // La imagen (C25); si el navegador no puede dibujarla, el texto de siempre
          try {
            const hecho = await compartirImagen(
              {
                fecha,
                nombre: sesion.nombre,
                racha,
                volumenKg: r.volumen,
                series: r.series,
                minutos,
                records: r.records,
              },
              `muta-${hoy}-${sesion.sigla.toLowerCase()}.png`,
            )
            if (hecho === 'saved') setAviso('Imagen guardada')
            return
          } catch {
            // Sigue con el texto
          }
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
