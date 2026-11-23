import { useState } from 'preact/hooks'
import { formatDecimal, formatMonthName, formatShortDate } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { ChevronRightIcon, PlayIcon } from '../../../../shared/ui/icons.tsx'
import {
  enEtapa,
  fotos,
  fotosPorMes,
  hoy,
  mesComoTramo,
  otroMes,
  POSES,
  serieDeMedida,
  type FotoVista,
  type Pose,
} from '../../state/progreso.ts'
import { cambioTexto, valorTexto } from './formato.ts'
import { FilaHoja, Grafica, TituloSeccion } from './Piezas.tsx'
import styles from './Progreso.module.css'

/** «ago 2026» o, si es del mismo año que `otro`, «ago». */
const mesCorto = (mes: string, otro: string) =>
  `${formatMonthName(mes).slice(0, 3).toLowerCase()}${mes.slice(0, 4) === otro.slice(0, 4) ? '' : ` ${mes.slice(0, 4)}`}`

/** Un número con un decimal como mucho, sin unidad. */
const numero = (n: number) => formatDecimal(Math.round(n * 10) / 10)

/** El cambio con su flecha: «↓ 0,6 kg», «=»; nada si no hay con qué comparar. */
function flecha(cambio: number | null, unidad: string) {
  if (cambio === null) return ''
  const r = Math.round(cambio * 10) / 10
  if (r === 0) return '='
  return (
    <>
      <span class={styles.oculto}>{r > 0 ? 'sube' : 'baja'}</span>
      <span class={styles.flecha} aria-hidden="true">
        {r > 0 ? '↑' : '↓'}
      </span>{' '}
      {numero(Math.abs(r))} {unidad}
    </>
  )
}

type Props = {
  mes: string
  onFoto: (id: string) => void
  onCambio: (pose: Pose) => void
  onMedida: (id: string) => void
  onComposicion: () => void
  onMedir: () => void
}

/**
 * Cuerpo: tus fotos del mes (frente, lado y espalda) junto a las de un mes de antes, en una sola foto partida por una línea
 * que deslizas; la tira de meses elige el de antes (de serie, el primero). «Ver tu cambio» las pasa mes a mes. Debajo, tus
 * medidas en una lista plana (antes → ahora y el cambio; tocar una, su gráfica) y, en el de ahora, tu composición.
 */
export function Cuerpo({ mes, onFoto, onCambio, onMedida, onComposicion, onMedir }: Props) {
  const [pose, setPose] = useState<Pose>('frente')
  const [elegidoAntes, setElegidoAntes] = useState<string | null>(null)
  const meses = fotosPorMes(fotos.value, pose).filter((x) => x.mes <= mes)
  const ahora = meses.find((x) => x.mes === mes)?.foto ?? null
  const anteriores = meses.filter((x) => x.mes < mes)
  const antes = (anteriores.find((x) => x.mes === elegidoAntes) ?? anteriores[0])?.foto ?? null
  const esteMes = mes === hoy.value.slice(0, 7)
  const cuerpo = enEtapa(mesComoTramo(mes)).cuerpo
  const anterior = formatMonthName(otroMes(mes, -1)).toLowerCase()
  const nombrePose = POSES.find((p) => p.id === pose)?.nombre ?? ''
  const primerMes = antes ? mesCorto(antes.date.slice(0, 7), mes) : null
  return (
    <>
      <section class={styles.bloque} aria-labelledby="cuerpo-fotos">
        <TituloSeccion
          id="cuerpo-fotos"
          titulo="Tus fotos"
          dato={ahora && primerMes ? `${primerMes} → ${mesCorto(mes, mes)}` : null}
        />
        <ChoiceSegmented
          name="pose"
          legend="Postura"
          options={POSES.map((p) => ({ value: p.id, label: p.nombre }))}
          value={pose}
          onChange={setPose}
        />
        {ahora && antes ? (
          <Comparar antes={antes} ahora={ahora} mes={mes} pose={nombrePose} />
        ) : ahora ? (
          <button type="button" class={styles.fotoSola} onClick={() => onFoto(ahora.id)}>
            <img src={ahora.url} alt={`${nombrePose} de ${formatMonthName(mes).toLowerCase()}`} />
          </button>
        ) : (
          <p class={styles.sub}>
            {esteMes
              ? `Aún sin foto de ${nombrePose.toLowerCase()} este mes: se hace en Hoy, con tus medidas.`
              : `Ese mes no hiciste foto de ${nombrePose.toLowerCase()}.`}
          </p>
        )}
        {ahora && anteriores.length > 0 && (
          <div class={styles.tira} role="group" aria-label="Comparar con el mes de…" tabIndex={0}>
            {anteriores.map((x) => (
              <button
                key={x.mes}
                type="button"
                class={styles.tiraMes}
                aria-pressed={x.foto.id === antes?.id}
                onClick={() => setElegidoAntes(x.mes)}
              >
                <img src={x.foto.url} alt="" />
                <span>{mesCorto(x.mes, mes)}</span>
              </button>
            ))}
          </div>
        )}
        {ahora && antes && <CambioEntre antes={antes} ahora={ahora} />}
        {meses.length > 1 && (
          <Button onClick={() => onCambio(pose)}>
            <span class={styles.conIcono}>
              <PlayIcon />
              Ver tu cambio
            </span>
          </Button>
        )}
      </section>

      <section class={styles.bloque} aria-labelledby="cuerpo-medidas">
        <TituloSeccion
          id="cuerpo-medidas"
          titulo="Tus medidas"
          dato={cuerpo.some((f) => f.cambio !== null) ? `frente a ${anterior}` : null}
        />
        {cuerpo.length ? (
          <ul class={styles.plana}>
            {cuerpo.map((f) => (
              <li key={f.id}>
                <button type="button" class={styles.filaPlana} onClick={() => onMedida(f.id)}>
                  <span class={styles.filaTexto}>
                    <span class={styles.filaTitulo}>{f.nombre}</span>
                    <span class={styles.filaDetalle}>
                      {f.cambio === null
                        ? valorTexto(f.fin, f.unidad)
                        : `${numero(f.inicio)} → ${valorTexto(f.fin, f.unidad)}`}
                      {f.id === 'peso' ? ' · tendencia' : f.id === 'grasa' ? ' · fórmula de la Marina' : ''}
                    </span>
                  </span>
                  <span class={styles.cambio}>{flecha(f.cambio, f.unidad)}</span>
                  <ChevronRightIcon />
                </button>
              </li>
            ))}
            {esteMes && cuerpo.some((f) => f.id === 'grasa') && (
              <FilaHoja
                titulo="Tu composición"
                detalle="Grasa, masa magra, FFMI y tu objetivo de grasa"
                onClick={onComposicion}
              />
            )}
          </ul>
        ) : (
          <p class={styles.sub}>
            {esteMes ? 'Aún sin medidas ni pesajes este mes.' : 'Ese mes no te mediste ni te pesaste.'}
          </p>
        )}
        {esteMes && (
          <Button variant="secondary" onClick={onMedir}>
            Medidas y fotos de este mes
          </Button>
        )}
      </section>
    </>
  )
}

/** Una sola foto partida por una línea: a la izquierda, la de antes; a la derecha, la de este mes. Se desliza. */
function Comparar(props: { antes: FotoVista; ahora: FotoVista; mes: string; pose: string }) {
  const [corte, setCorte] = useState(50)
  const mesAntes = props.antes.date.slice(0, 7)
  return (
    <div class={styles.comparar} style={{ '--corte': `${corte}%` }}>
      <img src={props.ahora.url} alt={`${props.pose} de ${formatMonthName(props.mes).toLowerCase()}`} />
      <img
        class={styles.compararAntes}
        src={props.antes.url}
        alt={`${props.pose} de ${formatMonthName(mesAntes).toLowerCase()}`}
      />
      <span class={styles.compararLinea} aria-hidden="true" />
      <span class={`${styles.compararEti} ${styles.compararEtiAntes}`} aria-hidden="true">
        {mesCorto(mesAntes, props.mes)}
      </span>
      <span class={`${styles.compararEti} ${styles.compararEtiAhora}`} aria-hidden="true">
        {mesCorto(props.mes, props.mes)}
      </span>
      <input
        type="range"
        class={styles.compararRango}
        min={0}
        max={100}
        value={corte}
        aria-label="Desliza para ver antes y ahora"
        aria-valuetext={`${corte} % de antes`}
        onInput={(ev) => setCorte(Number(ev.currentTarget.value))}
      />
    </div>
  )
}

/** Lo que cambiaste entre las dos fotos: tu peso y tu cintura. */
function CambioEntre({ antes, ahora }: { antes: FotoVista; ahora: FotoVista }) {
  const cuerpo = enEtapa({ desde: antes.date, hasta: ahora.date }).cuerpo
  const partes = (['peso', 'cintura'] as const).flatMap((id) => {
    const f = cuerpo.find((x) => x.id === id)
    return f?.cambio != null ? [`${cambioTexto(f.cambio, f.unidad)} de ${f.nombre.toLowerCase()}`] : []
  })
  if (!partes.length) return null
  return (
    <p class={styles.sub}>
      De {formatMonthName(antes.date).toLowerCase()} a {formatMonthName(ahora.date).toLowerCase()}:{' '}
      <b>{partes.join(' · ')}</b>
    </p>
  )
}

/** La gráfica de una medida de todos los meses hasta el que miras. */
export function MedidaHoja({ id, mes, onClose }: { id: string; mes: string; onClose: () => void }) {
  const f = enEtapa({ desde: null, hasta: `${mes}-31` }).cuerpo.find((x) => x.id === id)
  const puntos = serieDeMedida(id).filter((p) => p.date <= `${mes}-31`)
  if (!f) return null
  return (
    <Sheet title={f.nombre} onClose={onClose} large>
      <div class={styles.hoja}>
        <Grafica
          etiqueta={f.nombre}
          valor={valorTexto(f.fin, f.unidad)}
          texto={(v) => valorTexto(v, f.unidad)}
          cambio={f.cambio === null ? null : `${cambioTexto(f.cambio, f.unidad)} desde el principio`}
          fecha={puntos.at(-1) ? formatShortDate(puntos.at(-1)?.date ?? '') : null}
          puntos={puntos}
          resumen={`${f.nombre}: de ${valorTexto(f.inicio, f.unidad)} a ${valorTexto(f.fin, f.unidad)}`}
        />
        {puntos.length < 2 && <p class={styles.sub}>Con más medidas verás aquí cómo cambia.</p>}
      </div>
    </Sheet>
  )
}
