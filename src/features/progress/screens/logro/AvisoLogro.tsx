import { useEffect, useRef, useState } from 'preact/hooks'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { logroAbierto } from '../../state/logro.ts'
import { buscarLogro, type Pendiente } from '../../use-cases/logros.ts'
import { LogroHoja } from './LogroHoja.tsx'

/**
 * Tu logro o tu premio, solo, cuando toca (usuario, 2026-11-24): al abrir la app o al volver a una pestaña, si acabó una
 * etapa, llevas 6 meses con ella o cumpliste tu objetivo. Uno cada vez; «Ahora no» lo deja en la hoja de su etapa.
 * `ruta`: se vuelve a mirar al cambiar de pestaña. `activo`: ni en la bienvenida ni en una sesión.
 */
export function AvisoLogro({ activo, ruta }: { activo: boolean; ruta: string }) {
  const [pendiente, setPendiente] = useState<Pendiente | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  // Uno cada vez (usuario, 2026-11-24): al cerrar uno no sale el siguiente al momento, sino al volver a una pestaña
  const miradaRef = useRef<string | null>(null)
  useEffect(() => {
    if (!activo || pendiente || miradaRef.current === ruta) return
    miradaRef.current = ruta
    let vivo = true
    void buscarLogro().then((p) => {
      if (!vivo || !p) return
      setPendiente(p)
      logroAbierto.value = true
    })
    return () => {
      vivo = false
    }
  }, [activo, ruta, pendiente])
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(t)
  }, [aviso])
  return (
    <>
      {activo && pendiente && (
        <LogroHoja
          pendiente={pendiente}
          avisar={setAviso}
          onClose={() => {
            setPendiente(null)
            logroAbierto.value = false
          }}
        />
      )}
      {/* Solo con mensaje: una zona de avisos vacía siempre puesta chocaría con la de cada pantalla */}
      {aviso && <Toast message={aviso} />}
    </>
  )
}
