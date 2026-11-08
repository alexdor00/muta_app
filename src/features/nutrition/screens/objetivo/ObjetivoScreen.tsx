import { useEffect } from 'preact/hooks'
import {
  addDays,
  daysBetween,
  formatDayDate,
  formatDecimal,
  formatInt,
} from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { ChevronLeftIcon, PencilIcon } from '../../../../shared/ui/icons.tsx'
import { RoundButton } from '../../../../shared/ui/RoundButton.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import { ajustes, calculo, estado, gastoReal, historial, hoy, pendiente } from '../../state/comida.ts'
import { cargarComida } from '../../use-cases/nutritionStore.ts'
import {
  aceptadosDesdeElCalculo,
  deshacerCambio,
  deshacible,
  volverAlCalculo,
} from '../../use-cases/target.ts'
import { DatosHoja } from '../comida/DatosHoja.tsx'
import { useAviso } from '../comun/useAviso.ts'
import { FaseHoja } from './FaseHoja.tsx'
import { Historial } from './Historial.tsx'
import { ManoHoja } from './ManoHoja.tsx'
import styles from './Objetivo.module.css'
import { RevisionCard } from './RevisionCard.tsx'
import { TarjetaObjetivo } from './TarjetaObjetivo.tsx'
import { SugerenciaHoja } from './SugerenciaHoja.tsx'

/** Tu objetivo: la cifra, cómo sale paso a paso, la revisión semanal del entrenador y el historial de cambios. */
export function ObjetivoScreen() {
  useEffect(() => {
    void cargarComida()
  }, [])
  const fase = useSheet('fase')
  const mano = useSheet('mano')
  const datos = useSheet('datos')
  const sugerencia = useSheet('sugerencia')
  const { aviso, avisar } = useAviso()
  if (estado.value === 'cargando') return null
  const a = ajustes.value
  const c = calculo.value
  if (!a || !c) {
    return (
      <div class={styles.page}>
        <Volver />
        <p class={styles.sub}>Aún no tienes objetivo: calcúlalo en Nutrición con tus datos.</p>
      </div>
    )
  }
  const delEntrenador = a.aMano ? 0 : aceptadosDesdeElCalculo()
  const kgSemana = Math.round((a.ritmo / 100) * a.cuerpo.pesoKg * 100) / 100
  const ultimaRevision = historial.value.find((x) => x.tipo === 'sugerencia' || x.tipo === 'sin-cambios')
  const deshacer = deshacible()

  return (
    <div class={styles.page}>
      <Volver />
      <TarjetaObjetivo>
        <button type="button" onClick={fase.show}>
          Cambiar fase
        </button>
        <button type="button" onClick={mano.show}>
          <PencilIcon /> Fijar a mano
        </button>
      </TarjetaObjetivo>

      <section aria-labelledby="como-sale">
        <h2 id="como-sale" class={styles.title}>
          Cómo sale
        </h2>
        <ul class={styles.list}>
          <li>
            <button type="button" class={styles.rowButton} onClick={datos.show}>
              <span class={styles.rowText}>
                <span>Gasto en reposo</span>
                <span class={styles.foot}>
                  Mifflin-St Jeor: {formatDecimal(a.cuerpo.pesoKg)} kg, {a.cuerpo.alturaCm} cm,{' '}
                  {a.cuerpo.edad} años · cambiar tus datos
                </span>
              </span>
              <b>{formatInt(c.basal)}</b>
            </button>
          </li>
          <li class={styles.row}>
            <span class={styles.rowText}>
              <span>× Tu actividad</span>
              <span class={styles.foot}>
                {formatInt(a.pasos)} pasos al día y {a.diasEntreno} entrenos por semana
              </span>
            </span>
            <b>{formatDecimal(c.factor)}</b>
          </li>
          <li class={styles.row}>
            <span class={styles.rowText}>
              <span>= Lo que gastas</span>
              <span class={styles.foot}>
                {gastoReal.value
                  ? `Medido con tus datos de 2 semanas: ${formatInt(gastoReal.value)} kcal`
                  : 'Estimado; con 2 semanas de pesajes y comida apuntada se mide'}
              </span>
            </span>
            <b>{formatInt(c.gasto)}</b>
          </li>
          {c.cambio !== 0 && (
            <li class={styles.row}>
              <span class={styles.rowText}>
                <span>
                  {a.fase === 'definicion'
                    ? `− Para bajar ${formatDecimal(kgSemana)} kg a la semana`
                    : '+ Superávit de volumen'}
                </span>
                <span class={styles.foot}>
                  {a.fase === 'definicion'
                    ? `${formatDecimal(a.ritmo)} % de tu peso · 7.700 kcal por kilo`
                    : '0,375 % de tu peso al mes (al menos 75 kcal)'}
                </span>
              </span>
              <b>{formatInt(Math.abs(c.cambio))}</b>
            </li>
          )}
          {c.enSuelo && (
            <li class={styles.row}>
              <span class={styles.rowText}>
                <span>Mínimo</span>
                <span class={styles.foot}>No se baja de tu gasto en reposo × 1,1</span>
              </span>
              <b>{formatInt(c.suelo)}</b>
            </li>
          )}
          {delEntrenador !== 0 && (
            <li class={styles.row}>
              <span class={styles.rowText}>
                <span>Cambios que aceptaste</span>
                <span class={styles.foot}>Del entrenador, en el historial</span>
              </span>
              <b>
                {delEntrenador > 0 ? '+' : '−'}
                {formatInt(Math.abs(delEntrenador))}
              </b>
            </li>
          )}
        </ul>
        {a.aMano && (
          <p class={styles.note}>
            Fijado a mano en {formatInt(a.kcal)} kcal (el cálculo da {formatInt(c.kcal)}).{' '}
            <button type="button" class={styles.link} onClick={() => void volverAlCalculo()}>
              Volver al cálculo
            </button>
          </p>
        )}
      </section>

      <RevisionCard onVer={pendiente.value ? sugerencia.show : null} />

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

      {fase.open && <FaseHoja onClose={fase.close} />}
      {mano.open && <ManoHoja onClose={mano.close} avisar={avisar} />}
      {datos.open && <DatosHoja onClose={datos.close} />}
      {sugerencia.open && <SugerenciaHoja onClose={sugerencia.close} avisar={avisar} />}
      <Toast message={aviso?.texto ?? null} action={aviso?.accion ?? null} />
    </div>
  )
}

function Volver() {
  return (
    <header class={styles.bar}>
      <RoundButton label="Volver a Tu plan" variant="plain" href={`${paths.nutrition}?vista=plan`}>
        <ChevronLeftIcon />
      </RoundButton>
      <h1 class={styles.barTitle}>Tu objetivo</h1>
      <span />
    </header>
  )
}
