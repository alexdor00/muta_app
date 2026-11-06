import { useLocation } from 'preact-iso'
import { addDays, formatDayDate, formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '../../../../shared/ui/icons.tsx'
import { CoachCard } from '../../components/CoachCard.tsx'
import { PlatoFoto } from '../../components/Platos.tsx'
import { COMIDAS, dieta, hoy, objetivoDelDia, tipoDe, type ComidaId } from '../../state/comida.ts'
import {
  estadoRecetas,
  fotos,
  huecoDe,
  menu,
  platoPorId,
  propuestas,
  semanaDelMenu,
  semanaVista,
  totalDelDia,
  valoresDe,
} from '../../state/recetas.ts'
import styles from './Menu.module.css'
import v from './Vistas.module.css'

type Props = {
  onHueco: (fecha: string, comida: ComidaId) => void
  onAnadir: (fecha: string, comida: ComidaId) => void
  onCocinado: (id: string) => void
  onCuadrar: () => void
  onAvisos: () => void
}

/**
 * Tu menú de la semana: cada comida de cada día con su plato (del recetario o tuyo), lo que cocinas y cuándo, la compra,
 * tus avisos y lo que propone tu nutricionista.
 */
export function MenuVista({ onHueco, onAnadir, onCocinado, onCuadrar, onAvisos }: Props) {
  const { route } = useLocation()
  if (estadoRecetas.value !== 'listo') return null
  const dias = semanaDelMenu.value
  const m = menu.value
  const n = propuestas.value.length
  return (
    <div class={v.stack}>
      <div class={styles.semana}>
        <button
          type="button"
          class={styles.flecha}
          aria-label="Semana anterior"
          disabled={dias[0] <= hoy.value}
          onClick={() => (semanaVista.value = addDays(semanaVista.value, -7))}
        >
          <ChevronLeftIcon />
        </button>
        <p class={styles.semanaTitulo}>
          {formatDayDate(dias[0])} – {formatDayDate(dias[6])}
        </p>
        <button
          type="button"
          class={styles.flecha}
          aria-label="Semana siguiente"
          onClick={() => (semanaVista.value = addDays(semanaVista.value, 7))}
        >
          <ChevronRightIcon />
        </button>
      </div>
      <div class={styles.atajos}>
        <button type="button" class={styles.atajo} onClick={onCuadrar}>
          Cuadrar la semana
        </button>
        <a class={styles.atajo} href={paths.shopping}>
          La compra
        </a>
        <button type="button" class={styles.atajo} onClick={onAvisos}>
          Avisos
        </button>
        <a class={styles.atajo} href={`${paths.nutrition}?vista=dieta`}>
          {dieta.value ? 'Tu dieta' : 'Seguir una dieta'}
        </a>
      </div>
      {n > 0 && (
        <CoachCard
          titulo="Tu nutricionista"
          texto={n === 1 ? propuestas.value[0].titulo : `${n} propuestas para tu semana`}
          ver="Ver"
          onVer={() => route(paths.nutritionist)}
        />
      )}
      {dias.map((fecha) => {
        const cocinas = m.cocinados.filter((c) => c.fecha === fecha)
        const total = totalDelDia(m, fecha, platoPorId, valoresDe)
        const objetivo = objetivoDelDia(fecha)
        return (
          <section key={fecha} class={styles.dia} aria-label={formatDayDate(fecha)}>
            <div class={styles.diaHead}>
              <h2 class={styles.diaTitulo}>
                {fecha === hoy.value ? 'Hoy' : formatDayDate(fecha)} ·{' '}
                {tipoDe(fecha) === 'entreno' ? 'entreno' : 'descanso'}
              </h2>
              <span class={v.foot}>
                {total.kcal ? `${formatInt(total.kcal)} / ` : ''}
                {objetivo ? `${formatInt(objetivo.kcal)} kcal` : ''}
              </span>
            </div>
            <ul class={styles.filas}>
              {cocinas.map((c) => {
                const p = platoPorId(c.plato)
                return (
                  <li key={c.id}>
                    <button type="button" class={styles.fila} onClick={() => onCocinado(c.id)}>
                      <PlatoFoto foto={fotos.value[c.plato] ?? null} />
                      <span class={styles.filaTexto}>
                        <span class={styles.comida}>Cocinar</span>
                        <span class={styles.plato}>
                          {p?.nombre ?? 'Plato'} × {c.para.length}
                        </span>
                      </span>
                      <span class={styles.cocinar}>{c.hora}</span>
                    </button>
                  </li>
                )
              })}
              {COMIDAS.map((c) => {
                const h = huecoDe(m, fecha, c.id)
                const p = h ? platoPorId(h.plato) : null
                const cocinado = h?.cocinado ? m.cocinados.find((x) => x.id === h.cocinado) : null
                return (
                  <li key={c.id}>
                    {h ? (
                      <button type="button" class={styles.fila} onClick={() => onHueco(fecha, c.id)}>
                        <PlatoFoto foto={fotos.value[h.plato] ?? null} />
                        <span class={styles.filaTexto}>
                          <span class={styles.comida}>{c.nombre}</span>
                          <span class={styles.plato}>{p?.nombre ?? 'Plato que ya no está'}</span>
                          {cocinado && cocinado.fecha < fecha && (
                            <span class={v.foot}>Ya cocinado el {formatDayDate(cocinado.fecha)}</span>
                          )}
                        </span>
                        {cocinado && cocinado.fecha === fecha && (
                          <span class={styles.cocinar}>{cocinado.hora}</span>
                        )}
                      </button>
                    ) : (
                      <button type="button" class={styles.fila} onClick={() => onAnadir(fecha, c.id)}>
                        <span class={styles.mas} aria-hidden="true">
                          <PlusIcon />
                        </span>
                        <span class={styles.filaTexto}>
                          <span class={styles.comida}>{c.nombre}</span>
                          <span class={v.foot}>Añadir plato</span>
                        </span>
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
