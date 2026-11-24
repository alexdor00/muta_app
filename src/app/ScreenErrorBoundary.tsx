import { Component, type ComponentChildren } from 'preact'
import { useState } from 'preact/hooks'
import { logError } from '../shared/lib/logger.ts'
import { CopiaDeSeguridad } from '../features/profile/copia.ts'

type Props = { children: ComponentChildren }
type State = { failed: boolean; detalle: string | null }

/**
 * Lo que se ve cuando una pantalla falla o no carga: el aviso, el detalle (para poder decir qué pasó), «Volver», «Volver a
 * intentar» y tu copia de seguridad, por si sigue fallando (usuario, 2026-11-24).
 */
export function PantallaDeError({ detalle }: { detalle: string | null }) {
  const [aviso, setAviso] = useState<string | null>(null)
  return (
    <section role="alert">
      <h1>Algo ha fallado en esta pantalla</h1>
      <p>Tus datos están guardados. Vuelve atrás o inténtalo otra vez.</p>
      {detalle && <p>Detalle: {detalle}</p>}
      <button type="button" onClick={() => window.history.back()}>
        Volver
      </button>
      <button type="button" onClick={() => window.location.reload()}>
        Volver a intentar
      </button>
      <CopiaDeSeguridad avisar={setAviso} />
      {aviso && <p role="status">{aviso}</p>}
    </section>
  )
}

/**
 * Pantalla de error por pantalla: si una pantalla falla, se ve `PantallaDeError` y el resto de la app (pestañas, otras
 * pantallas) sigue funcionando.
 */
export class ScreenErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, detalle: null }

  componentDidCatch(error: unknown) {
    logError(error, `pantalla ${window.location.pathname}`)
    this.setState({ failed: true, detalle: error instanceof Error ? error.message : String(error) })
  }

  render() {
    if (!this.state.failed) return this.props.children
    return <PantallaDeError detalle={this.state.detalle} />
  }
}
