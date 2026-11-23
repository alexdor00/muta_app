import { useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { FilaComida } from '../../components/FilaComida.tsx'
import { diaVisto, objetivoDia, totalDia, type ComidaId } from '../../state/comida.ts'
import {
  comidasQueQuedan,
  cuadrarDia,
  faltaDia,
  grasaDeMas,
  fotos,
  mejoresPara,
  horaDeComida,
  menu,
  nombreDeComida,
  platosQueQuieres,
  repartir,
  repartoActual,
} from '../../state/recetas.ts'
import { apuntarPlato, desapuntar } from '../../use-cases/recipes.ts'
import { Comparacion } from '../comun/Comparacion.tsx'
import { comidaDe } from '../comun/platos.ts'
import styles from './CuadrarDia.module.css'
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
  const dia = cuadrarDia(platosQueQuieres.value, falta, quedan, elegidos)
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
    const partes = repartir(falta, quedan, repartoActual.value)
    const usados = dia.filter((d) => d.comida !== comida).map((d) => d.encaje.plato.id)
    const opciones = mejoresPara(platosQueQuieres.value, comida, partes[comida], 12, usados)
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
        {/* Lo que te queda, en grande y sencillo (usuario, 2026-11-19: «hazlo más bonito») */}
        <section class={styles.queda} aria-label="Lo que te queda hoy">
          <span class={styles.etiqueta}>Te quedan</span>
          <span class={styles.kcal}>
            <b>{formatInt(falta.kcal)}</b> kcal
          </span>
          <span class={styles.macros}>
            {formatInt(falta.protein)} g prot. · {formatInt(falta.carbs)} g hidr. · {formatInt(falta.fat)} g
            grasa
          </span>
          <span class={styles.para}>
            Para{' '}
            {quedan
              .map((c) => comidaDe(c).nombre.toLowerCase())
              .join(', ')
              .replace(/, ([^,]*)$/, ' y $1')}
          </span>
        </section>
        {grasaDeMas.value > 0 && (
          <p class={h.foot}>
            Llevas {grasaDeMas.value} g de grasa de más: los platos van con menos grasa y menos hidratos.
          </p>
        )}
        <ul class={styles.lista} aria-label="Lo que te propongo">
          {dia.map((d) => (
            <FilaComida
              key={d.comida}
              foto={fotos.value[d.encaje.plato.id] ?? null}
              etiqueta={`${horaDeComida(menu.value, d.comida)} · ${nombreDeComida(menu.value, d.comida)}`}
              nombre={d.encaje.plato.nombre}
              kcal={Math.round(d.encaje.ajuste.total.kcal)}
              etiquetaAccesible={`${comidaDe(d.comida).nombre}: ${d.encaje.plato.nombre}, cambiar por otro`}
              onClick={() => cambiar(d.comida, d.encaje.plato.id)}
            />
          ))}
        </ul>
        <p class={h.foot}>Toca una comida para cambiarla por otra receta.</p>
        <Comparacion titulo="Tu día con esto" total={despues} objetivo={objetivo} />
      </div>
    </Sheet>
  )
}
