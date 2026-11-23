import { useLocation } from 'preact-iso'
import { formatDayDate, formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import {
  BookIcon,
  ChatIcon,
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  SparkIcon,
} from '../../../../shared/ui/icons.tsx'
import { CartIcon } from '../../../../shared/ui/iconosHoy.tsx'
import sv from './SemanaVista.module.css'
import { CoachCard } from '../../components/CoachCard.tsx'
import { DietWeek } from '../../components/DietWeek.tsx'
import { dieta } from '../../state/comida.ts'
import {
  ahoraDieta,
  cifrasDieta,
  PLANTILLA_DIETA,
  proximaConsulta,
  recetaDelDia,
  semanaDieta,
  type Menu,
  type Receta,
} from '../../state/dieta.ts'
import { consultaDeshacible, consultaPendiente } from '../../use-cases/consult.ts'
import { formatoDias } from './formatoDias.ts'
import styles from './Vistas.module.css'

type Props = {
  onArchivo: () => void
  onEjemplo: () => void
  onPropia: () => void
  onDia: (fecha: string) => void
  onMas: () => void
  onNuevaReceta: (menu: string | null) => void
  onNuevoMenu: () => void
  onDeshacerConsulta: (id: string) => void
}

/** Una fila de receta: su nombre y sus kcal de entreno y de descanso; lleva a la receta. */
function FilaReceta({ r }: { r: Receta }) {
  const entreno = recetaDelDia(r, 'entreno').total
  const descanso = recetaDelDia(r, 'descanso').total
  return (
    <li>
      <a class={styles.rowLink} href={`${paths.recipe(r.id)}?desde=dieta`}>
        <span class={styles.rowText}>
          <span class={styles.rowTitle}>{r.nombre}</span>
          <span class={styles.foot}>
            {r.rotulo !== r.nombre ? `${r.rotulo} · ` : ''}
            {formatInt(entreno.kcal)} kcal
            {descanso.kcal !== entreno.kcal ? ` · descanso ${formatInt(descanso.kcal)}` : ''}
            {r.soloEntreno ? ' · solo si entrenas' : ''}
          </span>
        </span>
        <ChevronRightIcon />
      </a>
    </li>
  )
}

/** Tu dieta (el tercer apartado de Comida): sin dieta, cómo tener una; con dieta, sus cifras, tu semana y sus recetas. */
export function DietaVista(p: Props) {
  const { route } = useLocation()
  const a = dieta.value
  // Sin dieta (rediseño 45; usuario, 2026-11-17): es opcional; tres formas de tenerla
  if (!a) {
    return (
      <div class={sv.vista}>
        <section class={sv.vaciaTexto}>
          <h2>¿Sigues una dieta pautada?</h2>
          <p>Es opcional. Si la traes, MUTA la convierte en tu menú, tu compra y tu día.</p>
        </section>
        <ul class={sv.tarjeta}>
          <li>
            <button type="button" class={sv.opcion} onClick={p.onArchivo}>
              <span class={sv.icono}>
                <BookIcon />
              </span>
              <span class={sv.texto}>
                <b>Importar un archivo</b>
                <span class={sv.detalle}>El de MUTA o un CSV de tu nutricionista</span>
              </span>
              <ChevronRightIcon />
            </button>
          </li>
          <li>
            <button type="button" class={sv.opcion} onClick={p.onPropia}>
              <span class={sv.icono}>
                <PencilIcon />
              </span>
              <span class={sv.texto}>
                <b>Crear una con recetas</b>
                <span class={sv.detalle}>Eliges los platos de cada día</span>
              </span>
              <ChevronRightIcon />
            </button>
          </li>
          <li>
            <button type="button" class={sv.opcion} onClick={p.onEjemplo}>
              <span class={sv.icono}>
                <SparkIcon />
              </span>
              <span class={sv.texto}>
                <b>Probar una de ejemplo</b>
                <span class={sv.detalle}>Para ver cómo funciona; se quita cuando quieras</span>
              </span>
              <ChevronRightIcon />
            </button>
          </li>
        </ul>
        <p class={sv.detalle}>
          Sin dieta todo funciona igual: MUTA calcula tu objetivo y te propone los menús.
        </p>
        <p class={sv.detalle}>
          El CSV lleva una fila por ingrediente: menú y sus días, cuándo se cocina, comida, receta,
          ingrediente y gramos (de entreno y de descanso si cambian). Lo que va todos los días, con el menú
          «Todos». La de ejemplo no está pautada para ti.
        </p>
        <a
          class={sv.plantilla}
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(PLANTILLA_DIETA)}`}
          download="dieta-plantilla.csv"
        >
          Descargar plantilla
        </a>
      </div>
    )
  }
  const cifras = cifrasDieta.value
  const ahora = ahoraDieta.value
  const pendiente = consultaPendiente()
  const deshacible = consultaDeshacible()
  const menus: (Menu | null)[] = [...a.dieta.menus, null]
  return (
    <div class={styles.stack}>
      {/* Rediseño 46 (usuario, 2026-11-17): el nombre, la semana con sus kcal y lo que hay que hacer con ella */}
      {cifras && ahora && (
        <section class={sv.vista} aria-label="Tu dieta">
          <div class={styles.cabezaDieta}>
            <span>
              <h2>{a.dieta.nombre}</h2>
              <p>
                {[
                  `Semana ${ahora.semana}`,
                  ahora.fase?.nombre,
                  `${formatInt(cifras.entreno.kcal)} kcal si entrenas`,
                  `${formatInt(cifras.descanso.kcal)} si descansas`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </span>
            <button type="button" class={styles.editar} aria-label="Tu dieta: opciones" onClick={p.onMas}>
              <PencilIcon />
            </button>
          </div>
          <ul class={sv.tarjeta}>
            <li>
              <a class={sv.opcion} href={paths.checkIn}>
                <span class={sv.icono}>
                  <ChatIcon />
                </span>
                <span class={sv.texto}>
                  <b>Revisión semanal</b>
                  <span class={sv.detalle}>
                    {proximaConsulta.value
                      ? `Toca el ${formatDayDate(proximaConsulta.value).toLowerCase()}: cuéntale cómo ha ido`
                      : 'Cuéntale cómo ha ido la semana'}
                  </span>
                </span>
                <ChevronRightIcon />
              </a>
            </li>
            <li>
              <a class={sv.opcion} href={`${paths.nutrition}?vista=plan&paso=come`}>
                <span class={sv.icono}>
                  <SparkIcon />
                </span>
                <span class={sv.texto}>
                  <b>Propuestas</b>
                  <span class={sv.detalle}>Cambios que te sugiere tu nutricionista</span>
                </span>
                <ChevronRightIcon />
              </a>
            </li>
            <li>
              <a class={sv.opcion} href={paths.shopping}>
                <span class={sv.icono}>
                  <CartIcon />
                </span>
                <span class={sv.texto}>
                  <b>Compra de la dieta</b>
                  <span class={sv.detalle}>Lo que necesitas, en tu lista</span>
                </span>
                <ChevronRightIcon />
              </a>
            </li>
          </ul>
        </section>
      )}
      {a.dieta.ejemplo && (
        <p class={`${styles.foot} ${styles.pad}`}>
          Es la dieta de ejemplo del prototipo: para probar la app, no está pautada para ti.
        </p>
      )}
      {pendiente && (
        <CoachCard
          titulo="Tu nutricionista · consulta semanal"
          texto={`Te propongo: ${pendiente.propuestas.map((x) => x.titulo.toLowerCase()).join(' o ')}`}
          onVer={() => route(paths.checkIn)}
        />
      )}
      <DietWeek
        dias={semanaDieta.value.map((d) => ({
          fecha: d.fecha,
          letra: d.letra,
          menu: d.menu.id,
          entreno: d.tipo === 'entreno',
          hoy: d.hoy,
        }))}
        onDia={p.onDia}
      />
      <div class={`${styles.tiles} ${styles.pad}`}>
        <a class={styles.tile} href={paths.shopping}>
          <span class={styles.tileTitle}>La compra</span>
          <span class={styles.foot}>La lista de tus recetas</span>
        </a>
        <a class={styles.tile} href={paths.kitchen}>
          <span class={styles.tileTitle}>Cocina</span>
          <span class={styles.foot}>Arroz, raciones y platos</span>
        </a>
        <a class={styles.tile} href={paths.checkIn}>
          <span class={styles.tileTitle}>Consulta</span>
          <span class={styles.foot}>
            {proximaConsulta.value ? `Próxima: ${formatDayDate(proximaConsulta.value)}` : 'Cada semana'}
          </span>
        </a>
      </div>
      {deshacible && (
        <p class={`${styles.foot} ${styles.pad}`}>
          Aplicaste «{deshacible.propuestas.find((x) => x.id === deshacible.elegida)?.titulo}» el{' '}
          {formatDayDate(deshacible.fecha)}.{' '}
          <button type="button" class={styles.link} onClick={() => p.onDeshacerConsulta(deshacible.id)}>
            Deshacer
          </button>
        </p>
      )}
      {menus.map((m) => {
        const recetas = a.dieta.recetas.filter((r) => r.menu === (m?.id ?? null))
        const dias = m ? formatoDias(a.dieta.ciclo, m.id) : 'Todos los días'
        return (
          <section key={m?.id ?? 'todos'} class={styles.pad} aria-label={m?.nombre ?? 'Todos los días'}>
            <div class={styles.cardHead}>
              <h2 class={styles.sectionTitle}>{m?.nombre ?? 'Todos los días'}</h2>
              <span class={styles.sub}>{m ? dias : ''}</span>
            </div>
            <ul class={styles.rows}>
              {recetas.map((r) => (
                <FilaReceta key={r.id} r={r} />
              ))}
            </ul>
            <button type="button" class={styles.textButton} onClick={() => p.onNuevaReceta(m?.id ?? null)}>
              <PlusIcon /> Añadir receta{m ? ` al ${m.nombre}` : ' de todos los días'}
            </button>
          </section>
        )
      })}
      <div class={styles.pad}>
        <button type="button" class={styles.textButton} onClick={p.onNuevoMenu}>
          <PlusIcon /> Añadir un menú
        </button>
      </div>
    </div>
  )
}
