import { useState } from 'preact/hooks'
import { paths } from '../../../../shared/lib/paths.ts'
import { CartIcon, PotIcon } from '../../../../shared/ui/iconosHoy.tsx'
import { BookIcon, CalendarIcon, DotsIcon } from '../../../../shared/ui/icons.tsx'
import { MenuList } from '../../../../shared/ui/MenuList.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { compraDeLaSemana } from '../../state/autopilot.ts'
import styles from './Accesos.module.css'

/**
 * Arriba de tu día: «Mi plan» y el «···» (usuario, 2026-11-21: como el de Tu plan en Entreno) con lo que se consulta
 * siempre: las recetas, la compra y cocinar ahora.
 */
export function Accesos() {
  const [abierta, setAbierta] = useState(false)
  const faltan = (compraDeLaSemana.value?.faltan ?? []).filter((x) => !x.comprado).length
  return (
    <nav class={styles.fila} aria-label="Más de Nutrición">
      <a class={styles.pildora} href={`${paths.nutrition}?vista=plan`}>
        <CalendarIcon />
        Mi plan
      </a>
      <button type="button" class={styles.puntos} aria-label="Más" onClick={() => setAbierta(true)}>
        <DotsIcon />
      </button>
      {abierta && (
        <Sheet title="Nutrición" onClose={() => setAbierta(false)}>
          <MenuList
            rows={[
              { label: 'Recetas', Icon: BookIcon, href: `${paths.nutrition}?vista=recetas` },
              {
                label: 'La compra',
                detail: faltan ? `${faltan} ${faltan === 1 ? 'cosa' : 'cosas'} por comprar` : 'Tu lista',
                Icon: CartIcon,
                href: paths.shopping,
              },
              {
                label: 'Cocinar ahora',
                detail: 'Cualquier plato de tus menús',
                Icon: PotIcon,
                href: paths.kitchen,
              },
            ]}
          />
        </Sheet>
      )}
    </nav>
  )
}
