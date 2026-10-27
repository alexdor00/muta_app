import { Component, type ComponentChildren } from 'preact'
import { logError } from '../shared/lib/logger.ts'

type Props = { children: ComponentChildren }
type State = { failed: boolean }

/**
 * Pantalla de error por pantalla: si una pantalla falla, se ve un aviso con «Volver»
 * y el resto de la app (pestañas, otras pantallas) sigue funcionando.
 */
export class ScreenErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  componentDidCatch(error: unknown) {
    logError(error, `pantalla ${window.location.pathname}`)
    this.setState({ failed: true })
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <section role="alert">
        <h1>Algo ha fallado en esta pantalla</h1>
        <p>Tus datos están guardados. Vuelve atrás y prueba otra vez.</p>
        <button type="button" onClick={() => window.history.back()}>
          Volver
        </button>
      </section>
    )
  }
}
