import { useEffect, useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { ChevronDownIcon, ChevronRightIcon, DotsIcon, PlusIcon } from '../../../../shared/ui/icons.tsx'
import { PlatoFoto } from '../../components/Platos.tsx'
import { COMIDAS, dieta, hoy, type ComidaId } from '../../state/comida.ts'
import {
  diaSemana,
  diasDelMenu,
  estadoRecetas,
  fotos,
  huecoDe,
  MAX_MENUS,
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
import { cuantosMenus, menuEnDia } from '../../use-cases/menu.ts'
import styles from './Menu.module.css'
import { Deslizable } from '../../../../shared/ui/Deslizable.tsx'
import v from './Vistas.module.css'

type Props = {
  onPlato: (menu: string, comida: ComidaId) => void
  /** Deslizar un plato: quitarlo del menú (se deshace). */
  onQuitarPlato: (menu: string, comida: ComidaId) => void
  onAnadir: (menu: string, comida: ComidaId) => void
  onOpciones: (menu: string) => void
  onCuantos: () => void
  onAvisos: () => void
  onDeDieta: () => void
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
export function MenuVista({
  onPlato,
  onQuitarPlato,
  onAnadir,
  onOpciones,
  onCuantos,
  onAvisos,
  onDeDieta,
}: Props) {
  // Sin tocar nada, abierto el primer menú sin platos (cerrado no se ve por dónde empezar)
  const [abierto, setAbierto] = useState<string | null | undefined>(undefined)
  // Se elige una vez, al cargar: si no, al poner el primer plato el menú se cerraría solo
  const listo = estadoRecetas.value === 'listo'
  useEffect(() => {
    if (listo && abierto === undefined)
      setAbierto(menu.value.menus.find((x) => !Object.values(x.platos).some(Boolean))?.id ?? null)
  }, [listo, abierto])
  if (!listo) return null
  const m = menu.value
  const dias = semanaDesde(hoy.value)
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
          <button type="button" class={styles.enlace} onClick={onCuantos}>
            Cambiar
          </button>
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
      <div class={styles.menus}>
        {m.menus.map((x) => (
          <TarjetaMenu
            key={x.id}
            menu={x}
            abierto={abierto === x.id}
            onAbrir={() => setAbierto(abierto === x.id ? null : x.id)}
            onPlato={onPlato}
            onQuitarPlato={onQuitarPlato}
            onAnadir={onAnadir}
            onOpciones={onOpciones}
          />
        ))}
        {m.menus.length < MAX_MENUS && (
          <button
            type="button"
            class={styles.nuevoMenu}
            onClick={async () => {
              await cuantosMenus(m.menus.length + 1)
              setAbierto(menu.value.menus.at(-1)?.id ?? null)
            }}
          >
            <PlusIcon /> Añadir menú
          </button>
        )}
      </div>
      <a class={`${styles.herramienta} ${styles.dietaFila}`} href={`${paths.nutrition}?vista=dieta`}>
        <span class={styles.hIcono} aria-hidden="true">
          📋
        </span>
        <span class={styles.hTexto}>
          <span class={styles.hNombre}>
            {dieta.value ? `Tu dieta: ${dieta.value.dieta.nombre}` : 'Cargar la dieta de tu nutricionista'}
          </span>
          <span class={v.foot}>
            {dieta.value
              ? 'Sus menús, la consulta semanal y sus recetas'
              : 'Su archivo de dieta, o la de ejemplo para probar'}
          </span>
        </span>
        <ChevronRightIcon />
      </a>
      {dieta.value && (
        <p class={`${v.pad} ${v.foot}`}>
          <button type="button" class={styles.enlace} onClick={onDeDieta}>
            Pasar sus menús a tus menús
          </button>
        </p>
      )}
      <section class={v.pad} aria-labelledby="herramientas">
        <h2 id="herramientas" class={styles.herramientasTitulo}>
          Herramientas
        </h2>
        <ul class={styles.herramientas}>
          <li>
            <a class={styles.herramienta} href={paths.shopping}>
              <span class={styles.hIcono} aria-hidden="true">
                🛒
              </span>
              <span class={styles.hTexto}>
                <span class={styles.hNombre}>Lista de la compra</span>
                <span class={v.foot}>Lo que hace falta para tus menús</span>
              </span>
              <ChevronRightIcon />
            </a>
          </li>
          <li>
            <a class={styles.herramienta} href={`${paths.kitchen}?desde=menu`}>
              <span class={styles.hIcono} aria-hidden="true">
                ⚖️
              </span>
              <span class={styles.hTexto}>
                <span class={styles.hNombre}>Cocinar y pesar</span>
                <span class={v.foot}>En crudo y cocinado, cuánto servirte y repartir una olla</span>
              </span>
              <ChevronRightIcon />
            </a>
          </li>
          <li>
            <button type="button" class={styles.herramienta} onClick={onAvisos}>
              <span class={styles.hIcono} aria-hidden="true">
                🔔
              </span>
              <span class={styles.hTexto}>
                <span class={styles.hNombre}>Recordatorios</span>
                <span class={v.foot}>El día de la compra y cuándo cocinar, en tu calendario</span>
              </span>
              <ChevronRightIcon />
            </button>
          </li>
        </ul>
      </section>
    </div>
  )
}

function TarjetaMenu(props: {
  menu: MenuPlan
  abierto: boolean
  onAbrir: () => void
  onPlato: (menu: string, comida: ComidaId) => void
  /** Deslizar un plato: quitarlo del menú (se deshace). */
  onQuitarPlato: (menu: string, comida: ComidaId) => void
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
  // Lo que propone tu nutricionista para este menú («Menú A: no llegas a la proteína» → «No llegas a la proteína»)
  const titulo = propuestas.value.find((p) => p.menu === x.id)?.titulo.replace(/^[^:]*:\s*/, '')
  const propuesta = titulo ? titulo.charAt(0).toUpperCase() + titulo.slice(1) : null
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
      {propuesta && (
        <a class={styles.avisoMenu} href={paths.nutritionist}>
          <span class={styles.punto} aria-hidden="true" />
          <span class={styles.hTexto}>
            <span class={styles.avisoTexto}>{propuesta}</span>
            <span class={v.foot}>Tu nutricionista te propone un cambio</span>
          </span>
          <span class={styles.ver}>Ver ›</span>
        </a>
      )}
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
                  <Deslizable
                    fondo="surface"
                    ariaLabel={`Quitar ${p?.nombre ?? 'el plato'} de ${x.nombre}`}
                    onQuitar={() => props.onQuitarPlato(x.id, c.id)}
                  >
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
                  </Deslizable>
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
