import { useState } from 'preact/hooks'
import { formatDecimal, parseDecimal } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { ajustesCuerpo, composicion } from '../../state/progreso.ts'
import { calibrar, quitarCalibracion } from '../../use-cases/progress.ts'
import styles from './Progreso.module.css'

type Props = { onClose: () => void; avisar: (texto: string) => void }

/** Calibrar tu % de grasa con una medida real (DEXA, bioimpedancia buena, pliegues): se guarda la diferencia. */
export function CalibrarHoja({ onClose, avisar }: Props) {
  const antes = ajustesCuerpo.value.calibracion
  const [texto, setTexto] = useState(antes ? formatDecimal(antes.medido) : '')
  const c = composicion.value

  async function guardar() {
    const n = parseDecimal(texto)
    if (n === null || n <= 3 || n >= 60) return avisar('Escribe un porcentaje entre 3 y 60')
    if (!c) return avisar('Primero apunta tus medidas')
    await calibrar(n, c.bruta)
    onClose()
    avisar('Calibrado: tus estimaciones se ajustan a tu medida')
  }

  return (
    <Sheet
      title="Calibrar tu grasa"
      onClose={onClose}
      footer={<Button onClick={() => void guardar()}>Calibrar</Button>}
    >
      <div class={styles.hoja}>
        <p class={`${styles.sub} ${styles.justificado}`}>
          Si te has medido con DEXA, una bioimpedancia buena o pliegues, apunta el resultado. Todas tus
          estimaciones se ajustan con esa diferencia y el rango se estrecha a ±2 puntos.
        </p>
        <label class={styles.campo}>
          <span>% de grasa medido</span>
          <input
            inputMode="decimal"
            aria-label="% de grasa medido"
            value={texto}
            placeholder="14,5"
            onInput={(e) => setTexto(e.currentTarget.value)}
          />
          <span class={styles.nota}>%</span>
        </label>
        {antes && (
          <button
            type="button"
            class={styles.accion}
            onClick={() => {
              void quitarCalibracion()
              onClose()
              avisar('Calibración quitada')
            }}
          >
            Quitar la calibración
          </button>
        )}
      </div>
    </Sheet>
  )
}
