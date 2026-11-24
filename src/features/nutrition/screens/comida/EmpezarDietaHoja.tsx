import { useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { CheckIcon } from '../../../../shared/ui/icons.tsx'
import { MenuDesplegable } from '../../../../shared/ui/MenuDesplegable.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { resumenDeDieta, type Dieta } from '../../state/dieta.ts'
import { empezar, vistaPrevia } from '../../use-cases/diet.ts'
import { cocinarComoLaDieta } from '../../use-cases/autopilot.ts'
import { menusDeTuDieta, volverA } from '../../use-cases/menu.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'
import p from './PlanHojas.module.css'

type Props = {
  dieta: Dieta
  onClose: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
  /** Cargada desde Plan: tu plan pasa a ser esta dieta (sus menús, su ciclo y sus días de cocinar). */
  alPlan?: boolean
}

/** Antes de empezar una dieta: sus cifras, lo que cambia en tu objetivo y qué día del menú es hoy. Nada cambia hasta «Empezar hoy». */
export function EmpezarDietaHoja({ dieta, onClose, avisar, alPlan }: Props) {
  const [dia, setDia] = useState(1)
  const v = vistaPrevia(dieta)
  const r = resumenDeDieta(dieta)
  const y = (xs: readonly (string | number)[]) =>
    xs.length > 1 ? `${xs.slice(0, -1).join(', ')} y ${xs.at(-1)}` : String(xs[0] ?? '')
  // Lo que MUTA ha entendido de tu archivo (Plan, usuario 2026-11-18)
  const leido = [
    `${r.menus} ${r.menus === 1 ? 'menú' : 'menús'} y ${r.recetas} ${r.recetas === 1 ? 'receta' : 'recetas'}`,
    `Se repite cada ${r.ciclo.length} días: ${r.ciclo.join(' ')}`,
    r.cocinar.length ? `Cocinas los días ${y(r.cocinar)}` : null,
    r.todosLosDias.length ? `Todos los días: ${y(r.todosLosDias).toLowerCase()}` : null,
    r.soloEntreno.length ? `Solo entreno: ${y(r.soloEntreno).toLowerCase()}` : null,
    r.soloDescanso.length ? `Solo descanso: ${y(r.soloDescanso).toLowerCase()}` : null,
  ].filter((x): x is string => !!x)
  return (
    <Sheet
      title="Empezar la dieta"
      onClose={onClose}
      large
      footer={
        <div class={h.actions}>
          <Button
            onClick={async () => {
              await empezar(dieta, dia)
              // Tu plan pasa a ser tu dieta tal cual: sus menús, su ciclo y sus días de cocinar
              const antes = alPlan ? await menusDeTuDieta() : null
              if (alPlan) await cocinarComoLaDieta()
              onClose()
              avisar(
                `Empiezas «${dieta.nombre}»: hoy es el día ${dia}`,
                antes ? { label: 'Deshacer', onClick: () => void volverA(antes) } : undefined,
              )
            }}
          >
            Empezar hoy
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Ahora no
          </Button>
        </div>
      }
    >
      <div class={h.stack}>
        <p class={h.sub}>
          <b>{dieta.nombre}</b>
          {dieta.descripcion ? ` · ${dieta.descripcion}` : ''}
        </p>
        <div class={`${h.tiles} ${h.tres}`}>
          {[
            [String(v.menus), v.menus === 1 ? 'menú' : 'menús'],
            [String(v.recetas), v.recetas === 1 ? 'receta' : 'recetas'],
            [v.media ? formatInt(v.media) : '—', 'kcal de media'],
          ].map(([n, l]) => (
            <div key={l} class={h.tile}>
              <span class={h.tileValue}>{n}</span>
              <span class={h.foot}>{l}</span>
            </div>
          ))}
        </div>
        {v.media > 0 && (
          <section class={h.card} aria-label="Cambia tu objetivo">
            <span class={h.eyebrow}>Cambia tu objetivo</span>
            <p class={h.line}>
              <span>Media al día</span>
              {v.antes !== null && <span class={h.foot}>{formatInt(v.antes)} →</span>}
              <b>{formatInt(v.media)} kcal</b>
            </p>
            <p class={h.foot}>
              Mientras la sigas, mandan sus recetas: {formatInt(v.entreno)} kcal los días de entreno y{' '}
              {formatInt(v.descanso)} los de descanso. Tu objetivo de ahora se queda guardado: vuelves a él si
              la dejas.
            </p>
          </section>
        )}
        {dieta.ejemplo && (
          <p class={h.warn}>
            Es la dieta de ejemplo del prototipo: sirve para probar, no está pautada para ti.
          </p>
        )}
        <ul class={p.filas} aria-label="Lo que he leído">
          {leido.map((t) => (
            <li key={t} class={p.fila}>
              <span class={p.ok} aria-hidden="true">
                <CheckIcon />
              </span>
              <span class={p.que}>{t}</span>
            </li>
          ))}
        </ul>
        {(r.estimados.length > 0 || r.alGusto.length > 0) && (
          <ul class={p.filas} aria-label="Para revisar">
            {r.estimados.length > 0 && (
              <li class={p.fila}>
                <span class={p.que}>
                  Revisa {r.estimados.length} {r.estimados.length === 1 ? 'cantidad' : 'cantidades'}
                  <small>
                    {y(r.estimados.slice(0, 3)).toLowerCase()}
                    {r.estimados.length > 3 ? '…' : ''} venían en unidades: van con gramos aproximados.
                  </small>
                </span>
              </li>
            )}
            {r.alGusto.length > 0 && (
              <li class={p.fila}>
                <span class={p.que}>
                  Al gusto
                  <small>
                    {y(r.alGusto.slice(0, 3)).toLowerCase()}
                    {r.alGusto.length > 3 ? '…' : ''}: no suman kcal.
                  </small>
                </span>
              </li>
            )}
          </ul>
        )}
        <ul class={p.filas}>
          <li class={p.fila}>
            <label class={p.que} for="dia-del-ciclo">
              Hoy es el día
            </label>
            <MenuDesplegable
              id="dia-del-ciclo"
              etiqueta="Hoy es el día"
              valor={String(dia)}
              opciones={r.ciclo.map((_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
              onChange={(n) => setDia(Number(n))}
            />
          </li>
        </ul>
      </div>
    </Sheet>
  )
}
