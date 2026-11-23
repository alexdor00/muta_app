import { formatDayDate } from '../../../../shared/lib/format.ts'
import { ajustes, dieta, enRecarga, hoy, recargaActiva } from '../../state/comida.ts'
import { empezarRecargaYa, terminarRecarga, volverARecarga } from '../../use-cases/target.ts'
import type { Aviso } from '../comun/useAviso.ts'
import styles from './Objetivo.module.css'

/**
 * La recarga de hidratos cuando tú lo decides (usuario, 2026-11-22), en «Cambiar objetivo»: solo en definición y sin dieta. Si la
 * llevas, hasta cuándo y «Terminar»; si no, «Empezar». Las dos, con «Deshacer».
 */
export function FilaRecarga({ avisar }: { avisar: (t: string, a?: Aviso['accion']) => void }) {
  const a = ajustes.value
  if (!a || a.fase !== 'definicion' || dieta.value) return null
  const r = recargaActiva(a)
  const enCurso = r && enRecarga(r, hoy.value) ? r : null
  const hacer = async () => {
    const antes = enCurso ? await terminarRecarga() : await empezarRecargaYa()
    avisar(enCurso ? 'Recarga terminada: vuelves a tu definición' : 'Recarga de hidratos empezada', {
      label: 'Deshacer',
      onClick: () => void volverARecarga(antes),
    })
  }
  return (
    <ul class={styles.lista}>
      <li class={styles.filaLista}>
        <span class={styles.rowText}>
          <span class={styles.filaNombre}>Recarga de hidratos</span>
          <span class={styles.foot}>
            {enCurso
              ? `Hasta el ${formatDayDate(enCurso.hasta)}: los días que entrenas, mantenimiento con más hidratos.`
              : 'Una vuelta de tu rutina: los días que entrenas, mantenimiento con más hidratos; los demás, tu definición.'}
          </span>
        </span>
        <button type="button" class={styles.botonFila} onClick={() => void hacer()}>
          {enCurso ? 'Terminar' : 'Empezar'}
        </button>
      </li>
    </ul>
  )
}
