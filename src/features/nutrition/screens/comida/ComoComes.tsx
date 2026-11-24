import { MenuDesplegable } from '../../../../shared/ui/MenuDesplegable.tsx'
import { type ComoComes as Como } from '../../state/recetas.ts'
import styles from './TusMenus.module.css'

const OPCIONES: { id: Como; nombre: string }[] = [
  { id: 'repartido', nombre: 'Repartido' },
  { id: 'desayuno', nombre: 'Desayuno' },
  { id: 'comida', nombre: 'Comida' },
  { id: 'cena', nombre: 'Cena' },
]

/**
 * La comida fuerte del día (usuario, 2026-11-19: en «Ajustes de tu dieta», una fila con su desplegable). Cada plato se
 * ajusta a lo que le toca (el reparto, en domain/fit.ts).
 */
export function ElegirComoComes(props: { valor: Como; onCambiar: (c: Como) => void }) {
  return (
    <li class={styles.ajuste}>
      <label class={styles.texto} for="comida-fuerte">
        <b>Comida fuerte</b>
        <span>Tus platos se reparten según esto</span>
      </label>
      <MenuDesplegable
        id="comida-fuerte"
        etiqueta="Comida fuerte"
        valor={props.valor}
        opciones={OPCIONES.map((x) => ({ value: x.id, label: x.nombre }))}
        onChange={props.onCambiar}
      />
    </li>
  )
}
