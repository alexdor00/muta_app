import { useEffect, useState } from 'preact/hooks'

export type Aviso = { texto: string; accion?: { label: string; onClick: () => void } }

/** Aviso corto abajo (4 s, como «Deshacer» en Entreno). */
export function useAviso() {
  const [aviso, setAviso] = useState<Aviso | null>(null)
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(t)
  }, [aviso])
  return {
    aviso,
    avisar: (texto: string, accion?: Aviso['accion']) => setAviso({ texto, accion }),
    quitar: () => setAviso(null),
  }
}
