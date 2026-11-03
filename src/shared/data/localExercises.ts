// Ejercicios originales de las rutinas locales que no están en la biblioteca de MUTA (private/biblioteca, fuera del
// repositorio; los genera private/herramientas/biblioteca-local.mts con la explicación de su documento).

const archivo = import.meta.glob<unknown[]>('/private/biblioteca/ejercicios.json', {
  import: 'default',
  eager: true,
})

// Con VITE_NO_LOCAL_PROGRAMS (recorridos de prueba y CI) no se cargan, igual que las rutinas locales.
const enabled = !import.meta.env.VITE_NO_LOCAL_PROGRAMS

/** Los ejercicios locales tal cual están en el archivo (la forma la comprueba quien los usa). */
export const LOCAL_EXERCISES: unknown[] = enabled ? (Object.values(archivo)[0] ?? []) : []

const usos = import.meta.glob<Record<string, number>>('/private/biblioteca/usos.json', {
  import: 'default',
  eager: true,
})

/** Cuántas veces sale cada ejercicio (por id) en tus rutinas: la biblioteca enseña primero los más típicos. */
export const LOCAL_USES: Record<string, number> = enabled ? (Object.values(usos)[0] ?? {}) : {}
