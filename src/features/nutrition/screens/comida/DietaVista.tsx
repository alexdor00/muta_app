import { useLocation } from 'preact-iso'
import { formatDayDate, formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChevronRightIcon, PlusIcon } from '../../../../shared/ui/icons.tsx'
import { CoachCard } from '../../components/CoachCard.tsx'
import { DietWeek } from '../../components/DietWeek.tsx'
import { TargetHero } from '../../components/TargetHero.tsx'
import { dieta } from '../../state/comida.ts'
import {
  ahoraDieta,
  cifrasDieta,
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
  if (!a) {
    return (
      <div class={styles.stack}>
        <section class={styles.card} aria-labelledby="sin-dieta">
          <h2 id="sin-dieta" class={styles.cardTitle}>
            Sigue una dieta
          </h2>
          <p class={styles.sub}>
            Como tu rutina en Entreno: menús que se repiten, recetas con su versión de entreno y de descanso,
            y la app sabe qué toca comer cada día. Lo apuntas de un toque y te hace la lista de la compra.
          </p>
          <div class={styles.actions}>
            <Button onClick={p.onArchivo}>Cargar un archivo de dieta</Button>
            <Button variant="secondary" onClick={p.onPropia}>
              Crear la mía con mis recetas
            </Button>
            <Button variant="secondary" onClick={p.onEjemplo}>
              Probar la dieta de ejemplo
            </Button>
          </div>
          <p class={styles.foot}>
            El archivo puede ser el de MUTA o un CSV con una fila por ingrediente: menú, comida, receta,
            ingrediente y gramos (o gramos de entreno y de descanso).
          </p>
          <p class={styles.foot}>
            La de ejemplo es la del prototipo anterior, para ver cómo funciona: no es una dieta pautada para
            ti.
          </p>
        </section>
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
      {cifras && ahora && (
        <div class={styles.pad}>
          <TargetHero
            etiqueta={[a.dieta.nombre, `semana ${ahora.semana}`, ahora.fase?.nombre]
              .filter(Boolean)
              .join(' · ')}
            kcal={cifras.entreno.kcal}
            cuando="los días de entreno"
            macros={{
              proteina: cifras.entreno.protein,
              hidratos: cifras.entreno.carbs,
              grasa: cifras.entreno.fat,
            }}
            detalle={`${formatInt(cifras.descanso.kcal)} kcal los días de descanso · ${formatInt(ahora.ajuste.pasos)} pasos al día`}
          >
            <button type="button" onClick={p.onMas}>
              ··· Tu dieta
            </button>
          </TargetHero>
        </div>
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
