import { useLocation } from 'preact-iso'
import { useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { PlatoFila } from '../../components/Platos.tsx'
import type { ComidaId } from '../../state/comida.ts'
import {
  ajustar,
  comidasQueQuedan,
  faltaDia,
  fotos,
  llegaHasta,
  MACROS,
  mejoresPara,
  platos,
  repartir,
  type Plato,
} from '../../state/recetas.ts'
import { apuntarPlato, desapuntar } from '../../use-cases/recipes.ts'
import { Comparacion } from '../comun/Comparacion.tsx'
import { comidaDe, macrosCortos } from '../comun/platos.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'
import styles from './Plato.module.css'

type Props = {
  plato: Plato
  comida: ComidaId
  fecha: string
  onClose: () => void
  /** Ver la receta con estos gramos (sin apuntar). */
  onVer: (gramos: (number | null)[]) => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

/**
 * Ajustar un plato a lo que te falta: lo que te queda para esta comida (o repartido hasta la última), los gramos que
 * cambian y cómo queda. Si no llega, dice hasta dónde y da salidas: repartir, añadir algo u otra receta.
 */
export function AjustarHoja({ plato, comida, fecha, onClose, onVer, avisar }: Props) {
  const { route } = useLocation()
  const quedan = comidasQueQuedan.value
  const puedeRepartir = quedan.length > 1 && quedan.includes(comida)
  const [modo, setModo] = useState<'sola' | 'repartir'>(puedeRepartir ? 'repartir' : 'sola')
  const falta = faltaDia.value
  const de = comidaDe(comida)
  if (!falta) {
    return (
      <Sheet title={`Ajustar ${de.al}`} onClose={onClose}>
        <p class={h.sub}>Para ajustar hace falta tu objetivo: calcúlalo en Comida · Hoy.</p>
      </Sheet>
    )
  }
  const objetivo = modo === 'repartir' && puedeRepartir ? repartir(falta, quedan)[comida] : falta
  const a = ajustar(plato, objetivo)
  const cambian = plato.ingredientes.flatMap((i, k) =>
    i.macro && i.gramos !== null ? [{ i, k, antes: i.gramos, despues: a.gramos[k] ?? i.gramos }] : [],
  )
  const quietos = plato.ingredientes.filter((i) => i.cuenta && !i.macro).map((i) => i.nombre.toLowerCase())
  const nombre = (m: string) => MACROS.find((x) => x.id === m)?.nombre.toLowerCase() ?? m
  const otras = a.corto.length ? mejoresPara(platos.value, comida, objetivo, 3, [plato.id]).slice(0, 2) : []
  const corto = a.corto[0]

  const aplicar = async () => {
    const ids = await apuntarPlato(plato, comida, a.gramos, 1, fecha)
    onClose()
    avisar(`Ajustado y apuntado en ${de.nombre.toLowerCase()}`, {
      label: 'Deshacer',
      onClick: () => void desapuntar(ids, fecha),
    })
  }

  return (
    <Sheet
      title={`Ajustar ${de.al}`}
      onClose={onClose}
      large
      footer={
        <div class={h.actions}>
          <Button onClick={() => void aplicar()}>Aplicar y apuntar</Button>
          <Button variant="secondary" onClick={() => onVer(a.gramos)}>
            Ver la receta así
          </Button>
          <button type="button" class={h.textButton} onClick={onClose}>
            Ahora no
          </button>
        </div>
      }
    >
      <div class={h.stack}>
        <p class={`${h.sub} ${h.datos}`}>
          {modo === 'repartir' && puedeRepartir ? `Le toca ${de.al}` : 'Te faltan'}{' '}
          <b>{macrosCortos(objetivo)}</b>
        </p>
        {puedeRepartir && (
          <ChoiceSegmented<'sola' | 'repartir'>
            name="ajustar-modo"
            legend="Lo que falta"
            options={[
              { value: 'sola', label: 'Todo en esta comida' },
              { value: 'repartir', label: `Repartir hasta ${comidaDe(quedan.at(-1)!).el}` },
            ]}
            value={modo}
            onChange={setModo}
          />
        )}
        {cambian.length > 0 && (
          <ul class={h.list}>
            {cambian.map(({ i, k, antes, despues }) => (
              <li key={k} class={h.line}>
                <span>
                  <span class={styles.tag}>{MACROS.find((m) => m.id === i.macro)?.corto}</span> {i.nombre}
                </span>
                <b>
                  {antes !== despues && <span class={styles.old}>{formatInt(antes)}</span>}
                  {formatInt(despues)} g{antes === despues ? ' · igual' : ''}
                </b>
              </li>
            ))}
          </ul>
        )}
        {quietos.length > 0 && <p class={h.foot}>Igual: {quietos.join(', ')} y lo que va al gusto.</p>}
        <Comparacion titulo="Así queda · frente a lo que buscas" total={a.total} objetivo={objetivo} />
        {a.sobra.length > 0 && !a.corto.length && (
          <p class={h.foot}>
            {a.sobra.map(nombre).join(' y ')}: algo de más; lo trae el plato aunque se baje al mínimo.
          </p>
        )}
        {corto && (
          <section class={h.card} aria-label="No llega">
            <p class={h.eyebrow}>No llega</p>
            <p class={h.sub}>
              Este plato llega a{' '}
              <b>
                {formatInt(llegaHasta(plato, corto))} g de {nombre(corto)}
              </b>{' '}
              con lo que lo aporta al máximo. Te quedarían{' '}
              <b>
                {formatInt(Math.max(0, objetivo[corto] - a.total[corto]))} g de {nombre(corto)}
              </b>
              .
            </p>
            {puedeRepartir && modo === 'sola' && (
              <Button variant="secondary" onClick={() => setModo('repartir')}>
                Repartir con las otras comidas
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={async () => {
                await apuntarPlato(plato, comida, a.gramos, 1, fecha)
                route(`${paths.nutrition}?anadir=${comida}`)
              }}
            >
              Apuntar así y añadir algo más
            </Button>
            {otras.length > 0 && (
              <>
                <p class={h.foot}>O una receta que llega mejor:</p>
                <ul class={h.list}>
                  {otras.map((e) => (
                    <PlatoFila
                      key={e.plato.id}
                      nombre={e.plato.nombre}
                      foto={fotos.value[e.plato.id] ?? null}
                      lineas={[`Ajustada: ${macrosCortos(e.ajuste.total)}`]}
                      href={paths.dish(e.plato.id, { comida, fecha })}
                    />
                  ))}
                </ul>
              </>
            )}
          </section>
        )}
      </div>
    </Sheet>
  )
}
