import type { ComponentChildren } from 'preact'
import { formatDecimal, formatInt } from '../../../../shared/lib/format.ts'
import { ajustes, calculo } from '../../state/comida.ts'
import { gastoReal } from '../../state/entrenador.ts'
import { aceptadosDesdeElCalculo, volverAlCalculo } from '../../use-cases/target.ts'
import styles from './ComoSeCalcula.module.css'

/** Una línea de la cuenta: su signo, qué es (con su detalle) y su cifra. */
function Linea(props: {
  signo?: string
  que: string
  detalle?: ComponentChildren
  cifra: string
  total?: boolean
}) {
  return (
    <li class={props.total ? styles.total : undefined}>
      <span class={styles.signo} aria-hidden="true">
        {props.signo ?? ''}
      </span>
      <span class={styles.que}>
        <b>{props.que}</b>
        {props.detalle && <small>{props.detalle}</small>}
      </span>
      <span class={styles.cifra}>{props.cifra}</span>
    </li>
  )
}

/**
 * Cómo se calcula tu objetivo, como una cuenta (usuario, 2026-11-19: «ponlo más bonito»): gasto en reposo × tu actividad =
 * lo que gastas, lo que quitas o sumas para tu fase, el mínimo, los cambios que aceptaste y = tu objetivo. Lo usan Tu
 * objetivo (`?ver=calculo`) y la «ⓘ» de tu objetivo.
 */
export function ComoSeCalcula(props: { onDatos?: () => void }) {
  const a = ajustes.value
  const c = calculo.value
  if (!a || !c) return null
  // Con lo aprendido, los cambios que aceptaste ya van dentro de lo que gastas
  const delEntrenador = a.aMano || c.aprendido ? 0 : aceptadosDesdeElCalculo()
  const otroObjetivo = c.aprendido && !a.aMano && c.kcal !== a.kcal
  const kgSemana = Math.round((a.ritmo / 100) * a.cuerpo.pesoKg * 100) / 100
  return (
    <div class={styles.cuenta}>
      <ul>
        {c.aprendido ? (
          // Ya se sabe lo que gastas por tus datos: manda sobre la fórmula (usuario, 2026-11-19)
          <Linea
            que="Lo que gastas"
            detalle={`Aprendido de tus pesajes y tu comida; se actualiza cada semana${gastoReal.value ? ` (estas 2 semanas, ${formatInt(gastoReal.value)} kcal)` : ''}`}
            cifra={formatInt(c.gasto)}
          />
        ) : (
          <>
            <Linea
              que="Gasto en reposo"
              detalle={
                <>
                  {formatDecimal(a.cuerpo.pesoKg)} kg · {a.cuerpo.alturaCm} cm · {a.cuerpo.edad} años
                  {props.onDatos && (
                    <>
                      {' · '}
                      <button type="button" class={styles.enlace} onClick={props.onDatos}>
                        cambiar
                      </button>
                    </>
                  )}
                </>
              }
              cifra={formatInt(c.basal)}
            />
            <Linea
              signo="×"
              que="Tu actividad"
              detalle={`${formatInt(a.pasos)} pasos al día · ${a.diasEntreno} entrenos por semana${a.trabajo && a.trabajo !== 'sentado' ? ` · trabajo ${a.trabajo === 'fisico' ? 'físico' : 'de pie'}` : ''}`}
              cifra={formatDecimal(c.factor)}
            />
            {c.deporte > 0 && (
              <Linea
                signo="+"
                que="Otros deportes"
                detalle={`${a.deporte?.horas ?? 0} h a la semana`}
                cifra={formatInt(c.deporte)}
              />
            )}
            <Linea
              signo="="
              que="Lo que gastas"
              detalle="Estimado al empezar; con 2 semanas de pesajes y comida, lo aprendo de tus datos"
              cifra={formatInt(c.gasto)}
            />
          </>
        )}
        {c.cambio !== 0 && (
          <Linea
            signo={c.cambio < 0 ? '−' : '+'}
            que={
              a.fase === 'definicion'
                ? `Para bajar ${formatDecimal(kgSemana)} kg a la semana`
                : 'Para tu volumen'
            }
            detalle={
              a.fase === 'definicion'
                ? `${formatDecimal(a.ritmo)} % de tu peso · 7.700 kcal por kilo`
                : '0,375 % de tu peso al mes'
            }
            cifra={formatInt(Math.abs(c.cambio))}
          />
        )}
        {c.enSuelo && (
          <Linea que="Mínimo" detalle="No se baja de tu gasto en reposo × 1,1" cifra={formatInt(c.suelo)} />
        )}
        {delEntrenador !== 0 && (
          <Linea
            signo={delEntrenador > 0 ? '+' : '−'}
            que="Cambios que aceptaste"
            detalle="Del entrenador, en el historial"
            cifra={formatInt(Math.abs(delEntrenador))}
          />
        )}
        <Linea
          signo="="
          que={otroObjetivo ? 'Con lo que gastas hoy' : 'Tu objetivo'}
          cifra={`${formatInt(a.aMano || c.aprendido ? c.kcal : a.kcal)} kcal`}
          total
        />
      </ul>
      {otroObjetivo && (
        <p class={styles.nota}>
          Tu objetivo sigue en {formatInt(a.kcal)} kcal: cambia cuando tú lo apliques, en la revisión semanal
          o al cambiar de fase.
        </p>
      )}
      {a.aMano && (
        <p class={styles.nota}>
          Lo tienes fijado a mano en {formatInt(a.kcal)} kcal.{' '}
          <button type="button" class={styles.enlace} onClick={() => void volverAlCalculo()}>
            Volver al cálculo
          </button>
        </p>
      )}
    </div>
  )
}
