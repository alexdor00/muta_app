import { useEffect, useState } from 'preact/hooks'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { copia } from '../../state/copia.ts'
import { cargarCopia, guardarCopia, posponerCopia } from '../../use-cases/copia.ts'
import styles from './CopiaDeSeguridad.module.css'

/**
 * El cuadro al abrir la app, una vez al mes (usuario, 2026-11-24: «que al iniciar la aplicación te salga un cuadro»):
 * «Haz tu copia de seguridad» con «Guardar ahora» y «Ahora no» (otro mes). Sin ninguna copia, a la semana de empezar.
 * `activo`: no sale en la bienvenida ni durante una sesión de entreno.
 */
export function AvisoCopia({ activo }: { activo: boolean }) {
  const [cerrado, setCerrado] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  useEffect(() => void cargarCopia(), [])
  const c = copia.value
  if (!activo || cerrado || !c?.toca) return null
  const ahoraNo = () => {
    setCerrado(true)
    void posponerCopia()
  }
  async function guardar() {
    setOcupado(true)
    const r = await guardarCopia()
    setOcupado(false)
    if (r === 'guardada') setCerrado(true)
  }
  return (
    <Sheet title="Haz tu copia de seguridad" onClose={ahoraNo}>
      <p class={styles.texto}>
        Para no perder tus entrenos, tu comida y tus fotos si cambias de móvil o algo falla.
      </p>
      <div class={styles.botones}>
        <Button onClick={() => void guardar()} disabled={ocupado}>
          Guardar ahora
        </Button>
        <Button variant="secondary" onClick={ahoraNo}>
          Ahora no
        </Button>
      </div>
    </Sheet>
  )
}
