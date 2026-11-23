import { useLocation } from 'preact-iso'
import { useEffect } from 'preact/hooks'
import { racionesDeMas } from '../../use-cases/autopilot.ts'
import { COMIDAS, hoy, type ComidaId } from '../../state/comida.ts'
import { TandaScreen } from './TandaScreen.tsx'

const esComida = (c: unknown): c is ComidaId => COMIDAS.some((x) => x.id === c)

/**
 * El modo cocina de cualquier plato de tus menús (usuario, 2026-11-21 y 2026-11-22: «que te lleve al modo cocina»): el
 * mismo que el de tus días de cocina —lo que sacas, los pasos uno a uno y, si lleva algo que se cuece, pesarlo—, solo
 * con ese plato y los gramos de su menú.
 */
export function CocinarPlatoScreen(props: { plato: string }) {
  const { query } = useLocation()
  const comida = esComida(query.comida) ? query.comida : 'comida'
  const menuId = typeof query.menu === 'string' ? query.menu : ''
  // Desde una receta: entra con sus raciones (la tuya y las de más; con una, sin las de otra vez)
  const raciones = Number(query.raciones) || 1
  useEffect(() => {
    if (!menuId) void racionesDeMas(hoy.value, props.plato, raciones - 1)
  }, [menuId, props.plato, raciones])
  return <TandaScreen fecha={hoy.value} deMenu={{ plato: props.plato, menu: menuId, comida }} />
}
