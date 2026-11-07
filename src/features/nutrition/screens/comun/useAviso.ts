import { useLocation } from 'preact-iso'
import { useEffect, useState } from 'preact/hooks'

export type Aviso = { texto: string; accion?: { label: string; onClick: () => void } }

/**
 * Aviso corto abajo (4 s, como «Deshacer» en Entreno). Si abres otra hoja, se quita: si no, se queda encima de ella y tapa
 * lo que hay (cerrar una hoja no lo quita, porque «Deshacer» suele llegar justo al cerrarla).
 */
export function useAviso() {
  const { query } = useLocation()
  const [aviso, setAviso] = useState<(Aviso & { hoja?: string }) | null>(null)
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(t)
  }, [aviso])
  useEffect(() => {
    if (aviso && query.hoja && query.hoja !== aviso.hoja) setAviso(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar de hoja
  }, [query.hoja])
  return {
    aviso,
    avisar: (texto: string, accion?: Aviso['accion']) => setAviso({ texto, accion, hoja: query.hoja }),
    quitar: () => setAviso(null),
  }
}
