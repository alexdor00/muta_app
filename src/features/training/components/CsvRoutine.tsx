import { useState } from 'preact/hooks'
import { Button } from '../../../shared/ui/Button.tsx'
import { MoonIcon, PlusIcon } from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import styles from './CsvRoutine.module.css'

/** La tarjeta de abajo en Elegir rutina: cargar tu rutina desde un CSV y descargar la plantilla. */
export function CsvRoutineCard(props: {
  plantilla: string
  onArchivo: (nombre: string, texto: string) => void
}) {
  return (
    <section class={styles.card} aria-labelledby="tu-propia-rutina">
      <h2 id="tu-propia-rutina" class={styles.title}>
        ¿Tienes tu propia rutina?
      </h2>
      <p class={styles.text}>
        Cárgala desde un CSV: una fila por ejercicio con su sesión, series, repeticiones, RIR y descanso.
      </p>
      <label class={styles.load}>
        <PlusIcon />
        Cargar desde CSV
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={async (e) => {
            const input = e.currentTarget
            const archivo = input.files?.[0]
            if (archivo) props.onArchivo(archivo.name.replace(/\.csv$/i, ''), await archivo.text())
            input.value = ''
          }}
        />
      </label>
      <a
        class={styles.template}
        href={`data:text/csv;charset=utf-8,${encodeURIComponent(props.plantilla)}`}
        download="rutina-plantilla.csv"
      >
        Descargar plantilla
      </a>
    </section>
  )
}

/** Un día de tu rutina en la vista previa: una sesión con cuántos ejercicios, o un descanso. */
export type DiaCsv = { nombre: string; ejercicios: number } | { descanso: true }

/**
 * La hoja tras elegir el CSV: si hay errores, cuáles (con su fila) y elegir otro; si no, el nombre de tu rutina, sus días y
 * «Empezar esta rutina».
 */
export function CsvRoutineSheet(props: {
  nombre: string
  errores: string[]
  dias: DiaCsv[]
  resumen: string
  onEmpezar: (nombre: string) => void
  onClose: () => void
}) {
  const [nombre, setNombre] = useState(props.nombre)
  if (props.errores.length) {
    return (
      <Sheet title="No se pudo leer el CSV" onClose={props.onClose} large>
        <p class={styles.text}>Arréglalo en el archivo y vuelve a cargarlo:</p>
        <ul class={styles.errors}>
          {props.errores.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
        <Button variant="secondary" onClick={props.onClose}>
          Entendido
        </Button>
      </Sheet>
    )
  }
  return (
    <Sheet
      title="Tu rutina"
      onClose={props.onClose}
      large
      footer={<Button onClick={() => props.onEmpezar(nombre)}>Empezar esta rutina</Button>}
    >
      <label class={styles.field}>
        Nombre
        <input value={nombre} maxLength={40} onInput={(e) => setNombre(e.currentTarget.value)} />
      </label>
      <p class={styles.text}>{props.resumen}</p>
      <ol class={styles.days} aria-label="Tu semana">
        {props.dias.map((d, i) =>
          'descanso' in d ? (
            <li key={i} class={styles.rest}>
              <MoonIcon />
              Descanso
            </li>
          ) : (
            <li key={i}>
              <b>{d.nombre}</b>
              <span>{d.ejercicios === 1 ? '1 ejercicio' : `${d.ejercicios} ejercicios`}</span>
            </li>
          ),
        )}
      </ol>
    </Sheet>
  )
}
