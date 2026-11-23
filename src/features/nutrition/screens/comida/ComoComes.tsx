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
      <select
        id="comida-fuerte"
        class={styles.desplegable}
        value={props.valor}
        onChange={(e) => props.onCambiar(e.currentTarget.value as Como)}
      >
        {OPCIONES.map((x) => (
          <option key={x.id} value={x.id}>
            {x.nombre}
          </option>
        ))}
      </select>
    </li>
  )
}
