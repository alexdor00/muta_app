import { useEffect, useState } from 'preact/hooks'
import { formatDecimal, parseDecimal } from '../../../../shared/lib/format.ts'
import { logError } from '../../../../shared/lib/logger.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { ajustes, cuerpoValido, type Fase, type Sexo } from '../../state/comida.ts'
import { deTuPerfil, guardarDatos } from '../../use-cases/target.ts'
import h from '../comun/Hojas.module.css'

/** Lo que quieres conseguir (la primera vez, aquí; después, en Tu plan › Editar › «¿Qué quieres?»). */
export const QUE_QUIERES: { value: Fase; label: string }[] = [
  { value: 'definicion', label: 'Definir' },
  { value: 'mantenimiento', label: 'Mantenerte' },
  { value: 'volumen', label: 'Volumen' },
]

/**
 * Tus datos: lo que necesita la fórmula del gasto y, la primera vez, qué quieres (definir, mantenerte o volumen; viene
 * marcado lo de tu bienvenida). Al guardar se recalcula tu objetivo (lo pides tú).
 */
export function DatosHoja({ onClose }: { onClose: () => void }) {
  const a = ajustes.value
  const [sexo, setSexo] = useState<Sexo>(a?.cuerpo.sexo ?? 'hombre')
  const [v, setV] = useState({
    edad: a ? String(a.cuerpo.edad) : '',
    alturaCm: a ? String(a.cuerpo.alturaCm) : '',
    pesoKg: a ? formatDecimal(a.cuerpo.pesoKg) : '',
    pasos: a ? String(a.pasos) : '',
  })
  const [error, setError] = useState<string | null>(null)
  const [fase, setFase] = useState<Fase | null>(null)
  const [guardando, setGuardando] = useState(false)
  useEffect(() => {
    if (!a) void deTuPerfil().then((p) => setFase((ya) => ya ?? p.fase))
  }, [a])

  async function guardar() {
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
    setGuardando(true)
    try {
      await guardarDatos(cuerpo, pasos, a ? undefined : (fase ?? 'mantenimiento'))
      onClose()
    } catch (e) {
      logError(e, 'guardar tus datos')
      setError('No se ha podido guardar. Vuelve a intentarlo.')
      setGuardando(false)
    }
  }
  const campo = (clave: keyof typeof v, etiqueta: string, ejemplo: string) => (
    <label class={h.field}>
      {etiqueta}
      <input
        inputMode="decimal"
        value={v[clave]}
        placeholder={ejemplo}
        onInput={(e) => setV({ ...v, [clave]: e.currentTarget.value })}
      />
    </label>
  )

  return (
    <Sheet
      title="Tus datos"
      onClose={onClose}
      large
      footer={
        <Button onClick={() => void guardar()} disabled={guardando}>
          {a ? 'Guardar y recalcular' : 'Calcular mi objetivo'}
        </Button>
      }
    >
      <div class={h.stack}>
        <p class={h.sub}>
          Con ellos calculo lo que gastas (fórmula Mifflin-St Jeor y tu actividad) y cuánto comer.
        </p>
        {/* En su bloque: dos grupos seguidos llevan además el margen de la bienvenida */}
        {!a && (
          <div>
            <ChoiceSegmented<Fase>
              name="que-quieres"
              legend="¿Qué quieres?"
              showLegend
              options={QUE_QUIERES}
              value={fase ?? 'mantenimiento'}
              onChange={setFase}
            />
          </div>
        )}
        <ChoiceSegmented<Sexo>
          name="sexo"
          legend="Sexo"
          showLegend
          options={[
            { value: 'hombre', label: 'Hombre' },
            { value: 'mujer', label: 'Mujer' },
          ]}
          value={sexo}
          onChange={setSexo}
        />
        <div class={h.fields}>
          {campo('edad', 'Edad', '30')}
          {campo('alturaCm', 'Altura (cm)', '175')}
          {campo('pesoKg', 'Peso (kg)', '75,0')}
          {campo('pasos', 'Pasos al día', '8000')}
        </div>
        {error && (
          <p class={h.warn} role="alert">
            {error}
          </p>
        )}
      </div>
    </Sheet>
  )
}
