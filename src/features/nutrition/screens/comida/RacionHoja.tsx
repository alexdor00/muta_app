import { useState } from 'preact/hooks'
import { formatDecimal, formatInt, parseDecimal } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { CheckIcon, MinusIcon, PlusIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import {
  cantidadAlCambiar,
  COMIDAS,
  macrosIncompletos,
  modoInicial,
  objetivoHoy,
  pasoDe,
  totalHoy,
  type Alimento,
  type Apunte,
  type ComidaId,
  type Modo,
} from '../../state/comida.ts'
import { anadir, apunteDe, cambiar, devolver, quitar } from '../../use-cases/foodLog.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Props = {
  alimento: Alimento
  comida: ComidaId
  /** Un apunte que se cambia (o null si se añade). */
  editando: Apunte | null
  onClose: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

const parte = (n: number, de: number) => `${Math.min(100, de ? (n / de) * 100 : 0)}%`

/** La ración: en raciones o en gramos, con − / +; sus cifras y cómo queda tu día antes de añadirla. */
export function RacionHoja({ alimento, comida, editando, onClose, avisar }: Props) {
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
  const objetivo = objetivoHoy.value
  // Lo de hoy sin este apunte (si se está cambiando) y con él
  const antes = {
    kcal: totalHoy.value.kcal - (editando?.kcal ?? 0),
    protein: totalHoy.value.protein - (editando?.protein ?? 0),
  }
  const despues = { kcal: antes.kcal + apunte.kcal, protein: antes.protein + apunte.protein }
  const al = COMIDAS.find((c) => c.id === comida)?.al ?? comida

  function cambiarModo(m: Modo) {
    if (m === modo) return
    setCantidad(cantidadAlCambiar(alimento, cantidad, m))
    setModo(m)
    setEscrito(null)
  }
  function paso(signo: 1 | -1) {
    setCantidad((c) => Math.max(0, Math.round((c + signo * pasoDe(modo)) * 100) / 100))
    setEscrito(null)
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

  return (
    <Sheet
      title={alimento.name}
      onClose={onClose}
      large
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
      <div class={h.stack}>
        <p class={h.foot}>
          Por 100 g: {formatInt(alimento.kcal)} kcal · P {formatDecimal(alimento.protein)} · H{' '}
          {formatDecimal(alimento.carbs)} · G {formatDecimal(alimento.fat)}
          {alimento.id.startsWith('u_') ? ' · tu etiqueta' : ' · valores medios (BEDCA y USDA)'}
        </p>
        <ChoiceSegmented<Modo>
          name="modo-racion"
          legend="Cantidad en"
          options={[
            { value: 'racion', label: `${alimento.servingLabel} (${formatInt(alimento.servingG)} g)` },
            { value: 'gramos', label: 'Gramos' },
          ]}
          value={modo}
          onChange={cambiarModo}
        />
        <div class={h.stepper}>
          <button type="button" class={h.round} aria-label="Menos" onClick={() => paso(-1)}>
            <MinusIcon />
          </button>
          <label class={h.amount}>
            <input
              inputMode="decimal"
              aria-label={modo === 'racion' ? `Cantidad en ${alimento.servingLabel}` : 'Gramos'}
              value={escrito ?? formatDecimal(cantidad)}
              onInput={(e) => {
                setEscrito(e.currentTarget.value)
                const n = parseDecimal(e.currentTarget.value)
                setCantidad(n !== null && n >= 0 ? n : 0)
              }}
            />
            <span class={h.sub}>
              {modo === 'racion' ? `${alimento.servingLabel} · ${formatInt(apunte.gramos ?? 0)} g` : 'gramos'}
            </span>
          </label>
          <button type="button" class={h.round} aria-label="Más" onClick={() => paso(1)}>
            <PlusIcon />
          </button>
        </div>
        <div class={h.tiles}>
          {[
            [formatInt(apunte.kcal), 'kcal'],
            [formatDecimal(apunte.protein), 'proteína'],
            [formatDecimal(apunte.carbs), 'hidratos'],
            [formatDecimal(apunte.fat), 'grasa'],
          ].map(([v, l]) => (
            <div key={l} class={h.tile}>
              <span class={h.tileValue}>{v}</span>
              <span class={h.foot}>{l}</span>
            </div>
          ))}
        </div>
        {macrosIncompletos(alimento) && (
          <p class={h.warn}>
            Este alimento no trae todos los hidratos o la grasa: las kcal cuentan, pero los macros pueden
            quedar cortos.
          </p>
        )}
        {objetivo && (
          <section class={h.card} aria-label="Así queda tu día">
            <span class={h.eyebrow}>Así queda tu día</span>
            <p class={h.line}>
              <span>{despues.kcal <= objetivo.kcal ? 'Por comer' : 'De más'}</span>
              <span class={h.foot}>{formatInt(Math.abs(objetivo.kcal - antes.kcal))} →</span>
              <b>{formatInt(Math.abs(objetivo.kcal - despues.kcal))} kcal</b>
            </p>
            <div class={h.track} aria-hidden="true">
              <i style={{ width: parte(despues.kcal, objetivo.kcal) }} />
            </div>
            <p class={h.line}>
              <span>Proteína</span>
              <span class={h.foot}>{formatInt(antes.protein)} →</span>
              <b>
                {formatInt(despues.protein)} / {formatInt(objetivo.protein)} g
              </b>
              {despues.protein >= objetivo.protein && (
                <span class={h.check} aria-label="Llegas a la proteína">
                  <CheckIcon />
                </span>
              )}
            </p>
            <div class={h.track} aria-hidden="true">
              <i style={{ width: parte(despues.protein, objetivo.protein) }} />
            </div>
          </section>
        )}
      </div>
    </Sheet>
  )
}
