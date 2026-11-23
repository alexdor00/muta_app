import { useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import type { DetalleMeso } from '../../../training/index.ts'
import { empezarOtro, renombrar, volverAUsar } from '../../use-cases/mesocycles.ts'
import propios from '../mesociclo/Mesociclo.module.css'
import styles from './Progreso.module.css'

/**
 * Lo que se hace con una etapa (en su hoja): la de ahora se renombra y se cierra con «Empezar otra etapa» (con el balance de
 * la que se cierra); una anterior, «Volver a usar esta rutina». Sus hojas, en `HojasEtapa` (en la pantalla: abrir una
 * cierra la de la etapa y atrás vuelve a ella).
 */
export function AccionesEtapa({ d }: { d: DetalleMeso }) {
  const nombre = useSheet('nombre')
  const otro = useSheet('nuevo')
  const reusar = useSheet('volver')
  return (
    <div class={styles.acciones}>
      {d.meso.enCurso ? (
        <>
          <Button variant="secondary" onClick={() => otro.show()}>
            Empezar otra etapa
          </Button>
          <button type="button" class={styles.accion} onClick={() => nombre.show()}>
            Renombrar esta etapa
          </button>
        </>
      ) : (
        <Button variant="secondary" onClick={() => reusar.show()}>
          Volver a usar esta rutina
        </Button>
      )}
    </div>
  )
}

/** Las hojas de `AccionesEtapa`: renombrar, empezar otra y volver a usar la rutina. */
export function HojasEtapa({ d, avisar }: { d: DetalleMeso; avisar: (texto: string) => void }) {
  const { route } = useLocation()
  const nombre = useSheet('nombre')
  const otro = useSheet('nuevo')
  const reusar = useSheet('volver')
  const alInicio = (texto: string) => {
    avisar(texto)
    route(paths.progress, true)
  }
  return (
    <>
      {nombre.open && <NombreHoja d={d} onClose={nombre.close} avisar={avisar} />}
      {otro.open && (
        <NuevoHoja
          d={d}
          onClose={otro.close}
          onHecho={() => alInicio('La etapa nueva empieza hoy')}
          avisar={avisar}
        />
      )}
      {reusar.open && (
        <VolverHoja
          d={d}
          onClose={reusar.close}
          onHecho={() => alInicio('Vuelves a esta rutina desde hoy')}
          avisar={avisar}
        />
      )}
    </>
  )
}

type Hoja = { d: DetalleMeso; onClose: () => void; avisar: (texto: string) => void }

function NombreHoja({ d, onClose, avisar }: Hoja) {
  const [texto, setTexto] = useState(d.meso.nombre)
  async function guardar() {
    if (!(await renombrar(d.meso.id, texto))) return avisar('Escribe un nombre')
    onClose()
    avisar('Nombre cambiado')
  }
  return (
    <Sheet
      title="Nombre de la etapa"
      onClose={onClose}
      footer={<Button onClick={() => void guardar()}>Guardar</Button>}
    >
      <label class={styles.campo}>
        <span class={propios.oculto}>Nombre</span>
        <input
          class={propios.texto}
          aria-label="Nombre de la etapa"
          maxLength={40}
          value={texto}
          onInput={(e) => setTexto(e.currentTarget.value)}
        />
      </label>
    </Sheet>
  )
}

/** Empezar otra etapa con tu rutina: el balance de la que se cierra, su nombre y qué pasa con lo de ahora. */
function NuevoHoja({ d, onClose, onHecho, avisar }: Hoja & { onHecho: () => void }) {
  const [texto, setTexto] = useState('')
  async function empezar() {
    if (!(await empezarOtro(texto))) return avisar('No se pudo empezar: inténtalo otra vez')
    // Sin cerrar la hoja (sería un «atrás»): se va a Progreso en su lugar
    onHecho()
  }
  return (
    <Sheet
      title="Empezar otra etapa"
      onClose={onClose}
      large
      footer={<Button onClick={() => void empezar()}>Empezar hoy</Button>}
    >
      <div class={styles.hoja}>
        <p class={`${styles.sub} ${styles.justificado}`}>
          «{d.meso.nombre}» se archiva con todas sus sesiones y su rutina: nada se borra. El nuevo sigue con
          tu rutina de ahora. Para cambiar de rutina, elígela en Entreno: la etapa cambia sola.
        </p>
        {d.balance.length > 0 && (
          <>
            <h3 class={styles.subtitulo}>Balance de «{d.meso.nombre}»</h3>
            <ul class={styles.frases}>
              {d.balance.map((b) => (
                <li key={b.texto}>{b.texto}</li>
              ))}
            </ul>
            <p class={styles.nota}>
              No hace falta subir en todo: mantener la mayoría y subir en algunos es buen progreso. «Casi
              todo» (8 de cada 10), sugerido.
            </p>
          </>
        )}
        <label class={styles.campo}>
          <span class={propios.oculto}>Nombre</span>
          <input
            class={propios.texto}
            aria-label="Nombre de la etapa nueva"
            maxLength={40}
            placeholder="Nombre (opcional)"
            value={texto}
            onInput={(e) => setTexto(e.currentTarget.value)}
          />
        </label>
      </div>
    </Sheet>
  )
}

/** Volver a usar la rutina de un mesociclo archivado: el de ahora se archiva y empieza hoy otro con ella. */
function VolverHoja({ d, onClose, onHecho, avisar }: Hoja & { onHecho: () => void }) {
  async function volverYa() {
    if (!(await volverAUsar(d.meso.id))) return avisar('No se pudo: este mesociclo no guardó su rutina')
    // Sin cerrar la hoja (sería un «atrás»): se va a Progreso en su lugar
    onHecho()
  }
  return (
    <Sheet
      title="Volver a usar esta rutina"
      onClose={onClose}
      footer={<Button onClick={() => void volverYa()}>Volver a esta rutina</Button>}
    >
      <p class={`${styles.sub} ${styles.justificado}`}>
        Tu plan pasa a ser «{d.meso.rutina}» tal como la dejaste en «{d.meso.nombre}», con tus cambios. La
        etapa de ahora se archiva con todo y empieza hoy otra.
      </p>
    </Sheet>
  )
}
