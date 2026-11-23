import { useState } from 'preact/hooks'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { hoy, PREGUNTAS, sensaciones, type Respuesta, type Sensaciones } from '../../state/progreso.ts'
import { apuntarSensaciones } from '../../use-cases/progress.ts'
import styles from './HoyDeProgreso.module.css'

type Props = { onClose: () => void; avisar: (texto: string) => void }

/** ¿Cómo estás hoy? Cinco preguntas, cada una con sus tres respuestas; «Listo» lo guarda (se puede dejar alguna sin contestar). */
export function SensacionesHoja({ onClose, avisar }: Props) {
  const deHoy = sensaciones.value.find((s) => s.date === hoy.value)
  const [respuestas, setRespuestas] = useState<Sensaciones>(deHoy ?? { date: hoy.value })

  async function guardar() {
    await apuntarSensaciones(respuestas)
    onClose()
    avisar('Apuntado. Lo ves en Progreso')
  }

  return (
    <Sheet
      title="¿Cómo estás hoy?"
      onClose={onClose}
      footer={<Button onClick={() => void guardar()}>Listo</Button>}
    >
      <div class={styles.preguntas}>
        {PREGUNTAS.map((p) => (
          <div key={p.id} class={styles.pregunta}>
            <ChoiceSegmented<string>
              name={`sensacion-${p.id}`}
              legend={p.pregunta}
              showLegend
              options={p.opciones.map((o, i) => ({ value: String(i), label: o }))}
              value={respuestas[p.id] === undefined ? '' : String(respuestas[p.id])}
              onChange={(v) => setRespuestas({ ...respuestas, [p.id]: Number(v) as Respuesta })}
            />
          </div>
        ))}
      </div>
    </Sheet>
  )
}
