// El recetario (src/shared/content/recetario, subido por decisión del usuario el 2026-11-06): recetario.json con las recetas y una foto por receta. Lo
// generan private/herramientas/recetario*.mjs desde el documento original; ver docs/datos.md.

const archivo = import.meta.glob<unknown>('/src/shared/content/recetario/recetario.json', {
  import: 'default',
})
const fotos = import.meta.glob<string>('/src/shared/content/recetario/fotos/*.webp', {
  query: '?url',
  import: 'default',
  eager: true,
})

// Con VITE_NO_LOCAL_PROGRAMS (recorridos de prueba, CI y Vitest) no se carga, igual que las rutinas locales.
const enabled = !import.meta.env.VITE_NO_LOCAL_PROGRAMS

/** El recetario tal cual está en el archivo (la forma la comprueba quien lo usa); null si no hay. */
export async function readLocalRecipes(): Promise<unknown> {
  const load = enabled ? Object.values(archivo)[0] : undefined
  return load ? load() : null
}

/** La foto de una receta del recetario por su número («51» → su .webp); null si no hay. */
export function localRecipePhoto(numero: number): string | null {
  if (!enabled) return null
  const n = String(numero).padStart(2, '0')
  return fotos[`/src/shared/content/recetario/fotos/${n}.webp`] ?? null
}
