import { TIP_BOTON } from '../../../shared/ui/Consejos.tsx'
import {
  EstaSemana,
  Informe,
  TarjetaInforme,
  type FilaInforme,
  type LineaSemana,
} from '../../../shared/ui/Informe.tsx'
import styles from './CoachCard.module.css'

/** El informe de la semana (state/entrenador.ts · informeEntrenador), el mismo formato que la revisión de Nutrición. */
export type InformeCoach = {
  estado: string
  destacado: boolean
  titulo: string
  filas: FilaInforme[]
  nota: string | null
  lineas: string[]
  /** Los ejercicios en los que vas lejos de tu RIR (solo cuando eso manda la semana), con su músculo. */
  apurar: { nombre: string; rir: number; pauta: number; musculo: string }[]
  /** Toca la recarga de hidratos: un enlace a ella. */
  recarga: boolean
}

/** Lo que pinta la tarjeta de cada consejo (el consejo entero vuelve en los botones). */
type Consejo = {
  musculo: string
  lectura: string
  titulo: string
  detalle: string
  propuesta: { campo: 'series' | 'rir'; de: number; a: number; aMas?: number } | null
  noMeInteresa: boolean
}

type Props<T extends Consejo> = {
  consejos: T[]
  informe: InformeCoach | null
  /** Vuelves de un parón: «Aplicar» (una serie menos por músculo) y «Ahora no». */
  onParon?: { aplicar: () => void; dejar: () => void } | null
  /** Dónde está la recarga de hidratos (Nutrición). */
  hrefRecarga: string
  /** Con `a`, el valor elegido (la opción de +2 series); sin él, el propuesto. */
  onAplicar: (c: T, a?: number) => void
  onDejar: (c: T) => void
  /** «No me interesa»: ese músculo pasa a Mantener. */
  onNoMeInteresa: (c: T) => void
  /** «Ver dónde se edita»: lleva a Editar rutina con ese músculo señalado, para cambiarlo tú. */
  onEditar: (c: T) => void
  /** «Ver dónde se edita» de un músculo sin consejo (un ejercicio en el que vas lejos de tu RIR). */
  onEditarMusculo: (musculo: string) => void
}

/** La primera frase de un porqué (para «Esta semana», una frase por cosa). */
const primeraFrase = (t: string) => {
  const i = t.indexOf('. ')
  return i < 0 ? t : t.slice(0, i + 1)
}

/**
 * «Tu entrenador» en Tu plan, igual que la revisión semanal de Nutrición (usuario, 2026-11-23: «igual de bonito que
 * aquí y justificado»): el informe de la semana, una sola sugerencia con sus botones («Aplicar / Ahora no», «No me
 * interesa», «Ver dónde se edita») y «Esta semana» con lo demás en una frase. Nada cambia hasta que lo aplicas.
 */
export function CoachCard<T extends Consejo>({
  consejos,
  informe,
  onParon,
  hrefRecarga,
  onAplicar,
  onDejar,
  onNoMeInteresa,
  onEditar,
  onEditarMusculo,
}: Props<T>) {
  if (!informe) return null
  // Lejos de tu RIR: la rutina no se toca (antes se apura); el primero, en su recuadro; los demás, en «Esta semana»
  const [apura, ...masApurar] = informe.apurar
  const apurarLineas = masApurar.map((x): LineaSemana => ({
    texto: `${x.nombre}: vas a RIR ${x.rir} y tu pauta es ${x.pauta}.`,
    enlace: { texto: 'Ver dónde se edita ›', onClick: () => onEditarMusculo(x.musculo) },
  }))
  // Una cosa cada vez: la primera sugerencia; las demás salen al decidir esta (o la semana que viene)
  const principal = onParon ? null : (consejos.find((c) => c.propuesta) ?? null)
  // Lo que progresa ya va en una línea («no toques lo que funciona»); el resto, una frase cada uno
  const otros = consejos
    .filter((c) => c !== principal && c.lectura !== 'dulce')
    .map((c): LineaSemana => ({
      texto: `${c.titulo}. ${primeraFrase(c.detalle)}`,
      enlace: { texto: 'Ver dónde se edita ›', onClick: () => onEditar(c) },
    }))
  const p = principal?.propuesta
  return (
    <TarjetaInforme id="entrenador" rotulo="Tu entrenador" plegable={{ resumen: informe.estado }}>
      <Informe
        estado={informe.estado}
        destacado={informe.destacado}
        titulo={informe.titulo}
        filas={informe.filas}
        nota={informe.nota}
      />
      {onParon && (
        <div class={TIP_BOTON.fila}>
          <button type="button" class={TIP_BOTON.principal} onClick={onParon.aplicar}>
            Aplicar: una serie menos
          </button>
          <button
            type="button"
            class={`${TIP_BOTON.secundario} ${styles.secundario}`}
            onClick={onParon.dejar}
          >
            Ahora no
          </button>
        </div>
      )}
      {informe.recarga && (
        <a class={styles.enlace} href={hrefRecarga}>
          Ver la recarga en Nutrición ›
        </a>
      )}
      {principal && p && (
        <div class={styles.sugerencia} role="group" aria-label="Sugerencia">
          <p class={styles.titulo}>{principal.titulo}</p>
          <p class={styles.detalle}>{principal.detalle}</p>
          <div class={TIP_BOTON.fila}>
            <button type="button" class={TIP_BOTON.principal} onClick={() => onAplicar(principal)}>
              {p.campo === 'rir' ? `Aplicar: RIR ${p.de} → ${p.a}` : `Aplicar: ${p.de} → ${p.a} series`}
            </button>
            {p.aMas !== undefined && (
              <button type="button" class={TIP_BOTON.principal} onClick={() => onAplicar(principal, p.aMas)}>
                {`${p.de} → ${p.aMas} series`}
              </button>
            )}
            <button
              type="button"
              class={`${TIP_BOTON.secundario} ${styles.secundario}`}
              onClick={() => onDejar(principal)}
            >
              Ahora no
            </button>
            {principal.noMeInteresa && (
              <button
                type="button"
                class={`${TIP_BOTON.secundario} ${styles.secundario}`}
                onClick={() => onNoMeInteresa(principal)}
              >
                No me interesa
              </button>
            )}
            <button type="button" class={TIP_BOTON.enlace} onClick={() => onEditar(principal)}>
              Ver dónde se edita ›
            </button>
          </div>
        </div>
      )}
      {apura && (
        <div class={styles.sugerencia} role="group" aria-label="Sugerencia">
          <p class={styles.titulo}>{`${apura.nombre}: apura hasta RIR ${apura.pauta}`}</p>
          <p class={styles.detalle}>
            {`Terminas con RIR ${apura.rir} y tu pauta es ${apura.pauta}: se recomienda subir kilos o repeticiones en tu próxima sesión. Las series no se tocan hasta que apures.`}
          </p>
          <div class={TIP_BOTON.fila}>
            <button type="button" class={TIP_BOTON.enlace} onClick={() => onEditarMusculo(apura.musculo)}>
              Ver dónde se edita ›
            </button>
          </div>
        </div>
      )}
      <EstaSemana lineas={[...informe.lineas, ...apurarLineas, ...otros]} />
      <p class={styles.pie}>Nada cambia hasta que lo aplicas. Mejorar es subir kilos o repeticiones.</p>
    </TarjetaInforme>
  )
}
