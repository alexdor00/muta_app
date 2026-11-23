import { useLocation } from 'preact-iso'
import { useEffect } from 'preact/hooks'
import { addDays, daysBetween, formatDayDate } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { ChevronLeftIcon, ChevronRightIcon } from '../../../../shared/ui/icons.tsx'
import { RoundButton } from '../../../../shared/ui/RoundButton.tsx'
import { useVolver } from '../../../../shared/ui/useVolver.ts'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import { ajustes, calculo, dieta, estado, historial, hoy, pendiente } from '../../state/comida.ts'
import { cargarComida } from '../../use-cases/nutritionStore.ts'
import { aprenderDeTusDatos, deshacerCambio, deshacible } from '../../use-cases/target.ts'
import { DatosHoja } from '../comida/DatosHoja.tsx'
import { useAviso } from '../comun/useAviso.ts'
import { EditarObjetivo } from './EditarObjetivoHoja.tsx'
import { ComoSeCalcula } from './ComoSeCalcula.tsx'
import { Historial } from './Historial.tsx'
import { ManoHoja } from './ManoHoja.tsx'
import styles from './Objetivo.module.css'
import { RevisionCard } from './RevisionCard.tsx'
import { TarjetaObjetivo } from './TarjetaObjetivo.tsx'
import { SugerenciaHoja } from './SugerenciaHoja.tsx'

type Ver = 'cambiar' | 'calculo' | 'historial'
const TITULO: Record<Ver, string> = {
  cambiar: 'Cambiar objetivo',
  calculo: 'Cómo se calcula',
  historial: 'Historial de cambios',
}

/**
 * Rediseño 41 y 43 (usuario, 2026-11-17): arriba la cifra y la revisión; «Cambiar objetivo», «Cómo se calcula» e
 * «Historial de cambios», cada uno en su pantalla (`?ver=`), y tu dieta. Antes: tu objetivo, en una pantalla (usuario, 2026-11-15): la cifra, lo que quieres y cómo lo repartes (para cambiarlo), la
 * revisión semanal del entrenador y, plegados, cómo sale paso a paso y el historial de cambios.
 */
/** Tu objetivo vive en Mi plan (paso 1): «‹» vuelve ahí si no hay pantalla detrás (usuario, 2026-11-19). */
const MI_PLAN = `${paths.nutrition}?vista=plan&paso=objetivo`

export function ObjetivoScreen() {
  useEffect(() => {
    void cargarComida().then(aprenderDeTusDatos)
  }, [])
  const mano = useSheet('mano')
  const datos = useSheet('datos')
  const sugerencia = useSheet('sugerencia')
  const { aviso, avisar } = useAviso()
  const { query } = useLocation()
  const ver = (['cambiar', 'calculo', 'historial'] as const).find((x) => x === query.ver) ?? null
  if (estado.value === 'cargando') return null
  const a = ajustes.value
  const c = calculo.value
  if (!a || !c) {
    return (
      <div class={styles.page}>
        <Volver titulo="Objetivo" volver={MI_PLAN} />
        <p class={styles.sub}>Aún no tienes objetivo: calcúlalo en Nutrición con tus datos.</p>
      </div>
    )
  }
  const ultimaRevision = historial.value.find((x) => x.tipo === 'sugerencia' || x.tipo === 'sin-cambios')
  const deshacer = deshacible()

  return (
    <div class={styles.page}>
      <Volver titulo={ver ? TITULO[ver] : 'Objetivo'} volver={MI_PLAN} />
      {!ver && (
        <>
          <TarjetaObjetivo />
          <RevisionCard onVer={pendiente.value ? sugerencia.show : null} />
          <ul class={styles.lista}>
            {(['cambiar', 'calculo', 'historial'] as const).map((x) => (
              <li key={x}>
                <a class={styles.filaLista} href={`${paths.nutritionTarget}?ver=${x}`}>
                  <span class={styles.filaNombre}>{TITULO[x]}</span>
                  <ChevronRightIcon />
                </a>
              </li>
            ))}
          </ul>
          {/* Tu dieta vive aquí (usuario, 2026-11-15): si te la pasa tu nutricionista, ocupa el lugar del objetivo calculado */}
          <ul class={styles.lista}>
            <li>
              <a class={styles.filaLista} href={`${paths.nutrition}?vista=dieta`}>
                <span class={styles.rowText}>
                  <span class={styles.filaNombre}>Dieta de tu nutricionista</span>
                  <span class={styles.foot}>{dieta.value ? dieta.value.dieta.nombre : 'Opcional'}</span>
                </span>
                <ChevronRightIcon />
              </a>
            </li>
          </ul>
        </>
      )}
      {ver === 'cambiar' && <EditarObjetivo avisar={avisar} />}

      {ver === 'calculo' && <ComoSeCalcula onDatos={datos.show} />}

      {ver === 'historial' && (
        <div class={styles.historial}>
          <h2 id="historial" class={styles.historialTitulo}>
            Historial
          </h2>
          <Historial
            cambios={historial.value}
            deshacible={deshacer?.id ?? null}
            onDeshacer={async (id) => {
              await deshacerCambio(id)
              avisar('Cambio deshecho: vuelve tu objetivo de antes')
            }}
          />
          <p class={styles.next}>
            {ultimaRevision
              ? `Próxima revisión: ${formatDayDate(addDays(ultimaRevision.fecha, 7))}`
              : 'La primera revisión llega con 10 pesajes en 14 días y 12 días de comida apuntados.'}
            {a.desde > hoy.value &&
              ` · Tu nuevo objetivo empieza ${daysBetween(hoy.value, a.desde) === 1 ? 'mañana' : formatDayDate(a.desde)}.`}
          </p>
        </div>
      )}

      {mano.open && <ManoHoja onClose={mano.close} avisar={avisar} />}
      {datos.open && <DatosHoja onClose={datos.close} />}
      {sugerencia.open && <SugerenciaHoja onClose={sugerencia.close} avisar={avisar} />}
      <Toast message={aviso?.texto ?? null} action={aviso?.accion ?? null} />
    </div>
  )
}

function Volver({ titulo, volver }: { titulo: string; volver: string }) {
  const atras = useVolver(volver)
  return (
    <header class={styles.bar}>
      <RoundButton label="Volver" variant="plain" onClick={atras}>
        <ChevronLeftIcon />
      </RoundButton>
      <h1 class={styles.barTitle}>{titulo}</h1>
      <span />
    </header>
  )
}
