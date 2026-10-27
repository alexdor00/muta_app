import { render } from 'preact'
import '../shared/ui/tokens.css'
import '../shared/ui/base.css'
import { App } from './App.tsx'
import { startup } from './startup.ts'

render(<App />, document.getElementById('app')!)
void startup()
