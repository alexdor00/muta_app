import type { JSX } from 'preact'
import { useEffect } from 'preact/hooks'
import { ORDEN_TAREA, type TareaDeHoy } from '../../../../shared/lib/tareaDeHoy.ts'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import {
  ajustesCuerpo,
  contestadas,
  diasDelMes,
  estado,
  hoy,
  PREGUNTAS,
  resumenSensaciones,
  sensaciones,
  toca,
} from '../../state/progreso.ts'
import { cargarProgreso } from '../../use-cases/progress.ts'
import { MesHoja } from '../progreso/MesHoja.tsx'
import { SensacionesHoja } from './SensacionesHoja.tsx'

export type HoyDeProgreso = {
  listo: boolean
  tareas: TareaDeHoy[]
  /** Lo próximo que no es hoy («Medidas y fotos en 22 días», o «el día 15»), o null. */
  proximo: string | null
  /** Abre lo próximo (la hoja del mes, donde eliges su día). */
  abrirProximo: () => void
  hojas: JSX.Element
}

/**
 * Lo de Progreso en Hoy, como cosas que hacer: ¿Cómo estás hoy? (cada día) y, el día que tocan, tus medidas y fotos del
 * mes (abre `MesHoja`). Lo de cada mes, si no es hoy, sale solo como «lo próximo».
 */
export function useHoyDeProgreso(avisar: (texto: string) => void): HoyDeProgreso {
  useEffect(() => {
    void cargarProgreso()
  }, [])
  const como = useSheet('como-estas')
  const mes = useSheet('mes')
  const hojas = (
    <>
      {como.open && <SensacionesHoja onClose={como.close} avisar={avisar} />}
      {mes.open && <MesHoja onClose={mes.close} avisar={avisar} />}
    </>
  )
  const abrirProximo = () => mes.show()
  if (estado.value !== 'listo') return { listo: false, tareas: [], proximo: null, abrirProximo, hojas }
  const fecha = hoy.value
  const deHoy = sensaciones.value.find((s) => s.date === fecha)
  const n = contestadas(deHoy)
  const tareas: TareaDeHoy[] = [
    {
      id: 'sensaciones',
      orden: ORDEN_TAREA.sensaciones,
      icono: 'sensaciones',
      titulo: '¿Cómo estás?',
      corta: 'cómo estás',
      detalle: n ? resumenSensaciones(deHoy) : 'Sueño, energía y 3 más',
      hecha: n > 0,
      boton: n ? undefined : `${PREGUNTAS.length} toques`,
      onClick: como.show,
    },
  ]
  const t = toca.value
  const hechasHoy = t.ultima === fecha
  if (t.ahora || hechasHoy)
    tareas.push({
      id: 'medidas',
      orden: ORDEN_TAREA.medidas,
      icono: 'medidas',
      titulo: 'Medidas y fotos del mes',
      corta: 'tus medidas',
      detalle: hechasHoy ? 'Hechas' : 'Toca este mes',
      hecha: hechasHoy,
      boton: hechasHoy ? undefined : 'Empezar',
      onClick: () => mes.show(),
    })
  const elegido = ajustesCuerpo.value.diaMedidas
  // El 31 en un mes de 30 es su último día (como en `cuandoToca`)
  const dia = elegido && Math.min(elegido, diasDelMes(hoy.value.slice(0, 7)))
  const proximo =
    !t.ahora && !hechasHoy && t.enDias > 0
      ? `Medidas y fotos ${dia ? `el día ${dia}` : `en ${t.enDias} ${t.enDias === 1 ? 'día' : 'días'}`}`
      : null
  return { listo: true, tareas, proximo, abrirProximo, hojas }
}
