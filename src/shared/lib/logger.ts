// Registro de errores. Escribe en consola y avisa a quien escuche
// (app/ conecta el guardado en la base de datos para exportarlo con la copia).

export type LoggedError = { at: string; where: string; message: string; stack?: string }

type Listener = (entry: LoggedError) => void
const listeners = new Set<Listener>()

export function onError(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function logError(error: unknown, where: string): LoggedError {
  const err = error instanceof Error ? error : new Error(String(error))
  const entry: LoggedError = { at: new Date().toISOString(), where, message: err.message, stack: err.stack }
  console.error(`[${where}]`, err)
  for (const listener of listeners) {
    try {
      listener(entry)
    } catch {
      // Un fallo al registrar un error no puede provocar otro.
    }
  }
  return entry
}
