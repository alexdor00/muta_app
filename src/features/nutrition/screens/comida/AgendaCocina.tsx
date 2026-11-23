import { useEffect, useState } from 'preact/hooks'
import { cocinarEseDia } from '../../use-cases/autopilot.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { CartIcon, PotIcon } from '../../../../shared/ui/iconosHoy.tsx'
import { ClockIcon, PencilIcon } from '../../../../shared/ui/icons.tsx'
import { PlatoFoto } from '../../components/Platos.tsx'
import {
  comidasDelDia,
  compraDeLaSemana,
  diasDeCompra,
  enLista,
  paraQueDias,
  partesDeTanda,
  piloto,
  tandas,
} from '../../state/autopilot.ts'
import { COMIDAS, hoy, type ComidaId } from '../../state/comida.ts'
import {
  DIA_LARGO as NOMBRE_DIA_LARGO,
  diaSemana,
  extrasDelDia,
  fotos,
  horaDeComida,
  huecoDe,
  menu,
  nombreDeComida,
  NOMBRE_DIA,
  platoPorId,
  semanaDesde,
} from '../../state/recetas.ts'
import { parteDelPlato } from '../comun/parteDelPlato.ts'
import type { Aviso } from '../comun/useAviso.ts'
import k from './AgendaCocina.module.css'
import { PlatoMenuLlevaHoja } from './PlatoMenuLlevaHoja.tsx'
import { cargarOllas } from '../../use-cases/ollas.ts'
import { TusOllas } from '../tanda/Ollas.tsx'
import styles from './PlanVista.module.css'

/**
 * Lo que se hace al momento un día, una fila por comida (usuario, 2026-11-21: antes, una por cosa): los platos al momento
 * y lo de más, juntos y con los repetidos contados («Huevo entero ×2»), con su hora; `plato`, para abrir lo que lleva.
 */
function alMomento(
  fecha: string,
): { comida: ComidaId; titulo: string; cosas: string; foto: string | null; plato: string | null }[] {
  const m = menu.value
  return COMIDAS.flatMap((c) => {
    const dia = comidasDelDia(fecha).find((x) => x.hueco.comida === c.id)
    const pl = dia ? platoPorId(dia.hueco.plato, fecha) : null
    const alMomentoPlato = pl && dia && (dia.como === 'momento' || !dia.tanda) ? pl : null
    const nombres = [
      ...(alMomentoPlato ? [alMomentoPlato.nombre] : []),
      ...extrasDelDia(fecha, c.id).map((e) => e.nombre),
    ]
    if (!nombres.length) return []
    const cuenta = new Map<string, number>()
    for (const n of nombres) cuenta.set(n, (cuenta.get(n) ?? 0) + 1)
    const extraConFoto = extrasDelDia(fecha, c.id).find((e) => e.platoId)
    return [
      {
        comida: c.id,
        titulo: `${nombreDeComida(m, c.id)} · ${horaDeComida(m, c.id)}`,
        cosas: enLista([...cuenta].map(([n, veces]) => (veces > 1 ? `${n} ×${veces}` : n))),
        foto: alMomentoPlato
          ? (fotos.value[alMomentoPlato.id] ?? null)
          : extraConFoto?.platoId
            ? (fotos.value[extraConFoto.platoId] ?? null)
            : null,
        plato: alMomentoPlato?.id ?? null,
      },
    ]
  })
}

/**
 * «Cuándo cocinas» (Plan, usuario 2026-11-18): tus próximos 7 días con la compra, lo que cocinas (cada plato con su parte
 * y para qué días) y lo que se hace al momento. Tocar un día de cocina lo abre; «Cómo cocinas» lo cambia todo.
 */
export function AgendaCocina(props: {
  onComoCocinas: () => void
  onDiaCocina: (fecha: string) => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}) {
  const [dia, setDia] = useState(hoy.value)
  useEffect(() => void cargarOllas(), [])
  // Tocar un plato abre lo que lleva (usuario, 2026-11-21: como en Mi plan y Tus menús)
  const [abierto, setAbierto] = useState<{ menu: string; comida: ComidaId; dia: string } | null>(null)
  const p = piloto.value
  if (!p || p.cocina.modo === 'no')
    return (
      <section class={styles.tarjetaTexto}>
        <b>Aún no has dicho cuándo cocinas</b>
        <span>Elige cuántas veces y a qué hora: MUTA reparte qué cocinar cada vez y cuándo comprar.</span>
        <button type="button" class={styles.boton} onClick={props.onComoCocinas}>
          Cómo cocinas
        </button>
      </section>
    )
  const dias = semanaDesde(hoy.value)
  const ts = tandas.value
  const compras = diasDeCompra(p, dias, ts)
  const compra = compraDeLaSemana.value
  const tandaDe = (f: string) => ts.find((t) => t.fecha === f && t.huecos.length) ?? null
  const veces = dias.filter(tandaDe).length
  const f = dias.includes(dia) ? dia : dias[0]
  const t = tandaDe(f)
  const momento = alMomento(f)
  const compraHoy = compras.includes(f) && !!p.compra
  const nombreDia = (x: string) => (x === hoy.value ? 'Hoy' : NOMBRE_DIA[diaSemana(x)])

  return (
    <>
      <div class={styles.cabecera}>
        <span>
          Cocinas {veces} {veces === 1 ? 'vez' : 'veces'} · {p.cocina.hora}
        </span>
        <button type="button" onClick={props.onComoCocinas}>
          <PencilIcon />
          Editar
        </button>
      </div>
      {/* La semana, como en Menú: cada día con lo que toca (usuario, 2026-11-19, Desktop/MUTA-Cocina-semana.png) */}
      <div class={styles.tira} role="group" aria-label="Tu semana de cocina">
        {dias.map((x) => (
          <button key={x} type="button" class={styles.dia} aria-pressed={x === f} onClick={() => setDia(x)}>
            <span class={styles.letra}>{nombreDia(x)}</span>
            <b>{Number(x.slice(8))}</b>
            <span class={k.iconos} aria-hidden="true">
              {compras.includes(x) && p.compra && <CartIcon />}
              {tandaDe(x) && <PotIcon />}
            </span>
          </button>
        ))}
      </div>
      <div class={k.titulo}>
        <h3>{x0(f)}</h3>
        <span>
          {[compraHoy && 'Compras', t && 'Cocinas', momento.length && 'Al momento']
            .filter(Boolean)
            .join(' · ') || 'Nada que hacer'}
        </span>
      </div>
      {compraHoy && (
        <section class={k.card}>
          <div class={k.cabeza}>
            <span class={k.icono}>
              <CartIcon />
            </span>
            <span class={k.texto}>
              <b>Compras · {p.compra?.hora}</b>
              {compra?.fecha === f && <small>{compra.faltan.length} cosas</small>}
            </span>
            <a class={k.accion} href={paths.shopping}>
              Ver lista
            </a>
          </div>
        </section>
      )}
      {t && (
        <section class={k.card}>
          <div class={k.cabeza}>
            <span class={k.icono}>
              <PotIcon />
            </span>
            <button type="button" class={k.texto} onClick={() => props.onDiaCocina(f)}>
              <b>Cocinas · {t.hora}</b>
              <small>{paraQueDias(t)}</small>
            </button>
            <a class={k.accion} href={paths.batch(f)}>
              Cocinar
            </a>
          </div>
          {partesDeTanda(t, p, (id) => platoPorId(id)).map((x) => (
            <div key={x.plato} class={k.fila}>
              <button
                type="button"
                class={k.tocar}
                onClick={() => {
                  const h = t.huecos.find((y) => y.plato === x.plato)
                  if (h) setAbierto({ menu: h.menu, comida: h.comida, dia: h.fecha })
                }}
              >
                <PlatoFoto foto={fotos.value[x.plato] ?? null} />
                <span class={k.texto}>
                  <span>{platoPorId(x.plato)?.nombre ?? 'Plato'}</span>
                  <small>{parteDelPlato(x)}</small>
                </span>
              </button>
            </div>
          ))}
        </section>
      )}
      {momento.length > 0 && (
        <section class={k.card}>
          <div class={k.cabeza}>
            <span class={k.icono}>
              <ClockIcon />
            </span>
            <span class={k.texto}>
              <b>Al momento</b>
              <small>Lo haces justo antes de comerlo</small>
            </span>
          </div>
          {momento.map((x) => (
            <button
              key={x.comida}
              type="button"
              class={`${k.fila} ${k.tocar}`}
              disabled={!x.plato}
              onClick={() => {
                const h = huecoDe(menu.value, f, x.comida)
                if (h) setAbierto({ menu: h.menu, comida: x.comida, dia: f })
              }}
            >
              <PlatoFoto foto={x.foto} />
              <span class={k.texto}>
                <span>{x.titulo}</span>
                <small>{x.cosas}</small>
              </span>
            </button>
          ))}
        </section>
      )}
      {/* Solo este día: cocinar aunque tu regla no lo diga, o no cocinar (se vuelve a tocar para deshacerlo) */}
      {f >= hoy.value && (
        <button type="button" class={k.soloDia} onClick={() => void cocinarEseDia(f, !t)}>
          {t ? 'Este día no cocino' : 'Cocinar este día'}
        </button>
      )}
      {abierto && (
        <PlatoMenuLlevaHoja
          menuId={abierto.menu}
          comida={abierto.comida}
          dia={abierto.dia}
          onClose={() => setAbierto(null)}
          avisar={props.avisar}
        />
      )}
      {/* Lo que pesa cada olla vacía, para repartir (usuario, 2026-11-21) */}
      <TusOllas />
    </>
  )
}

/** «Jueves 19». */
function x0(f: string) {
  const n = NOMBRE_DIA_LARGO[diaSemana(f)]
  return `${n.charAt(0).toUpperCase() + n.slice(1)} ${Number(f.slice(8))}`
}
