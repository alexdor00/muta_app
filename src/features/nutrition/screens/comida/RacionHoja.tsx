import { useState } from 'preact/hooks'
import { formatDecimal, formatInt, parseDecimal } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { HeartIcon, MinusIcon, PlusIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import {
  cantidadAlCambiar,
  COMIDAS,
  macrosIncompletos,
  modoInicial,
  nombreRacion,
  unidadDe,
  objetivoDia,
  pasoDe,
  totalDia,
  type Alimento,
  type Apunte,
  type ComidaId,
  type Modo,
} from '../../state/comida.ts'
import {
  alternarFavorito,
  anadir,
  apunteDe,
  cambiar,
  devolver,
  favoritoDe,
  quitar,
} from '../../use-cases/foodLog.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'
import a from './Anadir.module.css'
import { CifrasRacion } from './CifrasRacion.tsx'
import r from './Racion.module.css'

type Props = {
  alimento: Alimento
  comida: ComidaId
  onComida?: (c: ComidaId) => void
  /** Un apunte que se cambia (o null si se añade). */
  editando: Apunte | null
  onClose: () => void
  /** «‹ Volver»: a la hoja de antes (Añadir o la comida), por si cambias de opinión. */
  onAtras?: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

/**
 * La cantidad (rediseño, pantalla 15; usuario, 2026-11-17): el nombre con su corazón, la cifra grande con − / + y sus
 * atajos (una ración, 100 g, 200 g), sus kcal y macros, la comida y lo que te quedará. Acción en negro.
 */
export function RacionHoja({
  alimento,
  comida: inicial,
  onComida,
  editando,
  onClose,
  onAtras,
  avisar,
}: Props) {
  const [comida, setComida] = useState<ComidaId>(inicial)
  const [modo, setModo] = useState<Modo>(
    editando ? (editando.raciones !== null ? 'racion' : 'gramos') : modoInicial(alimento),
  )
  const [cantidad, setCantidad] = useState<number>(
    editando
      ? (editando.raciones ?? editando.gramos ?? 0)
      : modoInicial(alimento) === 'gramos'
        ? alimento.servingG
        : 1,
  )
  const [escrito, setEscrito] = useState<string | null>(null)
  const apunte = apunteDe(alimento, cantidad, modo, comida)
  const objetivo = objetivoDia.value
  const antes = {
    kcal: totalDia.value.kcal - (editando?.kcal ?? 0),
    protein: totalDia.value.protein - (editando?.protein ?? 0),
  }
  const quedan = objetivo
    ? {
        kcal: objetivo.kcal - antes.kcal - apunte.kcal,
        protein: objetivo.protein - antes.protein - apunte.protein,
      }
    : null
  const al = COMIDAS.find((c) => c.id === comida)?.al ?? comida
  const favorito = favoritoDe(alimento.id)

  function poner(m: Modo, n: number) {
    setModo(m)
    setCantidad(n)
    setEscrito(null)
  }
  function paso(signo: 1 | -1) {
    setCantidad((c) => Math.max(0, Math.round((c + signo * pasoDe(modo, alimento)) * 100) / 100))
    setEscrito(null)
  }
  const elegirComida = (c: ComidaId) => {
    setComida(c)
    onComida?.(c)
  }

  async function guardar() {
    if (!(apunte.gramos && apunte.gramos > 0)) return avisar('Pon una cantidad')
    if (editando) {
      await cambiar({ ...apunte, id: editando.id })
      onClose()
      return avisar('Guardado')
    }
    const id = await anadir(apunte)
    onClose()
    avisar(`${alimento.name}: ${formatInt(apunte.kcal)} kcal`, {
      label: 'Deshacer',
      onClick: () => void quitar([id]),
    })
  }
  async function quitarlo() {
    if (!editando) return
    const quitados = await quitar([editando.id])
    onClose()
    avisar('Quitado', { label: 'Deshacer', onClick: () => void devolver(quitados) })
  }

  const enGramos = modo === 'gramos'
  const u = unidadDe(alimento)

  return (
    <Sheet
      title={alimento.name}
      onClose={onClose}
      atras={onAtras ? { label: 'Volver', onClick: onAtras } : undefined}
      large
      accion={
        <button
          type="button"
          class={h.round}
          aria-pressed={!!favorito}
          aria-label={favorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          // Sin aviso: el corazón relleno ya lo dice (usuario, 2026-11-17)
          onClick={() => void alternarFavorito(apunte)}
        >
          <HeartIcon lleno={!!favorito} />
        </button>
      }
      footer={
        <div class={h.actions}>
          <Button onClick={() => void guardar()}>{editando ? 'Guardar' : `Añadir ${al}`}</Button>
          {editando && (
            <Button variant="secondary" onClick={() => void quitarlo()}>
              Quitar
            </Button>
          )}
        </div>
      }
    >
      <div class={a.hoja}>
        <section class={r.tarjeta} aria-label="Cantidad">
          <div class={r.paso}>
            <button type="button" class={r.redondo} aria-label="Menos" onClick={() => paso(-1)}>
              <MinusIcon />
            </button>
            <label class={r.cifra}>
              <input
                inputMode="decimal"
                aria-label={
                  enGramos ? (u === 'ml' ? 'Mililitros' : 'Gramos') : `Cantidad en ${alimento.servingLabel}`
                }
                value={escrito ?? formatDecimal(cantidad)}
                onInput={(e) => {
                  setEscrito(e.currentTarget.value)
                  const n = parseDecimal(e.currentTarget.value)
                  setCantidad(n !== null && n >= 0 ? n : 0)
                }}
              />
              <span>{enGramos ? u : nombreRacion(alimento, cantidad).replace(/^[^ ]+ /, '')}</span>
            </label>
            <button type="button" class={r.redondo} aria-label="Más" onClick={() => paso(1)}>
              <PlusIcon />
            </button>
          </div>
          {/* La cantidad, en sus unidades o en gramos a mano (usuario, 2026-11-21: sin atajos de 100 y 200 g) */}
          {/* De una cadena: solo raciones (se sabe lo que aporta, no lo que pesa) */}
          {!alimento.porRacion && (
            <ChoiceSegmented
              name="modo"
              legend="Cómo apuntas"
              options={[
                {
                  value: 'racion',
                  label: nombreRacion(alimento, 2)
                    .replace(/^2 /, '')
                    .replace(/^./, (l) => l.toUpperCase()),
                },
                { value: 'gramos', label: u === 'ml' ? 'Mililitros' : 'Gramos' },
              ]}
              value={modo}
              onChange={(m) => poner(m, cantidadAlCambiar(alimento, cantidad, m))}
            />
          )}
          {!enGramos && !alimento.porRacion && (
            <p class={r.equivale}>
              {formatInt(apunte.gramos ?? 0)} {u}
            </p>
          )}
        </section>

        <CifrasRacion m={apunte} />
        {/* Comida de cadenas: cifras de FatSecret España (usuario, 2026-11-21: «marcado aproximado») */}
        {alimento.aproximado && <p class={h.foot}>Cifras aproximadas (FatSecret España).</p>}

        <div class={a.pastillas} role="group" aria-label="Comida">
          {COMIDAS.map((c) => (
            <button
              key={c.id}
              type="button"
              class={`${a.pastilla} ${c.id === comida ? a.on : ''}`}
              aria-pressed={c.id === comida}
              onClick={() => elegirComida(c.id)}
            >
              {c.nombre}
            </button>
          ))}
        </div>

        {macrosIncompletos(alimento) && (
          <p class={h.warn}>
            Este alimento no trae todos los hidratos o la grasa: las kcal cuentan, pero los macros pueden
            quedar cortos.
          </p>
        )}
        {quedan && (
          <p class={r.despues}>
            {quedan.kcal >= 0
              ? `Después te quedarán ${formatInt(quedan.kcal)} kcal`
              : `Te pasarás ${formatInt(-quedan.kcal)} kcal`}
            {quedan.protein > 0
              ? ` y ${formatInt(quedan.protein)} g de proteína.`
              : ' y llegas a tu proteína.'}
          </p>
        )}
      </div>
    </Sheet>
  )
}
