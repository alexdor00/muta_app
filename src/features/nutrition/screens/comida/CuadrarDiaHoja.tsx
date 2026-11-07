import { useState } from 'preact/hooks'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { PlatoFila } from '../../components/Platos.tsx'
import { diaVisto, objetivoDia, totalDia, type ComidaId } from '../../state/comida.ts'
import {
  comidasQueQuedan,
  cuadrarDia,
  faltaDia,
  fotos,
  mejoresPara,
  platos,
  repartir,
} from '../../state/recetas.ts'
import { apuntarPlato, desapuntar } from '../../use-cases/recipes.ts'
import { Comparacion } from '../comun/Comparacion.tsx'
import { comidaDe, macrosCortos } from '../comun/platos.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Props = { onClose: () => void; avisar: (texto: string, accion?: Aviso['accion']) => void }

/**
 * Cuadrar el día con recetas: un plato para cada comida que te queda, con sus gramos ajustados para que el día cierre.
 * «Cambiar» pasa al siguiente que mejor encaja; «Aplicar» los apunta todos (y se deshace).
 */
export function CuadrarDiaHoja({ onClose, avisar }: Props) {
  const [elegidos, setElegidos] = useState<Partial<Record<ComidaId, string>>>({})
  const falta = faltaDia.value
  const quedan = comidasQueQuedan.value
  const objetivo = objetivoDia.value
  if (!falta || !objetivo || !quedan.length) {
    return (
      <Sheet title="Cuadrar tu día" onClose={onClose}>
        <p class={h.sub}>
          {!objetivo ? 'Primero calcula tu objetivo.' : 'Ya tienes todas las comidas apuntadas.'}
        </p>
      </Sheet>
    )
  }
  const dia = cuadrarDia(platos.value, falta, quedan, elegidos)
  const despues = dia.reduce(
    (t, d) => ({
      kcal: t.kcal + d.encaje.ajuste.total.kcal,
      protein: t.protein + d.encaje.ajuste.total.protein,
      carbs: t.carbs + d.encaje.ajuste.total.carbs,
      fat: t.fat + d.encaje.ajuste.total.fat,
    }),
    totalDia.value,
  )
  const cambiar = (comida: ComidaId, actual: string) => {
    const partes = repartir(falta, quedan)
    const usados = dia.filter((d) => d.comida !== comida).map((d) => d.encaje.plato.id)
    const opciones = mejoresPara(platos.value, comida, partes[comida], 12, usados)
    const i = opciones.findIndex((e) => e.plato.id === actual)
    const siguiente = opciones[(i + 1) % opciones.length]
    if (siguiente) setElegidos({ ...elegidos, [comida]: siguiente.plato.id })
  }
  const fecha = diaVisto.value
  const aplicar = async () => {
    const ids: string[] = []
    for (const d of dia)
      ids.push(...(await apuntarPlato(d.encaje.plato, d.comida, d.encaje.ajuste.gramos, 1, fecha)))
    onClose()
    avisar(dia.length === 1 ? 'Apuntado' : `Apuntadas las ${dia.length}`, {
      label: 'Deshacer',
      onClick: () => void desapuntar(ids, fecha),
    })
  }
  return (
    <Sheet
      title="Cuadrar tu día"
      onClose={onClose}
      large
      footer={
        <div class={h.actions}>
          <Button disabled={!dia.length} onClick={() => void aplicar()}>
            {dia.length === 1 ? 'Aplicar y apuntar' : `Aplicar y apuntar las ${dia.length}`}
          </Button>
          <button type="button" class={h.textButton} onClick={onClose}>
            Ahora no
          </button>
        </div>
      }
    >
      <div class={h.stack}>
        <p class={`${h.sub} ${h.datos}`}>
          Te quedan {quedan.map((c) => comidaDe(c).nombre.toLowerCase()).join(', ')} ·{' '}
          <b>{macrosCortos(falta)}</b>
        </p>
        <ul class={h.list}>
          {dia.map((d) => (
            <PlatoFila
              key={d.comida}
              nombre={`${comidaDe(d.comida).nombre} · ${d.encaje.plato.nombre}`}
              foto={fotos.value[d.encaje.plato.id] ?? null}
              lineas={[macrosCortos(d.encaje.ajuste.total)]}
              href={paths.dish(d.encaje.plato.id, { comida: d.comida, fecha })}
              accion={
                <button
                  type="button"
                  class={h.textButton}
                  onClick={() => cambiar(d.comida, d.encaje.plato.id)}
                >
                  Cambiar
                </button>
              }
            />
          ))}
        </ul>
        <Comparacion titulo="Tu día con esto" total={despues} objetivo={objetivo} />
        <p class={h.foot}>
          Lo que falta se reparte entre las comidas que quedan (sugerido: desayuno 25 %, comida 35 %, merienda
          15 %, cena 25 %).
        </p>
      </div>
    </Sheet>
  )
}
