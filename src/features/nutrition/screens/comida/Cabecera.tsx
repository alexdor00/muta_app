import { useRef } from 'preact/hooks'
import { paths } from '../../../../shared/lib/paths.ts'
import { CompactBar } from '../../../../shared/ui/CompactBar.tsx'
import { SlidersIcon } from '../../../../shared/ui/icons.tsx'
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader.tsx'
import { Barra } from '../comun/Barra.tsx'
import styles from './ComidaScreen.module.css'

export type VistaNutricion = 'hoy' | 'plan' | 'recetas' | 'dieta'

const SUBVISTAS: Record<Exclude<VistaNutricion, 'hoy'>, { titulo: string; volver: string }> = {
  plan: { titulo: 'Tu plan', volver: paths.nutrition },
  recetas: { titulo: 'Recetas', volver: paths.nutrition },
  dieta: { titulo: 'Tu dieta', volver: `${paths.nutrition}?vista=plan` },
}

/**
 * La cabecera de Nutrición. En tu día, como en Entreno: el título grande con «Tu plan» y el perfil y, al bajar, una
 * barra fija con «Nutrición» pequeño en el centro. En Tu plan, Recetas y Tu dieta, «‹» y su título.
 */
export function Cabecera({ vista, conPlan }: { vista: VistaNutricion; conPlan: boolean }) {
  const cabecera = useRef<HTMLDivElement>(null)
  if (vista !== 'hoy')
    return (
      <div class={styles.barra}>
        <Barra titulo={SUBVISTAS[vista].titulo} volver={SUBVISTAS[vista].volver} />
      </div>
    )
  return (
    <>
      <CompactBar title="Nutrición" watch={cabecera} />
      <div ref={cabecera}>
        <ScreenHeader
          title="Nutrición"
          avatarHref={paths.profile}
          inline
          action={
            conPlan && (
              <a class={styles.plan} href={`${paths.nutrition}?vista=plan`}>
                <SlidersIcon />
                Tu plan
              </a>
            )
          }
        />
      </div>
    </>
  )
}
