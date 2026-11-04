// Mover la pantalla de la sesión hasta lo que toca (tras pintar): un ejercicio arriba o la serie siguiente a la vista.

/** Sube el ejercicio en ese puesto de hoy (1 = el primero) al principio de la pantalla. */
export function irAEjercicio(puesto: number): void {
  requestAnimationFrame(() =>
    document.getElementById(`ejercicio-${puesto}`)?.closest('section')?.scrollIntoView({ block: 'start' }),
  )
}

/** Deja a la vista la serie `numero` (1 = la primera) del ejercicio abierto. */
export function irASerie(numero: number): void {
  requestAnimationFrame(() =>
    document
      .querySelector(`[aria-label="Kilos de la serie ${numero}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
  )
}
