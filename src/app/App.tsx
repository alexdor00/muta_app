import type { ComponentChildren, FunctionComponent } from 'preact'
import { useEffect } from 'preact/hooks'
import { getDb } from '../shared/data/db.ts'
import { ErrorBoundary, LocationProvider, Route, Router, lazy, useLocation } from 'preact-iso'
import { apuntarPantalla } from '../shared/lib/historial.ts'
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
const VerSesion = screen(() =>
  import('../features/training/screens/ver-sesion/VerSesionScreen.tsx').then((m) => m.VerSesionScreen),
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
const FichaMusculo = screen(() =>
  import('../features/training/screens/musculo/MusculoScreen.tsx').then((m) => m.MusculoScreen),
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
const ObjetivoComida = screen(() =>
  import('../features/nutrition/screens/objetivo/ObjetivoScreen.tsx').then((m) => m.ObjetivoScreen),
)
const ComoCocinas = screen(() =>
  import('../features/nutrition/screens/cocinas/ComoCocinasScreen.tsx').then((m) => m.ComoCocinasScreen),
)
const RecetaComida = screen(() =>
  import('../features/nutrition/screens/receta/RecetaScreen.tsx').then((m) => m.RecetaScreen),
)
const CompraComida = screen(() =>
  import('../features/nutrition/screens/compra/CompraScreen.tsx').then((m) => m.CompraScreen),
)
const CocinaComida = screen(() =>
  import('../features/nutrition/screens/cocina/CocinaScreen.tsx').then((m) => m.CocinaScreen),
)
const TandaComida = screen(() =>
  import('../features/nutrition/screens/tanda/TandaScreen.tsx').then((m) => m.TandaScreen),
)
const AlMomentoComida = screen(() =>
  import('../features/nutrition/screens/tanda/AlMomentoScreen.tsx').then((m) => m.AlMomentoScreen),
)
const CocinarPlato = screen(() =>
  import('../features/nutrition/screens/tanda/CocinarPlatoScreen.tsx').then((m) => m.CocinarPlatoScreen),
)
const ConsultaComida = screen(() =>
  import('../features/nutrition/screens/consulta/ConsultaScreen.tsx').then((m) => m.ConsultaScreen),
)
const CategoriaPlatos = screen(() =>
  import('../features/nutrition/screens/plato/CategoriaScreen.tsx').then((m) => m.CategoriaScreen),
)
const PlatoComida = screen(() =>
  import('../features/nutrition/screens/plato/PlatoScreen.tsx').then((m) => m.PlatoScreen),
)
const Nutricionista = screen(() =>
  import('../features/nutrition/screens/plato/NutricionistaScreen.tsx').then((m) => m.NutricionistaScreen),
)
const Progreso = screen(() =>
  import('../features/progress/screens/progreso/ProgresoScreen.tsx').then((m) => m.ProgresoScreen),
)
const Dia = screen(() => import('../features/progress/screens/dia/DiaScreen.tsx').then((m) => m.DiaScreen))
const Perfil = screen(() =>
  import('../features/profile/screens/perfil/PerfilScreen.tsx').then((m) => m.PerfilScreen),
)
const Bienvenida = screen(() =>
  import('../features/profile/screens/bienvenida/BienvenidaScreen.tsx').then((m) => m.BienvenidaScreen),
)

const OnboardingStep = screen(() =>
  import('../features/profile/screens/onboarding/OnboardingScreen.tsx').then((m) => m.OnboardingScreen),
)

/** Los pasos de comida de la bienvenida: los pone Nutrición (se pueden saltar). */
const BienvenidaComida = screen(() =>
  import('../features/nutrition/screens/bienvenida/BienvenidaComidaScreen.tsx').then(
    (m) => m.BienvenidaComidaScreen,
  ),
)

/** Al abrir la app: la primera vez (sin perfil) va a la bienvenida; después, a Hoy. */
function GoHome() {
  const { route } = useLocation()
  useEffect(() => {
    getDb()
      .then((db) => db.get('profile', 'me'))
      .then((profile) => route(profile ? paths.today : paths.welcome, true))
      .catch((error) => {
        logError(error, 'elegir pantalla de inicio')
        route(paths.today, true)
      })
  }, [route])
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

const ElegirRutina = screen(() =>
  import('../features/training/screens/elegir-rutina/ElegirRutinaScreen.tsx').then(
    (m) => m.ElegirRutinaScreen,
  ),
)
const Categoria = screen(() =>
  import('../features/training/screens/categoria/CategoriaScreen.tsx').then((m) => m.CategoriaScreen),
)
const Rutina = screen(() =>
  import('../features/training/screens/rutina/RutinaScreen.tsx').then((m) => m.RutinaScreen),
)
const DevUi = screen(() => import('./dev/DevUiScreen.tsx').then((m) => m.DevUiScreen))
const DevDemo = screen(() => import('./dev/DemoScreen.tsx').then((m) => m.DemoScreen))

function Layout() {
  const { path, url } = useLocation()
  // Cada pantalla apunta cuántas de MUTA tiene detrás, para que «‹» vuelva a la anterior (shared/lib/historial.ts)
  useEffect(() => apuntarPantalla(), [url])
  return (
    <>
      <main>
        <ErrorBoundary onError={(error) => logError(error, 'cargar pantalla')}>
          <Router>
            <Route path="/" component={GoHome} />
            <Route path={paths.today} component={Hoy} />
            <Route path={paths.training} component={TuPlan} />
            <Route path={paths.routine} component={TuRutina} />
            <Route path={patterns.sessionView} component={VerSesion} />
            <Route path={paths.chooseRoutine} component={ElegirRutina} />
            <Route path={patterns.routineCategory} component={Categoria} />
            <Route path={patterns.routineSection} component={Categoria} />
            <Route path={patterns.routineDetail} component={Rutina} />
            <Route path={patterns.sessionStart} component={SesionInicio} />
            <Route path={patterns.summary} component={Resumen} />
            <Route path={patterns.session} component={Sesion} />
            <Route path={patterns.exercise} component={FichaEjercicio} />
            <Route path={patterns.muscle} component={FichaMusculo} />
            <Route path={paths.nutrition} component={Comida} />
            <Route path={paths.nutritionTarget} component={ObjetivoComida} />
            <Route path={paths.cooking} component={ComoCocinas} />
            <Route path={patterns.recipe} component={RecetaComida} />
            <Route path={paths.shopping} component={CompraComida} />
            <Route path={paths.kitchen} component={CocinaComida} />
            <Route path={patterns.batch} component={TandaComida} />
            <Route path={patterns.cookNow} component={AlMomentoComida} />
            <Route path={patterns.cookDish} component={CocinarPlato} />
            <Route path={paths.checkIn} component={ConsultaComida} />
            <Route path={patterns.dishes} component={CategoriaPlatos} />
            <Route path={patterns.dish} component={PlatoComida} />
            <Route path={paths.nutritionist} component={Nutricionista} />
            <Route path={paths.progress} component={Progreso} />
            <Route path={patterns.progressDay} component={Dia} />
            <Route path={paths.profile} component={Perfil} />
            <Route path={paths.welcome} component={Bienvenida} />
            <Route path={patterns.welcomeFood} component={BienvenidaComida} />
            <Route path={patterns.onboarding} component={OnboardingStep} />
            <Route path="/dev/fallo" component={import.meta.env.DEV ? DevCrash : NotFound} />
            <Route path="/dev/ui" component={DevUi} />
            <Route path="/dev/demo" component={DevDemo} />
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
