import type { ComponentChildren } from 'preact'
import { useLocation } from 'preact-iso'
import { useRef } from 'preact/hooks'
import { paths } from '../../../../shared/lib/paths.ts'
import { CompactBar } from '../../../../shared/ui/CompactBar.tsx'
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader.tsx'
import { Barra } from '../comun/Barra.tsx'
import { Accesos } from './Accesos.tsx'
import styles from './ComidaScreen.module.css'

export type VistaNutricion = 'hoy' | 'plan' | 'menus' | 'recetas' | 'dieta'

/** Cada subvista vuelve a donde vive (usuario, 2026-11-15): el recetario, a tu día o a Tu semana; tu dieta, a Tu objetivo. */
function subvista(vista: Exclude<VistaNutricion, 'hoy'>, desde: string | undefined, menu?: string) {
  if (vista === 'plan') return { titulo: 'Mi plan', volver: paths.nutrition }
  if (vista === 'menus')
    return {
      titulo: 'Tu dieta',
      // un menú vuelve a Tu dieta; Tu dieta, a Mi plan
      volver: menu ? `${paths.nutrition}?vista=menus` : `${paths.nutrition}?vista=plan&paso=come`,
    }
  if (vista === 'dieta') return { titulo: 'Tu dieta', volver: paths.nutritionTarget }
  return { titulo: 'Recetas', volver: desde === 'plan' ? `${paths.nutrition}?vista=plan` : paths.nutrition }
}

/**
 * La cabecera de Nutrición. En tu día, como en Entreno: el título con el perfil y, al bajar, una barra fija con «Nutrición»
 * pequeño en el centro; a la derecha, solo «Plan» (usuario, 2026-11-18). En Plan, Tu dieta y Recetas, «‹» y su título.
 */
export function Cabecera({ vista, accion }: { vista: VistaNutricion; accion?: ComponentChildren }) {
  const cabecera = useRef<HTMLDivElement>(null)
  const { query } = useLocation()
  if (vista !== 'hoy') {
    const s = subvista(vista, query.desde, query.menu)
    return (
      <div class={styles.barra}>
        <Barra titulo={s.titulo} volver={s.volver} accion={accion} />
      </div>
    )
  }
  return (
    <>
      <CompactBar title="Nutrición" watch={cabecera} />
      <div ref={cabecera}>
        <ScreenHeader title="Nutrición" inline action={<Accesos />} />
      </div>
    </>
  )
}
