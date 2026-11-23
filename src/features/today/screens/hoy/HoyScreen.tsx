import { useEffect, useRef, useState } from 'preact/hooks'
import { formatLongDate, localDate } from '../../../../shared/lib/format.ts'
import { desdeHoy, paths } from '../../../../shared/lib/paths.ts'
import { CompactBar } from '../../../../shared/ui/CompactBar.tsx'
import { MoonIcon } from '../../../../shared/ui/icons.tsx'
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { useHoyDeComida } from '../../../nutrition/paraHoy.ts'
import { useHoyDeProgreso } from '../../../progress/paraHoy.ts'
import { useHoyDeEntreno } from '../../../training/paraHoy.ts'
import { Propuestas } from '../../components/Propuestas.tsx'
import { RecordsHoy } from '../../components/RecordsHoy.tsx'
import { Tareas } from '../../components/Tareas.tsx'
import { TuDia } from '../../components/TuDia.tsx'
import { cuenta, fraseQueda, repartir } from '../../state/dia.ts'
import { marcadas } from '../../state/marcadas.ts'
import { cargarMarcadas, marcar } from '../../use-cases/marcadas.ts'
import styles from './Hoy.module.css'

/**
 * Hoy (propuesta 2, aprobada el 2026-11-13): solo «¿qué me queda por hacer hoy?». Arriba, tu día en una tarjeta negra con
 * un anillo partido en tantas piezas como cosas y tu racha; debajo, lo que queda (cada cosa lleva a su sitio o abre su
 * hoja) y lo hecho, tachado. Cada área da sus cosas por su index.ts; Hoy no calcula nada de ellas.
 */
export function HoyScreen() {
  const cabecera = useRef<HTMLDivElement>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(t)
  }, [aviso])
  useEffect(() => {
    void cargarMarcadas()
  }, [])
  const entreno = useHoyDeEntreno()
  const comida = useHoyDeComida(setAviso)
  const progreso = useHoyDeProgreso(setAviso)
  const hoy = localDate()
  const listo = entreno.listo && comida.listo && progreso.listo
  const { quedan, hechas } = repartir(
    [...entreno.tareas, ...comida.tareas, ...progreso.tareas],
    marcadas.value[hoy] ?? [],
  )
  const completo = listo && !quedan.length
  return (
    <>
      <CompactBar title="Hoy" watch={cabecera} />
      <div ref={cabecera}>
        <ScreenHeader title="Hoy" avatarHref={paths.profile} inline />
      </div>
      {listo && (
        <div class={styles.dia}>
          <TuDia
            fecha={formatLongDate(hoy)}
            total={cuenta([...quedan, ...hechas]).total}
            hechas={cuenta([...quedan, ...hechas]).hechas}
            queda={fraseQueda(quedan)}
            racha={entreno.racha}
            descansas={entreno.descansas}
            rachaSinColor={entreno.records.length > 0}
          />
          <RecordsHoy records={entreno.records} href={desdeHoy(paths.progressDay(hoy))} />
          <Propuestas propuestas={comida.propuestas} />
          <Tareas titulo="Te queda" tareas={quedan} onMarcar={(t) => void marcar(hoy, t.id)} />
          {completo && entreno.manana && (
            <section class={styles.manana} aria-labelledby="manana">
              <h2 id="manana" class={styles.titulo}>
                Mañana
              </h2>
              <p class={styles.mananaFila}>
                <span class={styles.luna} aria-hidden="true">
                  <MoonIcon />
                </span>
                {entreno.manana}
              </p>
            </section>
          )}
          <Tareas titulo="Hecho" tareas={hechas} onMarcar={(t) => void marcar(hoy, t.id)} />
          {progreso.proximo && (
            <button type="button" class={styles.proximo} onClick={progreso.abrirProximo}>
              Próximo: {progreso.proximo.toLowerCase()} · elegir día
            </button>
          )}
        </div>
      )}
      {comida.hojas}
      {progreso.hojas}
      <Toast message={aviso} />
    </>
  )
}
