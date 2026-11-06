import { useState } from 'preact/hooks'
import { formatDayDate, formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { PlusIcon, SearchIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { PlatoFila } from '../../components/Platos.tsx'
import type { ComidaId } from '../../state/comida.ts'
import { buscarPlatos, fotos, mejoresPara, platos, platosTuyos, recetario } from '../../state/recetas.ts'
import { objetivoDeComida, ponerPlato, quitarPlato } from '../../use-cases/menu.ts'
import { comidaDe } from '../comun/platos.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Props = {
  fecha: string
  comida: ComidaId
  onClose: () => void
  onCrear: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

/**
 * Añadir un plato a una comida de tu menú: del recetario (primero los que mejor cuadran con lo que le toca, ya
 * ajustados) o tuyos; o crear uno.
 */
export function ElegirPlatoHoja({ fecha, comida, onClose, onCrear, avisar }: Props) {
  const [de, setDe] = useState<'recetario' | 'tuyos'>('recetario')
  const [texto, setTexto] = useState('')
  const o = objetivoDeComida(fecha, comida)
  const fuente = de === 'tuyos' ? platosTuyos.value : (recetario.value?.platos ?? [])
  const lista = texto.trim()
    ? buscarPlatos(fuente, texto)
        .slice(0, 30)
        .map((plato) => ({ plato, kcal: plato.total.kcal, ajustado: false }))
    : o
      ? mejoresPara(fuente, comida, o, 30).map((e) => ({
          plato: e.plato,
          kcal: e.ajuste.total.kcal,
          ajustado: e.plato.ajustable,
        }))
      : fuente.slice(0, 30).map((plato) => ({ plato, kcal: plato.total.kcal, ajustado: false }))
  const poner = async (id: string, nombre: string) => {
    await ponerPlato(fecha, comida, id)
    onClose()
    avisar(`${nombre}: en ${comidaDe(comida).el} del ${formatDayDate(fecha)}`, {
      label: 'Deshacer',
      onClick: () => void quitarPlato(fecha, comida),
    })
  }
  return (
    <Sheet
      title={`${comidaDe(comida).nombre} · ${formatDayDate(fecha)}`}
      onClose={onClose}
      large
      footer={
        <div class={h.actions}>
          <Button variant="secondary" onClick={onCrear}>
            + Crear plato
          </Button>
        </div>
      }
    >
      <div class={h.stack}>
        <ChoiceSegmented<'recetario' | 'tuyos'>
          name="elegir-de"
          legend="De"
          options={[
            { value: 'recetario', label: 'Recetario' },
            {
              value: 'tuyos',
              label: `Tuyos${platosTuyos.value.length ? ` (${platosTuyos.value.length})` : ''}`,
            },
          ]}
          value={de}
          onChange={setDe}
        />
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
        {!texto.trim() && o && (
          <p class={h.foot}>
            Primero los que mejor cuadran con lo que le toca a {comidaDe(comida).el}: unas {formatInt(o.kcal)}{' '}
            kcal.
          </p>
        )}
        {lista.length ? (
          <ul class={h.list}>
            {lista.map(({ plato, kcal, ajustado }) => (
              <PlatoFila
                key={plato.id}
                nombre={plato.nombre}
                foto={fotos.value[plato.id] ?? null}
                lineas={[`${formatInt(kcal)} kcal${ajustado ? ' · ajustada a esta comida' : ''}`]}
                href={`${paths.dish(plato.id, { comida, fecha })}&desde=menu`}
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
          <p class={h.sub}>
            {de === 'tuyos'
              ? 'Aún no tienes platos tuyos: crea uno abajo.'
              : 'Ningún plato con esa búsqueda.'}
          </p>
        )}
        {!platos.value.length && <p class={h.sub}>No hay recetas cargadas.</p>}
      </div>
    </Sheet>
  )
}
