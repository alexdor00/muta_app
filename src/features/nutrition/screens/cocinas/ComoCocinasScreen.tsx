import { useEffect, useState } from 'preact/hooks'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { useVolver } from '../../../../shared/ui/useVolver.ts'
import { HORA_COMPRA, piloto, pilotoNuevo, type Piloto } from '../../state/autopilot.ts'
import { estado, hoy } from '../../state/comida.ts'
import { estadoRecetas, menu } from '../../state/recetas.ts'
import { aplicarSemana, volverAlPiloto, volverASemana } from '../../use-cases/autopilot.ts'
import { cargarComida } from '../../use-cases/nutritionStore.ts'
import { cargarRecetas } from '../../use-cases/recipes.ts'
import { OrganizarPreguntas } from '../comida/OrganizarPreguntas.tsx'
import { Barra } from '../comun/Barra.tsx'
import { useAviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'
import p from '../comun/Pagina.module.css'

const VOLVER = `${paths.nutrition}?vista=plan&paso=cocina`

/**
 * Cómo cocinas (usuario, 2026-11-19: «de claridad, muy intuitiva, en una pantalla grande, no desplegable»): una pantalla
 * completa con cuándo cocinas, lo que dejas hecho y cuándo compras. Todo se guarda al momento, como Tu dieta, con
 * «Deshacer» (usuario, 2026-11-20: sin «Guardar»); la primera vez, «Organizar mi semana» lo empieza.
 */
export function ComoCocinasScreen() {
  useEffect(() => {
    void cargarComida().then(cargarRecetas)
  }, [])
  if (estado.value === 'cargando' || estadoRecetas.value !== 'listo') return null
  return <ComoCocinas />
}

function ComoCocinas() {
  const actual = piloto.value
  const atras = useVolver(VOLVER)
  const { aviso, avisar } = useAviso()
  const [x, setX] = useState<Piloto>(() => {
    // Sin «Al cocinar» (usuario, 2026-11-20): la compra va en un día fijo o sin día
    if (actual) return actual.compra ? { ...actual, compra: { ...actual.compra, conCocina: false } } : actual
    const nuevo = pilotoNuevo(hoy.value)
    // De serie (sugerido): como dice tu dieta o MUTA elige 3 veces; la compra, el viernes; lo fresco, al momento
    return {
      ...nuevo,
      cocina: menu.value.ciclo?.cocinar?.length
        ? { ...nuevo.cocina, modo: 'dieta', veces: 3, hora: '12:00' }
        : { ...nuevo.cocina, modo: 'veces', veces: 3, hora: '12:00' },
      compra: { dia: 5, hora: HORA_COMPRA, conCocina: false },
      preparar: { ...nuevo.preparar, comida: 'mixto', cena: 'mixto' },
    }
  })
  const guardar = async (nuevo: Piloto) => {
    setX(nuevo)
    const antes = await aplicarSemana(nuevo, null)
    return antes
  }
  // Ya organizado: cada cambio se guarda al momento, con «Deshacer»
  const cambiar = async (c: Partial<Piloto>) => {
    const conCambio = { ...x, ...c }
    if (!actual) return setX(conCambio)
    const antes = await guardar(conCambio)
    avisar('Guardado', {
      label: 'Deshacer',
      onClick: () => {
        if (antes.piloto) setX(antes.piloto)
        void volverASemana(antes)
      },
    })
  }

  return (
    <div class={p.page}>
      <Barra titulo="Cómo cocinas" volver={VOLVER} />
      <OrganizarPreguntas
        p={x}
        onCambiar={(c) => void cambiar(c)}
        conDieta={!!menu.value.ciclo?.cocinar?.length}
      />
      {actual ? (
        <button
          type="button"
          class={`${h.textButton} ${h.danger}`}
          onClick={async () => {
            await volverAlPiloto(null)
            atras()
          }}
        >
          Dejar de organizar mi semana
        </button>
      ) : (
        <Button
          onClick={async () => {
            await guardar(x)
            atras()
          }}
        >
          Organizar mi semana
        </Button>
      )}
      <Toast message={aviso?.texto ?? null} action={aviso?.accion ?? null} />
    </div>
  )
}
