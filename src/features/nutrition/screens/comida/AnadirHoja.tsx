import { useEffect, useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { BoltIcon, PlusIcon, RepeatIcon, SearchIcon, TrashIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import {
  base,
  COMIDAS,
  guardadas,
  modoInicial,
  propios,
  type Alimento,
  type ComidaId,
} from '../../state/comida.ts'
import {
  anadir,
  anadirVarios,
  borrarGuardada,
  buscar,
  cargarAlimentos,
  categorias,
  porRacion,
  quitar,
  repetirDeAyer,
  resumenDeAyer,
  sugeridos,
  textoRacion,
  unaRacion,
} from '../../use-cases/foodLog.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Filtro = 'recientes' | 'guardadas' | 'mios' | string

type Props = {
  comida: ComidaId
  onComida: (c: ComidaId) => void
  onClose: () => void
  onElegir: (a: Alimento) => void
  onRapido: () => void
  onCrear: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

const comidaDe = (c: ComidaId) => COMIDAS.find((x) => x.id === c) ?? COMIDAS[0]

/** Añadir: la comida, el buscador, lo rápido (repetir ayer, solo kcal y proteína), tus recientes y la base. */
export function AnadirHoja({ comida, onComida, onClose, onElegir, onRapido, onCrear, avisar }: Props) {
  const [texto, setTexto] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('recientes')
  useEffect(() => {
    void cargarAlimentos()
  }, [])
  const ayer = resumenDeAyer(comida)
  const deshacer = (ids: string[]) => ({ label: 'Deshacer', onClick: () => void quitar(ids) })

  async function masUno(a: Alimento) {
    const apunte = unaRacion(a, comida, modoInicial(a))
    const id = await anadir(apunte)
    avisar(`${a.name}: ${formatInt(apunte.kcal)} kcal`, deshacer([id]))
  }

  const lista: Alimento[] = texto.trim()
    ? buscar(texto)
    : filtro === 'recientes'
      ? sugeridos().alimentos
      : filtro === 'mios'
        ? propios.value
        : (base.value ?? []).filter((a) => a.category === filtro)

  return (
    <Sheet title={`Añadir ${comidaDe(comida).al}`} onClose={onClose} large>
      <div class={h.stack}>
        <ChoiceSegmented<ComidaId>
          name="comida-anadir"
          legend="Comida"
          options={COMIDAS.map((c) => ({ value: c.id, label: c.nombre }))}
          value={comida}
          onChange={onComida}
        />
        <label class={h.search}>
          <SearchIcon />
          <input
            type="search"
            value={texto}
            placeholder="Buscar: arroz, pollo, yogur…"
            aria-label="Buscar un alimento"
            enterKeyHint="search"
            onInput={(e) => setTexto(e.currentTarget.value)}
          />
        </label>
        {!texto.trim() && (
          <div class={h.quick}>
            {ayer && (
              <button
                type="button"
                class={h.quickItem}
                onClick={async () => {
                  const ids = await repetirDeAyer(comida)
                  onClose()
                  avisar(`Repetido lo de ayer en ${comidaDe(comida).el}`, deshacer(ids))
                }}
              >
                <span class={h.quickTitle}>
                  <RepeatIcon /> Repetir {comidaDe(comida).el} de ayer
                </span>
                <span class={h.foot}>
                  {ayer.nombres} · {formatInt(ayer.kcal)} kcal
                </span>
              </button>
            )}
            <button type="button" class={h.quickItem} onClick={onRapido}>
              <span class={h.quickTitle}>
                <BoltIcon /> Solo kcal y proteína
              </span>
              <span class={h.foot}>Para comer fuera o si no lo encuentras</span>
            </button>
          </div>
        )}
        {!texto.trim() && (
          <div class={h.chips} role="group" aria-label="Qué ver">
            {[
              ['recientes', 'Recientes'],
              ['guardadas', 'Guardadas ★'],
              ['mios', 'Mis alimentos'],
              ...categorias().map((c) => [c, c]),
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                class={`${h.chip} ${filtro === id ? h.chipOn : ''}`}
                aria-pressed={filtro === id}
                onClick={() => setFiltro(id)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {base.value === null ? (
          <p class={h.sub}>Cargando alimentos…</p>
        ) : filtro === 'guardadas' && !texto.trim() ? (
          guardadas.value.length ? (
            <ul class={h.list}>
              {guardadas.value.map((g) => (
                <li key={g.id} class={h.row}>
                  <button
                    type="button"
                    class={h.rowMain}
                    onClick={async () => {
                      const ids = await anadirVarios(g.apuntes, comida)
                      onClose()
                      avisar(`${g.nombre}: añadida`, deshacer(ids))
                    }}
                  >
                    <span class={h.rowTitle}>{g.nombre}</span>
                    <span class={h.rowDetail}>
                      {g.apuntes.length} {g.apuntes.length === 1 ? 'alimento' : 'alimentos'} ·{' '}
                      {formatInt(g.apuntes.reduce((s, a) => s + a.kcal, 0))} kcal
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
            <p class={h.sub}>
              Guarda una comida desde Hoy (toca la comida y «★ Guardar») para repetirla de un toque.
            </p>
          )
        ) : lista.length ? (
          <>
            {filtro === 'recientes' && !texto.trim() && sugeridos().habituales && (
              <p class={h.foot}>Los más habituales. Cuando apuntes, aquí verás los tuyos.</p>
            )}
            <ul class={h.list}>
              {lista.map((a) => {
                const m = porRacion(a)
                return (
                  <li key={a.id} class={h.row}>
                    <button type="button" class={h.rowMain} onClick={() => onElegir(a)}>
                      <span class={h.rowTitle}>{a.name}</span>
                      <span class={h.rowDetail}>
                        {textoRacion(a)} · {formatInt(m.kcal)} kcal · {formatInt(m.protein)} g prot.
                      </span>
                    </button>
                    <button
                      type="button"
                      class={h.round}
                      aria-label={`Añadir ${a.name}`}
                      onClick={() => void masUno(a)}
                    >
                      <PlusIcon />
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        ) : (
          <p class={h.sub}>
            {texto.trim()
              ? `No encuentro «${texto.trim()}». Créalo con los valores de la etiqueta o apunta solo kcal y proteína.`
              : 'Aún no has creado alimentos.'}
          </p>
        )}
        <button type="button" class={h.textButton} onClick={onCrear}>
          + Crear alimento
        </button>
      </div>
    </Sheet>
  )
}
