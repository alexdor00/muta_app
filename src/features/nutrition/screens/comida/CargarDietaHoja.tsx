import { useState } from 'preact/hooks'
import { Button } from '../../../../shared/ui/Button.tsx'
import { CheckIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { PLANTILLA_DIETA } from '../../state/dieta.ts'
import { copiarInstruccionesIA } from '../../use-cases/diet.ts'
import styles from './CargarDieta.module.css'

const PASOS = [
  { que: 'Copia las instrucciones', como: 'Con el botón de abajo.' },
  {
    que: 'Pégalas en una IA con tu dieta',
    como: 'ChatGPT, Claude… Debajo, tu dieta o el archivo (Word, PDF, foto).',
  },
  {
    que: 'Guarda su respuesta como .csv',
    como: 'Y elígela aquí: menús, días, cuándo se cocina y todo lo demás.',
  },
]

/**
 * Cargar una dieta (usuario, 2026-11-19: «solo lo primordial»): tres pasos para que una IA la pase al CSV de MUTA, copiar
 * sus instrucciones y elegir el archivo; la plantilla, para quien lo hace a mano.
 */
export function CargarDietaHoja(props: { onClose: () => void; onElegir: () => void }) {
  const [copiado, setCopiado] = useState<boolean | null>(null)
  return (
    <Sheet title="Cargar una dieta" onClose={props.onClose}>
      <div class={styles.hoja}>
        <ol class={styles.pasos}>
          {PASOS.map((x, i) => (
            <li key={x.que}>
              <span class={styles.num} aria-hidden="true">
                {i + 1}
              </span>
              <span class={styles.texto}>
                <b>{x.que}</b>
                <small>{x.como}</small>
              </span>
            </li>
          ))}
        </ol>
        <Button variant="secondary" onClick={async () => setCopiado(await copiarInstruccionesIA())}>
          {copiado && <CheckIcon />}
          {copiado ? 'Instrucciones copiadas' : 'Copiar instrucciones'}
        </Button>
        {copiado === false && <p class={styles.nota}>No se pudo copiar: prueba otra vez.</p>}
        <Button
          onClick={() => {
            props.onClose()
            props.onElegir()
          }}
        >
          Elegir archivo
        </Button>
        <p class={styles.nota}>
          ¿Lo haces tú?{' '}
          <a
            class={styles.plantilla}
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(PLANTILLA_DIETA)}`}
            download="dieta-plantilla.csv"
          >
            Descarga la plantilla
          </a>
          : trae un ejemplo con todas las columnas.
        </p>
      </div>
    </Sheet>
  )
}
