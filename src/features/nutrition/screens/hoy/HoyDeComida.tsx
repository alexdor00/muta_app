import { useEffect, useState } from 'preact/hooks'
import { addDays, formatDecimal } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import { estado, hoy, pesajes, serie } from '../../state/comida.ts'
import { estadoRecetas, menu, type Cocinado } from '../../state/recetas.ts'
import { cargarComida } from '../../use-cases/nutritionStore.ts'
import { cargarRecetas } from '../../use-cases/recipes.ts'
import { CocinarHoja } from '../comida/CocinarHoja.tsx'
import { LoDeHoy } from '../comida/LoDeHoy.tsx'
import { PesoHoja } from '../comida/PesoHoja.tsx'
import { useAviso } from '../comun/useAviso.ts'
import styles from './Hoy.module.css'

/**
 * Lo de Comida en la pestaña Hoy: tu peso (pésate al levantarte: lo miran el entrenador y la consulta) y lo de hoy con
 * hora (la compra y lo que cocinas). El resto de Hoy tendrá su propio diseño.
 */
export function HoyDeComida() {
  useEffect(() => {
    void cargarComida().then(cargarRecetas)
  }, [])
  const peso = useSheet('peso')
  const cocinar = useSheet('cocinar')
  const [cocinado, setCocinado] = useState<Cocinado | null>(null)
  const { aviso, avisar } = useAviso()
  if (estado.value === 'cargando') return null
  const deHoy = pesajes.value.find((p) => p.date === hoy.value)
  const puntos = serie.value
  const ahora = puntos.at(-1)
  const antes = [...puntos].reverse().find((p) => p.date <= addDays(hoy.value, -7))
  const cambio = ahora && antes ? Math.round((ahora.tendencia - antes.tendencia) * 10) / 10 : null
  return (
    <div class={styles.stack}>
      <section class={styles.peso} aria-labelledby="tu-peso">
        <div class={styles.pesoTexto}>
          <h2 id="tu-peso" class={styles.eyebrow}>
            {deHoy ? 'Tu peso · hoy' : 'Tu peso'}
          </h2>
          {deHoy ? (
            <p class={styles.cifra}>
              <b class={styles.kg}>{formatDecimal(deHoy.kg)}</b>
              <span class={styles.sub}>
                kg
                {cambio !== null
                  ? ` · ${cambio > 0 ? '+' : cambio < 0 ? '−' : ''}${formatDecimal(Math.abs(cambio))} esta semana`
                  : ''}
              </span>
            </p>
          ) : (
            <>
              <p class={styles.titulo}>Pésate al levantarte</p>
              <p class={styles.sub}>Lo mira el entrenador cada semana</p>
            </>
          )}
        </div>
        {deHoy ? (
          <button type="button" class={styles.cambiar} onClick={peso.show}>
            Cambiar
          </button>
        ) : (
          <span class={styles.boton}>
            <Button onClick={peso.show}>+ Pesarme</Button>
          </span>
        )}
      </section>
      {estadoRecetas.value === 'listo' && (
        <LoDeHoy
          onCocinado={(id) => {
            const c = menu.value.cocinados.find((x) => x.id === id)
            if (!c) return
            setCocinado(c)
            cocinar.show()
          }}
        />
      )}
      {peso.open && <PesoHoja onClose={peso.close} avisar={avisar} />}
      {cocinar.open && cocinado && (
        <CocinarHoja cocinado={cocinado} onClose={cocinar.close} avisar={avisar} />
      )}
      <Toast message={aviso?.texto ?? null} action={aviso?.accion ?? null} />
    </div>
  )
}
