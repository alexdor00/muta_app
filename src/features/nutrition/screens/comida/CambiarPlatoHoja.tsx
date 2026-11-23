import { useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { SearchIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { PlatoFoto } from '../../components/Platos.tsx'
import { COMIDAS, type ComidaId } from '../../state/comida.ts'
import {
  DIA_LARGO,
  diaSemana,
  fotos,
  huecoDe,
  menu,
  parecidos,
  platoPorId,
  platosQueQuieres,
  totalDelHueco,
} from '../../state/recetas.ts'
import { cambiarEseDia, ponerPlato, quitarDeEseDia } from '../../use-cases/menu.ts'
import type { Aviso } from '../comun/useAviso.ts'
import a from './Anadir.module.css'
import s from './CambiarPlato.module.css'

type Props = {
  fecha: string
  comida: ComidaId
  onClose: () => void
  /** Buscar otra receta para todo el menú (la hoja de elegir plato). */
  onBuscar: (menu: string, comida: ComidaId) => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

/**
 * Cambiar un plato de tu semana (rediseño, pantalla 18; usuario, 2026-11-17): solo ese día o en todo su menú, con los
 * platos parecidos en calorías y proteína (y si lo tienes todo en casa), o buscar otra receta.
 */
export function CambiarPlatoHoja({ fecha, comida, onClose, onBuscar, avisar }: Props) {
  const [soloEste, setSoloEste] = useState(true)
  const h = huecoDe(menu.value, fecha, comida)
  const actual = h ? platoPorId(h.plato, fecha) : null
  if (!h || !actual) return null
  const t = totalDelHueco(h)
  const nombreComida = COMIDAS.find((c) => c.id === comida)?.el ?? comida
  const nombreMenu = menu.value.menus.find((x) => x.id === h.menu)?.nombre ?? 'tu menú'
  const dia = DIA_LARGO[diaSemana(fecha)]
  const lista = parecidos(platosQueQuieres.value, actual, comida)

  async function elegir(id: string, nombre: string) {
    if (soloEste) {
      const deshacer = await cambiarEseDia(fecha, comida, id)
      onClose()
      return avisar(`${nombre}: solo este ${dia}`, { label: 'Deshacer', onClick: () => void deshacer() })
    }
    const antes = await ponerPlato(h!.menu, comida, id)
    onClose()
    avisar(`${nombre}: en todo el ${nombreMenu}`, {
      label: 'Deshacer',
      onClick: () => void ponerPlato(h!.menu, comida, antes),
    })
  }

  return (
    <Sheet title={`Cambiar ${nombreComida}`} onClose={onClose} large>
      <div class={a.hoja}>
        <p class={s.ahora}>
          Ahora: <a href={paths.dish(actual.id)}>{actual.nombre}</a>
          {t ? ` · ${formatInt(t.kcal)} kcal` : ''}
        </p>
        <div class={a.segmento} role="group" aria-label="Dónde cambiarlo">
          <button
            type="button"
            class={soloEste ? a.on : ''}
            aria-pressed={soloEste}
            onClick={() => setSoloEste(true)}
          >
            Solo este {dia}
          </button>
          <button
            type="button"
            class={!soloEste ? a.on : ''}
            aria-pressed={!soloEste}
            onClick={() => setSoloEste(false)}
          >
            Todo el {nombreMenu}
          </button>
        </div>
        {lista.length > 0 && (
          <section class={a.seccion} aria-labelledby="parecidos">
            <h3 id="parecidos" class={a.rotulo}>
              Parecidos en calorías y proteína
            </h3>
            <ul class={a.tarjeta}>
              {lista.map((p) => (
                <li key={p.id} class={a.fila}>
                  <button type="button" class={s.opcion} onClick={() => void elegir(p.id, p.nombre)}>
                    <PlatoFoto foto={fotos.value[p.id] ?? null} />
                    <span class={a.filaTexto}>
                      <span class={a.nombre}>{p.nombre}</span>
                      <span class={a.detalle}>
                        {formatInt(p.total.kcal)} kcal · {formatInt(p.total.protein)} g prot.
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        <button
          type="button"
          class={s.buscar}
          onClick={() => {
            onClose()
            onBuscar(h.menu, comida)
          }}
        >
          <SearchIcon /> Buscar otra receta
        </button>
        <button
          type="button"
          class={s.quitar}
          onClick={async () => {
            const reponer = await quitarDeEseDia(comida, fecha)
            onClose()
            avisar(`Sin plato este ${dia}`, { label: 'Deshacer', onClick: () => void reponer() })
          }}
        >
          Quitar solo este {dia}
        </button>
      </div>
    </Sheet>
  )
}
