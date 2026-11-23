import { signal } from '@preact/signals'
import { paths } from '../../../../shared/lib/paths.ts'
import { compraDeLaSemana, platosDeTanda, tandaDeHoy } from '../../state/autopilot.ts'
import { hoy } from '../../state/comida.ts'
import { fotos, huecosDelDia, menu, platoPorId, semanaDesde, tareasDeHoy } from '../../state/recetas.ts'
import { ChevronDownIcon } from '../../../../shared/ui/icons.tsx'
import styles from './HoyCocinas.module.css'

type Tarea = {
  id: string
  platos: readonly string[]
  rotulo: string
  titulo: string
  detalle: string
  href: string
  boton: string
  /** Cada plato con su modo cocina (usuario, 2026-11-21) */
  enlaces?: { texto: string; href: string }[]
}

/** Cocinar hoy: las raciones, la hora, cuánto se tarda y «Cocinar» (el modo cocina). Null si no toca o ya está hecho. */
function cocinarHoy(): Tarea | null {
  const t = tandaDeHoy.value
  if (!t || t.hecha || !t.huecos.length) return null
  const platos = platosDeTanda(t)
  const dias = new Set(t.huecos.map((h) => h.fecha)).size
  return {
    id: 'cocinar',
    platos: platos.map((p) => p.plato),
    rotulo: `Hoy cocinas · ${t.hora}`,
    titulo: `${t.huecos.length} ${t.huecos.length === 1 ? 'ración' : 'raciones'}${dias > 1 ? ` para ${dias} días` : ''}`,
    detalle: platos
      .map((p) => `${platoPorId(p.plato)?.nombre ?? 'Plato'} ×${p.raciones}`)
      .join(String.fromCharCode(10)),
    href: paths.batch(t.fecha),
    boton: 'Cocinar',
    enlaces: platos.map((p) => ({
      texto: `${platoPorId(p.plato)?.nombre ?? 'Plato'} ×${p.raciones}`,
      href: paths.batch(t.fecha, undefined, p.plato),
    })),
  }
}

/**
 * La compra de hoy: con tu semana resuelta, la de tu día (cuántas cosas faltan; si está todo, nada); sin ella, la del día
 * que elegiste.
 */
function comprarHoy(): Tarea | null {
  const s = compraDeLaSemana.value
  if (s && s.fecha === hoy.value) {
    const quedan = s.faltan.filter((x) => !x.comprado).length
    if (!quedan) return null
    return {
      id: 'compra',
      platos: s.platos,
      rotulo: `Hoy compras · ${s.hora}`,
      titulo: `${quedan} ${quedan === 1 ? 'cosa' : 'cosas'} por comprar`,
      detalle: '',
      href: paths.shopping,
      boton: 'Ver la lista',
    }
  }
  const t = tareasDeHoy.value.find((x) => x.tipo === 'compra')
  if (!t) return null
  return {
    id: 'compra',
    platos: [
      ...new Set(semanaDesde(hoy.value).flatMap((f) => huecosDelDia(menu.value, f).map((h) => h.plato))),
    ],
    rotulo: `Hoy compras · ${t.hora}`,
    titulo: 'La compra de tu menú',
    detalle: '',
    href: paths.shopping,
    boton: 'Ver la lista',
  }
}

/**
 * Lo que toca hacer hoy (usuario, 2026-11-17: arriba del todo y con foto): cocinar y la compra en una sola tarjeta, con
 * hasta tres fotos de los platos y una línea con su botón para cada cosa. Si hoy no toca nada, no sale. Sin «×» (usuario,
 * 2026-11-21); lo que quitaste antes con ella sigue fuera ese día.
 */
export const HoyToca = () => {
  const q = menu.value.quitadoHoy
  const fuera = q?.fecha === hoy.value ? q.ids : []
  return <Tarjeta tareas={[cocinarHoy(), comprarHoy()].filter((t) => !t || !fuera.includes(t.id))} />
}

/** Solo cocinar (el centro de Cocinar). */
export const HoyCocinas = () => <Tarjeta tareas={[cocinarHoy()]} />

/**
 * Plegada o abierta (usuario, 2026-11-21): al abrir la app sale plegada; si la abres o la pliegas, se queda así el resto
 * del día (en memoria: la app recién abierta vuelve a plegarla).
 */
const abierta = signal<{ fecha: string; si: boolean }>({ fecha: '', si: false })

function Tarjeta(props: { tareas: (Tarea | null)[] }) {
  const tareas = props.tareas.filter((t): t is Tarea => t !== null)
  if (!tareas.length) return null
  const plegada = !(abierta.value.fecha === hoy.value && abierta.value.si)
  const alternar = () => (abierta.value = { fecha: hoy.value, si: plegada })
  const conFoto = [...new Set(tareas.flatMap((t) => t.platos))].filter((id) => fotos.value[id]).slice(0, 3)
  return (
    <section class={styles.tarjeta} aria-label="Hoy toca">
      {!plegada && conFoto.length > 0 && (
        <div class={styles.fotos} aria-hidden="true">
          {conFoto.map((id) => (
            <span key={id} style={{ backgroundImage: `url(${fotos.value[id]})` }} />
          ))}
        </div>
      )}
      {tareas.map((t) => (
        <div key={t.id} class={styles.pie}>
          <div class={styles.texto}>
            <button type="button" class={styles.plegar} aria-expanded={!plegada} onClick={alternar}>
              <span class={styles.rotulo}>{t.rotulo}</span>
              <span class={`${styles.flecha} ${plegada ? '' : styles.girada}`} aria-hidden="true">
                <ChevronDownIcon />
              </span>
            </button>
            {!plegada && <span class={styles.titulo}>{t.titulo}</span>}
            {!plegada &&
              (t.enlaces ? (
                <span class={styles.enlaces}>
                  {t.enlaces.map((e) => (
                    <a key={e.href} class={styles.enlace} href={e.href}>
                      {e.texto}
                    </a>
                  ))}
                </span>
              ) : (
                t.detalle && <span class={styles.detalle}>{t.detalle}</span>
              ))}
          </div>
          <a class={styles.cocinar} href={t.href} aria-label={`${t.boton}: ${t.rotulo.toLowerCase()}`}>
            {t.boton}
          </a>
        </div>
      ))}
    </section>
  )
}
