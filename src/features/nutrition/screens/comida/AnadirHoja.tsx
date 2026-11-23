import { useEffect, useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import {
  BarcodeIcon,
  BoltIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { PlatoFoto } from '../../components/Platos.tsx'
import {
  base,
  COMIDAS,
  diaVisto,
  guardadas,
  modoInicial,
  propios,
  type Alimento,
  type ComidaId,
} from '../../state/comida.ts'
import { fotos, huecoDe, menu, platoPorId, totalDelHueco } from '../../state/recetas.ts'
import {
  anadir,
  anadirVarios,
  apunteDe,
  borrarGuardada,
  cargarAlimentos,
  deLoQueSuelesComer,
  porRacion,
  quitar,
  repetirDeAyer,
  resumenDeAyer,
  sugeridos,
  textoRacion,
  unaRacion,
} from '../../use-cases/foodLog.ts'
import { platoApuntado } from '../../use-cases/recipes.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'
import a from './Anadir.module.css'
import { AnadirBusqueda, type Filtro } from './AnadirBusqueda.tsx'

type Lista = 'recientes' | 'favoritos' | 'tuyos'

type Props = {
  comida: ComidaId
  onComida: (c: ComidaId) => void
  onClose: () => void
  onElegir: (a: Alimento) => void
  onRapido: () => void
  onCrear: () => void
  /** Leer un código de barras (Open Food Facts). */
  onEscanear: () => void
  /** El tick del plato de tu menú en esa comida. */
  onMenuHecho: (c: ComidaId) => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

const comidaDe = (c: ComidaId) => COMIDAS.find((x) => x.id === c) ?? COMIDAS[0]
const NOMBRE_MACRO = { protein: 'proteína', carbs: 'hidratos', fat: 'grasa' } as const

/**
 * Añadir (rediseño, pantallas 13 y 14; usuario, 2026-11-17): la comida en pastillas, el buscador, los atajos redondos
 * (código, solo kcal y proteína, crear), lo de tu menú («Hecho») y lo de ayer («Repetir») en una tarjeta, y tus recientes,
 * favoritos o tuyos con su «+». Al buscar: Todo · Alimentos · Recetas · Tuyos, las recetas con su foto, y escanear o crear.
 */
export function AnadirHoja(props: Props) {
  const { comida, onClose, avisar } = props
  const [texto, setTexto] = useState('')
  const [lista, setLista] = useState<Lista>('recientes')
  const [filtro, setFiltro] = useState<Filtro>('todo')
  useEffect(() => {
    void cargarAlimentos()
  }, [])
  const q = texto.trim()
  const fecha = diaVisto.value
  const ayer = resumenDeAyer(comida)
  const sueles = deLoQueSuelesComer(comida)
  const deshacer = (ids: string[]) => ({ label: 'Deshacer', onClick: () => void quitar(ids) })
  // El plato de tu menú en esta comida, si aún no lo has apuntado
  const hueco = huecoDe(menu.value, fecha, comida)
  const delMenu = hueco ? platoPorId(hueco.plato, fecha) : null
  const menuPendiente = delMenu && !platoApuntado(delMenu.id, comida, fecha) ? delMenu : null

  async function masUno(x: Alimento) {
    const apunte = unaRacion(x, comida, modoInicial(x))
    const id = await anadir(apunte)
    avisar(`${x.name}: ${formatInt(apunte.kcal)} kcal`, deshacer([id]))
  }

  const filaAlimento = (x: Alimento, detalle?: string) => {
    const m = porRacion(x)
    return (
      <li key={x.id} class={a.fila}>
        <button type="button" class={a.filaTexto} onClick={() => props.onElegir(x)}>
          <span class={a.nombre}>{x.name}</span>
          <span class={a.detalle}>{detalle ?? `${textoRacion(x)} · ${formatInt(m.kcal)} kcal`}</span>
        </button>
        <button type="button" class={h.round} aria-label={`Añadir ${x.name}`} onClick={() => void masUno(x)}>
          <PlusIcon />
        </button>
      </li>
    )
  }

  return (
    <Sheet title="Añadir" onClose={onClose} large>
      <div class={a.hoja}>
        <div class={a.pastillas} role="group" aria-label="Comida">
          {COMIDAS.map((c) => (
            <button
              key={c.id}
              type="button"
              class={`${a.pastilla} ${c.id === comida ? a.on : ''}`}
              aria-pressed={c.id === comida}
              onClick={() => props.onComida(c.id)}
            >
              {c.nombre}
            </button>
          ))}
        </div>
        <label class={a.buscador}>
          <SearchIcon />
          <input
            type="search"
            value={texto}
            placeholder="Busca un alimento o una receta"
            aria-label="Buscar un alimento o una receta"
            enterKeyHint="search"
            onInput={(e) => setTexto(e.currentTarget.value)}
          />
        </label>

        {!q ? (
          <>
            <div class={a.atajos}>
              <button
                type="button"
                class={a.atajo}
                aria-label="Escanear un código de barras"
                onClick={props.onEscanear}
              >
                <span>
                  <BarcodeIcon />
                </span>
                Código
              </button>
              <button
                type="button"
                class={a.atajo}
                aria-label="Solo kcal y proteína"
                onClick={props.onRapido}
              >
                <span>
                  <BoltIcon />
                </span>
                Solo kcal
              </button>
              <button type="button" class={a.atajo} onClick={props.onCrear}>
                <span>
                  <PencilIcon />
                </span>
                Crear
              </button>
            </div>

            {(menuPendiente || ayer) && (
              <ul class={a.tarjeta}>
                {menuPendiente && hueco && (
                  <li class={a.fila}>
                    <PlatoFoto foto={fotos.value[menuPendiente.id] ?? null} />
                    <span class={a.filaTexto}>
                      <span class={a.detalle}>De tu menú</span>
                      <span class={a.nombre}>{menuPendiente.nombre}</span>
                    </span>
                    <button
                      type="button"
                      class={a.boton}
                      aria-label={`Hecho: ${menuPendiente.nombre}, ${formatInt(totalDelHueco(hueco)?.kcal ?? 0)} kcal`}
                      onClick={() => {
                        props.onMenuHecho(comida)
                        onClose()
                      }}
                    >
                      Hecho
                    </button>
                  </li>
                )}
                {ayer && (
                  <li class={a.fila}>
                    <span class={a.filaTexto}>
                      <span class={a.detalle}>Lo mismo que ayer · {formatInt(ayer.kcal)} kcal</span>
                      <span class={a.nombre}>{ayer.nombres}</span>
                    </span>
                    <button
                      type="button"
                      class={`${a.boton} ${a.suave}`}
                      onClick={async () => {
                        const ids = await repetirDeAyer(comida)
                        onClose()
                        avisar(`Repetido lo de ayer en ${comidaDe(comida).el}`, deshacer(ids))
                      }}
                    >
                      Repetir
                    </button>
                  </li>
                )}
              </ul>
            )}

            <div class={a.segmento} role="group" aria-label="Qué ver">
              {(
                [
                  ['recientes', 'Recientes'],
                  ['favoritos', 'Favoritos'],
                  ['tuyos', 'Tuyos'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  class={lista === id ? a.on : ''}
                  aria-pressed={lista === id}
                  onClick={() => setLista(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            {base.value === null ? (
              <p class={h.sub}>Cargando alimentos…</p>
            ) : lista === 'favoritos' ? (
              guardadas.value.length ? (
                <ul class={a.tarjeta}>
                  {guardadas.value.map((g) => (
                    <li key={g.id} class={a.fila}>
                      <button
                        type="button"
                        class={a.filaTexto}
                        onClick={async () => {
                          const ids = await anadirVarios(g.apuntes, comida)
                          onClose()
                          avisar(`${g.nombre}: añadida`, deshacer(ids))
                        }}
                      >
                        <span class={a.nombre}>{g.nombre}</span>
                        <span class={a.detalle}>
                          {g.apuntes.length} {g.apuntes.length === 1 ? 'alimento' : 'alimentos'} ·{' '}
                          {formatInt(g.apuntes.reduce((s, x) => s + x.kcal, 0))} kcal
                        </span>
                      </button>
                      <button
                        type="button"
                        class={h.round}
                        aria-label={`Borrar ${g.nombre}`}
                        onClick={() => void borrarGuardada(g.id)}
                      >
                        <TrashIcon />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p class={a.vacio}>
                  Guarda una comida desde tu día (tócala y «Guardar») para repetirla de un toque.
                </p>
              )
            ) : lista === 'tuyos' ? (
              propios.value.length ? (
                <ul class={a.tarjeta}>{propios.value.map((x) => filaAlimento(x))}</ul>
              ) : (
                <p class={a.vacio}>Aún no has creado alimentos.</p>
              )
            ) : (
              <>
                <ul class={a.tarjeta}>{sugeridos().alimentos.map((x) => filaAlimento(x))}</ul>
                {sueles && (
                  <section class={a.seccion} aria-labelledby="sueles">
                    <h3 id="sueles" class={a.rotulo}>
                      Te faltan {formatInt(sueles.falta[sueles.macro])} g de {NOMBRE_MACRO[sueles.macro]}
                    </h3>
                    <ul class={a.tarjeta}>
                      {sueles.propuestas.map(({ alimento: x, gramos, aporta }) => (
                        <li key={x.id} class={a.fila}>
                          <span class={a.filaTexto}>
                            <span class={a.nombre}>{x.name}</span>
                            <span class={a.detalle}>
                              {formatInt(gramos)} g · {formatInt(aporta[sueles.macro])} g de{' '}
                              {NOMBRE_MACRO[sueles.macro]} · {formatInt(aporta.kcal)} kcal
                            </span>
                          </span>
                          <button
                            type="button"
                            class={h.round}
                            aria-label={`Añadir ${formatInt(gramos)} g de ${x.name}`}
                            onClick={async () => {
                              const apunte = apunteDe(x, gramos, 'gramos', comida)
                              const id = await anadir(apunte)
                              avisar(`${x.name}: ${formatInt(apunte.kcal)} kcal`, deshacer([id]))
                            }}
                          >
                            <PlusIcon />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <AnadirBusqueda
              q={q}
              comida={comida}
              filtro={filtro}
              onFiltro={setFiltro}
              fila={filaAlimento}
              onEscanear={props.onEscanear}
              onCrear={props.onCrear}
              avisar={avisar}
            />
          </>
        )}
      </div>
    </Sheet>
  )
}
