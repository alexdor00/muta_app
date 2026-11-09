import { formatChange, formatDayDate, formatInt } from '../../../../shared/lib/format.ts'
import {
  consejosSemana,
  MESETAS_PARON,
  pendiente,
  recargaPropuesta,
  revisionDeHoy,
  SUBIDA_MESETA,
} from '../../state/comida.ts'
import { descartarRecarga, empezarRecarga } from '../../use-cases/target.ts'
import styles from './Objetivo.module.css'

const pct = (n: number) => formatChange(n / 100, 2)

/** Qué dice hoy la revisión semanal: la sugerencia que espera, o en vivo lo que falta o cómo vas. */
export function RevisionCard({ onVer }: { onVer: (() => void) | null }) {
  const p = pendiente.value
  const r = revisionDeHoy.value
  let texto = 'Cada semana miro tu peso y lo que comes. Si hace falta, te propongo un cambio y tú decides.'
  if (p) texto = `${p.texto}: te propongo ${formatInt(p.a)} kcal en lugar de ${formatInt(p.de ?? 0)}.`
  else if (r?.tipo === 'faltan') {
    const partes = [
      r.faltanPesajes
        ? `${r.faltanPesajes} ${r.faltanPesajes === 1 ? 'pesaje' : 'pesajes'} más (llevas ${r.pesajes} en 14 días)`
        : '',
      r.faltanDias
        ? `${r.faltanDias} ${r.faltanDias === 1 ? 'día' : 'días'} más de comida apuntada (llevas ${r.dias} en 4 semanas)`
        : '',
    ].filter(Boolean)
    texto = `Para revisar tu semana me faltan ${partes.join(' y ')}.`
  } else if (r?.tipo === 'cumplir')
    texto = `Comes el ${Math.round(r.cumplido * 100)} % de tu objetivo: primero, comer lo que marca el plan; después vemos si hay que cambiarlo.`
  else if (r?.tipo === 'bien') texto = `Vas al ritmo previsto (${pct(r.pct)} por semana). No toco nada.`
  else if (r?.tipo === 'esperar')
    texto = `Dejo 10 días entre cambios para ver su efecto: vuelvo a mirar en ${r.dias} ${r.dias === 1 ? 'día' : 'días'}.`
  else if (r?.tipo === 'pasos')
    texto = `Bajas más despacio de lo previsto (${pct(r.pct)} por semana). Antes de comer menos, muévete más: llega al menos a 10.000 pasos al día y, si puedes, a 12.000–15.000, repartidos en varios ratos (ahora, ${formatInt(r.pasos)}). Cámbialo en tus datos cuando lo hagas.`
  else if (r?.tipo === 'progresas')
    texto = `Subes más despacio de lo previsto (${pct(r.pct)} por semana), pero tu fuerza en los básicos ${r.fuerza > 0 ? 'sube' : 'se mantiene'}: no toco las calorías. Antes de comer más, revisa el descanso y tus medidas.`
  else if (r?.tipo === 'meseta')
    texto = `Esperando a que tu peso se estabilice (${pct(r.pct)} por semana) para subir +${SUBIDA_MESETA} kcal en hidratos. Llevas ${r.hechas} ${r.hechas === 1 ? 'meseta' : 'mesetas'}.`
  else if (r?.tipo === 'mesetasHechas')
    texto = `Ya llevas ${MESETAS_PARON} mesetas: ya puedes empezar a definir o seguir subiendo poco a poco.`
  else if (r?.tipo === 'suelo')
    texto = `Ya estás en el mínimo (${formatInt(r.suelo)} kcal): no bajo más. Mejor más pasos o paciencia.`
  return (
    <section class={styles.review} aria-labelledby="revision">
      <div class={styles.reviewHead}>
        <h2 id="revision" class={styles.reviewTitle}>
          Revisión semanal
        </h2>
        {p && <span class={styles.badge}>1 sugerencia</span>}
      </div>
      <p class={styles.sub}>{texto}</p>
      {recargaPropuesta.value && (
        <div class={styles.recarga}>
          <p class={styles.sub}>
            Tu rendimiento baja en varias sesiones y ya llevas semanas en definición: se recomienda una
            recarga de hidratos hasta el {formatDayDate(recargaPropuesta.value.hasta)} (una vuelta de tu
            rutina). Comerás lo de mantenimiento, con todo lo de más en hidratos.
          </p>
          <div class={styles.recargaBotones}>
            <button
              type="button"
              class={styles.see}
              onClick={() => void empezarRecarga(recargaPropuesta.value?.hasta ?? '')}
            >
              Empezar la recarga
            </button>
            <button type="button" class={styles.textButton} onClick={() => void descartarRecarga()}>
              Ahora no
            </button>
          </div>
        </div>
      )}
      {consejosSemana.value.map((c) => (
        <p key={c} class={styles.foot}>
          {c}
        </p>
      ))}
      {p && onVer && (
        <button type="button" class={styles.see} onClick={onVer}>
          Ver la sugerencia
        </button>
      )}
    </section>
  )
}
