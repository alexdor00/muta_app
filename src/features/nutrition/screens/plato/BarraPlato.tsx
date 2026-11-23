import { Button } from '../../../../shared/ui/Button.tsx'
import { PotIcon } from '../../../../shared/ui/iconosHoy.tsx'
import r from '../receta/Receta.module.css'
import styles from './Plato.module.css'

/**
 * Abajo de un plato. Normalmente, «Apuntar» (la hoja pregunta si es para hoy o para un menú; usuario, 2026-11-21) y la olla,
 * que abre su modo cocina. Desde un menú, ponerlo en esa comida del menú (o volver, si ya lo lleva) y apuntarlo ese día.
 */
export function BarraPlato(p: {
  /** Viene de elegir el plato de un menú: «Poner en Menú A · cena»; null si no. */
  enMenu: string | null
  yaEnMenu: boolean
  volver: string
  cuando: string
  onApuntar: () => void
  onPoner: () => void
  onApuntarHoy: () => void
  /** El modo cocina de la receta; null si no trae pasos. */
  onCocinar: (() => void) | null
}) {
  return (
    <div class={`${r.bottom} ${styles.abajo}`}>
      {!p.enMenu ? (
        <>
          <Button onClick={p.onApuntar}>Apuntar</Button>
          {p.onCocinar && (
            <button type="button" class={styles.olla} aria-label="Cocinar: modo cocina" onClick={p.onCocinar}>
              <PotIcon />
            </button>
          )}
        </>
      ) : p.yaEnMenu ? (
        <Button href={p.volver}>Volver al menú</Button>
      ) : (
        <>
          <Button onClick={p.onPoner}>{p.enMenu}</Button>
          <Button variant="secondary" onClick={p.onApuntarHoy}>
            Apuntar {p.cuando}
          </Button>
        </>
      )}
    </div>
  )
}
