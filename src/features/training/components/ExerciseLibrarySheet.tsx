import { ChevronRightIcon, PlusIcon, SearchIcon } from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import styles from './ExerciseLibrarySheet.module.css'

type Props<M extends string> = {
  /** «Biblioteca de ejercicios» (ver) o «Elegir ejercicio» (añadir o cambiar en la sesión). */
  title: string
  query: string
  onQuery: (query: string) => void
  /** Músculos del filtro, en su orden; `muscle` es el elegido (null: todos). */
  muscles: { id: M; label: string }[]
  muscle: M | null
  onMuscle: (id: M | null) => void
  /** Ejercicios que coinciden: nombre y «Pecho, barra»; los que no se hacen con tu material van al final, en gris. */
  rows: { id: string; name: string; line: string; noTienes?: boolean }[]
  /** Con `hrefOf`, cada fila lleva a su ficha (›); con `onPick`, se elige (+). */
  hrefOf?: (id: string) => string
  onPick?: (id: string) => void
  onClose: () => void
}

/**
 * Biblioteca de ejercicios (A16) y «Elegir ejercicio» (C19): buscador, filtro por músculo (tocar otra vez lo quita) y la
 * lista.
 */
export function ExerciseLibrarySheet<M extends string>({
  title,
  query,
  onQuery,
  muscles,
  muscle,
  onMuscle,
  rows,
  hrefOf,
  onPick,
  onClose,
}: Props<M>) {
  const contenido = (r: Props<M>['rows'][number]) => (
    <>
      <span class={styles.text}>
        <span class={styles.name}>{r.name}</span>
        <span class={styles.line}>{r.line}</span>
      </span>
      <span class={styles.chevron}>{onPick ? <PlusIcon /> : <ChevronRightIcon />}</span>
    </>
  )
  const lista = (rs: Props<M>['rows'], clase = '') => (
    <ul class={`${styles.list} ${clase}`}>
      {rs.map((r) => (
        <li key={r.id}>
          {onPick ? (
            <button type="button" class={styles.row} onClick={() => onPick(r.id)}>
              {contenido(r)}
            </button>
          ) : (
            <a class={styles.row} href={hrefOf?.(r.id)}>
              {contenido(r)}
            </a>
          )}
        </li>
      ))}
    </ul>
  )
  return (
    <Sheet title={title} onClose={onClose} large>
      <label class={styles.search}>
        <SearchIcon />
        <input
          class={styles.input}
          type="search"
          placeholder="Buscar: press, curl, remo…"
          aria-label="Buscar ejercicio"
          autocomplete="off"
          value={query}
          onInput={(event) => onQuery(event.currentTarget.value)}
        />
      </label>
      <div class={styles.chips} role="group" aria-label="Músculo">
        {muscles.map((m) => (
          <button
            key={m.id}
            type="button"
            class={`${styles.chip} ${muscle === m.id ? styles.on : ''}`}
            aria-pressed={muscle === m.id}
            onClick={() => onMuscle(muscle === m.id ? null : m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
      {rows.length ? (
        <>
          {lista(rows.filter((r) => !r.noTienes))}
          {rows.some((r) => r.noTienes) && (
            <>
              <h3 class={styles.section}>No está en tu material</h3>
              {lista(
                rows.filter((r) => r.noTienes),
                styles.dim,
              )}
            </>
          )}
        </>
      ) : (
        <p class={styles.empty}>Sin resultados.</p>
      )}
    </Sheet>
  )
}
