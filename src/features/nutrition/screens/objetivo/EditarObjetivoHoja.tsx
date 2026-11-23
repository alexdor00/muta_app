import { useState } from 'preact/hooks'
import { formatDecimal, formatInt, daysBetween } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { ChevronDownIcon, ChevronRightIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import {
  ajustes,
  hoy,
  RITMO_MAX_FINAL,
  RITMO_VOLUMEN_DE_SERIE,
  RITMOS,
  RITMOS_VOLUMEN,
  SEMANA_FINAL,
  semanaDeLaFase,
  type Fase,
  type Situacion,
} from '../../state/comida.ts'
import { ajustarAlObjetivo, propuestaHaciaObjetivo, quitarAjuste } from '../../use-cases/diet.ts'
import { cambiarActividad, cambiarFase, cambiarOnOff, cambiarReparto } from '../../use-cases/target.ts'
import { TuActividad, type Actividad } from './TuActividad.tsx'
import { QUE_QUIERES } from '../comida/DatosHoja.tsx'
import h from '../comun/Hojas.module.css'
import sec from './Seccion.module.css'
import { HidratosDelDia } from './HidratosDelDia.tsx'
import { TuSituacion, VelocidadPorFases } from './OpcionesDeFase.tsx'
import { FilaRecarga } from './FilaRecarga.tsx'
import { borradorDe, mismoReparto, RepartoMacros, repartoDe, type Borrador } from './RepartoMacros.tsx'

/**
 * Editar tu objetivo, dentro de la pantalla Tu objetivo (usuario, 2026-11-15: una pantalla, no una hoja): qué quieres
 * (definir, mantenerte o volumen) y a qué velocidad, la proteína y la grasa (por kilo o en gramos) y los hidratos según el
 * día (ON/OFF); «Poner mis kcal» y «Mis datos» abren sus hojas.
 * Si sigues una dieta (manda en tu día y tus menús), al guardar propone ajustarla a las kcal nuevas: nada cambia hasta
 * «Ajustar mi dieta» (regla 10), y se deshace desde el aviso.
 */
export function EditarObjetivo({ avisar }: Pick<Props, 'avisar'>) {
  const [propuesta, setPropuesta] = useState<Propuesta | null>(null)
  // Al guardar se vuelve a empezar con lo guardado
  const [vez, setVez] = useState(0)
  return (
    <>
      <Editar
        key={vez}
        avisar={avisar}
        onGuardado={(p) => {
          setVez(vez + 1)
          if (p) setPropuesta(p)
          else avisar('Tu objetivo, guardado')
        }}
      />
      {propuesta && <AjustarDieta p={propuesta} onClose={() => setPropuesta(null)} avisar={avisar} />}
    </>
  )
}

type Propuesta = NonNullable<ReturnType<typeof propuestaHaciaObjetivo>>
type Props = {
  onClose: () => void
  avisar: (texto: string, accion?: { label: string; onClick: () => void }) => void
}

function Editar({
  onGuardado,
  avisar,
}: { onGuardado: (p: Propuesta | null) => void } & Pick<Props, 'avisar'>) {
  const a = ajustes.value
  const [fase, setFase] = useState<Fase>(a?.fase ?? 'mantenimiento')
  const [ritmo, setRitmo] = useState(String(a?.ritmo ?? 0.75))
  const [reparto, setReparto] = useState<Borrador | null>(a ? borradorDe(a) : null)
  const [onOff, setOnOff] = useState<number | null>(a?.onOff ?? null)
  const [porFases, setPorFases] = useState(a?.porFases ?? false)
  const [ritmoVolumen, setRitmoVolumen] = useState(String(a?.ritmoVolumen ?? RITMO_VOLUMEN_DE_SERIE))
  const [situacion, setSituacion] = useState<Situacion | null>(a?.situacion ?? null)
  const [actividad, setActividad] = useState<Actividad>({
    trabajo: a?.trabajo ?? 'sentado',
    horas: a?.deporte?.horas ?? 0,
    intensidad: a?.deporte?.intensidad ?? 'media',
  })
  if (!a || !reparto) return null
  // Etapa final de la definición (ya bastante definido): no se ofrece ir más rápido de −0,75 %
  const etapaFinal =
    a.fase === 'definicion' &&
    fase === 'definicion' &&
    semanaDeLaFase(a.faseDesde ?? a.creado, hoy.value) >= SEMANA_FINAL
  const cambiaFase =
    fase !== a.fase ||
    (fase === 'definicion' && (Number(ritmo) !== a.ritmo || porFases !== (a.porFases ?? false))) ||
    (fase === 'mantenimiento' && situacion !== (a.situacion ?? null)) ||
    (fase === 'volumen' && Number(ritmoVolumen) !== (a.ritmoVolumen ?? RITMO_VOLUMEN_DE_SERIE))
  const cambiaReparto = !mismoReparto(reparto, borradorDe(a))
  const cambiaOnOff = onOff !== (a.onOff ?? null)
  const cambiaActividad =
    actividad.trabajo !== (a.trabajo ?? 'sentado') ||
    actividad.horas !== (a.deporte?.horas ?? 0) ||
    (actividad.horas > 0 && actividad.intensidad !== (a.deporte?.intensidad ?? 'media'))
  const fila = (href: string, nombre: string, detalle: string) => (
    <li class={h.row}>
      <a class={h.rowMain} href={href}>
        <span class={h.rowTitle}>{nombre}</span>
        <span class={h.rowDetail}>{detalle}</span>
      </a>
      <ChevronRightIcon />
    </li>
  )
  const cambia = cambiaFase || cambiaReparto || cambiaOnOff || cambiaActividad
  const guardar = async () => {
    if (cambiaActividad)
      await cambiarActividad(
        actividad.trabajo,
        actividad.horas ? { horas: actividad.horas, intensidad: actividad.intensidad } : null,
      )
    if (cambiaReparto) await cambiarReparto(repartoDe(reparto, a))
    if (cambiaOnOff) await cambiarOnOff(onOff)
    if (cambiaFase)
      await cambiarFase(fase, Number(ritmo), { porFases, situacion, ritmoVolumen: Number(ritmoVolumen) })
    onGuardado(propuestaHaciaObjetivo())
  }
  return (
    <section class={h.stack} aria-labelledby="editar-objetivo">
      {/* Su título, solo para el lector de pantalla (los de dentro van debajo de él) */}
      <h2 id="editar-objetivo" class={h.oculto}>
        Editar tu objetivo
      </h2>
      {/* Lo primero, tu actividad (usuario, 2026-11-19) */}
      <TuActividad valor={actividad} onChange={setActividad} />
      {/* Qué quieres y a qué velocidad, en su tarjeta como las demás secciones (usuario, 2026-11-15) */}
      <div class={sec.card}>
        <ChoiceSegmented<Fase>
          name="editar-que-quieres"
          legend="¿Qué quieres?"
          showLegend
          options={QUE_QUIERES}
          value={fase}
          onChange={setFase}
        />
        {fase === 'definicion' && (
          <ChoiceSegmented<string>
            name="editar-velocidad"
            legend="Velocidad: de tu peso por semana"
            showLegend
            options={RITMOS.filter((r) => !etapaFinal || r <= RITMO_MAX_FINAL).map((r) => ({
              value: String(r),
              label: `−${formatDecimal(r)} %`,
            }))}
            value={ritmo}
            onChange={setRitmo}
          />
        )}
        {fase === 'volumen' && (
          <>
            <ChoiceSegmented<string>
              name="editar-velocidad-volumen"
              legend="Velocidad: de tu peso al mes"
              showLegend
              options={RITMOS_VOLUMEN.map((r) => ({
                value: String(r),
                label: `+${formatDecimal(r)} %`,
              }))}
              value={ritmoVolumen}
              onChange={setRitmoVolumen}
            />
            {/* Con precaución: subir más deprisa no gana más músculo (usuario, 2026-11-19) */}
            <p class={h.foot}>
              Unos {formatInt((Number(ritmoVolumen) / 100) * a.cuerpo.pesoKg * 1000)} g al mes. Subir más
              deprisa no gana más músculo, solo más grasa: si subes de más, la revisión te propone bajar.
            </p>
          </>
        )}
        {etapaFinal && (
          <p class={h.foot}>
            Estás en la etapa final: se recomienda no pasar de −{formatDecimal(RITMO_MAX_FINAL)} % para no
            perder músculo ni rendimiento.
          </p>
        )}
      </div>
      {/* Tu última definición, para empezar esta con eso en cuenta (usuario, 2026-11-22; la guía, § 7) */}
      {fase === 'definicion' && a.fase !== 'definicion' && a.ultimaDefinicion && (
        <p class={h.foot}>
          Tu última definición:{' '}
          {Math.round(daysBetween(a.ultimaDefinicion.desde, a.ultimaDefinicion.hasta) / 7)} semanas
          {a.ultimaDefinicion.kcalInicio
            ? `, de ${formatInt(a.ultimaDefinicion.kcalInicio)} a ${formatInt(a.ultimaDefinicion.kcalFinal)} kcal`
            : `, hasta ${formatInt(a.ultimaDefinicion.kcalFinal)} kcal`}
          .{a.ultimaDefinicion.atragantada ? ' Se atragantó: se recomienda un ritmo más suave esta vez.' : ''}
        </p>
      )}
      {/* Por fases, junto a la velocidad: sus etapas salen de ella (usuario, 2026-11-19) */}
      {fase === 'definicion' && !etapaFinal && (
        <VelocidadPorFases ritmo={Number(ritmo)} valor={porFases} onChange={setPorFases} />
      )}
      {fase === 'mantenimiento' && <TuSituacion valor={situacion} onChange={setSituacion} />}
      <HidratosDelDia a={a} valor={onOff} onChange={setOnOff} />
      {/* La recarga, aquí y solo en definición (usuario, 2026-11-22) */}
      {fase === 'definicion' && <FilaRecarga avisar={avisar} />}
      {/* Lo avanzado, plegado: a la vista queda lo que casi todos tocan (usuario, 2026-11-15: más fácil) */}
      <details class={sec.mas}>
        <summary>
          <span>Más ajustes</span>
          <ChevronDownIcon />
        </summary>
        <div class={h.stack}>
          <RepartoMacros a={a} valor={reparto} onChange={setReparto} />
          <ul class={`${h.list} ${sec.lista}`}>
            {fila(
              `${paths.nutritionTarget}?hoja=mano`,
              'Poner mis kcal',
              'Si tu nutricionista te da otra cifra',
            )}
            {fila(
              `${paths.nutritionTarget}?hoja=datos`,
              'Mis datos',
              `${formatDecimal(a.cuerpo.pesoKg)} kg · ${a.cuerpo.alturaCm} cm · ${a.cuerpo.edad} años · ${formatInt(a.pasos)} pasos`,
            )}
          </ul>
        </div>
      </details>
      {cambia && (
        <Button onClick={() => void guardar()}>
          {cambiaFase || cambiaActividad ? 'Guardar y recalcular' : 'Guardar'}
        </Button>
      )}
    </section>
  )
}

const kcal = (n: number) => `${formatInt(n)} kcal`
const conSigno = (n: number) => `${n > 0 ? '+' : '−'}${formatInt(Math.abs(n))}`

/** Sigues una dieta y tu objetivo ya no cuadra con ella: lo que cambiaría en cada tipo de día y «Ajustar mi dieta». */
function AjustarDieta({ p, onClose, avisar }: { p: Propuesta } & Props) {
  const filas = (['entreno', 'descanso'] as const).filter((t) => p.cambio[t] !== 0)
  return (
    <Sheet
      title="¿Ajustar tu dieta?"
      onClose={onClose}
      footer={
        <>
          <Button
            onClick={async () => {
              const id = await ajustarAlObjetivo(p.cambio)
              onClose()
              if (id)
                avisar('Tu dieta va con tus kcal nuevas', {
                  label: 'Deshacer',
                  onClick: () => void quitarAjuste(id),
                })
            }}
          >
            Ajustar mi dieta
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Ahora no
          </Button>
        </>
      }
    >
      <div class={h.stack}>
        <p class={h.foot}>
          Sigues una dieta: tu día y tus menús van con sus kcal, no con las de tu objetivo (
          {p.objetivo.descanso === p.objetivo.entreno
            ? `${kcal(p.objetivo.entreno)} al día`
            : `${kcal(p.objetivo.entreno)} los días de entreno y ${kcal(p.objetivo.descanso)} los de descanso`}
          ). Se puede ajustar como lo hace la consulta, moviendo los hidratos de una receta de cada día; la
          dieta conserva su reparto entre entreno y descanso.
        </p>
        <ul class={h.list}>
          {filas.map((t) => (
            <li key={t} class={h.row}>
              <span class={h.rowMain}>
                <span class={h.rowTitle}>{t === 'entreno' ? 'Días de entreno' : 'Días de descanso'}</span>
                <span class={h.rowDetail}>
                  Tu dieta {kcal(p.dieta[t])} → {kcal(p.dieta[t] + p.cambio[t])}
                </span>
              </span>
              <b>{conSigno(p.cambio[t])}</b>
            </li>
          ))}
        </ul>
        <p class={h.foot}>Si no, la dieta sigue igual y tu objetivo queda guardado para cuando la dejes.</p>
      </div>
    </Sheet>
  )
}
