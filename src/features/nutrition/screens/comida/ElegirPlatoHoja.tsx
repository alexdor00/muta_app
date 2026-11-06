import { useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceChips } from '../../../../shared/ui/Choice.tsx'
import { PlusIcon, SearchIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { PlatoFila } from '../../components/Platos.tsx'
import { hoy, type ComidaId } from '../../state/comida.ts'
import {
  buscarPlatos,
  categorias,
  diasDelMenu,
  fotos,
  menu,
  mejoresPara,
  objetivoDeComida,
  vaCon,
} from '../../state/recetas.ts'
import { ponerPlato } from '../../use-cases/menu.ts'
import { comidaDe } from '../comun/platos.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'
import ps from '../plato/Plato.module.css'

type Props = {
  menuId: string
  comida: ComidaId
  onClose: () => void
  onCrear: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

/**
 * Un plato para una comida de un menú: del recetario (primero los que mejor cuadran con lo que le toca, ya ajustados) o
 * tuyos; o crear uno.
 */
export function ElegirPlatoHoja({ menuId, comida, onClose, onCrear, avisar }: Props) {
  const [cat, setCat] = useState('para')
  const [texto, setTexto] = useState('')
  const m = menu.value.menus.find((x) => x.id === menuId)
  const fecha = diasDelMenu(menu.value, menuId, hoy.value)[0] ?? hoy.value
  const o = objetivoDeComida(fecha, comida)
  const todas = categorias.value.flatMap((c) => c.platos)
  const fuente =
    cat === 'para'
      ? todas.filter((p) => vaCon(p, comida))
      : cat === 'todas'
        ? todas
        : (categorias.value.find((c) => c.id === cat)?.platos ?? [])
  const lista = texto.trim()
    ? buscarPlatos(fuente, texto)
        .slice(0, 30)
        .map((plato) => ({ plato, kcal: plato.total.kcal }))
    : o
      ? mejoresPara(fuente, comida, o, 30, [], cat === 'para').map((e) => ({
          plato: e.plato,
          kcal: e.ajuste.total.kcal,
        }))
      : fuente.slice(0, 30).map((plato) => ({ plato, kcal: plato.total.kcal }))
  const poner = async (id: string, nombre: string) => {
    const antes = await ponerPlato(menuId, comida, id)
    onClose()
    avisar(`${nombre}: en ${m?.nombre ?? 'tu menú'}`, {
      label: 'Deshacer',
      onClick: () => void ponerPlato(menuId, comida, antes),
    })
  }
  return (
    <Sheet
      title={`${m?.nombre ?? 'Menú'} · ${comidaDe(comida).nombre}`}
      onClose={onClose}
      large
      footer={
        <div class={h.actions}>
          <Button variant="secondary" onClick={onCrear}>
            Crear un plato tuyo
          </Button>
        </div>
      }
    >
      <div class={h.stack}>
        <label class={h.search}>
          <SearchIcon />
          <input
            type="search"
            value={texto}
            placeholder="Buscar"
            aria-label="Buscar un plato"
            enterKeyHint="search"
            onInput={(e) => setTexto(e.currentTarget.value)}
          />
        </label>
        <div class={ps.filtros}>
          <ChoiceChips<string>
            name="elegir-categoria"
            legend="Categoría"
            options={[
              { value: 'para', label: `Para ${comidaDe(comida).el}` },
              { value: 'todas', label: 'Todas' },
              ...categorias.value.map((c) => ({ value: c.id, label: c.nombre })),
            ]}
            value={cat}
            onChange={setCat}
          />
        </div>
        {lista.length ? (
          <ul class={h.list}>
            {lista.map(({ plato, kcal }) => (
              <PlatoFila
                key={plato.id}
                nombre={plato.nombre}
                foto={fotos.value[plato.id] ?? null}
                lineas={[`${formatInt(kcal)} kcal`]}
                href={`${paths.dish(plato.id, { comida })}&desde=menu`}
                accion={
                  <button
                    type="button"
                    class={h.round}
                    aria-label={`Poner ${plato.nombre}`}
                    onClick={() => void poner(plato.id, plato.nombre)}
                  >
                    <PlusIcon />
                  </button>
                }
              />
            ))}
          </ul>
        ) : (
          <p class={h.sub}>Ningún plato con esa búsqueda.</p>
        )}
      </div>
    </Sheet>
  )
}
