import { useLocation } from 'preact-iso'
import { useEffect, useState } from 'preact/hooks'
import { daysBetween, formatDayDate, formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import {
  BookmarkIcon,
  CameraIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MinusIcon,
  PlusIcon,
  ClockIcon,
  ShareIcon,
} from '../../../../shared/ui/icons.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import { useVolver } from '../../../../shared/ui/useVolver.ts'
import { comidaPorHora, diaVisto, dieta, estado, hoy, type ComidaId } from '../../state/comida.ts'
import {
  encuadresPlatos,
  enCrudo,
  estadoRecetas,
  fotos,
  menu,
  platoPorId,
  recetario,
  recetasGuardadas,
  siguiente,
  totalDePlato,
} from '../../state/recetas.ts'
import { ponerPlato } from '../../use-cases/menu.ts'
import { cargarComida } from '../../use-cases/nutritionStore.ts'
import {
  alternarRecetaGuardada,
  apuntarPlato,
  borrarPlato,
  cargarRecetas,
  compartirReceta,
  desapuntar,
} from '../../use-cases/recipes.ts'
import a from '../comida/Anadir.module.css'
import { comidaDe, esComida } from '../comun/platos.ts'
import { useAviso } from '../comun/useAviso.ts'
import { Cifras } from '../comun/Cifras.tsx'
import h from '../comun/Hojas.module.css'
import r from '../receta/Receta.module.css'
import { ADietaHoja } from './ADietaHoja.tsx'
import { AjustarHoja } from './AjustarHoja.tsx'
import { ApuntarHoja } from './ApuntarHoja.tsx'
import { BarraPlato } from './BarraPlato.tsx'
import { CambiarHoja } from './CambiarHoja.tsx'
import { EditarPlatoHoja } from './EditarPlatoHoja.tsx'
import { FotoPlatoHoja } from './FotoPlatoHoja.tsx'
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
  // Ingredientes · Pasos (rediseño 30; sin «Cómo se prepara»: lo decide «Cómo cocinas», usuario 2026-11-21)
  // `?ver=pasos`: abre en sus pasos (desde «Cocinar ahora»)
  const [ver, setVer] = useState<'ingredientes' | 'pasos'>(query.ver === 'pasos' ? 'pasos' : 'ingredientes')
  const pasos = ver === 'pasos'
  const ajustarHoja = useSheet('ajustar')
  const cambiar = useSheet('cambiar')
  const editar = useSheet('editar')
  const apuntarHoja = useSheet('apuntar')
  const aDieta = useSheet('a-dieta')
  const fotoHoja = useSheet('foto')
  const { aviso, avisar } = useAviso()
  const volver =
    query.desde === 'menu'
      ? `${paths.nutrition}?vista=menus&menu=${query.menu ?? 'A'}`
      : query.fecha
        ? `${paths.nutrition}?vista=plan&paso=come`
        : `${paths.nutrition}?vista=recetas`
  const atras = useVolver(volver)
  if (estado.value === 'cargando' || estadoRecetas.value !== 'listo') return null
  const fecha = query.fecha ?? diaVisto.value
  const p = platoPorId(props.id, fecha)
  if (!p) {
    return (
      <div class={r.page}>
        <p class={h.sub}>Este plato ya no está.</p>
        <Button href={volver}>Volver a Nutrición</Button>
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
  // Tiempo, dificultad y categoría, en pastillas (usuario, 2026-11-17)
  const datos = [
    p.dificultad,
    categoria ?? (p.origen === 'tuyo' ? 'Receta tuya' : 'De ejemplo'),
    p.raciones > 1 ? `${p.raciones} raciones en total` : '',
  ].filter(Boolean)

  const apuntar = async (en: ComidaId = comida) => {
    const ids = await apuntarPlato(p, en, gramos, veces, fecha)
    avisar(`Apuntado en ${comidaDe(en).nombre.toLowerCase()} ${cuando}`, {
      label: 'Deshacer',
      onClick: () => void desapuntar(ids, fecha),
    })
  }

  const guardada = recetasGuardadas.value.includes(p.id)
  const foto = fotos.value[p.id]

  return (
    <div class={r.screen}>
      {/* La foto arriba con volver, compartir y guardar (rediseño 30; usuario, 2026-11-17) */}
      <div
        class={styles.hero}
        style={
          foto
            ? {
                backgroundImage: `url(${foto})`,
                backgroundPosition: `${encuadresPlatos.value[p.id]?.x ?? 50}% ${encuadresPlatos.value[p.id]?.y ?? 50}%`,
              }
            : undefined
        }
      >
        <button type="button" class={styles.heroBoton} aria-label="Volver" onClick={atras}>
          <ChevronLeftIcon />
        </button>
        <span class={styles.heroDerecha}>
          {/* Tu foto: cambiarla y centrarla (usuario, 2026-11-17) */}
          <button type="button" class={styles.heroBoton} aria-label="Cambiar la foto" onClick={fotoHoja.show}>
            <CameraIcon />
          </button>
          <button
            type="button"
            class={styles.heroBoton}
            aria-label="Compartir la receta"
            onClick={async () => {
              const r0 = await compartirReceta(p)
              if (r0 === 'copied') avisar('Receta copiada: pégala donde quieras')
            }}
          >
            <ShareIcon />
          </button>
          <button
            type="button"
            class={styles.heroBoton}
            aria-pressed={guardada}
            aria-label={guardada ? 'Quitar de guardadas' : 'Guardar la receta'}
            onClick={async () => {
              const si = await alternarRecetaGuardada(p.id)
              avisar(si ? 'Receta guardada' : 'Quitada de guardadas')
            }}
          >
            <BookmarkIcon filled={guardada} />
          </button>
        </span>
      </div>
      <div class={`${r.page} ${styles.panel}`}>
        <header class={styles.titulo}>
          <h1>{p.nombre}</h1>
          <ul class={styles.datos}>
            {p.minutos ? (
              <li>
                <ClockIcon /> {p.minutos} min
              </li>
            ) : null}
            {datos.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </header>
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
        <div class={styles.controles}>
          <div class={a.segmento} role="group" aria-label="Qué ver">
            <button
              type="button"
              class={ver === 'ingredientes' ? a.on : ''}
              aria-pressed={ver === 'ingredientes'}
              onClick={() => setVer('ingredientes')}
            >
              Ingredientes
            </button>
            <button
              type="button"
              class={pasos ? a.on : ''}
              aria-pressed={pasos}
              disabled={!p.pasos.length}
              onClick={() => setVer('pasos')}
            >
              Pasos
            </button>
          </div>
          <span class={styles.raciones}>
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
        {!pasos ? (
          <section aria-label="Ingredientes">
            {/* Arriba, antes de la lista (usuario, 2026-11-21) */}
            <p class={`${h.foot} ${styles.notaArriba}`}>
              Toca un ingrediente para cambiarlo por otra marca u otro alimento.
            </p>
            <ul class={styles.ingredientes}>
              {p.ingredientes.map((i, k) => {
                const g0 = i.gramos === null ? null : (i.gramos * veces) / p.raciones
                const g = gramos?.[k] != null ? (gramos[k]! * veces) / p.raciones : g0
                // «Eliminar de la receta» (0 g): ya no sale en la lista
                if (i.cuenta && g === 0) return null
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
                      <span class={r.rowText}>
                        <span class={r.name}>{i.alimentoId ? i.nombre : i.texto}</span>
                        {i.antes && <span class={h.foot}>En lugar de {i.antes.toLowerCase()}</span>}
                        {i.cuenta && enCrudo(i.alimentoId, g) && (
                          <span class={h.foot}>{enCrudo(i.alimentoId, g)}</span>
                        )}
                        {i.cuenta && p.gramosDescanso?.[k] != null && p.gramosDescanso[k] !== i.gramos && (
                          <span class={h.foot}>
                            Días de descanso: {formatInt((p.gramosDescanso[k]! * veces) / p.raciones)} g
                          </span>
                        )}
                      </span>
                      {g !== null && i.cuenta && (
                        <span class={styles.gramos}>
                          {g0 !== null && Math.round(g0) !== Math.round(g) && (
                            <span class={styles.old}>{formatInt(g0)}</span>
                          )}
                          {i.sugerido ? '≈ ' : ''}
                          {formatInt(g)} g{i.sugerido && <span class={styles.sugerido}>sugerido</span>}
                        </span>
                      )}
                      {i.cuenta && i.alimentoId && <ChevronRightIcon />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ) : (
          <section aria-label="Pasos">
            <ol class={styles.pasos}>
              {/* Como los ingredientes: una fila por paso con su número (usuario, 2026-11-21) */}
              {p.pasos.map((x, k) => (
                <li key={x}>
                  <span class={styles.numeroPaso} aria-hidden="true">
                    {k + 1}
                  </span>
                  <span>{x}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
        <div class={styles.mas}>
          {/* Tu versión de una receta, tocando sus ingredientes; ajustar, en «Apuntar» (usuario, 2026-11-21) */}
          {p.origen === 'tuyo' && (
            <button type="button" class={a.pastilla} onClick={editar.show}>
              Editar
            </button>
          )}
          {dieta.value && (
            <button type="button" class={a.pastilla} onClick={aDieta.show}>
              A tu dieta
            </button>
          )}
          {p.origen === 'tuyo' && (
            <button
              type="button"
              class={a.pastilla}
              onClick={async () => {
                await borrarPlato(p.id)
                route(volver)
              }}
            >
              Borrar
            </button>
          )}
        </div>
      </div>
      <BarraPlato
        enMenu={enMenu && `Poner en ${enMenu.nombre} · ${comidaDe(comida).nombre.toLowerCase()}`}
        yaEnMenu={yaEnMenu}
        volver={volver}
        cuando={cuando}
        onApuntar={apuntarHoja.show}
        onPoner={() => void (enMenu && ponerPlato(enMenu.id, comida, p.id).then(() => route(volver)))}
        onApuntarHoy={() => void apuntar()}
        onCocinar={
          p.pasos.length
            ? // La olla lleva al modo cocina de esta receta (usuario, 2026-11-22), con tu ración de esa comida
              () =>
                route(paths.cookDish(p.id, typeof query.menu === 'string' ? query.menu : '', comida, veces))
            : null
        }
      />
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
      {apuntarHoja.open && (
        <ApuntarHoja
          plato={p}
          comida={comida}
          kcal={total.kcal}
          cuando={cuando}
          apuntarHoy={apuntar}
          onAjustar={
            p.ajustable
              ? () => {
                  apuntarHoja.close()
                  ajustarHoja.show()
                }
              : null
          }
          onClose={apuntarHoja.close}
          avisar={avisar}
        />
      )}
      {aDieta.open && <ADietaHoja plato={p} onClose={aDieta.close} avisar={avisar} />}
      {fotoHoja.open && <FotoPlatoHoja plato={p} onClose={fotoHoja.close} avisar={avisar} />}
      {editar.open && <EditarPlatoHoja plato={p} onClose={editar.close} avisar={avisar} />}
      <Toast message={aviso?.texto ?? null} action={aviso?.accion ?? null} />
    </div>
  )
}
