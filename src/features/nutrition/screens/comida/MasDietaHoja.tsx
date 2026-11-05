import { useState } from 'preact/hooks'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { dieta } from '../../state/comida.ts'
import { dejar, guardarComoArchivo, renombrarDieta } from '../../use-cases/diet.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Props = {
  onClose: () => void
  /** Cambiar a otra dieta: desde un archivo, la de ejemplo o una tuya nueva (se ve antes de empezar). */
  onArchivo: () => void
  onEjemplo: () => void
  onPropia: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

/** Tu dieta: su nombre, guardarla como archivo (con lo que has editado), cambiar de dieta o dejarla. */
export function MasDietaHoja({ onClose, onArchivo, onEjemplo, onPropia, avisar }: Props) {
  const a = dieta.value
  const [nombre, setNombre] = useState(a?.dieta.nombre ?? '')
  const [seguro, setSeguro] = useState(false)
  if (!a) return null
  return (
    <Sheet title="Tu dieta" onClose={onClose} large>
      <div class={h.stack}>
        <label class={h.field}>
          Nombre
          <input
            value={nombre}
            onInput={(e) => setNombre(e.currentTarget.value)}
            onBlur={() => void renombrarDieta(nombre)}
          />
        </label>
        <Button
          variant="secondary"
          onClick={async () => {
            await guardarComoArchivo()
            avisar('Dieta guardada como archivo')
          }}
        >
          Guardar como archivo
        </Button>
        <p class={h.foot}>Con tus recetas tal como las tienes: para compartirla o volver a cargarla.</p>
        <span class={h.eyebrow}>Cambiar de dieta</span>
        <Button variant="secondary" onClick={onArchivo}>
          Cargar un archivo de dieta
        </Button>
        <Button variant="secondary" onClick={onPropia}>
          Empezar una mía desde cero
        </Button>
        <Button variant="secondary" onClick={onEjemplo}>
          La dieta de ejemplo
        </Button>
        <span class={h.eyebrow}>Dejarla</span>
        {seguro ? (
          <>
            <p class={h.warn}>
              ¿Dejar «{a.dieta.nombre}»? Lo que has apuntado se queda y vuelve tu objetivo de kcal. Si no la
              has guardado como archivo, sus cambios se pierden.
            </p>
            <Button
              onClick={async () => {
                await dejar()
                onClose()
                avisar('Has dejado la dieta: vuelve tu objetivo')
              }}
            >
              Dejar la dieta
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => setSeguro(true)}>
            Dejar la dieta
          </Button>
        )}
      </div>
    </Sheet>
  )
}
