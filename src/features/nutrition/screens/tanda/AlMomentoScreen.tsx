import { useLocation } from 'preact-iso'
import { useEffect, useState } from 'preact/hooks'
import { formatDuracion } from '../../../../shared/lib/format.ts'
import { paths, vieneDeHoy } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { useVolver } from '../../../../shared/ui/useVolver.ts'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { comidaParaCocinar, enLista, fresco, type ComidaDeHoy } from '../../state/autopilot.ts'
import { COMIDAS, estado } from '../../state/comida.ts'
import { estadoRecetas, fotos, gramosDeHueco, platoPorId, type Plato } from '../../state/recetas.ts'
import { pantallaEncendida } from '../../use-cases/autopilot.ts'
import { tickDelMenu } from '../../use-cases/menu.ts'
import { cargarComida } from '../../use-cases/nutritionStore.ts'
import { cargarOllas } from '../../use-cases/ollas.ts'
import { cargarRecetas, platoApuntado } from '../../use-cases/recipes.ts'
import { Barra } from '../comun/Barra.tsx'
import p from '../comun/Pagina.module.css'
import { useAviso } from '../comun/useAviso.ts'
import { CarruselCocina, enCrudo, RecetaCocina } from './Cocinar.tsx'
import { RepartirPlato } from './RepartirPlato.tsx'
import s from './Tanda.module.css'

const nombreDe = (comida: string) => COMIDAS.find((x) => x.id === comida)?.nombre ?? 'Comida'

/** Lo que dice la tarjeta de una comida: de tu táper, una parte ese día o al momento. */
function comoEs(c: ComidaDeHoy, r: Plato): string {
  if (c.como === 'taper') return 'Ya lo tienes hecho'
  if (c.como === 'mixto')
    return `Haz ${enLista(r.ingredientes.filter((i) => i.cuenta && fresco(r.id, i)).map((i) => i.nombre.toLowerCase()))}`
  return 'Al momento'
}

/**
 * Tus comidas de hoy (`/comida/al-momento/:fecha/:comida`): las que quedan por apuntar, en un carrusel de fotos que se
 * desliza como el de tu rutina en Entreno (empieza en `comida`); arriba, el nombre de la que ves. Debajo, su receta: al
 * momento, lo que pesas (con sus gramos de ese día) y sus pasos; con la base en tu táper, solo lo de ese día; en táper,
 * calentarlo. «Hecho y apuntar la cena» la apunta y deja de salir. La pantalla no se apaga.
 */
export function AlMomentoScreen(props: { fecha: string; comida: string }) {
  const { query, route } = useLocation()
  useEffect(() => {
    void cargarComida().then(cargarRecetas)
    void cargarOllas()
    void pantallaEncendida(true)
    return () => void pantallaEncendida(false)
  }, [])
  const { aviso, avisar } = useAviso()
  const [visible, setVisible] = useState<number | null>(null)
  const volver = vieneDeHoy(query) ? paths.today : paths.nutrition
  const atras = useVolver(volver)
  const listo = estado.value !== 'cargando' && estadoRecetas.value === 'listo'
  // Las comidas del día con plato que quedan por apuntar
  const quedan = listo
    ? COMIDAS.flatMap((x) => {
        const c = comidaParaCocinar(props.fecha, x.id)
        const r = c ? platoPorId(c.hueco.plato, props.fecha) : null
        return c && r && !platoApuntado(r.id, x.id, props.fecha) ? [{ c, r }] : []
      })
    : []
  const inicio = Math.max(
    0,
    quedan.findIndex((x) => x.c.hueco.comida === props.comida),
  )
  const aqui = Math.min(visible ?? inicio, Math.max(0, quedan.length - 1))
  if (!listo) return null
  if (!quedan.length)
    return (
      <div class={p.page}>
        <Barra titulo="Tus comidas de hoy" volver={volver} />
        <p class={p.sub}>Todas tus comidas de hoy están apuntadas.</p>
        <Button onClick={atras}>Listo</Button>
        <Toast message={aviso?.texto ?? null} action={aviso?.accion ?? null} />
      </div>
    )
  const { c } = quedan[aqui]
  const h = c.hueco
  const nombre = nombreDe(h.comida)
  return (
    <div class={p.page}>
      <Barra titulo={nombre} volver={volver} />
      <CarruselCocina
        key={quedan.length}
        etiqueta="Tus comidas de hoy"
        visible={aqui}
        inicio={visible === null ? inicio : aqui}
        onVisible={setVisible}
        diapositivas={quedan.map((x, i) => (
          <div key={x.c.hueco.comida} class={s.conBoton}>
            <Comida c={x.c} r={x.r} />
            <Button
              onClick={async () => {
                await tickDelMenu(props.fecha, x.c.hueco.comida)
                avisar(`${nombreDe(x.c.hueco.comida)}: apuntada`)
                // Ya no sale: se queda en la siguiente (la que ocupa su sitio) o vuelve si era la última
                if (quedan.length === 1) route(volver)
                else setVisible(Math.min(i, quedan.length - 2))
              }}
            >
              Hecho y apuntar {COMIDAS.find((y) => y.id === x.c.hueco.comida)?.el ?? 'la comida'}
            </Button>
          </div>
        ))}
      />
      <Toast message={aviso?.texto ?? null} action={aviso?.accion ?? null} />
    </div>
  )
}

/** Una comida en el carrusel: su receta entera con su foto (en táper, calentarlo; con la base en táper, solo lo de ese día). */
function Comida({ c, r }: { c: ComidaDeHoy; r: Plato }) {
  const taper = c.como === 'taper'
  const soloParte = c.como === 'mixto'
  const gramos = gramosDeHueco(c.hueco, r)
  const lista = r.ingredientes.map((i, k) => ({ i, g: gramos[k] })).filter((x) => x.i.cuenta)
  // Pesar lo cocinado (usuario, 2026-11-21: en cualquier modo cocina): con la base hecha, solo lo de hoy
  const hoyG = soloParte ? gramos.map((g, k) => (fresco(r.id, r.ingredientes[k]) ? g : 0)) : gramos
  return (
    <>
      <RecetaCocina
        nombre={r.nombre}
        foto={fotos.value[r.id] ?? null}
        detalle={`${nombreDe(c.hueco.comida)} · ${comoEs(c, r)}${r.minutos && !taper && !soloParte ? ` · ${formatDuracion(r.minutos)}` : ''}`}
        ingredientes={
          taper
            ? []
            : [
                ...lista.map(({ i, g }) => {
                  const x = g ? enCrudo(i.alimentoId, i.nombre, g) : null
                  return {
                    clave: i.texto,
                    nombre: x?.nombre ?? i.nombre,
                    gramos: x?.gramos ?? null,
                    cocido: x?.cocido ?? null,
                    // Con la base en tu táper, lo que no es de ese día ya está hecho
                    hecho: soloParte && !fresco(r.id, i),
                  }
                }),
                // Lo que va al gusto (sal, especias…), si la cocinas entera
                ...(soloParte
                  ? []
                  : r.ingredientes
                      .filter((i) => !i.cuenta)
                      .map((i) => ({ clave: i.texto, nombre: i.nombre, gramos: null, cocido: null }))),
              ]
        }
        nota={
          taper
            ? 'Ya está hecho: caliéntalo y a comer.'
            : soloParte
              ? 'La base ya está hecha: hoy, solo esto.'
              : undefined
        }
        pasos={taper ? [] : r.pasos}
      />
      {!taper && (
        <RepartirPlato
          plato={r.id}
          recipientes={[{ clave: 'tu', dia: 'Tu ración', sub: nombreDe(c.hueco.comida), gramos: hoyG }]}
          factor={1}
          sinTitulo
        />
      )}
    </>
  )
}
