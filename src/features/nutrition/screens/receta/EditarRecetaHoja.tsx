import { useEffect, useState } from 'preact/hooks'
import { formatInt, parseDecimal } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { MinusIcon, PlusIcon, SearchIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { Switch } from '../../../../shared/ui/Switch.tsx'
import { base, dieta, type Alimento } from '../../state/comida.ts'
import { recetaComoToca, TIPOS_DIA, type Receta, type TipoDia } from '../../state/dieta.ts'
import {
  borrarReceta,
  conGramos,
  devolverReceta,
  guardarReceta,
  ingredienteDe,
  restaurarReceta,
} from '../../use-cases/diet.ts'
import { buscar, cargarAlimentos } from '../../use-cases/foodLog.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Props = {
  receta: Receta
  tipo: TipoDia
  onTipo: (t: TipoDia) => void
  onClose: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

/**
 * Editar una receta, como Editar rutina: los gramos con − / + (de 5 en 5), quitar o añadir ingredientes desde la base,
 * su nombre y sus pasos. Se guarda solo; si venía en la dieta, se puede volver a como venía.
 */
export function EditarRecetaHoja({ receta, tipo, onTipo, onClose, avisar }: Props) {
  const [buscando, setBuscando] = useState(false)
  const [texto, setTexto] = useState('')
  const [nombre, setNombre] = useState(receta.nombre)
  const [pasos, setPasos] = useState(receta.pasos.join('\n'))
  useEffect(() => {
    if (buscando) void cargarAlimentos()
  }, [buscando])
  const total = recetaComoToca(receta, tipo).total
  const original = dieta.value?.originales[receta.id]

  const guardar = (r: Receta) => void guardarReceta(r)
  const paso = (i: number, g: number) => guardar(conGramos(receta, i, tipo, g))
  const quitarIng = (i: number) => {
    const antes = receta
    guardar({ ...receta, ingredientes: receta.ingredientes.filter((_, k) => k !== i) })
    avisar(`${receta.ingredientes[i].nombre}: quitado`, { label: 'Deshacer', onClick: () => guardar(antes) })
  }
  const anadirIng = (a: Alimento) => {
    guardar({ ...receta, ingredientes: [...receta.ingredientes, ingredienteDe(a, a.servingG)] })
    setBuscando(false)
    setTexto('')
  }

  if (buscando) {
    const lista = texto.trim() ? buscar(texto).slice(0, 25) : []
    return (
      <Sheet title="Añadir ingrediente" onClose={() => setBuscando(false)} large>
        <div class={h.stack}>
          <label class={h.search}>
            <SearchIcon />
            <input
              type="search"
              value={texto}
              placeholder="Buscar: arroz, pollo, aceite…"
              aria-label="Buscar un ingrediente"
              onInput={(e) => setTexto(e.currentTarget.value)}
            />
          </label>
          {base.value === null ? (
            <p class={h.sub}>Cargando alimentos…</p>
          ) : (
            <ul class={h.list}>
              {lista.map((a) => (
                <li key={a.id} class={h.row}>
                  <button type="button" class={h.rowMain} onClick={() => anadirIng(a)}>
                    <span class={h.rowTitle}>{a.name}</span>
                    <span class={h.rowDetail}>
                      Por 100 g: {formatInt(a.kcal)} kcal · {formatInt(a.protein)} g prot. · se añade con{' '}
                      {formatInt(a.servingG)} g
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p class={h.foot}>Lo pesas en crudo. Los gramos los cambias después con − / +.</p>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet title="Editar receta" onClose={onClose} large>
      <div class={h.stack}>
        <label class={h.field}>
          Nombre
          <input
            value={nombre}
            onInput={(e) => setNombre(e.currentTarget.value)}
            onBlur={() => guardar({ ...receta, nombre: nombre.trim() || receta.nombre })}
          />
        </label>
        <ChoiceSegmented<TipoDia>
          name="editar-version"
          legend="Gramos del"
          options={TIPOS_DIA.map((x) => ({ value: x.id, label: x.nombre }))}
          value={tipo}
          onChange={onTipo}
        />
        <span class={h.eyebrow}>Ingredientes</span>
        <ul class={h.list}>
          {receta.ingredientes.map((i, k) => (
            <li key={`${i.nombre}-${k}`} class={h.row}>
              <span class={h.rowMain}>
                <span class={h.rowTitle}>{i.nombre}</span>
                <button type="button" class={h.danger} onClick={() => quitarIng(k)}>
                  Quitar
                </button>
              </span>
              {i.gramos ? (
                <span class={h.miniStepper}>
                  <button
                    type="button"
                    aria-label={`Menos ${i.nombre}`}
                    onClick={() => paso(k, (i.gramos?.[tipo] ?? 0) - 5)}
                  >
                    <MinusIcon />
                  </button>
                  <input
                    inputMode="numeric"
                    aria-label={`Gramos de ${i.nombre}`}
                    value={String(i.gramos[tipo])}
                    onChange={(e) => {
                      const n = parseDecimal(e.currentTarget.value)
                      if (n !== null && n >= 0) paso(k, n)
                    }}
                  />
                  <span class={h.foot}>g</span>
                  <button
                    type="button"
                    aria-label={`Más ${i.nombre}`}
                    onClick={() => paso(k, (i.gramos?.[tipo] ?? 0) + 5)}
                  >
                    <PlusIcon />
                  </button>
                </span>
              ) : (
                <span class={h.foot}>{i.nota || 'Al gusto'}</span>
              )}
            </li>
          ))}
        </ul>
        <button type="button" class={h.textButton} onClick={() => setBuscando(true)}>
          + Añadir ingrediente
        </button>
        <section class={h.card} aria-label="Total de la receta">
          <p class={h.line}>
            <span>Total</span>
            <b>
              {formatInt(total.kcal)} kcal · {formatInt(total.protein)} g prot.
            </b>
          </p>
          <p class={h.foot}>
            Se guarda solo. {tipo === 'entreno' ? 'Si el descanso llevaba lo mismo, cambia también.' : ''}
          </p>
        </section>
        <Switch
          checked={receta.soloEntreno}
          label="Solo los días de entreno"
          onChange={(on) => guardar({ ...receta, soloEntreno: on })}
        />
        <label class={h.field}>
          Preparación (un paso por línea)
          <textarea
            class={h.textarea}
            value={pasos}
            onInput={(e) => setPasos(e.currentTarget.value)}
            onBlur={() =>
              guardar({
                ...receta,
                pasos: pasos
                  .split('\n')
                  .map((p) => p.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
        {original && (
          <Button
            variant="secondary"
            onClick={async () => {
              await restaurarReceta(receta.id)
              onClose()
              avisar('La receta vuelve a como venía en la dieta')
            }}
          >
            Volver a la receta de la dieta
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={async () => {
            const b = await borrarReceta(receta.id)
            if (!b) return
            onClose()
            avisar(`${b.receta.nombre}: borrada`, {
              label: 'Deshacer',
              onClick: () => void devolverReceta(b),
            })
          }}
        >
          Borrar la receta
        </Button>
      </div>
    </Sheet>
  )
}
