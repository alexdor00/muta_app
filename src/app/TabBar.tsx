import { useLocation } from 'preact-iso'
import { tabOf, tabs } from '../shared/lib/paths.ts'

/** Las cuatro pestañas fijas abajo. Tocar una lleva siempre a su pantalla principal. */
export function TabBar() {
  const { path } = useLocation()
  const current = tabOf(path)
  return (
    <nav aria-label="Pestañas">
      {tabs.map((tab) => (
        <a key={tab.id} href={tab.path} aria-current={tab.id === current ? 'page' : undefined}>
          {tab.label}
        </a>
      ))}
    </nav>
  )
}
