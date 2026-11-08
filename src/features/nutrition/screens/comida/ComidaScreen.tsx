import { useLocation } from 'preact-iso'
import { useEffect, useState } from 'preact/hooks'
import { paths } from '../../../../shared/lib/paths.ts'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import {
  ajustes,
  dias,
  diaVisto,
  dieta,
  estado,
  pendiente,
  type Alimento,
  type Apunte,
  type ComidaId,
} from '../../state/comida.ts'
import { menuDelDia, type Dieta } from '../../state/dieta.ts'
import { deshacer } from '../../use-cases/consult.ts'
import {
  anadirMenu,
  apuntarReceta,
  devolver,
  dietaEjemplo,
  dietaPropia,
  elegirArchivo,
  quitarReceta,
} from '../../use-cases/diet.ts'
import { cargarComida } from '../../use-cases/nutritionStore.ts'
import { menusDeTuDieta, ponerPlato, quitarDelMenu, quitarDeEseDia, volverA } from '../../use-cases/menu.ts'
import { apuntarPlato, cargarRecetas, desapuntar, platoApuntado } from '../../use-cases/recipes.ts'
import { gramosDeHueco, huecoDe, menu, platoPorId, type Cocinado } from '../../state/recetas.ts'
import { comidaDe, esComida } from '../comun/platos.ts'
import { AvisosHoja } from './AvisosHoja.tsx'
import { CocinarHoja } from './CocinarHoja.tsx'
import { CrearPlatoHoja } from './CrearPlatoHoja.tsx'
import { CuadrarDiaHoja } from './CuadrarDiaHoja.tsx'
import { ElegirPlatoHoja } from './ElegirPlatoHoja.tsx'
import { CuantosMenusHoja } from './CuantosMenusHoja.tsx'
import { OpcionesMenuHoja } from './OpcionesMenuHoja.tsx'
import { PlatoMenuHoja } from './PlatoMenuHoja.tsx'
import { MenuVista } from './MenuVista.tsx'
import { RecetasVista } from './RecetasVista.tsx'
import { useAviso } from '../comun/useAviso.ts'
import { AnadirHoja } from './AnadirHoja.tsx'
import styles from './ComidaScreen.module.css'
import { ComidaDelDiaHoja } from './ComidaDelDiaHoja.tsx'
import { CrearAlimentoHoja } from './CrearAlimentoHoja.tsx'
import { Cabecera, type VistaNutricion } from './Cabecera.tsx'
import { DatosHoja } from './DatosHoja.tsx'
import { PlanVista } from './PlanVista.tsx'
import { DiaDietaHoja } from './DiaDietaHoja.tsx'
import { DietaVista } from './DietaVista.tsx'
import { EmpezarDietaHoja } from './EmpezarDietaHoja.tsx'
import { EscanerHoja } from './EscanerHoja.tsx'
import { HoyVista } from './HoyVista.tsx'
import { MasDietaHoja } from './MasDietaHoja.tsx'
import { NuevaRecetaHoja } from './NuevaRecetaHoja.tsx'
import { RacionHoja } from './RacionHoja.tsx'
import { RapidoHoja } from './RapidoHoja.tsx'
import { SugerenciaHoja } from '../objetivo/SugerenciaHoja.tsx'

/** Las vistas (`?vista=`): tu día, Tu plan, el recetario y tu dieta. «menu», la de antes, es Tu plan. */
const VISTAS: VistaNutricion[] = ['hoy', 'plan', 'recetas', 'dieta']

/**
 * Nutrición (pestaña): abre en tu día. «Tu plan» reúne tu objetivo, tus menús y tu dieta; las recetas, desde tu día
 * («Para la cena» y «Ver todas»). Añadir, la ración, el menú, cocinar, los avisos y el entrenador van en hojas. La
 * semana (medias, tendencia del peso) será de Progreso.
 */
export function ComidaScreen() {
  useEffect(() => {
    void cargarComida().then(cargarRecetas)
  }, [])
  const { query, route } = useLocation()
  const vista: VistaNutricion =
    query.vista === 'menu' ? 'plan' : (VISTAS.find((v) => v === query.vista) ?? 'hoy')
  // Cada vista (tu día, Tu plan, Recetas, Tu dieta) empieza arriba, no a la altura de la anterior
  useEffect(() => window.scrollTo(0, 0), [vista])
  const [comida, setComida] = useState<ComidaId>('desayuno')
  const [alimento, setAlimento] = useState<Alimento | null>(null)
  const [editando, setEditando] = useState<Apunte | null>(null)
  const [nueva, setNueva] = useState<Dieta | null>(null)
  const [fecha, setFecha] = useState('')
  const [menuReceta, setMenuReceta] = useState<string | null>(null)
  const anadir = useSheet('anadir')
  const racion = useSheet('racion')
  const rapido = useSheet('rapido')
  const crear = useSheet('crear')
  const escaner = useSheet('escaner')
  const delDia = useSheet('comida')
  const datos = useSheet('datos')
  const sugerencia = useSheet('sugerencia')
  const empezar = useSheet('empezar')
  const diaDieta = useSheet('dia')
  const mas = useSheet('tu-dieta')
  const receta = useSheet('receta-nueva')
  const elegir = useSheet('plato')
  const platoMenu = useSheet('plato-menu')
  const cuantos = useSheet('menus')
  const opciones = useSheet('menu')
  const cocinar = useSheet('cocinar')
  const avisos = useSheet('avisos')
  const crearPlato = useSheet('crear-plato')
  const cuadrar = useSheet('cuadrar')
  const [enMenu, setEnMenu] = useState<{ menu: string; comida: ComidaId } | null>(null)
  const [cocinado, setCocinado] = useState<Cocinado | null>(null)
  const { aviso, avisar } = useAviso()
  // «Apuntar así y añadir algo más» (desde Ajustar): abre Añadir en esa comida
  useEffect(() => {
    if (!esComida(query.anadir)) return
    setComida(query.anadir)
    anadir.show()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.anadir])

  if (estado.value === 'cargando') return null
  const abrirAnadir = (id: ComidaId) => {
    setComida(id)
    anadir.show()
  }
  const abrirRacion = (a: Alimento, apunte: Apunte | null, enLugar: boolean) => {
    setAlimento(a)
    setEditando(apunte)
    if (enLugar) racion.showInstead()
    else racion.show()
  }
  const proponer = (d: Dieta | null) => {
    if (!d) return avisar('No se pudo preparar la dieta')
    setNueva(d)
    empezar.show()
  }
  const apuntarDelMenu = async (id: string) => {
    const r = menuDelDia.value?.recetas.find((x) => x.id === id)
    if (!r) return
    const ya = await quitarReceta(id)
    if (ya.length)
      return avisar(`${r.nombre}: quitada`, { label: 'Deshacer', onClick: () => void devolver(ya) })
    await apuntarReceta(r)
    avisar(`${r.nombre}: apuntada`, { label: 'Deshacer', onClick: () => void quitarReceta(id) })
  }
  const desdeArchivo = async () => {
    const r = await elegirArchivo()
    if (!r) return
    if (!r.ok) return avisar(r.motivo)
    proponer(r.dieta)
  }
  const deEjemplo = async () => proponer(await dietaEjemplo())
  const propia = () => proponer(dietaPropia('Mi dieta'))
  const hayObjetivo = ajustes.value || dieta.value
  // Quitar deslizando (una comida de un día o un plato del menú), con «Deshacer»
  const quitarYAvisar = async (texto: string, hacer: () => Promise<() => Promise<unknown>>) => {
    const reponer = await hacer()
    avisar(texto, { label: 'Deshacer', onClick: () => void reponer() })
  }
  // El tick de una comida con plato de tu menú: lo apunta (con sus gramos de ese día) o lo quita
  const tick = async (c: ComidaId) => {
    const f = diaVisto.value
    const h = huecoDe(menu.value, f, c)
    const p = h ? platoPorId(h.plato, f) : null
    if (!h || !p) return
    if (platoApuntado(p.id, c, f)) {
      const ids = (dias.value[f] ?? []).filter((a) => a.receta === p.id && a.comida === c).map((a) => a.id)
      await desapuntar(ids, f)
      return
    }
    const ids = await apuntarPlato(p, c, gramosDeHueco(h, p), 1, f)
    avisar(`${p.nombre}: apuntado`, { label: 'Deshacer', onClick: () => void desapuntar(ids, f) })
  }
  const abrirCocinado = (id: string) => {
    const c = menu.value.cocinados.find((x) => x.id === id)
    if (!c) return
    setCocinado(c)
    cocinar.show()
  }

  return (
    <>
      <Cabecera vista={vista} conPlan={Boolean(hayObjetivo)} />
      {vista === 'plan' ? (
        <PlanVista>
          <MenuVista
            onPlato={(m, c) => {
              setEnMenu({ menu: m, comida: c })
              platoMenu.show()
            }}
            onQuitarPlato={(m, c) => void quitarYAvisar('Quitado del menú', () => quitarDelMenu(m, c))}
            onAnadir={(m, c) => {
              setEnMenu({ menu: m, comida: c })
              elegir.show()
            }}
            onOpciones={(m) => {
              setEnMenu({ menu: m, comida: 'desayuno' })
              opciones.show()
            }}
            onCuantos={cuantos.show}
            onAvisos={avisos.show}
            onDeDieta={async () => {
              const antes = await menusDeTuDieta()
              if (antes)
                avisar('Tus menús son ahora los de tu dieta', {
                  label: 'Deshacer',
                  onClick: () => void volverA(antes),
                })
            }}
          />
        </PlanVista>
      ) : vista === 'recetas' ? (
        <RecetasVista />
      ) : vista === 'dieta' ? (
        <DietaVista
          onArchivo={() => void desdeArchivo()}
          onEjemplo={() => void deEjemplo()}
          onPropia={propia}
          onDia={(f) => {
            setFecha(f)
            diaDieta.show()
          }}
          onMas={mas.show}
          onNuevaReceta={(m) => {
            setMenuReceta(m)
            receta.show()
          }}
          onNuevoMenu={async () => {
            const id = await anadirMenu()
            if (id) avisar(`Menú ${id} añadido: elige en Tu semana qué días va`)
          }}
          onDeshacerConsulta={async (id) => {
            await deshacer(id)
            avisar('Deshecho: tu dieta vuelve a como estaba')
          }}
        />
      ) : !hayObjetivo ? (
        <section class={styles.empty}>
          <h2 class={styles.emptyTitle}>Calcula tu objetivo</h2>
          <p class={styles.emptyText}>
            Con tu sexo, edad, altura, peso y pasos al día calculo lo que gastas y cuánto comer para tu fase.
            Lo ves paso a paso y lo puedes cambiar. O sigue una dieta desde «Tu plan».
          </p>
          <button type="button" class={styles.emptyButton} onClick={datos.show}>
            Calcular mi objetivo
          </button>
        </section>
      ) : (
        <HoyVista
          onAnadir={abrirAnadir}
          onAbrirComida={(id) => {
            setComida(id)
            delDia.show()
          }}
          onSugerencia={pendiente.value ? sugerencia.show : null}
          onAbrirReceta={(id) => route(paths.recipe(id, menuDelDia.value?.tipo))}
          onApuntarReceta={(id) => void apuntarDelMenu(id)}
          onConsulta={() => route(paths.checkIn)}
          onCuadrar={cuadrar.show}
          onCocinado={abrirCocinado}
          onTick={(c) => void tick(c)}
          onQuitar={(c) =>
            void quitarYAvisar(`${comidaDe(c).nombre}: quitada de este día`, () =>
              quitarDeEseDia(c, diaVisto.value),
            )
          }
        />
      )}
      {anadir.open && (
        <AnadirHoja
          comida={comida}
          onComida={setComida}
          onClose={anadir.close}
          onElegir={(a) => abrirRacion(a, null, true)}
          onRapido={() => {
            setEditando(null)
            rapido.showInstead()
          }}
          onCrear={crear.showInstead}
          onEscanear={escaner.showInstead}
          avisar={avisar}
        />
      )}
      {racion.open && alimento && (
        <RacionHoja
          alimento={alimento}
          comida={editando?.comida ?? comida}
          editando={editando}
          onClose={racion.close}
          avisar={avisar}
        />
      )}
      {rapido.open && (
        <RapidoHoja comida={comida} editando={editando} onClose={rapido.close} avisar={avisar} />
      )}
      {crear.open && <CrearAlimentoHoja onClose={crear.close} onCreado={(a) => abrirRacion(a, null, true)} />}
      {escaner.open && (
        <EscanerHoja
          comida={comida}
          onClose={escaner.close}
          onElegir={(a) => abrirRacion(a, null, true)}
          avisar={avisar}
        />
      )}
      {delDia.open && (
        <ComidaDelDiaHoja
          comida={comida}
          onClose={delDia.close}
          onAnadir={anadir.showInstead}
          onEditar={(apunte, a) => {
            if (a) return abrirRacion(a, apunte, true)
            setEditando(apunte)
            rapido.showInstead()
          }}
          avisar={avisar}
        />
      )}
      {datos.open && <DatosHoja onClose={datos.close} />}
      {sugerencia.open && <SugerenciaHoja onClose={sugerencia.close} avisar={avisar} />}
      {empezar.open && nueva && <EmpezarDietaHoja dieta={nueva} onClose={empezar.close} avisar={avisar} />}
      {diaDieta.open && fecha && <DiaDietaHoja fecha={fecha} onClose={diaDieta.close} />}
      {mas.open && (
        <MasDietaHoja
          onClose={mas.close}
          onArchivo={() => void desdeArchivo()}
          onEjemplo={() => void deEjemplo()}
          onPropia={propia}
          avisar={avisar}
        />
      )}
      {receta.open && <NuevaRecetaHoja menu={menuReceta} onClose={receta.close} />}
      {elegir.open && enMenu && (
        <ElegirPlatoHoja
          menuId={enMenu.menu}
          comida={enMenu.comida}
          onClose={elegir.close}
          onCrear={crearPlato.showInstead}
          avisar={avisar}
        />
      )}
      {platoMenu.open && enMenu && (
        <PlatoMenuHoja
          menuId={enMenu.menu}
          comida={enMenu.comida}
          onClose={platoMenu.close}
          onCambiar={elegir.showInstead}
          onCocinar={(c) => {
            setCocinado(c)
            cocinar.showInstead()
          }}
          avisar={avisar}
        />
      )}
      {cocinar.open && cocinado && (
        <CocinarHoja cocinado={cocinado} onClose={cocinar.close} avisar={avisar} />
      )}
      {avisos.open && <AvisosHoja onClose={avisos.close} avisar={avisar} />}
      {crearPlato.open && (
        <CrearPlatoHoja
          onClose={crearPlato.close}
          onCreado={async (id) => {
            crearPlato.close()
            if (enMenu) await ponerPlato(enMenu.menu, enMenu.comida, id)
            avisar(enMenu ? 'Plato creado y puesto en tu menú' : 'Plato creado: está en Recetas · Tuyos', {
              label: 'Ver',
              onClick: () => route(paths.dish(id)),
            })
          }}
        />
      )}
      {cuadrar.open && <CuadrarDiaHoja onClose={cuadrar.close} avisar={avisar} />}
      {cuantos.open && <CuantosMenusHoja onClose={cuantos.close} />}
      {opciones.open && enMenu && (
        <OpcionesMenuHoja menuId={enMenu.menu} onClose={opciones.close} avisar={avisar} />
      )}
      <Toast message={aviso?.texto ?? null} action={aviso?.accion ?? null} />
    </>
  )
}
