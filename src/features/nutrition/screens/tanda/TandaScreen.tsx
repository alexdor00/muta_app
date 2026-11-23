import { useLocation } from 'preact-iso'
import { useEffect, useState } from 'preact/hooks'
import { paths, vieneDeHoy } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChevronLeftIcon, CloseIcon } from '../../../../shared/ui/icons.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { useVolver } from '../../../../shared/ui/useVolver.ts'
import {
  aparteComoTanda,
  llevaAlgoQueSeCuece,
  platoComoTanda,
  platosDeTanda,
  soloDeUnPlato,
  tandas,
} from '../../state/autopilot.ts'
import a from '../comida/Anadir.module.css'
import { estado, type ComidaId } from '../../state/comida.ts'
import { estadoRecetas, platoPorId } from '../../state/recetas.ts'
import { marcarTanda, pantallaEncendida } from '../../use-cases/autopilot.ts'
import { marcarCocinados } from '../../use-cases/menu.ts'
import { cargarComida } from '../../use-cases/nutritionStore.ts'
import { cargarOllas } from '../../use-cases/ollas.ts'
import { cargarRecetas } from '../../use-cases/recipes.ts'
import { Barra } from '../comun/Barra.tsx'
import p from '../comun/Pagina.module.css'
import { useAviso } from '../comun/useAviso.ts'
import c from './Cocina.module.css'
import { Paso, Preparar } from './FasesCocina.tsx'
import { AvisoOlla } from './Ollas.tsx'
import { conVariosDias, Repartir } from './Repartir.tsx'

type Fase = 'preparar' | 'pasos' | 'repartir'

/**
 * Arriba del modo cocina (usuario, 2026-11-19): «‹» vuelve a la pantalla anterior (un paso atrás) y una «×» pequeña a la
 * derecha sale a donde estabas. En la primera, sin «‹».
 */
function Cabeza(props: {
  titulo: string
  atras?: { etiqueta: string; onClick: () => void }
  onSalir: () => void
}) {
  return (
    <header class={c.cabeza}>
      {props.atras ? (
        <button type="button" class={c.icono} aria-label={props.atras.etiqueta} onClick={props.atras.onClick}>
          <ChevronLeftIcon />
        </button>
      ) : (
        <span />
      )}
      <h1>{props.titulo}</h1>
      <button
        type="button"
        class={`${c.icono} ${c.salir}`}
        aria-label="Salir del modo cocina"
        onClick={props.onSalir}
      >
        <CloseIcon />
      </button>
    </header>
  )
}

/**
 * El modo cocina de una tanda (`/comida/tanda/:fecha`; rediseño, pantallas 33 a 35; usuario, 2026-11-17): «Hoy cocinas»
 * con los platos y lo que sacas (en crudo lo que se cuece), los pasos uno a uno y, al final, repartir
 * cada olla en sus recipientes (nada pasa de 3 días en la nevera). «Terminar» la marca como hecha.
 * La pantalla no se apaga.
 */
export function TandaScreen(props: {
  fecha: string
  /** Un plato de tus menús, desde Cocinar (usuario, 2026-11-22): el mismo modo cocina, solo con él. */
  deMenu?: { plato: string; menu: string; comida: ComidaId }
}) {
  const d = props.deMenu
  const { query } = useLocation()
  useEffect(() => {
    void cargarComida().then(cargarRecetas)
    void cargarOllas()
    void pantallaEncendida(true)
    return () => void pantallaEncendida(false)
  }, [])
  const [fase, setFase] = useState<Fase>('preparar')
  const [paso, setPaso] = useState(0)
  // Qué cocinas: todo, o solo una receta (y las que ya hiciste así, hasta que estén todas)
  const [solo, setSolo] = useState<string | null>(() =>
    typeof query.plato === 'string' ? query.plato : null,
  )
  const [hechas, setHechas] = useState<string[]>([])
  const { aviso, avisar } = useAviso()
  // Sin pantalla detrás (enlace directo), a tu día: «‹» y «Listo» vuelven a la de antes (usuario, 2026-11-17)
  const volver = vieneDeHoy(query) ? paths.today : paths.nutrition
  const atras = useVolver(volver)
  if (estado.value === 'cargando' || estadoRecetas.value !== 'listo') return null
  // Tu tanda de ese día o, con `?aparte=HH:MM`, lo que cocinas aparte a esa hora
  const aparte = query.aparte ? aparteComoTanda(props.fecha, query.aparte) : null
  const entera = d
    ? platoComoTanda(d.plato, d.menu, d.comida)
    : query.aparte
      ? aparte?.tanda
      : tandas.value.find((x) => x.fecha === props.fecha)
  const t = entera && solo ? soloDeUnPlato(entera, solo) : entera
  const marcar = async (hecho: boolean) =>
    d ? undefined : aparte ? marcarCocinados(aparte.ids, hecho) : marcarTanda(props.fecha, hecho)
  if (!t || !t.huecos.length)
    return (
      <div class={p.page}>
        <Barra titulo="Modo cocina" volver={volver} />
        <p class={p.sub}>Esta tanda ya no está en tu semana: mírala en Tu semana.</p>
      </div>
    )
  const platos = platosDeTanda(t)
  // Repartir, solo con lo que cocinas para varios días (usuario, 2026-11-19)
  const repartir = d ? llevaAlgoQueSeCuece(d.plato) : conVariosDias(t).length > 0
  const todos = entera ? platosDeTanda(entera) : platos
  // Todos los pasos, plato a plato
  const pasos = platos.flatMap((x) =>
    (platoPorId(x.plato)?.pasos ?? []).map((texto) => ({ plato: x.plato, texto })),
  )
  const terminar = async () => {
    // Una receta sola: se apunta como hecha aquí y, cuando están todas, la tanda entera
    if (solo) {
      const ya = [...new Set([...hechas, solo])]
      setHechas(ya)
      setSolo(null)
      setFase('preparar')
      setPaso(0)
      if (todos.every((x) => ya.includes(x.plato))) return void terminarTodo()
      return avisar(`${platoPorId(solo)?.nombre ?? 'Receta'}: hecha. Te quedan ${todos.length - ya.length}`)
    }
    await terminarTodo()
  }
  const terminarTodo = async () => {
    if (d) return atras()
    await marcar(true)
    avisar(`Tanda hecha: ${entera?.huecos.length ?? 0} recipientes`)
  }

  if (t.hecha)
    return (
      <div class={p.page}>
        <Barra titulo="Hoy cocinas" volver={volver} />
        <p class={p.sub}>Ya has cocinado todo lo que te propusiste para este día.</p>
        <Button onClick={atras}>Listo</Button>
        <button type="button" class={c.texto} onClick={() => void marcar(false)}>
          Marcar sin hacer
        </button>
        <Toast message={aviso?.texto ?? null} action={aviso?.accion ?? null} />
      </div>
    )

  return (
    <div class={`${p.page} ${c.pantalla}`}>
      {fase === 'preparar' && (
        <>
          <Cabeza titulo="Hoy cocinas" onSalir={atras} />
          {todos.length > 1 && (
            <div class={a.pastillas} role="group" aria-label="Qué cocinas">
              {[
                { plato: null as string | null, nombre: 'Todo' },
                ...todos.map((x) => ({
                  plato: x.plato as string | null,
                  nombre: platoPorId(x.plato)?.nombre ?? 'Plato',
                })),
              ].map((x) => (
                <button
                  key={x.plato ?? 'todo'}
                  type="button"
                  class={`${a.pastilla} ${solo === x.plato ? a.on : ''}`}
                  aria-pressed={solo === x.plato}
                  onClick={() => {
                    setSolo(x.plato)
                    setPaso(0)
                  }}
                >
                  {x.plato && hechas.includes(x.plato) ? `✓ ${x.nombre}` : x.nombre}
                </button>
              ))}
            </div>
          )}
          <AvisoOlla hayQueRepartir={repartir} />
          <Preparar t={t} solo={!!solo} unPlato={!!d} />
          <div class={c.abajo}>
            <Button
              onClick={() =>
                pasos.length ? setFase('pasos') : repartir ? setFase('repartir') : void terminar()
              }
            >
              {solo ? 'Cocinar esta receta' : 'Empezar'}
            </Button>
          </div>
        </>
      )}
      {fase === 'pasos' && pasos.length > 0 && (
        <>
          <Cabeza
            titulo={`Paso ${paso + 1} de ${pasos.length}`}
            atras={{
              etiqueta: paso ? 'Paso anterior' : 'Volver a lo que sacas',
              onClick: () => (paso ? setPaso(paso - 1) : setFase('preparar')),
            }}
            onSalir={atras}
          />
          <div
            class={c.barra}
            role="progressbar"
            aria-label="Pasos hechos"
            aria-valuemin={0}
            aria-valuemax={pasos.length}
            aria-valuenow={paso + 1}
          >
            <i style={{ width: `${((paso + 1) / pasos.length) * 100}%` }} />
          </div>
          <Paso
            t={t}
            plato={pasos[paso].plato}
            texto={pasos[paso].texto}
            numero={paso + 1}
            siguiente={pasos[paso + 1]?.texto}
          />
          <div class={c.abajo}>
            <Button
              onClick={() => {
                if (paso + 1 < pasos.length) setPaso(paso + 1)
                else if (repartir) setFase('repartir')
                else void terminar()
              }}
            >
              {paso + 1 < pasos.length
                ? 'Siguiente'
                : repartir
                  ? 'A repartir'
                  : solo
                    ? 'Receta hecha'
                    : 'Terminar'}
            </Button>
          </div>
        </>
      )}
      {fase === 'repartir' && (
        <>
          <Cabeza
            titulo="Repartir"
            atras={{
              etiqueta: pasos.length ? 'Volver al último paso' : 'Volver a lo que sacas',
              onClick: () => setFase(pasos.length ? 'pasos' : 'preparar'),
            }}
            onSalir={atras}
          />
          <Repartir t={t} todos={!!d} />
          <div class={c.abajo}>
            <Button onClick={() => void terminar()}>{solo ? 'Receta hecha' : 'Terminar'}</Button>
          </div>
        </>
      )}
      <Toast message={aviso?.texto ?? null} action={aviso?.accion ?? null} />
    </div>
  )
}
