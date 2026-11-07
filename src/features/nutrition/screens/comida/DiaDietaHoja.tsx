import { formatDayDate } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { dieta, tiposEntreno, tipoDe } from '../../state/comida.ts'
import { diaDe, TIPOS_DIA, type TipoDia } from '../../state/dieta.ts'
import { anadirMenu, elegirTipo, menuDelDiaDelCiclo, tipoDeRutina } from '../../use-cases/diet.ts'
import h from '../comun/Hojas.module.css'

type Props = { fecha: string; onClose: () => void }

/** Un día de tu semana: si es de entreno o de descanso (manda sobre tu rutina) y qué menú va ese día del ciclo. */
export function DiaDietaHoja({ fecha, onClose }: Props) {
  const a = dieta.value
  const dia = diaDe(fecha)
  if (!a || !dia) return null
  const elegido = fecha in a.tipoElegido
  const deRutina = tiposEntreno.value?.[fecha]
  return (
    <Sheet title={formatDayDate(fecha)} onClose={onClose} large>
      <div class={h.stack}>
        <ChoiceSegmented<TipoDia>
          name="tipo-de-dia"
          legend="Ese día"
          showLegend
          options={TIPOS_DIA.map((t) => ({ value: t.id, label: t.nombre }))}
          value={tipoDe(fecha)}
          onChange={(t) => void elegirTipo(fecha, t)}
        />
        <p class={h.foot}>
          {elegido
            ? 'Lo has elegido tú.'
            : deRutina
              ? 'Lo dice tu rutina de Entreno.'
              : 'Sin rutina en Entreno: tus días de entreno, repartidos por la semana (sugerido).'}
        </p>
        {elegido && (
          <Button variant="secondary" onClick={() => void tipoDeRutina(fecha)}>
            Volver a lo que dice tu rutina
          </Button>
        )}
        <ChoiceSegmented<string>
          name="menu-del-dia"
          legend={`Menú del día ${dia.diaCiclo} del ciclo`}
          showLegend
          options={a.dieta.menus.map((m) => ({ value: m.id, label: m.nombre }))}
          value={dia.menu.id}
          onChange={(m) => void menuDelDiaDelCiclo(dia.diaCiclo, m)}
        />
        <p class={h.foot}>Cambia el menú de este día del ciclo: vale para todas las semanas.</p>
        <button
          type="button"
          class={h.textButton}
          onClick={async () => {
            const id = await anadirMenu()
            if (id) await menuDelDiaDelCiclo(dia.diaCiclo, id)
          }}
        >
          + Un menú nuevo para este día
        </button>
      </div>
    </Sheet>
  )
}
