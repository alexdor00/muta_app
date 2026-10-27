import { render } from 'preact'
import { App } from './App.tsx'
import { startup } from './startup.ts'

render(<App />, document.getElementById('app')!)
void startup()
