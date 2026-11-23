import { useLocation } from 'preact-iso'
import { useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { PencilIcon } from '../../../../shared/ui/icons.tsx'
import type { Origen } from '../../components/FilaComida.tsx'
import { GrupoComida, ListaGrupos } from '../../components/GrupoComida.tsx'
import { LetraMenu } from '../../components/LetraMenu.tsx'
import { comidasDelDia, piloto } from '../../state/autopilot.ts'
import { ajustes, COMIDAS, dieta, hoy, tipoDe, type ComidaId } from '../../state/comida.ts'
import {
  cicloDe,
  DIA_LARGO,
  diaDeHoy,
  diaSemana,
  estadoRecetas,
  extrasDelDia,
  fotos,
  horaDeComida,
  huecoDe,
  menu,
  menuDelDia,
  nombreDeComida,
  platoPorId,
  tienePlatos,
  totalDeExtras,
  totalDelHueco,
  totalDeMenu,
} from '../../state/recetas.ts'
import { AgendaCocina } from './AgendaCocina.tsx'
import { TiraSemana } from './TiraSemana.tsx'
import { ObjetivoPaso } from './ObjetivoPaso.tsx'
import { PlanVacio } from './PlanVacio.tsx'
import { NutricionistaCard } from './NutricionistaCard.tsx'
import type { Aviso } from '../comun/useAviso.ts'
import { ExtraCantidadHoja } from './ExtraCantidadHoja.tsx'
import { PlatoMenuLlevaHoja } from './PlatoMenuLlevaHoja.tsx'
import styles from './PlanVista.module.css'

type Lente = 'objetivo' | 'come' | 'cocina'

type Props = {
  onComoCocinas: () => void
  onDiaCocina: (fecha: string) => void
  onProponer: () => void
  onCargar: () => void
  onDeDieta: () => void
  /** Sin objetivo: calcularlo con tus datos. */
  onCalcular: () => void
  /** La propuesta del entrenador por decidir. */
  onSugerencia: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/**
 * Mi plan (usuario, 2026-11-18 y 2026-11-19; diseños `Desktop/MUTA-Plan-Diseno` y `MUTA-Mi-Plan`): tres pasos en orden.
 * 1 Objetivo: cuánto comes. 2 Menú: tu semana con el menú de cada día y, el día que tocas, sus comidas con la hora, sus
 * kcal y si salen de una olla o se hacen al momento. 3 Cocina: tu agenda de cocina. Lo demás se abre tocando.
 */
export function PlanVista(props: Props) {
  // Sin objetivo se empieza por él; con él, por tu menú
  const conObjetivo = !!(ajustes.value || dieta.value)
  // El paso va en la ruta (`&paso=objetivo`): al volver de Tu objetivo, sigues en él (usuario, 2026-11-19)
  const { query, route } = useLocation()
  const lente: Lente =
    query.paso === 'objetivo' || query.paso === 'come' || query.paso === 'cocina'
      ? query.paso
      : conObjetivo
        ? 'come'
        : 'objetivo'
  const setLente = (l: Lente) => route(`${paths.nutrition}?vista=plan&paso=${l}`, true)
  const [dia, setDia] = useState(hoy.value)
  if (estadoRecetas.value !== 'listo') return null
  const m = menu.value
  const vacia = m.menus.every((x) => !tienePlatos(x) && !Object.keys(x.extras ?? {}).length)

  return (
    <div class={styles.vista}>
      <ChoiceSegmented<Lente>
        name="plan-lente"
        legend="Los pasos de tu plan"
        grande
        value={lente}
        onChange={setLente}
        options={[
          { value: 'objetivo', label: 'Objetivo', icon: <span class={styles.numPaso}>1</span> },
          { value: 'come', label: 'Menú', icon: <span class={styles.numPaso}>2</span> },
          { value: 'cocina', label: 'Cocina', icon: <span class={styles.numPaso}>3</span> },
        ]}
      />
      {lente === 'objetivo' ? (
        <ObjetivoPaso onCalcular={props.onCalcular} onSugerencia={props.onSugerencia} />
      ) : lente === 'come' ? (
        vacia ? (
          <PlanVacio onProponer={props.onProponer} onCargar={props.onCargar} onDeDieta={props.onDeDieta} />
        ) : (
          <>
            <NutricionistaCard />
            <QueComes dia={dia} onElegir={setDia} {...props} />
          </>
        )
      ) : (
        <AgendaCocina
          onComoCocinas={props.onComoCocinas}
          onDiaCocina={props.onDiaCocina}
          avisar={props.avisar}
        />
      )}
    </div>
  )
}

/** «Qué comes»: la tira de la semana con sus menús, el día con su menú y sus kcal, y sus comidas. */
function QueComes(props: Props & { dia: string; onElegir: (f: string) => void }) {
  const { dia } = props
  // Tocar el plato abre lo que lleva; un alimento, su cantidad (usuario, 2026-11-21: como en Tus menús)
  const [abierto, setAbierto] = useState<{ comida: ComidaId; i: number | null } | null>(null)
  const m = menu.value
  const hoyEs = hoy.value
  const indice = (id: string | undefined) => m.menus.findIndex((x) => x.id === id)
  const { route } = useLocation()
  const x = menuDelDia(m, dia)
  const libre = !!m.libres?.includes(dia)
  /** Lo que va de más en una comida del menú de ese día, en su orden (para cambiar su cantidad). */
  const extrasDelMenu = (c: ComidaId) => x?.extras?.[c] ?? []
  const ciclo = m.ciclo?.menus.length ? cicloDe(m, hoyEs) : null
  const delDia = comidasDelDia(dia)
  const p = piloto.value
  const origen = (c: ComidaId, soloExtras: boolean): Origen | null => {
    if (!p || p.cocina.modo === 'no') return null
    if (soloExtras) return { tipo: 'momento', texto: 'Al momento' }
    const k = delDia.find((y) => y.hueco.comida === c)
    if (!k?.tanda || k.como === 'momento') return { tipo: 'momento', texto: 'Al momento' }
    const de = k.tanda.fecha === dia ? 'de hoy' : `del ${DIA_LARGO[diaSemana(k.tanda.fecha)]}`
    return { tipo: 'olla', texto: `De la olla ${de}` }
  }

  return (
    <>
      <div class={styles.cabecera}>
        <span>
          {ciclo
            ? `${dieta.value?.dieta.nombre ?? 'Tu plan'} · día ${diaDeHoy(m, hoyEs)} de ${ciclo.menus.length}`
            : 'Tu semana'}
        </span>
        <span class={styles.botones}>
          <a href={`${paths.nutrition}?vista=menus`}>
            <PencilIcon />
            Editar
          </a>
        </span>
      </div>

      <TiraSemana dia={dia} onElegir={props.onElegir} />

      <div class={styles.dh}>
        {/* Solo para ver (usuario, 2026-11-19): lo de un día se cambia en Editar */}
        <div class={styles.diaBoton}>
          <span class={styles.titulo}>
            {mayuscula(DIA_LARGO[diaSemana(dia)])} {Number(dia.slice(8))}
          </span>
          <span class={styles.etiquetas}>
            {x && !libre && <LetraMenu id={x.id} indice={indice(x.id)} tam="etiqueta" />}
            <span class={styles.etiqueta}>
              {libre ? 'Día libre' : tipoDe(dia) === 'entreno' ? 'Entreno' : 'Descanso'}
            </span>
          </span>
        </div>
        {!libre && (
          <span class={styles.kcal}>
            <b>{formatInt(totalDeMenu(dia).kcal)}</b>
            <small>kcal</small>
          </span>
        )}
      </div>

      {libre ? (
        <p class={styles.nota}>Día libre: no sigues el menú ni se cocina para él. Se cambia en Editar.</p>
      ) : (
        <ListaGrupos>
          {COMIDAS.map((c) => {
            const h = huecoDe(m, dia, c.id)
            const pl = h ? platoPorId(h.plato, dia) : null
            const extras = extrasDelDia(dia, c.id)
            if (!pl && !extras.length) return null
            const comida = nombreDeComida(m, c.id)
            const kcalPlato = h ? (totalDelHueco(h)?.kcal ?? 0) : 0
            const cosas = [
              ...(pl
                ? [
                    {
                      nombre: pl.nombre,
                      foto: fotos.value[pl.id] ?? null,
                      kcal: Math.round(kcalPlato),
                      onTocar: () => setAbierto({ comida: c.id, i: null }),
                    },
                  ]
                : []),
              ...extras.map((e) => ({
                nombre: e.nombre,
                foto: e.platoId ? (fotos.value[e.platoId] ?? null) : null,
                kcal: Math.round(totalDeExtras([e]).kcal),
                onTocar: e.platoId
                  ? () => route(paths.dish(e.platoId!, { comida: c.id, fecha: dia }))
                  : () => setAbierto({ comida: c.id, i: extrasDelMenu(c.id).indexOf(e) }),
              })),
            ]
            return (
              <GrupoComida
                key={c.id}
                titulo={comida}
                meta={`${horaDeComida(m, c.id)}${m.cambiados[`${dia}|${c.id}`] ? ' · solo este día' : ''}`}
                kcal={Math.round(kcalPlato + totalDeExtras(extras).kcal)}
                cosas={cosas}
                origen={origen(c.id, !pl)}
                etiquetaAccesible={`${comida}: ${cosas.map((k) => k.nombre).join(', ')}, ver la receta`}
                onClick={() => pl && route(paths.dish(pl.id, { comida: c.id, fecha: dia }))}
              />
            )
          })}
        </ListaGrupos>
      )}
      {!x && <p class={styles.nota}>Este día no tiene menú.</p>}
      {abierto && x && abierto.i === null && (
        <PlatoMenuLlevaHoja
          menuId={x.id}
          comida={abierto.comida}
          dia={dia}
          onClose={() => setAbierto(null)}
          avisar={props.avisar}
        />
      )}
      {abierto && x && abierto.i !== null && extrasDelMenu(abierto.comida)[abierto.i] && (
        <ExtraCantidadHoja
          menuId={x.id}
          comida={abierto.comida}
          i={abierto.i}
          extra={extrasDelMenu(abierto.comida)[abierto.i]}
          onClose={() => setAbierto(null)}
          avisar={props.avisar}
        />
      )}
    </>
  )
}
