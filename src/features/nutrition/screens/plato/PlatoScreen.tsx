import { useLocation } from 'preact-iso'
import { useEffect, useState } from 'preact/hooks'
import { daysBetween, formatDayDate, formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { HeroHeader } from '../../../../shared/ui/HeroHeader.tsx'
import { ChevronRightIcon, MinusIcon, PlusIcon } from '../../../../shared/ui/icons.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import { comidaPorHora, diaVisto, dieta, estado, hoy } from '../../state/comida.ts'
import {
  enCrudo,
  estadoRecetas,
  fotos,
  MACROS,
  menu,
  platoPorId,
  recetario,
  siguiente,
  totalDePlato,
} from '../../state/recetas.ts'
import { ponerPlato } from '../../use-cases/menu.ts'
import { cargarComida } from '../../use-cases/nutritionStore.ts'
import { apuntarPlato, borrarPlato, cargarRecetas, desapuntar } from '../../use-cases/recipes.ts'
import { comidaDe, esComida } from '../comun/platos.ts'
import { useAviso } from '../comun/useAviso.ts'
import { Cifras } from '../comun/Cifras.tsx'
import h from '../comun/Hojas.module.css'
import r from '../receta/Receta.module.css'
import { ADietaHoja } from './ADietaHoja.tsx'
import { AjustarHoja } from './AjustarHoja.tsx'
import { AlMenuHoja } from './AlMenuHoja.tsx'
import { CambiarHoja } from './CambiarHoja.tsx'
import { EditarPlatoHoja } from './EditarPlatoHoja.tsx'
import styles from './Plato.module.css'

/**
 * Un plato del recetario o tuyo, como una receta: foto, cifras (las del libro, con tus productos), raciones,
 * ingredientes con su macro principal y la preparación. «Ajustar a lo que falta» cambia sus gramos; «Apuntar» lo apunta
 * tal cual o ajustado.
 */
export function PlatoScreen(props: { id: string }) {
  useEffect(() => {
    void cargarComida().then(cargarRecetas)
  }, [])
  const { query, route } = useLocation()
  const [veces, setVeces] = useState(1)
  const [gramos, setGramos] = useState<(number | null)[] | null>(null)
  const [cual, setCual] = useState<number | null>(null)
  const ajustarHoja = useSheet('ajustar')
  const cambiar = useSheet('cambiar')
  const editar = useSheet('editar')
  const alMenu = useSheet('al-menu')
  const aDieta = useSheet('a-dieta')
  const { aviso, avisar } = useAviso()
  if (estado.value === 'cargando' || estadoRecetas.value !== 'listo') return null
  const fecha = query.fecha ?? diaVisto.value
  const p = platoPorId(props.id, fecha)
  const volver = query.desde === 'menu' ? `${paths.nutrition}?vista=menu` : `${paths.nutrition}?vista=recetas`
  if (!p) {
    return (
      <div class={r.page}>
        <p class={h.sub}>Este plato ya no está.</p>
        <Button href={volver}>Volver a Comida</Button>
      </div>
    )
  }
  const comida = esComida(query.comida)
    ? query.comida
    : (siguiente.value?.comida ?? comidaPorHora(new Date().getHours()))
  const cuando = daysBetween(fecha, hoy.value) === 0 ? 'hoy' : `el ${formatDayDate(fecha)}`
  // Desde un menú (al elegir su plato): lo principal es ponerlo en el menú, no apuntarlo hoy
  const enMenu =
    query.desde === 'menu' && esComida(query.comida)
      ? (menu.value.menus.find((m) => m.id === query.menu) ?? null)
      : null
  const yaEnMenu = enMenu?.platos[comida] === p.id
  const total = totalDePlato(p, gramos ?? undefined, veces)
  const categoria = recetario.value?.categorias.find((c) => c.id === p.categoria)?.nombre
  const detalle = [
    categoria ?? (p.origen === 'tuyo' ? 'Tuyo' : 'De ejemplo'),
    p.dificultad,
    p.minutos ? `${p.minutos} min` : '',
    p.raciones > 1 ? `${p.raciones} raciones en total` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  const apuntar = async () => {
    const ids = await apuntarPlato(p, comida, gramos, veces, fecha)
    avisar(`Apuntado en ${comidaDe(comida).nombre.toLowerCase()} ${cuando}`, {
      label: 'Deshacer',
      onClick: () => void desapuntar(ids, fecha),
    })
  }

  const apuntarHoy = (
    <Button variant={enMenu ? 'secondary' : undefined} onClick={() => void apuntar()}>
      Apuntar en {comidaDe(comida).nombre.toLowerCase()} {cuando}
    </Button>
  )

  return (
    <div class={r.screen}>
      <HeroHeader
        title={p.nombre}
        description={detalle}
        photo={fotos.value[p.id]}
        tone={5}
        backHref={volver}
      />
      <div class={r.page}>
        <Cifras total={total} />
        <p class={h.foot}>
          {p.origen === 'recetario'
            ? 'Cifras del recetario por ración'
            : 'Suma de sus ingredientes (base de alimentos)'}
          {p.raciones > 1
            ? `: el libro da el total de ${p.raciones} raciones; aquí, ${veces} de ellas.`
            : '.'}
          {gramos ? ' Con los gramos ajustados.' : ''}
        </p>
        {p.ajustable && !enMenu && (
          <div class={styles.buttons}>
            <Button variant="secondary" onClick={ajustarHoja.show}>
              {gramos ? 'Ajustar otra vez' : 'Ajustar a lo que falta'}
            </Button>
          </div>
        )}
        <section aria-labelledby="ingredientes">
          <div class={r.head}>
            <h2 id="ingredientes" class={r.title}>
              Ingredientes
            </h2>
            <span class={r.stepper}>
              <button
                type="button"
                aria-label="Menos raciones"
                disabled={veces <= 1}
                onClick={() => setVeces((n) => Math.max(1, n - 1))}
              >
                <MinusIcon />
              </button>
              <span>
                {veces} {veces === 1 ? 'ración' : 'raciones'}
              </span>
              <button
                type="button"
                aria-label="Más raciones"
                onClick={() => setVeces((n) => Math.min(12, n + 1))}
              >
                <PlusIcon />
              </button>
            </span>
          </div>
          <ul class={r.list}>
            {p.ingredientes.map((i, k) => {
              const g0 = i.gramos === null ? null : (i.gramos * veces) / p.raciones
              const g = gramos?.[k] != null ? (gramos[k]! * veces) / p.raciones : g0
              const macro = MACROS.find((m) => m.id === i.macro)
              return (
                <li key={`${i.texto}-${k}`}>
                  <button
                    type="button"
                    class={r.row}
                    disabled={!i.cuenta || !i.alimentoId}
                    onClick={() => {
                      setCual(k)
                      cambiar.show()
                    }}
                  >
                    <span
                      class={`${styles.tag} ${macro ? '' : styles.sinTag}`}
                      aria-label={macro ? macro.nombre : undefined}
                      aria-hidden={macro ? undefined : 'true'}
                    >
                      {macro?.corto ?? ''}
                    </span>
                    <span class={r.rowText}>
                      <span class={r.name}>{i.alimentoId ? i.nombre : i.texto}</span>
                      {i.antes && <span class={h.foot}>En lugar de {i.antes.toLowerCase()}</span>}
                      {i.cuenta && enCrudo(i.alimentoId, g) && (
                        <span class={h.foot}>{enCrudo(i.alimentoId, g)}</span>
                      )}
                    </span>
                    {g !== null && i.cuenta && (
                      <b class={r.grams}>
                        {g0 !== null && Math.round(g0) !== Math.round(g) && (
                          <span class={styles.old}>{formatInt(g0)}</span>
                        )}
                        {i.sugerido ? '≈ ' : ''}
                        {formatInt(g)} g{i.sugerido && <span class={styles.sugerido}>sugerido</span>}
                      </b>
                    )}
                    {i.cuenta && i.alimentoId && <ChevronRightIcon />}
                  </button>
                </li>
              )
            })}
          </ul>
          <p class={h.foot}>Toca un ingrediente para cambiarlo por otra marca u otro alimento.</p>
        </section>
        {p.pasos.length > 0 && (
          <section aria-labelledby="preparacion">
            <h2 id="preparacion" class={r.title}>
              Preparación
            </h2>
            <ol class={r.steps}>
              {p.pasos.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          </section>
        )}
        <div class={styles.more}>
          {enMenu ? (
            apuntarHoy
          ) : (
            <Button variant="secondary" onClick={alMenu.show}>
              Al menú
            </Button>
          )}
          <Button variant="secondary" onClick={editar.show}>
            {p.origen === 'tuyo' ? 'Editar' : 'Hacer tu versión'}
          </Button>
          {dieta.value && (
            <Button variant="secondary" onClick={aDieta.show}>
              A tu dieta
            </Button>
          )}
          {p.origen === 'tuyo' && (
            <Button
              variant="secondary"
              onClick={async () => {
                await borrarPlato(p.id)
                route(volver)
              }}
            >
              Borrar
            </Button>
          )}
        </div>
      </div>
      <div class={r.bottom}>
        {!enMenu ? (
          apuntarHoy
        ) : yaEnMenu ? (
          <Button href={volver}>Volver al menú</Button>
        ) : (
          <Button
            onClick={async () => {
              await ponerPlato(enMenu.id, comida, p.id)
              route(volver)
            }}
          >
            Poner en {enMenu.nombre} · {comidaDe(comida).nombre.toLowerCase()}
          </Button>
        )}
      </div>
      {ajustarHoja.open && (
        <AjustarHoja
          plato={p}
          comida={comida}
          fecha={fecha}
          onClose={ajustarHoja.close}
          onVer={(g) => {
            setGramos(g)
            setVeces(1)
            ajustarHoja.close()
          }}
          avisar={avisar}
        />
      )}
      {cambiar.open && cual !== null && (
        <CambiarHoja plato={p} indice={cual} fecha={fecha} onClose={cambiar.close} avisar={avisar} />
      )}
      {alMenu.open && <AlMenuHoja plato={p} onClose={alMenu.close} avisar={avisar} />}
      {aDieta.open && <ADietaHoja plato={p} onClose={aDieta.close} avisar={avisar} />}
      {editar.open && <EditarPlatoHoja plato={p} onClose={editar.close} avisar={avisar} />}
      <Toast message={aviso?.texto ?? null} action={aviso?.accion ?? null} />
    </div>
  )
}
