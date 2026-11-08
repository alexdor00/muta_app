import { useLocation } from 'preact-iso'
import { useEffect, useState } from 'preact/hooks'
import { daysBetween, formatDayDate, formatDecimal, formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { HeroHeader } from '../../../../shared/ui/HeroHeader.tsx'
import { ChevronRightIcon, MinusIcon, PencilIcon, PlusIcon } from '../../../../shared/ui/icons.tsx'
import { RoundButton } from '../../../../shared/ui/RoundButton.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import { diaVisto, dieta, estado, hoy, tipoDe } from '../../state/comida.ts'
import {
  apuntada,
  cambiaEnDescanso,
  recetaComoToca,
  recetaPorId,
  TIPOS_DIA,
  type TipoDia,
} from '../../state/dieta.ts'
import { apuntarReceta, devolver, quitarReceta } from '../../use-cases/diet.ts'
import { cargarComida } from '../../use-cases/nutritionStore.ts'
import { useAviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'
import { EditarRecetaHoja } from './EditarRecetaHoja.tsx'
import { IntercambioHoja } from './IntercambioHoja.tsx'
import styles from './Receta.module.css'

/** Una receta de tu dieta, como Ver sesión: sus cifras, la versión de entreno o de descanso, raciones y «Apuntar». */
export function RecetaScreen(props: { id: string }) {
  useEffect(() => {
    void cargarComida()
  }, [])
  const { query } = useLocation()
  const [tipo, setTipo] = useState<TipoDia | null>(
    query.tipo === 'descanso' || query.tipo === 'entreno' ? query.tipo : null,
  )
  const [raciones, setRaciones] = useState(1)
  const [cual, setCual] = useState<number | null>(null)
  const editar = useSheet('editar')
  const cambio = useSheet('cambio')
  const { aviso, avisar } = useAviso()
  if (estado.value === 'cargando') return null
  const volver = query.desde === 'dieta' ? `${paths.nutrition}?vista=dieta` : paths.nutrition
  const r = recetaPorId(props.id)
  if (!r || !dieta.value) {
    return (
      <div class={styles.page}>
        <p class={h.sub}>Esta receta ya no está en tu dieta.</p>
        <Button href={volver}>Volver a Nutrición</Button>
        <Toast message={aviso?.texto ?? null} action={aviso?.accion ?? null} />
      </div>
    )
  }
  const t = tipo ?? tipoDe(diaVisto.value)
  const delDia = recetaComoToca(r, t, raciones)
  const fecha = diaVisto.value
  const ya = apuntada(r.id, fecha)
  const cuando = daysBetween(fecha, hoy.value) === 0 ? 'hoy' : `el ${formatDayDate(fecha)}`
  const menu = dieta.value.dieta.menus.findIndex((m) => m.id === r.menu)
  const tono = ((menu < 0 ? 4 : menu) % 6) + 1

  const apuntar = async () => {
    if (ya) {
      const quitado = await quitarReceta(r.id, fecha)
      return avisar(`Quitada de ${cuando}`, {
        label: 'Deshacer',
        onClick: () => void devolver(quitado, fecha),
      })
    }
    // Se apunta una ración, como toca ese día
    await apuntarReceta(recetaComoToca(r, tipoDe(fecha)), fecha)
    avisar(`Apuntada ${cuando}`, { label: 'Deshacer', onClick: () => void quitarReceta(r.id, fecha) })
  }

  return (
    <div class={styles.screen}>
      <HeroHeader
        title={r.nombre}
        description={`${r.rotulo} · ${r.menu ? (dieta.value.dieta.menus[menu]?.nombre ?? '') : 'todos los días'}`}
        tone={tono as 1 | 2 | 3 | 4 | 5 | 6}
        backHref={volver}
        action={
          <RoundButton label="Editar receta" onClick={editar.show}>
            <PencilIcon />
          </RoundButton>
        }
      />
      <div class={styles.page}>
        <div class={h.tiles}>
          {[
            [formatInt(delDia.total.kcal), 'kcal'],
            [formatInt(delDia.total.protein), 'proteína'],
            [formatInt(delDia.total.carbs), 'hidratos'],
            [formatInt(delDia.total.fat), 'grasa'],
          ].map(([v, l]) => (
            <div key={l} class={h.tile}>
              <span class={h.tileValue}>{v}</span>
              <span class={h.foot}>{l}</span>
            </div>
          ))}
        </div>
        {cambiaEnDescanso(r) && (
          <ChoiceSegmented<TipoDia>
            name="version-receta"
            legend="Versión"
            options={TIPOS_DIA.map((x) => ({ value: x.id, label: x.nombre }))}
            value={t}
            onChange={setTipo}
          />
        )}
        <section aria-labelledby="ingredientes">
          <div class={styles.head}>
            <h2 id="ingredientes" class={styles.title}>
              Ingredientes
            </h2>
            <span class={styles.stepper}>
              <button
                type="button"
                aria-label="Menos raciones"
                disabled={raciones <= 1}
                onClick={() => setRaciones((n) => Math.max(1, n - 1))}
              >
                <MinusIcon />
              </button>
              <span>
                {raciones} {raciones === 1 ? 'ración' : 'raciones'}
              </span>
              <button
                type="button"
                aria-label="Más raciones"
                onClick={() => setRaciones((n) => Math.min(12, n + 1))}
              >
                <PlusIcon />
              </button>
            </span>
          </div>
          {delDia.lista.length ? (
            <ul class={styles.list}>
              {delDia.lista.map((i, k) => {
                const otra = i.gramos && i.gramos.entreno !== i.gramos.descanso
                return (
                  <li key={`${i.nombre}-${k}`}>
                    <button
                      type="button"
                      class={styles.row}
                      disabled={!i.g || !i.alimentoId}
                      onClick={() => {
                        setCual(k)
                        cambio.show()
                      }}
                    >
                      <span class={styles.rowText}>
                        <span class={styles.name}>{i.nombre}</span>
                        <span class={h.foot}>
                          {i.g
                            ? `${formatInt(i.macros.kcal)} kcal · ${formatDecimal(i.macros.protein)} g prot.`
                            : i.nota || 'Al gusto'}
                          {otra && i.gramos
                            ? ` · ${t === 'entreno' ? `en descanso, ${formatInt(i.gramos.descanso * raciones)} g` : `en entreno, ${formatInt(i.gramos.entreno * raciones)} g`}`
                            : ''}
                        </span>
                      </span>
                      {i.g !== null && <b class={styles.grams}>{formatInt(i.g)} g</b>}
                      {i.g !== null && i.alimentoId && <ChevronRightIcon />}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p class={h.sub}>Aún no tiene ingredientes: ponlos en «Editar».</p>
          )}
          <p class={h.foot}>
            {raciones === 1
              ? 'Una ración. Sube las raciones para cocinar para varios días o para más gente.'
              : `Para ${raciones} raciones.`}{' '}
            Toca un ingrediente para cambiarlo por otro equivalente.
          </p>
        </section>
        {r.pasos.length > 0 && (
          <section aria-labelledby="preparacion">
            <h2 id="preparacion" class={styles.title}>
              Preparación
            </h2>
            <ol class={styles.steps}>
              {r.pasos.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
          </section>
        )}
        {r.notas.length > 0 && (
          <section aria-labelledby="notas">
            <h2 id="notas" class={styles.title}>
              Notas
            </h2>
            <ul class={styles.steps}>
              {r.notas.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <div class={styles.bottom}>
        <Button variant={ya ? 'secondary' : 'primary'} onClick={() => void apuntar()}>
          {ya ? `Apuntada ${cuando} · quitar` : `Apuntar ${cuando}`}
        </Button>
      </div>
      {editar.open && (
        <EditarRecetaHoja receta={r} tipo={t} onTipo={setTipo} onClose={editar.close} avisar={avisar} />
      )}
      {cambio.open && cual !== null && delDia.lista[cual] && (
        <IntercambioHoja
          receta={r}
          delDia={delDia}
          indice={cual}
          raciones={raciones}
          fecha={fecha}
          onClose={cambio.close}
          avisar={avisar}
        />
      )}
      <Toast message={aviso?.texto ?? null} action={aviso?.accion ?? null} />
    </div>
  )
}
