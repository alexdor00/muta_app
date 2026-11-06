import { useLocation } from 'preact-iso'
import { useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { ChevronDownIcon, DotsIcon, PlusIcon } from '../../../../shared/ui/icons.tsx'
import { CoachCard } from '../../components/CoachCard.tsx'
import { PlatoFoto } from '../../components/Platos.tsx'
import { COMIDAS, dieta, hoy, type ComidaId } from '../../state/comida.ts'
import {
  diaSemana,
  diasDelMenu,
  estadoRecetas,
  fotos,
  huecoDe,
  menu,
  menuDelDia,
  NOMBRE_DIA,
  platoPorId,
  propuestas,
  semanaDesde,
  totalDeMenu,
  totalDelHueco,
  type MenuPlan,
} from '../../state/recetas.ts'
import { menuEnDia } from '../../use-cases/menu.ts'
import styles from './Menu.module.css'
import v from './Vistas.module.css'

type Props = {
  onPlato: (menu: string, comida: ComidaId) => void
  onAnadir: (menu: string, comida: ComidaId) => void
  onOpciones: (menu: string) => void
  onCuantos: () => void
  onAvisos: () => void
}

const DIA_LARGO = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

/** «hoy y lunes», «sábado y martes», «ningún día». */
function cuando(dias: readonly string[], hoyEs: string): string {
  const n = dias.map((f) => (f === hoyEs ? 'hoy' : DIA_LARGO[diaSemana(f)]))
  if (!n.length) return 'ningún día'
  return n.length === 1 ? n[0] : `${n.slice(0, -1).join(', ')} y ${n.at(-1)}`
}

/**
 * Tus menús: arriba tu semana (qué menú va cada día; tócalo para cambiarlo) y debajo cada menú cerrado con sus kcal y las
 * fotos de sus platos. Abierto, sus cuatro comidas.
 */
export function MenuVista({ onPlato, onAnadir, onOpciones, onCuantos, onAvisos }: Props) {
  const { route } = useLocation()
  const [abierto, setAbierto] = useState<string | null>(null)
  if (estadoRecetas.value !== 'listo') return null
  const m = menu.value
  const dias = semanaDesde(hoy.value)
  const n = propuestas.value.length
  const siguienteMenu = (actual: string) => {
    const i = m.menus.findIndex((x) => x.id === actual)
    return m.menus[(i + 1) % m.menus.length].id
  }
  return (
    <div class={v.stack}>
      <section class={styles.semanaCard} aria-labelledby="tu-semana">
        <div class={styles.diaHead}>
          <h2 id="tu-semana" class={styles.diaTitulo}>
            Tu semana
          </h2>
          <span class={v.foot}>
            {m.menus.length} {m.menus.length === 1 ? 'menú' : 'menús'}
          </span>
        </div>
        <ol class={styles.dias}>
          {dias.map((f) => {
            const id = menuDelDia(m, f)?.id ?? ''
            const nombre = f === hoy.value ? 'Hoy' : NOMBRE_DIA[diaSemana(f)]
            return (
              <li key={f}>
                <span class={styles.diaNombre}>{nombre}</span>
                <button
                  type="button"
                  class={`${styles.letra} ${f === hoy.value ? styles.letraHoy : ''}`}
                  aria-label={`${nombre}: menú ${id}${m.menus.length > 1 ? ', cambiar' : ''}`}
                  disabled={m.menus.length < 2}
                  onClick={() => void menuEnDia(diaSemana(f), siguienteMenu(id))}
                >
                  {id}
                </button>
              </li>
            )
          })}
        </ol>
      </section>
      {n > 0 && (
        <CoachCard
          titulo="Tu nutricionista"
          texto={n === 1 ? propuestas.value[0].titulo : `${n} propuestas para tus menús`}
          ver="Ver"
          onVer={() => route(paths.nutritionist)}
        />
      )}
      <div class={styles.menus}>
        {m.menus.map((x) => (
          <TarjetaMenu
            key={x.id}
            menu={x}
            abierto={abierto === x.id}
            onAbrir={() => setAbierto(abierto === x.id ? null : x.id)}
            onPlato={onPlato}
            onAnadir={onAnadir}
            onOpciones={onOpciones}
          />
        ))}
      </div>
      <div class={styles.atajos}>
        <button type="button" class={styles.atajo} onClick={onCuantos}>
          Tus menús
        </button>
        <a class={styles.atajo} href={paths.shopping}>
          La compra
        </a>
        <button type="button" class={styles.atajo} onClick={onAvisos}>
          Avisos
        </button>
      </div>
      <a class={`${v.pad} ${v.foot} ${styles.dieta}`} href={`${paths.nutrition}?vista=dieta`}>
        {dieta.value
          ? `Tu dieta: ${dieta.value.dieta.nombre} ›`
          : '¿Sigues una dieta pautada? Cárgala aquí ›'}
      </a>
    </div>
  )
}

function TarjetaMenu(props: {
  menu: MenuPlan
  abierto: boolean
  onAbrir: () => void
  onPlato: (menu: string, comida: ComidaId) => void
  onAnadir: (menu: string, comida: ComidaId) => void
  onOpciones: (menu: string) => void
}) {
  const { menu: x, abierto } = props
  const hoyEs = hoy.value
  const dias = diasDelMenu(menu.value, x.id, hoyEs)
  const primero = dias[0] ?? hoyEs
  const total = dias.length ? totalDeMenu(primero) : null
  const faltan = COMIDAS.filter((c) => !x.platos[c.id])
  const ids = COMIDAS.flatMap((c) => (x.platos[c.id] ? [x.platos[c.id]!] : []))
  const detalle = !ids.length
    ? 'Sin platos aún'
    : `${total && total.kcal ? `${formatInt(total.kcal)} kcal · ` : ''}${cuando(dias, hoyEs)}`
  const cuerpo = `cuerpo-${x.id}`
  return (
    <section class={styles.menuCard} aria-label={x.nombre}>
      <div class={styles.menuHead}>
        <button
          type="button"
          class={styles.menuAbrir}
          aria-expanded={abierto}
          aria-controls={cuerpo}
          onClick={props.onAbrir}
        >
          <span class={styles.filaTexto}>
            <span class={styles.menuNombre}>{x.nombre}</span>
            <span class={v.foot}>
              {detalle}
              {ids.length > 0 && faltan.length > 0 && !abierto ? ` · le falta ${faltan[0].el}` : ''}
            </span>
          </span>
          {!abierto && ids.length > 0 && (
            <span class={styles.fotos} aria-hidden="true">
              {ids.slice(0, 4).map((id, i) => (
                <span key={`${id}-${i}`} class={styles.mini}>
                  <PlatoFoto foto={fotos.value[id] ?? null} />
                </span>
              ))}
            </span>
          )}
          <span class={`${styles.flechaMenu} ${abierto ? styles.flechaArriba : ''}`} aria-hidden="true">
            <ChevronDownIcon />
          </span>
        </button>
        {abierto && (
          <button
            type="button"
            class={styles.opciones}
            aria-label={`Opciones de ${x.nombre}`}
            onClick={() => props.onOpciones(x.id)}
          >
            <DotsIcon />
          </button>
        )}
      </div>
      {abierto && (
        <ul id={cuerpo} class={styles.filas}>
          {COMIDAS.map((c) => {
            const id = x.platos[c.id]
            const p = id ? platoPorId(id, primero) : null
            const h = huecoDe(menu.value, primero, c.id)
            const t = h && h.menu === x.id ? totalDelHueco(h) : p ? p.total : null
            const cocinado = h?.cocinado ? menu.value.cocinados.find((k) => k.id === h.cocinado) : null
            return (
              <li key={c.id} class={styles.filaMenu}>
                {id ? (
                  <button type="button" class={styles.fila} onClick={() => props.onPlato(x.id, c.id)}>
                    <PlatoFoto foto={fotos.value[id] ?? null} />
                    <span class={styles.filaTexto}>
                      <span class={styles.comida}>{c.nombre}</span>
                      <span class={styles.plato}>{p?.nombre ?? 'Plato que ya no está'}</span>
                    </span>
                    {cocinado ? (
                      <span class={styles.cocinar}>
                        {NOMBRE_DIA[diaSemana(cocinado.fecha)]} {cocinado.hora}
                      </span>
                    ) : (
                      t && <span class={v.foot}>{formatInt(t.kcal)} kcal</span>
                    )}
                  </button>
                ) : (
                  <button type="button" class={styles.fila} onClick={() => props.onAnadir(x.id, c.id)}>
                    <span class={styles.mas} aria-hidden="true">
                      <PlusIcon />
                    </span>
                    <span class={styles.filaTexto}>
                      <span class={styles.comida}>{c.nombre}</span>
                      <span class={v.foot}>Añadir plato</span>
                    </span>
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
