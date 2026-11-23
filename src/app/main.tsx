import { render } from 'preact'
// Lo primero: el largo del historial al abrir (para volver a la pantalla de antes; ver shared/lib/historial.ts)
import '../shared/lib/historial.ts'
import '../shared/ui/tokens.css'
import '../shared/ui/base.css'
import { App } from './App.tsx'
import { startup } from './startup.ts'

render(<App />, document.getElementById('app')!)
void startup()
