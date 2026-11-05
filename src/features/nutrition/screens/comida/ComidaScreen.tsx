import { useEffect, useState } from 'preact/hooks'
import { paths } from '../../../../shared/lib/paths.ts'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import { ajustes, estado, pendiente, type Alimento, type Apunte, type ComidaId } from '../../state/comida.ts'
import { cargarComida } from '../../use-cases/nutritionStore.ts'
import { useAviso } from '../comun/useAviso.ts'
import { AnadirHoja } from './AnadirHoja.tsx'
import styles from './ComidaScreen.module.css'
import { ComidaDelDiaHoja } from './ComidaDelDiaHoja.tsx'
import { CrearAlimentoHoja } from './CrearAlimentoHoja.tsx'
import { DatosHoja } from './DatosHoja.tsx'
import { HoyVista } from './HoyVista.tsx'
import { PesoHoja } from './PesoHoja.tsx'
import { RacionHoja } from './RacionHoja.tsx'
import { RapidoHoja } from './RapidoHoja.tsx'
import { SemanaVista } from './SemanaVista.tsx'
import { SugerenciaHoja } from '../objetivo/SugerenciaHoja.tsx'

type Vista = 'hoy' | 'semana'

/** Comida (pestaña): lo de hoy y la semana; añadir, la ración y la sugerencia del entrenador van en hojas. */
export function ComidaScreen() {
  useEffect(() => {
    void cargarComida()
  }, [])
  const [vista, setVista] = useState<Vista>('hoy')
  const [comida, setComida] = useState<ComidaId>('desayuno')
  const [alimento, setAlimento] = useState<Alimento | null>(null)
  const [editando, setEditando] = useState<Apunte | null>(null)
  const anadir = useSheet('anadir')
  const racion = useSheet('racion')
  const rapido = useSheet('rapido')
  const crear = useSheet('crear')
  const delDia = useSheet('comida')
  const peso = useSheet('peso')
  const datos = useSheet('datos')
  const sugerencia = useSheet('sugerencia')
  const { aviso, avisar } = useAviso()

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
          ]}
          value={vista}
          onChange={setVista}
        />
      </div>
      {!ajustes.value ? (
        <section class={styles.empty}>
          <h2 class={styles.emptyTitle}>Calcula tu objetivo</h2>
          <p class={styles.emptyText}>
            Con tu sexo, edad, altura, peso y pasos al día calculo lo que gastas y cuánto comer para tu fase.
            Lo ves paso a paso y lo puedes cambiar.
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
      <Toast message={aviso?.texto ?? null} action={aviso?.accion ?? null} />
    </>
  )
}
