import { useLocation } from 'preact-iso'
import { useEffect, useState } from 'preact/hooks'
import { paths } from '../../../../shared/lib/paths.ts'
import type { ComidaId } from '../../state/comida.ts'
import { menu, platosDelMenu, propuestas } from '../../state/recetas.ts'
import { esComida } from '../comun/platos.ts'
import {
  anadirExtra,
  cambiarComoComes,
  cuantosMenus,
  menusDeTuDieta,
  ponerPlato,
  proponerMenu,
  quitarExtra,
  volverA,
} from '../../use-cases/menu.ts'
import { ExtraHoja } from './ExtraHoja.tsx'
import { ComidaMenuHoja } from './ComidaMenuHoja.tsx'
import { ExtraCantidadHoja } from './ExtraCantidadHoja.tsx'
import { PlatoMenuLlevaHoja } from './PlatoMenuLlevaHoja.tsx'
import type { Aviso } from '../comun/useAviso.ts'
import { MenuVista } from './MenuVista.tsx'
import { PlanVista } from './PlanVista.tsx'
import { TusMenusVista } from './TusMenusVista.tsx'
import { CargarDietaHoja } from './CargarDietaHoja.tsx'
import { UnDiaHoja } from './UnDiaHoja.tsx'

/** Lo que abren Tu semana y Tus menús (las hojas viven en la pantalla de Nutrición). */
export type AbrirSemana = {
  cambiar: (fecha: string, comida: ComidaId) => void
  elegir: (menu: string, comida: ComidaId) => void
  plato: (menu: string, comida: ComidaId) => void
  opciones: (menu: string) => void
  organizar: () => void
  diaCocina: (fecha: string) => void
  avisos: () => void
  /** Cargar tu dieta de un archivo (CSV o de MUTA). */
  cargar: () => void
  /** Calcular tu objetivo con tus datos. */
  calcular: () => void
  /** La propuesta del entrenador por decidir. */
  sugerencia: () => void
}

/**
 * Plan (`?vista=plan`), Tu dieta con tus menús (`?vista=menus`) y un menú (`&menu=A`), con «Proponme un menú» y «Pasar los
 * menús de tu dieta» (los dos con «Deshacer»).
 */
export function SemanaYMenus(props: {
  vista: 'plan' | 'menus'
  menuId?: string
  abrir: AbrirSemana
  avisar: (texto: string, accion?: Aviso['accion']) => void
}) {
  const { route, query } = useLocation()
  const { abrir, avisar } = props
  const [extraEn, setExtraEn] = useState<{ menu: string; comida: ComidaId } | null>(null)
  const [comidaEn, setComidaEn] = useState<{ menu: string; comida: ComidaId } | null>(null)
  const [platoEn, setPlatoEn] = useState<{ menu: string; comida: ComidaId } | null>(null)
  const [cantidadEn, setCantidadEn] = useState<{ menu: string; comida: ComidaId; i: number } | null>(null)
  /** Lo que va de más en esa comida de ese menú, en su sitio. */
  const extraDe = (x: { menu: string; comida: ComidaId; i: number }) =>
    menu.value.menus.find((y) => y.id === x.menu)?.extras?.[x.comida]?.[x.i] ?? null
  const [diaEn, setDiaEn] = useState<string | null>(null)
  const [cargar, setCargar] = useState(false)
  // Desde «Tu nutricionista» (Ver dónde se edita): se abre la comida marcada, con sus opciones
  const consejo = query.p ? propuestas.value.find((k) => k.id === query.p) : undefined
  useEffect(() => {
    if (query.menu && esComida(query.marca)) setComidaEn({ menu: query.menu, comida: query.marca })
  }, [query.menu, query.marca])
  // «Proponme un menú»: abre el menú propuesto para verlo y cambiarlo
  const proponer = async () => {
    const r = await proponerMenu()
    if (!r) return avisar('Primero calcula tu objetivo y ten recetas')
    route(`${paths.nutrition}?vista=menus&menu=${r.menu}`)
    avisar('Te propongo este menú: cámbialo a tu gusto', {
      label: 'Deshacer',
      onClick: () => void r.deshacer(),
    })
  }
  // Un menú nuevo, abierto para llenarlo
  const nuevoMenu = async () => {
    const n = menu.value.menus.length
    await cuantosMenus(n + 1)
    const id = menu.value.menus.at(-1)?.id
    if (id && menu.value.menus.length > n) route(`${paths.nutrition}?vista=menus&menu=${id}`)
    else avisar('Ya tienes el máximo de menús')
  }
  // Quitar deslizando en un menú: vale para todos sus días, con «Deshacer»
  const quitar = async (m: string, c: ComidaId, i: number | null) => {
    const antes = menu.value
    const nombre = antes.menus.find((k) => k.id === m)?.nombre ?? m
    await (i === null ? ponerPlato(m, c, null) : quitarExtra(m, c, i))
    avisar(`Quitado de tu ${nombre}`, { label: 'Deshacer', onClick: () => void volverA(antes) })
  }
  const deDieta = async () => {
    const antes = await menusDeTuDieta()
    if (antes)
      avisar('Tus menús son ahora los de tu dieta', { label: 'Deshacer', onClick: () => void volverA(antes) })
  }
  if (props.vista === 'plan')
    return (
      <PlanVista
        onComoCocinas={abrir.organizar}
        onDiaCocina={abrir.diaCocina}
        onProponer={() => void proponer()}
        onCargar={abrir.cargar}
        onDeDieta={() => void deDieta()}
        onCalcular={abrir.calcular}
        onSugerencia={abrir.sugerencia}
        avisar={avisar}
      />
    )
  return (
    <>
      <TusMenusVista
        onNuevoMenu={() => void nuevoMenu()}
        onDia={setDiaEn}
        onCargar={() => setCargar(true)}
        onComoComes={(c) => void cambiarComoComes(c)}
      >
        <MenuVista
          inicial={props.menuId}
          onComida={(m, c) => setComidaEn({ menu: m, comida: c })}
          onPlato={(m, c) => setPlatoEn({ menu: m, comida: c })}
          onExtra={(m, c, i) => setCantidadEn({ menu: m, comida: c, i })}
          onAnadir={(m, c) => {
            const x = menu.value.menus.find((k) => k.id === m)
            if (x && platosDelMenu(x)[c]) setExtraEn({ menu: m, comida: c })
            else setComidaEn({ menu: m, comida: c })
          }}
          onQuitar={(m, c, i) => void quitar(m, c, i)}
          onOpciones={abrir.opciones}
          onDeDieta={() => void deDieta()}
          onDia={setDiaEn}
        />
      </TusMenusVista>
      {platoEn && (
        <PlatoMenuLlevaHoja
          menuId={platoEn.menu}
          comida={platoEn.comida}
          onClose={() => setPlatoEn(null)}
          avisar={avisar}
        />
      )}
      {cantidadEn && extraDe(cantidadEn) && (
        <ExtraCantidadHoja
          menuId={cantidadEn.menu}
          comida={cantidadEn.comida}
          i={cantidadEn.i}
          extra={extraDe(cantidadEn)!}
          onClose={() => setCantidadEn(null)}
          avisar={avisar}
        />
      )}
      {cargar && <CargarDietaHoja onClose={() => setCargar(false)} onElegir={abrir.cargar} />}
      {diaEn && (
        <UnDiaHoja
          fecha={diaEn}
          onClose={() => setDiaEn(null)}
          avisar={avisar}
          onComida={(c) => {
            setDiaEn(null)
            abrir.cambiar(diaEn, c)
          }}
        />
      )}
      {comidaEn && !extraEn && (
        <ComidaMenuHoja
          consejo={
            comidaEn.menu === query.menu && comidaEn.comida === query.marca
              ? (consejo?.detalle ?? '')
              : undefined
          }
          menuId={comidaEn.menu}
          comida={comidaEn.comida}
          onClose={() => setComidaEn(null)}
          onPlato={(m, c) => {
            setComidaEn(null)
            abrir.plato(m, c)
          }}
          onElegir={(m, c) => {
            setComidaEn(null)
            abrir.elegir(m, c)
          }}
          onExtra={(m, c) => setExtraEn({ menu: m, comida: c })}
          onQuitarExtra={async (m, c, i) => {
            const antes = await quitarExtra(m, c, i)
            avisar('Quitado del menú', { label: 'Deshacer', onClick: () => void volverA(antes) })
          }}
          avisar={avisar}
        />
      )}
      {extraEn && (
        <ExtraHoja
          menu={menu.value.menus.find((k) => k.id === extraEn.menu)?.nombre ?? extraEn.menu}
          comida={extraEn.comida}
          onClose={() => setExtraEn(null)}
          onAnadir={async (c, x) => {
            const antes = await anadirExtra(extraEn.menu, c, x)
            setExtraEn(null)
            setComidaEn(null) // añadido: se vuelve al menú, no a la hoja de la comida
            avisar(`${x.nombre}: en tu menú`, { label: 'Deshacer', onClick: () => void volverA(antes) })
          }}
        />
      )}
    </>
  )
}
