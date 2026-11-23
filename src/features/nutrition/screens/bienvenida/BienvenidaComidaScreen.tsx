import { useEffect, useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { formatDecimal, formatInt, parseDecimal } from '../../../../shared/lib/format.ts'
import { logError } from '../../../../shared/lib/logger.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { ChevronDownIcon } from '../../../../shared/ui/icons.tsx'
import { Pasos } from '../../../../shared/ui/Pasos.tsx'
import { datosBienvenida } from '../../state/bienvenida.ts'
import { cuerpoValido, RITMOS, type Fase, type Sexo } from '../../state/comida.ts'
import { deTuPerfil, guardarDatos, previaDelObjetivo } from '../../use-cases/target.ts'
import styles from './BienvenidaComida.module.css'

const PASO = 3
const TOTAL = 4
const RITMO_DE_SERIE = '0.75'

/** «Ahora no, solo entreno»: sin objetivo; la comida se calcula después desde su pestaña, como siempre. */
function SoloEntreno() {
  return (
    <a class={styles.saltar} href={paths.chooseRoutine}>
      Ahora no, solo entreno
    </a>
  )
}

/**
 * Paso 3 · Cuatro datos (usuario, 2026-11-17: la estética del rediseño de Nutrición, unida a la bienvenida de Entreno):
 * sexo, edad, altura, peso y pasos; los entrenos ya vienen de tu bienvenida. Se puede saltar.
 */
function TusDatos() {
  const { route } = useLocation()
  const ya = datosBienvenida.value
  const [sexo, setSexo] = useState<Sexo>(ya?.cuerpo.sexo ?? 'hombre')
  const [v, setV] = useState({
    edad: ya ? String(ya.cuerpo.edad) : '',
    alturaCm: ya ? String(ya.cuerpo.alturaCm) : '',
    pesoKg: ya ? formatDecimal(ya.cuerpo.pesoKg) : '',
    pasos: ya ? String(ya.pasos) : '',
  })
  const [dias, setDias] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    void deTuPerfil().then((p) => setDias(p.diasEntreno))
  }, [])

  function seguir() {
    const n = (s: string) => parseDecimal(s) ?? Number.NaN
    const cuerpo = {
      sexo,
      edad: Math.round(n(v.edad)),
      // «1,80» es en metros
      alturaCm: Math.round(n(v.alturaCm) < 3 ? n(v.alturaCm) * 100 : n(v.alturaCm)),
      pesoKg: Math.round(n(v.pesoKg) * 10) / 10,
    }
    // «8.000» son ocho mil pasos, no ocho
    const pasos = Math.round(n(v.pasos.replace(/\./g, '')))
    if (!cuerpoValido(cuerpo))
      return setError('Revisa la edad (14–100), la altura en cm (120–230) y el peso en kg (30–300)')
    if (!(pasos >= 0 && pasos <= 60000))
      return setError('Escribe tus pasos de un día normal (por ejemplo, 8000)')
    setError(null)
    datosBienvenida.value = { cuerpo, pasos }
    route(paths.welcomeFood(2))
  }

  const campo = (clave: keyof typeof v, etiqueta: string, ejemplo: string, unidad: string) => (
    <label class={styles.fila}>
      <span>{etiqueta}</span>
      <span class={styles.valor}>
        <input
          inputMode="decimal"
          value={v[clave]}
          placeholder={ejemplo}
          onInput={(e) => setV({ ...v, [clave]: e.currentTarget.value })}
        />
        {unidad && <span class={styles.unidad}>{unidad}</span>}
      </span>
    </label>
  )

  return (
    <Pasos
      paso={PASO}
      total={TOTAL}
      titulo="Cuatro datos y calculo lo que necesitas"
      intro="Un minuto. Podrás cambiarlos cuando quieras."
      accion={<Button onClick={seguir}>Siguiente</Button>}
      secundaria={<SoloEntreno />}
    >
      <ChoiceSegmented<Sexo>
        name="sexo"
        legend="Sexo"
        options={[
          { value: 'hombre', label: 'Hombre' },
          { value: 'mujer', label: 'Mujer' },
        ]}
        value={sexo}
        onChange={setSexo}
      />
      <div class={styles.tarjeta}>
        {campo('edad', 'Edad', '30', 'años')}
        {campo('alturaCm', 'Altura', '175', 'cm')}
        {campo('pesoKg', 'Peso', '75,0', 'kg')}
        {campo('pasos', 'Pasos al día', '8000', '')}
      </div>
      {dias !== null && (
        <div class={styles.grupo}>
          <p class={styles.rotulo}>Ya lo sé por tu perfil</p>
          <div class={styles.tarjeta}>
            <div class={styles.fila}>
              <span class={styles.texto}>
                {dias} entrenos por semana
                <small>De tu bienvenida</small>
              </span>
            </div>
          </div>
        </div>
      )}
      {error && (
        <p class={styles.error} role="alert">
          {error}
        </p>
      )}
    </Pasos>
  )
}

/**
 * Paso 4 · Tu objetivo, listo: tus kcal en grande y tu reparto; en definición, a qué ritmo (de serie, −0,75 %); cómo se
 * calcula, plegado. «Elegir mi rutina» lo guarda (es una propuesta: la revisas cada semana) y sigue con tu rutina.
 */
function TuObjetivo() {
  const { route } = useLocation()
  const d = datosBienvenida.value
  const [perfil, setPerfil] = useState<{ fase: Fase; diasEntreno: number } | null>(null)
  const [ritmo, setRitmo] = useState(RITMO_DE_SERIE)
  const [guardando, setGuardando] = useState(false)
  useEffect(() => {
    void deTuPerfil().then(setPerfil)
  }, [])
  // Sin datos (se recargó la página): vuelta al paso de los datos
  useEffect(() => {
    if (!d) route(paths.welcomeFood(1), true)
  }, [d, route])
  if (!d || !perfil) return null
  const { calculo, macros } = previaDelObjetivo(d.cuerpo, d.pasos, perfil, Number(ritmo))

  async function aceptar() {
    setGuardando(true)
    try {
      await guardarDatos(d!.cuerpo, d!.pasos, perfil!.fase, Number(ritmo))
      route(paths.chooseRoutine, true)
    } catch (e) {
      logError(e, 'guardar tu objetivo de la bienvenida')
      setGuardando(false)
    }
  }

  const kgSemana = Math.round((Number(ritmo) / 100) * d.cuerpo.pesoKg * 10) / 10
  return (
    <Pasos
      paso={PASO + 1}
      total={TOTAL}
      titulo="Tu objetivo, listo"
      intro="Es una propuesta: cada semana la reviso con tu peso y te sugiero cambios. Tú decides."
      accion={
        <Button onClick={() => void aceptar()} disabled={guardando}>
          Elegir mi rutina
        </Button>
      }
      secundaria={<SoloEntreno />}
    >
      <div class={styles.cifra}>
        <span class={styles.kcal}>{formatInt(macros.kcal)}</span>
        <span class={styles.unidad}>kcal al día</span>
      </div>
      <div class={styles.macros}>
        {(
          [
            [macros.protein, 'proteína'],
            [macros.carbs, 'hidratos'],
            [macros.fat, 'grasa'],
          ] as const
        ).map(([g, n]) => (
          <div key={n} class={styles.macro}>
            <b>{formatInt(g)} g</b>
            <span>{n}</span>
          </div>
        ))}
      </div>
      {perfil.fase === 'definicion' && (
        <div class={styles.grupo}>
          <p class={styles.rotulo}>A qué ritmo</p>
          <ChoiceSegmented<string>
            name="ritmo"
            legend="A qué ritmo"
            options={RITMOS.map((r) => ({ value: String(r), label: `−${formatDecimal(r)} %` }))}
            value={ritmo}
            onChange={setRitmo}
          />
          <p class={styles.nota}>
            Bajas un {formatDecimal(Number(ritmo))} % de tu peso a la semana: unos {formatDecimal(kgSemana)}{' '}
            kg.
            {ritmo === RITMO_DE_SERIE ? ' Es el de serie.' : ''}
          </p>
        </div>
      )}
      <details class={styles.plegable}>
        <summary>
          <span class={styles.texto}>
            Cómo se calcula
            <small>Tu gasto en reposo, tu actividad y tu objetivo</small>
          </span>
          <ChevronDownIcon />
        </summary>
        <div class={styles.calculo}>
          <p>
            <span>Gasto en reposo</span>
            <b>{formatInt(calculo.basal)} kcal</b>
          </p>
          <p>
            <span>Con tus pasos y tus entrenos (× {formatDecimal(calculo.factor)})</span>
            <b>{formatInt(calculo.gasto)} kcal</b>
          </p>
          <p>
            <span>
              {calculo.cambio < 0
                ? 'Para perder grasa'
                : calculo.cambio > 0
                  ? 'Para ganar músculo'
                  : 'Para mantenerte'}
            </span>
            <b>
              {calculo.cambio > 0 ? '+' : calculo.cambio < 0 ? '−' : ''}
              {formatInt(Math.abs(calculo.cambio))} kcal
            </b>
          </p>
        </div>
      </details>
    </Pasos>
  )
}

/** Los pasos de comida de la bienvenida (/bienvenida/comida/1 y /2). */
export function BienvenidaComidaScreen(props: { paso: string }) {
  return props.paso === '2' ? <TuObjetivo /> : <TusDatos />
}
