import { useEffect, useState } from 'preact/hooks'
import type { SesionEnCurso } from '../../state/sesionEnCurso.ts'

/** El aviso de abajo (4 s) y, si lo lleva, lo que se acaba de borrar para «Deshacer» mientras dura. */
export function useAviso() {
  const [aviso, setAviso] = useState<string | null>(null)
  const [deshacer, setDeshacer] = useState<SesionEnCurso | null>(null)

  useEffect(() => {
    if (!aviso) return setDeshacer(null)
    const t = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(t)
  }, [aviso])

  /** Un aviso normal (sin «Deshacer»). */
  const decir = (texto: string) => {
    setDeshacer(null)
    setAviso(texto)
  }
  return { aviso, setAviso, deshacer, setDeshacer, decir }
}
