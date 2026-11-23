import { useState } from 'preact/hooks'
import { addDays, formatInt } from '../../../../shared/lib/format.ts'
import { nuevoId } from '../../../../shared/lib/id.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { CheckIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { tandaDeHueco, tandas } from '../../state/autopilot.ts'
import { PlatoFoto } from '../../components/Platos.tsx'
import { COMIDAS, hoy } from '../../state/comida.ts'
import {
  clave,
  DIA_LARGO,
  DIAS_NEVERA,
  diaSemana,
  enCrudoDe,
  fotos,
  gramosDeHueco,
  huecosDelDia,
  LETRA_DIA,
  menu,
  paraCocinar,
  pasanDeLaNevera,
  platoPorId,
  type Cocinado,
  type Hueco,
} from '../../state/recetas.ts'
import { guardarSesion, marcarCocinados, volverA } from '../../use-cases/menu.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'
import c from './CocinarAparte.module.css'

type Props = {
  /** El cocinado con el que se abre: su día y su hora traen los demás platos de esa misma vez. */
  cocinado: Cocinado
  onClose: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

/**
 * Cocinar aparte (fuera de tus tandas): el día, la hora y qué comidas de tu semana cocinas de una vez, de cualquier plato
 * (desayuno, comida, merienda o cena). Lo que ya cocinas otra vez sale tachado. Debajo, el total de cada plato; cada comida se
 * sirve luego con sus gramos de su día.
 */
export function CocinarHoja({ cocinado, onClose, avisar }: Props) {
  // Los platos que ya cocinas a esa misma hora ese día van juntos
  const sesion = menu.value.cocinados.filter(
    (x) => x.id === cocinado.id || (x.fecha === cocinado.fecha && x.hora === cocinado.hora),
  )
  const ids = sesion.map((x) => x.id)
  // Ya guardado (no uno nuevo) y si ya lo cocinaste
  const guardada = sesion.some((x) => menu.value.cocinados.includes(x))
  const hecho = guardada && sesion.every((x) => x.hecho)
  const [fecha, setFecha] = useState(cocinado.fecha)
  const [hora, setHora] = useState(cocinado.hora)
  const [para, setPara] = useState<string[]>(() => [
    ...new Set([...cocinado.para, ...sesion.flatMap((x) => x.para)]),
  ])
  const dias = Array.from({ length: 7 }, (_, i) => addDays(hoy.value, i))
  const huecos = dias.filter((d) => d >= fecha).flatMap((d) => huecosDelDia(menu.value, d))
  const elegidos = huecos.filter((x) => para.includes(clave(x.fecha, x.comida)))
  // Cada plato con sus comidas: lo que se guarda (un cocinado por plato, a la misma hora)
  const porPlato = [...new Set(elegidos.map((x) => x.plato))].map((plato) => ({
    plato,
    para: elegidos.filter((x) => x.plato === plato).map((x) => clave(x.fecha, x.comida)),
  }))
  const nuevos: Cocinado[] = porPlato.map((x) => ({
    id: sesion.find((y) => y.plato === x.plato)?.id ?? nuevoId(),
    hecho: sesion.find((y) => y.plato === x.plato)?.hecho,
    plato: x.plato,
    fecha,
    hora,
    para: x.para,
  }))
  const fuera = pasanDeLaNevera(fecha, para)
  const nombreComida = (x: Hueco) => COMIDAS.find((k) => k.id === x.comida)?.nombre ?? ''
  const elDia = (d: string) => (d === hoy.value ? 'hoy' : `el ${DIA_LARGO[diaSemana(d)]}`)

  async function guardar() {
    const antes = menu.value
    await guardarSesion(ids, nuevos)
    onClose()
    avisar(`Cocinas ${elDia(fecha)} a las ${hora}`, {
      label: 'Deshacer',
      onClick: () => void volverA(antes),
    })
  }
  async function quitar() {
    const antes = menu.value
    await guardarSesion(ids, [])
    onClose()
    avisar('Cada comida se cocina su día', { label: 'Deshacer', onClick: () => void volverA(antes) })
  }

  return (
    <Sheet
      title={`Cocinas ${elDia(fecha)}`}
      onClose={onClose}
      large
      footer={
        <div class={h.actions}>
          <Button disabled={!para.length} onClick={() => void guardar()}>
            {para.length
              ? `Guardar · ${para.length} ${para.length === 1 ? 'comida' : 'comidas'}`
              : 'Marca lo que dejas hecho'}
          </Button>
          {guardada && cocinado.fecha <= hoy.value && (
            <Button
              variant="secondary"
              onClick={async () => {
                await marcarCocinados(ids, !hecho)
                onClose()
                avisar(hecho ? 'Sin cocinar' : 'Cocinado: tachado también en Hoy')
              }}
            >
              {hecho ? 'Marcar sin cocinar' : 'Ya lo he cocinado'}
            </Button>
          )}
          {guardada && (
            <button type="button" class={`${h.textButton} ${h.danger}`} onClick={() => void quitar()}>
              Quitar este día de cocina
            </button>
          )}
        </div>
      }
    >
      <div class={h.stack}>
        {/* Cuándo: el día en una fila de círculos (con su número) y la hora junto al título (usuario, 2026-11-16) */}
        <section class={c.tarjeta} aria-labelledby="cocinar-cuando">
          <div class={c.cabeza}>
            <h3 id="cocinar-cuando" class={c.titulo}>
              ¿Qué día?
            </h3>
            <label class={c.aLas}>
              a las
              <input
                class={c.hora}
                type="time"
                aria-label="Hora de cocinar"
                value={hora}
                onInput={(e) => setHora(e.currentTarget.value || hora)}
              />
            </label>
          </div>
          <div class={c.dias}>
            {dias.map((d) => (
              <button
                key={d}
                type="button"
                class={c.dia}
                aria-pressed={d === fecha}
                aria-label={`${LETRA_DIA[diaSemana(d)]} · ${d === hoy.value ? 'hoy' : DIA_LARGO[diaSemana(d)]} ${Number(d.slice(8))}`}
                onClick={() => {
                  setFecha(d)
                  // Lo de antes de ese día ya no se puede cocinar ese día
                  setPara(para.filter((k) => k.split('|')[0] >= d))
                }}
              >
                <small>{LETRA_DIA[diaSemana(d)]}</small>
                {Number(d.slice(8))}
              </button>
            ))}
          </div>
        </section>

        <p class={c.nota}>
          Marca lo que dejas hecho. Lo que no marques lo cocinas el mismo día que te lo comes.
        </p>

        {/* Las comidas de esos días, en una lista con su foto: un toque marca o desmarca */}
        <section class={c.tarjeta} aria-label="Lo que dejas hecho">
          {dias
            .filter((d) => d >= fecha)
            .map((d) => {
              const delDia = huecos.filter((x) => x.fecha === d)
              if (!delDia.length) return null
              return (
                <div key={d}>
                  <p class={c.diaNombre}>
                    {d === hoy.value ? 'Hoy' : `${DIA_LARGO[diaSemana(d)]} ${Number(d.slice(8))}`}
                  </p>
                  <ul class={c.lista}>
                    {delDia.map((x) => {
                      const k = clave(x.fecha, x.comida)
                      const on = para.includes(k)
                      // Ya lo cocinas otra vez: no se puede marcar aquí
                      const otra = x.cocinado && !ids.includes(x.cocinado)
                      const otraVez = otra ? menu.value.cocinados.find((y) => y.id === x.cocinado) : null
                      const tanda = otra ? null : tandaDeHueco(tandas.value, x)
                      const p = platoPorId(x.plato, x.fecha)
                      return (
                        <li key={k}>
                          <button
                            type="button"
                            class={c.fila}
                            aria-pressed={on}
                            disabled={!!otra}
                            onClick={() => setPara(on ? para.filter((y) => y !== k) : [...para, k])}
                          >
                            <PlatoFoto foto={fotos.value[x.plato] ?? null} />
                            <span class={c.texto}>
                              <span class={c.comida}>{nombreComida(x)}</span>
                              <span class={c.plato}>{p?.nombre ?? 'Plato'}</span>
                              {otraVez ? (
                                <span class={c.ya}>Ya lo cocinas {elDia(otraVez.fecha)}</span>
                              ) : (
                                tanda &&
                                !on && (
                                  <span class={c.ya}>Ya va en tu día de cocina {elDia(tanda.fecha)}</span>
                                )
                              )}
                            </span>
                            <span class={c.marca} aria-hidden="true">
                              {on && <CheckIcon />}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          {!huecos.length && <p class={c.nota}>Pon platos en tus menús para cocinarlos de una vez.</p>}
        </section>

        {fuera.length > 0 && (
          <p class={h.warn} role="status">
            Lo cocinado aguanta {DIAS_NEVERA} días en la nevera: lo del{' '}
            {[...new Set(fuera.map((k) => DIA_LARGO[diaSemana(k.split('|')[0])]))].join(', ')}, mejor hazlo
            ese día.
          </p>
        )}

        {nuevos.length > 0 && (
          <section class={c.tarjeta} aria-label="Cocinas en total">
            <div class={c.cabeza}>
              <h3 class={c.titulo}>
                Cocinas {para.length} {para.length === 1 ? 'ración' : 'raciones'}
              </h3>
            </div>
            <p class={c.nota}>
              {nuevos
                .map((x) => {
                  const p = platoPorId(x.plato)
                  return p ? `${p.nombre} ×${x.para.length}` : null
                })
                .filter(Boolean)
                .join(' · ')}
            </p>
            <details class={c.cantidades}>
              <summary>Ver cuánto de cada cosa</summary>
              {nuevos.map((x) => {
                const p = platoPorId(x.plato)
                if (!p) return null
                return (
                  <div key={x.plato} class={c.total}>
                    <p class={c.totalNombre}>
                      {p.nombre} ×{x.para.length}
                    </p>
                    {paraCocinar(menu.value, x, p, gramosDeHueco)
                      .filter((i) => i.gramos)
                      .map((i) => {
                        const crudo = enCrudoDe(i.alimentoId, i.gramos!)
                        return (
                          <p key={i.texto} class={h.line}>
                            <span class={h.rowMain}>
                              <span>{crudo?.nombre ?? i.nombre}</span>
                              {crudo && <span class={h.foot}>≈ {formatInt(i.gramos!)} g cocido</span>}
                            </span>
                            <b>{formatInt(crudo?.gramos ?? i.gramos!)} g</b>
                          </p>
                        )
                      })}
                  </div>
                )
              })}
              <p class={h.foot}>Luego cada comida lleva los gramos de su día.</p>
            </details>
          </section>
        )}
      </div>
    </Sheet>
  )
}
