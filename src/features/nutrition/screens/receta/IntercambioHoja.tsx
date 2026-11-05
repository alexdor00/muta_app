import { useEffect, useState } from 'preact/hooks'
import { formatDecimal, formatInt } from '../../../../shared/lib/format.ts'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { base, type Alimento } from '../../state/comida.ts'
import { COMPENSAR, intercambios, NOMBRE_MACRO, type Receta, type RecetaDelDia } from '../../state/dieta.ts'
import { cargarAlimentos } from '../../use-cases/foodLog.ts'
import {
  apuntarReceta,
  conCambio,
  guardarReceta,
  quitarReceta,
  recetaDeHoyCon,
} from '../../use-cases/diet.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Modo = 'hoy' | 'siempre'

type Props = {
  receta: Receta
  delDia: RecetaDelDia
  indice: number
  raciones: number
  fecha: string
  onClose: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

const de5 = (n: number) => Math.max(5, Math.round(n / 5) * 5)

/**
 * Intercambios de un ingrediente, como «Cambiar ejercicio» en la sesión: los mismos gramos de su macro principal. Solo
 * hoy (se apunta la receta con el cambio) o para siempre en la receta.
 */
export function IntercambioHoja({ receta, delDia, indice, raciones, fecha, onClose, avisar }: Props) {
  const [modo, setModo] = useState<Modo>('hoy')
  useEffect(() => {
    void cargarAlimentos()
  }, [])
  const i = delDia.lista[indice]
  const g = (i.g ?? 0) / raciones
  const r = base.value ? intercambios(i, g, base.value) : null

  async function elegir(a: Alimento, gramos: number) {
    if (modo === 'hoy') {
      await quitarReceta(receta.id, fecha)
      await apuntarReceta(recetaDeHoyCon(delDia, indice, a, gramos), fecha)
      onClose()
      return avisar(`Apuntada con ${a.name.toLowerCase()}`, {
        label: 'Deshacer',
        onClick: () => void quitarReceta(receta.id, fecha),
      })
    }
    // Para siempre: los gramos de entreno (si se está viendo la de descanso, en su misma proporción)
    const x = receta.ingredientes[indice]
    const entreno =
      delDia.tipo === 'entreno' || !x.gramos?.descanso
        ? gramos
        : de5((gramos * x.gramos.entreno) / x.gramos.descanso)
    const antes = receta
    await guardarReceta(conCambio(receta, indice, a, entreno))
    onClose()
    avisar(`${a.name}: cambiado en la receta`, {
      label: 'Deshacer',
      onClick: () => void guardarReceta(antes),
    })
  }

  return (
    <Sheet title={`Cambiar ${i.nombre.toLowerCase()}`} onClose={onClose} large>
      <div class={h.stack}>
        {r ? (
          <>
            <p class={h.sub}>
              {formatInt(g)} g son{' '}
              <b>
                {formatDecimal(r.cantidad)} g de {NOMBRE_MACRO[r.macro]}
              </b>{' '}
              ({formatInt((i.por100.kcal * g) / 100)} kcal). Con estas cantidades comes lo mismo:
            </p>
            <ChoiceSegmented<Modo>
              name="intercambio-modo"
              legend="El cambio vale"
              options={[
                { value: 'hoy', label: 'Solo hoy' },
                { value: 'siempre', label: 'En la receta, siempre' },
              ]}
              value={modo}
              onChange={setModo}
            />
            <ul class={h.list}>
              {r.lista.map((x) => (
                <li key={x.alimento.id} class={h.row}>
                  <button type="button" class={h.rowMain} onClick={() => void elegir(x.alimento, x.gramos)}>
                    <span class={h.rowTitle}>{x.alimento.name}</span>
                    <span class={h.rowDetail}>
                      {formatInt(x.kcal)} kcal
                      {Math.abs(x.diferencia) >= 10
                        ? ` · ${x.diferencia > 0 ? '+' : '−'}${formatInt(Math.abs(x.diferencia))}`
                        : ''}
                      {x.diferencia > COMPENSAR ? ' · compénsalo en otra comida' : ''}
                    </span>
                  </button>
                  <span class={h.tileValue}>{formatInt(x.gramos)} g</span>
                </li>
              ))}
            </ul>
            <p class={h.foot}>
              Un nutricionista lo llama «intercambio»: cambias el alimento sin salirte de tus macros.
            </p>
          </>
        ) : (
          <p class={h.sub}>Cargando alimentos…</p>
        )}
      </div>
    </Sheet>
  )
}
