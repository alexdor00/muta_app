import { useLocation } from 'preact-iso'
import { useEffect, useState } from 'preact/hooks'
import { paths } from '../../../../shared/lib/paths.ts'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import {
  ajustes,
  alimentoPorId,
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
import { aprenderDeTusDatos } from '../../use-cases/target.ts'
import {
  anadirMenu,
  apuntarReceta,
  devolver,
  dietaEjemplo,
  dietaPropia,
  elegirArchivo,
  quitarReceta,
} from '../../use-cases/diet.ts'
import { cargarComida, tiposLeidos } from '../../use-cases/nutritionStore.ts'
import { alDia } from '../../use-cases/autopilot.ts'
import { platoEseDia, ponerPlato, quitarDeEseDia, tickDelMenu } from '../../use-cases/menu.ts'
import { cargarRecetas } from '../../use-cases/recipes.ts'
import { type Cocinado } from '../../state/recetas.ts'
import { comidaDe, esComida } from '../comun/platos.ts'
import { AvisosHoja } from './AvisosHoja.tsx'
import { DiaCocinaHoja } from './DiaCocina.tsx'
import { CocinarHoja } from './CocinarHoja.tsx'
import { CrearPlatoHoja } from './CrearPlatoHoja.tsx'
import { CuadrarDiaHoja } from './CuadrarDiaHoja.tsx'
import { ElegirPlatoHoja } from './ElegirPlatoHoja.tsx'
import { OpcionesMenuHoja } from './OpcionesMenuHoja.tsx'
import { PlatoMenuHoja } from './PlatoMenuHoja.tsx'
import { RecetasVista } from './RecetasVista.tsx'
import { useAviso } from '../comun/useAviso.ts'
import { AnadirHoja } from './AnadirHoja.tsx'
import { ComidaDelDiaHoja } from './ComidaDelDiaHoja.tsx'
import { CrearAlimentoHoja } from './CrearAlimentoHoja.tsx'
import { Cabecera, type VistaNutricion } from './Cabecera.tsx'
import { DatosHoja } from './DatosHoja.tsx'
import { DiaDietaHoja } from './DiaDietaHoja.tsx'
import { DietaVista } from './DietaVista.tsx'
import { EmpezarDietaHoja } from './EmpezarDietaHoja.tsx'
import { EscanerHoja } from './EscanerHoja.tsx'
import { HoyVista } from './HoyVista.tsx'
import { SemanaYMenus } from './SemanaYMenus.tsx'
import { SinObjetivo } from './SinObjetivo.tsx'
import { CambiarPlatoHoja } from './CambiarPlatoHoja.tsx'
import { MasDietaHoja } from './MasDietaHoja.tsx'
import { NuevaRecetaHoja } from './NuevaRecetaHoja.tsx'
import { RacionHoja } from './RacionHoja.tsx'
import { RapidoHoja } from './RapidoHoja.tsx'
import { SugerenciaHoja } from '../objetivo/SugerenciaHoja.tsx'

/** Las vistas (`?vista=`): tu día, Tu semana (`plan`; «menu», la de antes), el recetario y tu dieta. */
const VISTAS: VistaNutricion[] = ['hoy', 'plan', 'menus', 'recetas', 'dieta']

/** Nutrición (pestaña): abre en tu día; arriba, «Plan» (y desde tu día, tu objetivo). Lo demás va en hojas. */
export function ComidaScreen() {
  useEffect(() => {
    void cargarComida().then(aprenderDeTusDatos).then(cargarRecetas).then(tiposLeidos).then(alDia)
  }, [])
  const { query, route } = useLocation()
  const vista: VistaNutricion =
    query.vista === 'menu' ? 'menus' : (VISTAS.find((v) => v === query.vista) ?? 'hoy')
  useEffect(() => window.scrollTo(0, 0), [vista])
  const [comida, setComida] = useState<ComidaId>('desayuno')
  const [alimento, setAlimento] = useState<Alimento | null>(null)
  const [editando, setEditando] = useState<Apunte | null>(null)
  const [nueva, setNueva] = useState<Dieta | null>(null)
  const [fecha, setFecha] = useState('')
  const [menuReceta, setMenuReceta] = useState<string | null>(null)
  const [alPlan, setAlPlan] = useState(false)
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
  const opciones = useSheet('menu')
  const cocinar = useSheet('cocinar')
  const avisos = useSheet('avisos')
  const diaCocina = useSheet('dia-cocina')
  const [fechaCocina, setFechaCocina] = useState('')
  const crearPlato = useSheet('crear-plato')
  const cuadrar = useSheet('cuadrar')
  const cambiarPlato = useSheet('cambiar-plato')
  const [aCambiar, setACambiar] = useState<{ fecha: string; comida: ComidaId } | null>(null)
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
  // Desde Plan, la dieta pasa a ser tu plan; desde Tu objetivo, como siempre
  const desdeArchivo = async (plan = false) => {
    setAlPlan(plan)
    const r = await elegirArchivo()
    if (!r) return
    if (!r.ok) return avisar(r.motivo)
    proponer(r.dieta)
  }
  const deEjemplo = async () => {
    setAlPlan(false)
    proponer(await dietaEjemplo())
  }
  const propia = () => {
    setAlPlan(false)
    proponer(dietaPropia('Mi dieta'))
  }
  const hayObjetivo = ajustes.value || dieta.value
  const quitarYAvisar = async (texto: string, hacer: () => Promise<() => Promise<unknown>>) => {
    const reponer = await hacer()
    avisar(texto, { label: 'Deshacer', onClick: () => void reponer() })
  }
  // El tick de una comida con plato de tu menú: lo apunta (con sus gramos de ese día) o lo quita
  const tick = async (c: ComidaId, solo?: 'plato' | number) => {
    const f = diaVisto.value
    const r = await tickDelMenu(f, c, solo)
    if (r) avisar(`${r.nombre}: apuntado`, { label: 'Deshacer', onClick: () => void tickDelMenu(f, c, solo) })
  }

  return (
    <>
      <Cabecera vista={vista} />
      {vista === 'plan' || vista === 'menus' ? (
        <SemanaYMenus
          vista={vista}
          menuId={query.menu}
          avisar={avisar}
          abrir={{
            cambiar: (f, c) => {
              setACambiar({ fecha: f, comida: c })
              cambiarPlato.show()
            },
            elegir: (m, c) => {
              setEnMenu({ menu: m, comida: c })
              elegir.show()
            },
            plato: (m, c) => {
              setEnMenu({ menu: m, comida: c })
              platoMenu.show()
            },
            opciones: (m) => {
              setEnMenu({ menu: m, comida: 'desayuno' })
              opciones.show()
            },
            organizar: () => route(paths.cooking),
            diaCocina: (f) => {
              setFechaCocina(f)
              diaCocina.show()
            },
            avisos: avisos.show,
            cargar: () => void desdeArchivo(true),
            calcular: datos.show,
            sugerencia: sugerencia.show,
          }}
        />
      ) : vista === 'recetas' ? (
        <RecetasVista
          onCrear={() => {
            setEnMenu(null)
            crearPlato.show()
          }}
        />
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
        <SinObjetivo onCalcular={datos.show} />
      ) : (
        <HoyVista
          onAnadir={abrirAnadir}
          avisar={avisar}
          onAbrirComida={(id) => {
            setComida(id)
            delDia.show()
          }}
          onAbrirApunte={(c, id) => {
            const ap = (dias.value[diaVisto.value] ?? []).find((x) => x.id === id)
            if (!ap) return
            setComida(c)
            const al = ap.alimentoId ? alimentoPorId(ap.alimentoId) : null
            if (al) return abrirRacion(al, ap, false)
            void (setEditando(ap), rapido.show())
          }}
          onSugerencia={pendiente.value ? sugerencia.show : null}
          onAbrirReceta={(id) => route(paths.recipe(id, menuDelDia.value?.tipo))}
          onApuntarReceta={(id) => void apuntarDelMenu(id)}
          onConsulta={() => route(paths.checkIn)}
          onCuadrar={cuadrar.show}
          onTick={(c, solo) => void tick(c, solo)}
          onQuitar={(c) =>
            void quitarYAvisar(
              `Fuera de este día: ${platoEseDia(diaVisto.value, c) ?? comidaDe(c).nombre}`,
              () => quitarDeEseDia(c, diaVisto.value),
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
          onMenuHecho={(c) => void tick(c)}
          avisar={avisar}
        />
      )}
      {racion.open && alimento && (
        <RacionHoja
          alimento={alimento}
          comida={editando?.comida ?? comida}
          onComida={editando ? undefined : setComida}
          editando={editando}
          onClose={racion.close}
          onAtras={editando ? delDia.showInstead : anadir.showInstead}
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
          onClose={anadir.showInstead}
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
      {empezar.open && nueva && (
        <EmpezarDietaHoja dieta={nueva} onClose={empezar.close} avisar={avisar} alPlan={alPlan} />
      )}
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
      {cambiarPlato.open && aCambiar && (
        <CambiarPlatoHoja
          fecha={aCambiar.fecha}
          comida={aCambiar.comida}
          onClose={cambiarPlato.close}
          onBuscar={(m, c) => {
            setEnMenu({ menu: m, comida: c })
            elegir.show()
          }}
          avisar={avisar}
        />
      )}
      {diaCocina.open && fechaCocina && (
        <DiaCocinaHoja fecha={fechaCocina} onClose={diaCocina.close} avisar={avisar} />
      )}
      {crearPlato.open && (
        <CrearPlatoHoja
          onClose={crearPlato.close}
          avisar={avisar}
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
      {opciones.open && enMenu && (
        <OpcionesMenuHoja menuId={enMenu.menu} onClose={opciones.close} avisar={avisar} />
      )}
      <Toast message={aviso?.texto ?? null} action={aviso?.accion ?? null} />
    </>
  )
}
