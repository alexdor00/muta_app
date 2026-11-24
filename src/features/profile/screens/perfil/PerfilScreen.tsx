import { useEffect, useState } from 'preact/hooks'
import { paths } from '../../../../shared/lib/paths.ts'
import { ChevronLeftIcon } from '../../../../shared/ui/icons.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { useVolver } from '../../../../shared/ui/useVolver.ts'
import { CopiaDeSeguridad } from './CopiaDeSeguridad.tsx'
import styles from './PerfilScreen.module.css'

/**
 * Perfil: tu copia de seguridad (usuario, 2026-11-24; `Desktop/MUTA-Copia-de-seguridad-propuesta.png`). «Tu material» se
 * quitó ese día. «‹» vuelve a la pantalla de la que vienes.
 */
export function PerfilScreen() {
  const volver = useVolver(paths.training)
  const [aviso, setAviso] = useState<string | null>(null)
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(t)
  }, [aviso])
  return (
    <div class={styles.page}>
      <header class={styles.bar}>
        <a
          class={styles.back}
          href={paths.training}
          aria-label="Volver"
          onClick={(e) => {
            e.preventDefault()
            volver()
          }}
        >
          <ChevronLeftIcon />
        </a>
        <h1 class={styles.title}>Perfil</h1>
        <span />
      </header>
      <CopiaDeSeguridad avisar={setAviso} />
      <Toast message={aviso} />
    </div>
  )
}
