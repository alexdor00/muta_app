import { useState } from 'preact/hooks'
import { addDays, formatDayDate, formatInt } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceChips } from '../../../../shared/ui/Choice.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { COMIDAS, hoy, tipoDe } from '../../state/comida.ts'
import {
  clave,
  gramosDeHueco,
  MACROS,
  menu,
  paraCocinar,
  platoPorId,
  type Cocinado,
} from '../../state/recetas.ts'
import { comidasDelPlato, guardarCocinado, quitarCocinado } from '../../use-cases/menu.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Props = {
  cocinado: Cocinado
  onClose: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

/**
 * Cuándo cocinas un plato: el día, la hora y para qué comidas de tu menú (las del mismo plato). Te da los gramos de todo
 * de una vez; cada comida se sirve con los suyos.
 */
export function CocinarHoja({ cocinado, onClose, avisar }: Props) {
  const p = platoPorId(cocinado.plato)
  const [fecha, setFecha] = useState(cocinado.fecha)
  const [hora, setHora] = useState(cocinado.hora)
  const [para, setPara] = useState<string[]>(cocinado.para)
  if (!p) return null
  const posibles = comidasDelPlato(p.id, hoy.value).filter((x) => x.fecha >= fecha)
  const dias = Array.from({ length: 7 }, (_, i) => addDays(hoy.value, i)).filter(
    (d) => !para.length || para.every((k) => k.split('|')[0] >= d),
  )
  const borrador: Cocinado = { ...cocinado, fecha, hora, para }
  const gramos = paraCocinar(menu.value, borrador, p, gramosDeHueco)
  const existe = menu.value.cocinados.some((c) => c.id === cocinado.id)
  return (
    <Sheet
      title={`Cocinar · ${p.nombre}`}
      onClose={onClose}
      large
      footer={
        <div class={h.actions}>
          <Button
            disabled={!para.length}
            onClick={async () => {
              await guardarCocinado(borrador)
              onClose()
              avisar(`Cocinas el ${formatDayDate(fecha)} a las ${hora}`)
            }}
          >
            Guardar
          </Button>
          {existe && (
            <button
              type="button"
              class={h.textButton}
              onClick={async () => {
                await quitarCocinado(cocinado.id)
                onClose()
                avisar('Cada comida se cocina su día', {
                  label: 'Deshacer',
                  onClick: () => void guardarCocinado(cocinado),
                })
              }}
            >
              Quitar: cocinarlo cada día
            </button>
          )}
        </div>
      }
    >
      <div class={h.stack}>
        <ChoiceChips<string>
          name="cocinar-dia"
          legend="Día"
          showLegend
          options={dias.map((d) => ({ value: d, label: d === hoy.value ? 'Hoy' : formatDayDate(d) }))}
          value={fecha}
          onChange={setFecha}
        />
        <label class={h.field}>
          <span class={h.foot}>Hora</span>
          <input type="time" value={hora} onInput={(e) => setHora(e.currentTarget.value || hora)} />
        </label>
        <fieldset class={h.stack}>
          <legend class={h.eyebrow}>Para</legend>
          {posibles.length ? (
            posibles.map((x) => {
              const k = clave(x.fecha, x.comida)
              return (
                <label key={k} class={h.check}>
                  <input
                    type="checkbox"
                    checked={para.includes(k)}
                    onChange={() => setPara(para.includes(k) ? para.filter((y) => y !== k) : [...para, k])}
                  />
                  <span class={h.rowMain}>
                    <span class={h.rowTitle}>
                      {COMIDAS.find((c) => c.id === x.comida)?.nombre} · {formatDayDate(x.fecha)}
                    </span>
                    <span class={h.rowDetail}>
                      {tipoDe(x.fecha) === 'entreno' ? 'Día de entreno' : 'Día de descanso'}
                    </span>
                  </span>
                </label>
              )
            })
          ) : (
            <p class={h.sub}>Pon este plato en más comidas de tu menú para cocinarlo de una vez.</p>
          )}
        </fieldset>
        <section class={h.card} aria-label="Cocinas en total">
          <p class={h.eyebrow}>
            Cocinas en total · {para.length} {para.length === 1 ? 'ración' : 'raciones'}
          </p>
          {gramos
            .filter((i) => i.gramos !== null)
            .map((i) => (
              <p key={i.texto} class={h.line}>
                <span>
                  {MACROS.find((m) => m.id === i.macro)?.corto ?? '·'} {i.nombre}
                </span>
                <b>{formatInt(i.gramos!)} g</b>
              </p>
            ))}
          <p class={h.foot}>Luego cada comida lleva los gramos de su día.</p>
        </section>
      </div>
    </Sheet>
  )
}
