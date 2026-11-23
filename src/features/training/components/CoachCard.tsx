import { TIP_BOTON, TarjetaConsejos, type ConsejoVisto } from '../../../shared/ui/Consejos.tsx'

/** Lo que pinta la tarjeta de cada consejo (el consejo entero vuelve en los botones). */
type Consejo = {
  musculo: string
  lectura: string
  titulo: string
  detalle: string
  mejora: { mejoran: number; comparables: number }
  propuesta: { campo: 'series' | 'rir'; de: number; a: number; aMas?: number } | null
  noMeInteresa: boolean
}

type Props<T extends Consejo> = {
  consejos: T[]
  /** Con `a`, el valor elegido (la opción de +2 series); sin él, el propuesto. */
  onAplicar: (c: T, a?: number) => void
  onDejar: (c: T) => void
  /** «No me interesa»: ese músculo pasa a Mantener. */
  onNoMeInteresa: (c: T) => void
  /** «Ver dónde se edita»: lleva a Editar rutina con ese músculo señalado, para cambiarlo tú. */
  onEditar: (c: T) => void
}

/**
 * «Tu entrenador» en Tu plan: cada músculo con su % de series que mejoran esta semana y lo que toca según la guía. Con
 * propuesta (una serie más o menos), «Aplicar» y «Ahora no» (y, si propone subir, «No me interesa», que lo pasa a Mantener);
 * sin ella, «Entendido». Todo son sugerencias: nada cambia hasta que lo aplicas. Plegada (usuario, 2026-11-12): se
 * abre al tocarla; cada consejo, con «Ver dónde se edita», lleva a Editar rutina con su músculo señalado. Se ve como
 * «Consejos para esta sesión» (usuario, 2026-11-14): la misma tarjeta y la misma lista numerada.
 */
export function CoachCard<T extends Consejo>({
  consejos,
  onAplicar,
  onDejar,
  onNoMeInteresa,
  onEditar,
}: Props<T>) {
  if (!consejos.length) return null
  const propuestas = consejos.filter((c) => c.propuesta).length
  // La misma lista que «Consejos para esta sesión» (01, 02…, el consejo en negrita y el porqué en gris), con sus botones
  const lista: ConsejoVisto[] = consejos.map((c) => ({
    text: `${c.titulo} · ${Math.round((c.mejora.mejoran / c.mejora.comparables) * 100)} %`,
    why: c.detalle,
    pie: (
      <>
        {c.propuesta ? (
          <>
            <button type="button" class={TIP_BOTON.principal} onClick={() => onAplicar(c)}>
              {c.propuesta.campo === 'rir'
                ? `Aplicar: RIR ${c.propuesta.de} → ${c.propuesta.a}`
                : `Aplicar: ${c.propuesta.de} → ${c.propuesta.a} series`}
            </button>
            {c.propuesta.aMas !== undefined && (
              <button
                type="button"
                class={TIP_BOTON.principal}
                onClick={() => onAplicar(c, c.propuesta?.aMas)}
              >
                {`${c.propuesta.de} → ${c.propuesta.aMas} series`}
              </button>
            )}
            <button type="button" class={TIP_BOTON.secundario} onClick={() => onDejar(c)}>
              Ahora no
            </button>
            {c.noMeInteresa && (
              <button type="button" class={TIP_BOTON.secundario} onClick={() => onNoMeInteresa(c)}>
                No me interesa
              </button>
            )}
          </>
        ) : (
          <button type="button" class={TIP_BOTON.secundario} onClick={() => onDejar(c)}>
            Entendido
          </button>
        )}
        <button type="button" class={TIP_BOTON.enlace} onClick={() => onEditar(c)}>
          Ver dónde se edita ›
        </button>
      </>
    ),
  }))
  return (
    <TarjetaConsejos
      id="entrenador"
      titulo="Tu entrenador"
      resumen={
        propuestas
          ? `${propuestas} ${propuestas === 1 ? 'propuesta' : 'propuestas'}`
          : `${consejos.length} ${consejos.length === 1 ? 'consejo' : 'consejos'}`
      }
      consejos={lista}
      nota="Nada cambia hasta que lo aplicas. Mejorar es subir kilos o repeticiones frente a la vez anterior."
    />
  )
}
