import type { JSX } from 'preact'
import { useLocation } from 'preact-iso'
import { tabOf, tabs, type Tab } from '../shared/lib/paths.ts'
import { DumbbellIcon, ForkIcon, HomeIcon, TrendIcon } from '../shared/ui/icons.tsx'
import styles from './TabBar.module.css'

const ICON: Record<Tab, () => JSX.Element> = {
  today: HomeIcon,
  training: DumbbellIcon,
  nutrition: ForkIcon,
  progress: TrendIcon,
}

/** Las cuatro pestañas fijas abajo. Tocar una lleva siempre a su pantalla principal. */
export function TabBar() {
  const { path } = useLocation()
  const current = tabOf(path)
  return (
    <nav class={styles.bar} aria-label="Pestañas">
      {tabs.map((tab) => {
        const Icon = ICON[tab.id]
        return (
          <a
            key={tab.id}
            class={styles.tab}
            href={tab.path}
            aria-current={tab.id === current ? 'page' : undefined}
          >
            <Icon />
            {tab.label}
          </a>
        )
      })}
    </nav>
  )
}
