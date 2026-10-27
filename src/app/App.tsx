import type { ComponentChildren, FunctionComponent } from 'preact'
import { useLayoutEffect } from 'preact/hooks'
import { ErrorBoundary, LocationProvider, Route, Router, lazy, useLocation } from 'preact-iso'
import { logError } from '../shared/lib/logger.ts'
import { isFullScreen, paths, patterns } from '../shared/lib/paths.ts'
import { Pending } from '../shared/ui/Pending.tsx'
import { ScreenErrorBoundary } from './ScreenErrorBoundary.tsx'
import { TabBar } from './TabBar.tsx'

function ScreenGuard(props: { children: ComponentChildren }) {
  const { path } = useLocation()
  return <ScreenErrorBoundary key={path}>{props.children}</ScreenErrorBoundary>
}

/**
 * Una pantalla: se descarga solo cuando se abre (abrir Entreno no descarga Comida)
 * y va dentro de su propia pantalla de error, que se reinicia al cambiar de ruta.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- cada pantalla tiene sus propias props
function screen<P extends Record<string, any>>(load: () => Promise<FunctionComponent<P>>) {
  const Lazy = lazy<FunctionComponent<P>>(load)
  return function Screen(props: P) {
    return (
      <ScreenGuard>
        <Lazy {...props} />
      </ScreenGuard>
    )
  }
}

const TuPlan = screen(() =>
  import('../features/training/screens/tu-plan/TuPlanScreen.tsx').then((m) => m.TuPlanScreen),
)
const TuRutina = screen(() =>
  import('../features/training/screens/tu-rutina/TuRutinaScreen.tsx').then((m) => m.TuRutinaScreen),
)
const SesionInicio = screen(() =>
  import('../features/training/screens/sesion-inicio/SesionInicioScreen.tsx').then(
    (m) => m.SesionInicioScreen,
  ),
)
const Sesion = screen(() =>
  import('../features/training/screens/sesion/SesionScreen.tsx').then((m) => m.SesionScreen),
)
const Resumen = screen(() =>
  import('../features/training/screens/resumen/ResumenScreen.tsx').then((m) => m.ResumenScreen),
)
const FichaEjercicio = screen(() =>
  import('../features/training/screens/ejercicio/FichaEjercicioScreen.tsx').then(
    (m) => m.FichaEjercicioScreen,
  ),
)
const Hoy = screen(() => import('../features/today/screens/hoy/HoyScreen.tsx').then((m) => m.HoyScreen))
const Comida = screen(() =>
  import('../features/nutrition/screens/comida/ComidaScreen.tsx').then((m) => m.ComidaScreen),
)
const Progreso = screen(() =>
  import('../features/progress/screens/progreso/ProgresoScreen.tsx').then((m) => m.ProgresoScreen),
)
const Perfil = screen(() =>
  import('../features/profile/screens/perfil/PerfilScreen.tsx').then((m) => m.PerfilScreen),
)
const Bienvenida = screen(() =>
  import('../features/profile/screens/bienvenida/BienvenidaScreen.tsx').then((m) => m.BienvenidaScreen),
)

function GoToToday() {
  const { route } = useLocation()
  useLayoutEffect(() => route(paths.today, true), [route])
  return null
}

function NotFoundScreen() {
  return (
    <Pending code="404" title="Esta pantalla no existe">
      <a href={paths.today}>Ir a Hoy</a>
    </Pending>
  )
}
const NotFound = screen(async () => NotFoundScreen)

// Solo en desarrollo: /dev/fallo comprueba que la pantalla de error funciona.
function DevCrashScreen(): never {
  throw new Error('Fallo de prueba (/dev/fallo)')
}
const DevCrash = screen(async () => DevCrashScreen)

function Layout() {
  const { path } = useLocation()
  return (
    <>
      <main>
        <ErrorBoundary onError={(error) => logError(error, 'cargar pantalla')}>
          <Router>
            <Route path="/" component={GoToToday} />
            <Route path={paths.today} component={Hoy} />
            <Route path={paths.training} component={TuPlan} />
            <Route path={paths.routine} component={TuRutina} />
            <Route path={patterns.sessionStart} component={SesionInicio} />
            <Route path={patterns.summary} component={Resumen} />
            <Route path={patterns.session} component={Sesion} />
            <Route path={patterns.exercise} component={FichaEjercicio} />
            <Route path={paths.nutrition} component={Comida} />
            <Route path={paths.progress} component={Progreso} />
            <Route path={paths.profile} component={Perfil} />
            <Route path={paths.welcome} component={Bienvenida} />
            <Route path="/dev/fallo" component={import.meta.env.DEV ? DevCrash : NotFound} />
            <Route default component={NotFound} />
          </Router>
        </ErrorBoundary>
      </main>
      {!isFullScreen(path) && <TabBar />}
    </>
  )
}

export function App() {
  return (
    <LocationProvider>
      <Layout />
    </LocationProvider>
  )
}
