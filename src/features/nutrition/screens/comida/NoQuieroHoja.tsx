import { useState } from 'preact/hooks'
import { Button } from '../../../../shared/ui/Button.tsx'
import { CloseIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { menu } from '../../state/recetas.ts'
import { cambiarNoQuiero } from '../../use-cases/plan.ts'
import h from '../comun/Hojas.module.css'
import p from './PlanHojas.module.css'

/**
 * Alimentos que no quieres (usuario, 2026-11-18): MUTA no los propone ni los pone al cambiar un plato; si tu dieta cargada
 * los lleva, te lo dice y no la toca. No es una lista de alergias.
 */
export function NoQuieroHoja({ onClose }: { onClose: () => void }) {
  const [texto, setTexto] = useState('')
  const lista = menu.value.noQuiero ?? []
  const anadir = () => {
    const x = texto.trim()
    if (!x) return
    setTexto('')
    void cambiarNoQuiero([...lista, x])
  }
  return (
    <Sheet
      title="Alimentos que no quieres"
      onClose={onClose}
      footer={<Button onClick={onClose}>Listo</Button>}
    >
      <form
        class={h.searchRow}
        onSubmit={(e) => {
          e.preventDefault()
          anadir()
        }}
      >
        <label class={h.search}>
          <input
            type="text"
            placeholder="Champiñones, atún…"
            aria-label="Un alimento que no quieres"
            value={texto}
            onInput={(e) => setTexto(e.currentTarget.value)}
          />
        </label>
        <button type="submit" class={h.textButton}>
          Añadir
        </button>
      </form>
      {lista.length ? (
        <div class={h.chips}>
          {lista.map((x) => (
            <button
              key={x}
              type="button"
              class={`${h.chip} ${p.quitar}`}
              aria-label={`Quitar ${x}`}
              onClick={() => void cambiarNoQuiero(lista.filter((y) => y !== x))}
            >
              {x} <CloseIcon />
            </button>
          ))}
        </div>
      ) : (
        <p class={p.nota}>Ninguno. MUTA no te propondrá platos que los lleven.</p>
      )}
      <p class={p.nota}>No es para alergias: revisa siempre las etiquetas.</p>
    </Sheet>
  )
}
