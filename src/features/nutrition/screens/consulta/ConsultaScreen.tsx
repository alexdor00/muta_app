import { useLocation } from 'preact-iso'
import { useEffect, useState } from 'preact/hooks'
import { formatDecimal, parseDecimal } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { dieta, estado } from '../../state/comida.ts'
import { CINTURA, consultas, ESCALAS, SUENO, type Revision } from '../../state/dieta.ts'
import {
  ahoraNo,
  aplicar,
  cinturaAnterior,
  consultaPendiente,
  guardarInforme,
  prepararConsulta,
  revisionDeHoy,
  type Informe,
} from '../../use-cases/consult.ts'
import { cargarComida } from '../../use-cases/nutritionStore.ts'
import { Barra } from '../comun/Barra.tsx'
import h from '../comun/Hojas.module.css'
import p from '../comun/Pagina.module.css'
import { useAviso } from '../comun/useAviso.ts'
import c from './Consulta.module.css'

const PASOS = ['Báscula y cinta', 'Sensaciones', 'Informe']
const volver = `${paths.nutrition}?vista=dieta`

/**
 * La consulta semanal con tu dieta: la cinta, cómo te has sentido y el informe del nutricionista y del entrenador. Lo que
 * propone no se aplica solo: «Aplicar desde mañana» o «Ahora no».
 */
export function ConsultaScreen() {
  useEffect(() => {
    void cargarComida()
  }, [])
  const { route } = useLocation()
  const [paso, setPaso] = useState(0)
  const [r, setR] = useState<Revision | null>(null)
  const [informe, setInforme] = useState<Informe | null>(null)
  const [consultaId, setConsultaId] = useState<string | null>(null)
  const [cintura, setCintura] = useState('')
  const [sueno, setSueno] = useState('')
  const { aviso, avisar } = useAviso()
  if (estado.value === 'cargando') return null
  if (!dieta.value) {
    return (
      <div class={p.page}>
        <Barra titulo="Consulta semanal" volver={volver} />
        <p class={p.sub}>
          La consulta es con una dieta pautada: cárgala en Nutrición · Tu plan, en «¿Sigues una dieta
          pautada?».
        </p>
        <a class={p.sub} href={`${paths.nutrition}?vista=dieta`}>
          Ir a tu dieta ›
        </a>
      </div>
    )
  }
  const pendiente = consultaPendiente()
  const rev = r ?? revisionDeHoy()
  // Si hay una propuesta esperando (de hoy o de otro día), se ve directamente
  const viendo = consultaId ?? (paso === 0 && !informe ? pendiente?.id : null) ?? null
  const consulta = viendo ? consultas.value.find((x) => x.id === viendo) : null

  if (consulta && paso !== 1) {
    return (
      <div class={p.page}>
        <Barra titulo="Consulta semanal" volver={volver} />
        <Pasos en={2} />
        <section class={c.nutri} aria-labelledby="nutri">
          <span class={c.eyebrow}>Tu nutricionista · semana {consulta.semana}</span>
          <h2 id="nutri" class={c.titulo}>
            {consulta.titulo}
          </h2>
          <p class={c.detalle}>{consulta.detalle}</p>
          {informe && (
            <dl class={c.metricas}>
              {informe.metricas.map((m) => (
                <div key={m.nombre}>
                  <dt>{m.nombre}</dt>
                  <dd>{m.valor}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
        {consulta.propuestas.length > 0 && (
          <section class={p.card} aria-labelledby="propuesta">
            <span class={p.eyebrow} id="propuesta">
              {consulta.propuestas.length > 1 ? 'Te propongo · elige una' : 'Te propongo'}
            </span>
            {consulta.propuestas.map((x) => (
              <div key={x.id} class={c.propuesta}>
                <p class={p.cardTitle}>{x.titulo}</p>
                <p class={p.sub}>{x.detalle}</p>
                {consulta.status === 'pendiente' ? (
                  <Button
                    onClick={async () => {
                      await aplicar(consulta.id, x.id)
                      avisar('Aplicado: tu dieta cambia desde mañana')
                    }}
                  >
                    Aplicar desde mañana
                  </Button>
                ) : (
                  consulta.elegida === x.id && <p class={p.foot}>Aplicado.</p>
                )}
              </div>
            ))}
            {consulta.status === 'pendiente' && (
              <Button
                variant="secondary"
                onClick={async () => {
                  await ahoraNo(consulta.id)
                  avisar('Ahora no: tu dieta sigue igual')
                }}
              >
                Ahora no
              </Button>
            )}
            {consulta.status === 'descartado' && <p class={p.foot}>«Ahora no»: tu dieta sigue igual.</p>}
          </section>
        )}
        {informe && informe.decision.consejos.length > 0 && (
          <section class={p.card} aria-label="Consejos">
            <span class={p.eyebrow}>Consejos</span>
            <ul class={c.consejos}>
              {informe.decision.consejos.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </section>
        )}
        {informe && (
          <section class={p.card} aria-labelledby="entrenador">
            <span class={p.eyebrow}>Tu entrenador</span>
            <p class={p.cardTitle} id="entrenador">
              {informe.senales.length >= 2 ? 'Recuperación justa' : 'Sin señales de cansancio'}
            </p>
            <p class={p.sub}>
              {informe.senales.length
                ? `${informe.senales.length === 1 ? 'Una señal' : `${informe.senales.length} señales`}: ${informe.senales.join(', ')}.`
                : 'Duermes y te recuperas bien: sigue así.'}
            </p>
          </section>
        )}
        <Button
          variant={consulta.status === 'pendiente' ? 'secondary' : 'primary'}
          onClick={() => route(volver)}
        >
          Terminar la consulta
        </Button>
        <Toast message={aviso?.texto ?? null} action={aviso?.accion ?? null} />
      </div>
    )
  }

  const antes = cinturaAnterior()
  return (
    <div class={p.page}>
      <Barra titulo="Consulta semanal" volver={volver} />
      <Pasos en={paso} />
      {paso === 0 ? (
        <>
          <section class={p.card} aria-labelledby="cinta">
            <h2 id="cinta" class={p.cardTitle}>
              La cinta
            </h2>
            <label class={h.field}>
              Cintura, a la altura del ombligo (cm)
              <input
                inputMode="decimal"
                value={cintura || (rev.cintura !== null ? formatDecimal(rev.cintura) : '')}
                placeholder={antes !== null ? formatDecimal(antes) : 'Opcional'}
                onInput={(e) => setCintura(e.currentTarget.value)}
              />
            </label>
            <p class={p.foot}>
              Comparamos medias de la semana, no días sueltos: tus pesajes los apuntas en la pestaña Hoy.
            </p>
          </section>
          <Button
            onClick={() => {
              const n = cintura ? parseDecimal(cintura) : rev.cintura
              if (n !== null && (n < CINTURA.min || n > CINTURA.max)) return avisar('Revisa la cintura')
              setR({ ...rev, cintura: n })
              setPaso(1)
            }}
          >
            Siguiente
          </Button>
        </>
      ) : (
        <>
          <section class={p.card} aria-label="Sensaciones">
            <label class={h.field}>
              Sueño medio (horas)
              <input
                inputMode="decimal"
                value={sueno || (rev.sueno !== null ? formatDecimal(rev.sueno) : '')}
                placeholder="7"
                onInput={(e) => setSueno(e.currentTarget.value)}
              />
            </label>
            {ESCALAS.map((e) => (
              <fieldset key={e.id} class={c.escala}>
                <legend class={c.leyenda}>
                  {e.nombre}
                  <span class={p.foot}>
                    {e.de} → {e.a}
                  </span>
                </legend>
                <div class={c.numeros}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                      key={n}
                      type="button"
                      class={`${c.numero} ${rev[e.id] === n ? c.on : ''}`}
                      aria-pressed={rev[e.id] === n}
                      aria-label={`${e.nombre}: ${n}`}
                      onClick={() => setR({ ...rev, [e.id]: rev[e.id] === n ? null : n })}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
            <label class={h.field}>
              ¿Algo más?
              <textarea
                class={h.textarea}
                value={rev.nota}
                placeholder="Comidas fuera, viajes, molestias…"
                onInput={(e) => setR({ ...rev, nota: e.currentTarget.value })}
              />
            </label>
          </section>
          <div class={p.row2}>
            <Button variant="secondary" onClick={() => setPaso(0)}>
              Atrás
            </Button>
            <Button
              onClick={async () => {
                const s = sueno ? parseDecimal(sueno) : rev.sueno
                if (s !== null && (s < SUENO.min || s > SUENO.max)) return avisar('Revisa las horas de sueño')
                const i = await prepararConsulta({ ...rev, sueno: s })
                if (!i) return
                const guardada = await guardarInforme(i)
                setInforme(i)
                setConsultaId(guardada.id)
                setPaso(2)
              }}
            >
              Ver el informe
            </Button>
          </div>
        </>
      )}
      <Toast message={aviso?.texto ?? null} action={aviso?.accion ?? null} />
    </div>
  )
}

function Pasos({ en }: { en: number }) {
  return (
    <ol class={c.pasos} aria-label="Pasos de la consulta">
      {PASOS.map((x, i) => (
        <li key={x} class={i <= en ? c.hecho : ''} aria-current={i === en ? 'step' : undefined}>
          {i + 1} · {x}
        </li>
      ))}
    </ol>
  )
}
