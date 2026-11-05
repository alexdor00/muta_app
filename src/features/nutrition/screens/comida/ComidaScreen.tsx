import { useLocation } from 'preact-iso'
import { useEffect, useState } from 'preact/hooks'
import { paths } from '../../../../shared/lib/paths.ts'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import {
  ajustes,
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
import { useAviso } from '../comun/useAviso.ts'
import { AnadirHoja } from './AnadirHoja.tsx'
import styles from './ComidaScreen.module.css'
import { ComidaDelDiaHoja } from './ComidaDelDiaHoja.tsx'
import { CrearAlimentoHoja } from './CrearAlimentoHoja.tsx'
import { DatosHoja } from './DatosHoja.tsx'
import { DiaDietaHoja } from './DiaDietaHoja.tsx'
import { DietaVista } from './DietaVista.tsx'
import { EmpezarDietaHoja } from './EmpezarDietaHoja.tsx'
import { EscanerHoja } from './EscanerHoja.tsx'
import { HoyVista } from './HoyVista.tsx'
import { MasDietaHoja } from './MasDietaHoja.tsx'
import { NuevaRecetaHoja } from './NuevaRecetaHoja.tsx'
import { PesoHoja } from './PesoHoja.tsx'
import { RacionHoja } from './RacionHoja.tsx'
import { RapidoHoja } from './RapidoHoja.tsx'
import { SemanaVista } from './SemanaVista.tsx'
import { SugerenciaHoja } from '../objetivo/SugerenciaHoja.tsx'

type Vista = 'hoy' | 'semana' | 'dieta'

/** Comida (pestaña): el día, la semana y tu dieta; añadir, la ración, la dieta y la sugerencia del entrenador van en hojas. */
export function ComidaScreen() {
  useEffect(() => {
    void cargarComida()
  }, [])
  const { query, route } = useLocation()
  const vista: Vista = query.vista === 'semana' || query.vista === 'dieta' ? query.vista : 'hoy'
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
  const peso = useSheet('peso')
  const datos = useSheet('datos')
  const sugerencia = useSheet('sugerencia')
  const empezar = useSheet('empezar')
  const diaDieta = useSheet('dia')
  const mas = useSheet('tu-dieta')
  const receta = useSheet('receta-nueva')
  const { aviso, avisar } = useAviso()

  if (estado.value === 'cargando') return null

  const cambiarVista = (v: Vista) =>
    route(v === 'hoy' ? paths.nutrition : `${paths.nutrition}?vista=${v}`, true)
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

  return (
    <>
      <ScreenHeader
        title="Comida"
        avatarHref={paths.profile}
        inline
        action={
          ajustes.value && (
            <a class={styles.target} href={paths.nutritionTarget}>
              Objetivo
            </a>
          )
        }
      />
      <div class={styles.segment}>
        <ChoiceSegmented<Vista>
          name="vista-comida"
          legend="Ver"
          options={[
            { value: 'hoy', label: 'Hoy' },
            { value: 'semana', label: 'Semana' },
            { value: 'dieta', label: 'Dieta' },
          ]}
          value={vista}
          onChange={cambiarVista}
        />
      </div>
      {vista === 'dieta' ? (
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
            Lo ves paso a paso y lo puedes cambiar. O sigue una dieta en «Dieta».
          </p>
          <button type="button" class={styles.emptyButton} onClick={datos.show}>
            Calcular mi objetivo
          </button>
        </section>
      ) : vista === 'hoy' ? (
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
        />
      ) : (
        <SemanaVista onPesarme={peso.show} />
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
      {peso.open && <PesoHoja onClose={peso.close} avisar={avisar} />}
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
      <Toast message={aviso?.texto ?? null} action={aviso?.accion ?? null} />
    </>
  )
}
