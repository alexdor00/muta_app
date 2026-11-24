import { useEffect, useState } from 'preact/hooks'
import { daysBetween, formatInt, formatShortDate, localDate } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { copia } from '../../state/copia.ts'
import {
  abrirCopia,
  cargarCopia,
  guardarCopia,
  recuperarCopia,
  type CopiaLeida,
} from '../../use-cases/copia.ts'
import styles from './CopiaDeSeguridad.module.css'

/** «Hace 22 días», «hoy», «ayer». */
function hace(iso: string): string {
  const dias = daysBetween(localDate(new Date(iso)), localDate())
  return dias <= 0 ? 'hoy' : dias === 1 ? 'ayer' : `hace ${formatInt(dias)} días`
}

/**
 * Tu copia de seguridad (usuario, 2026-11-24; `Desktop/MUTA-Copia-de-seguridad-propuesta.png`): cuándo fue la última,
 * «Guardar copia» (un archivo por el menú de compartir) y «Recuperar una copia» (enseña qué trae y pregunta antes). Sale en
 * Perfil y en la pantalla de error, por si algo falla.
 */
export function CopiaDeSeguridad({ avisar }: { avisar: (texto: string) => void }) {
  const [leida, setLeida] = useState<CopiaLeida | null>(null)
  const [ocupado, setOcupado] = useState(false)
  useEffect(() => void cargarCopia(), [])
  const ultima = copia.value?.ultima ?? null
  const vieja = !ultima || daysBetween(localDate(new Date(ultima)), localDate()) >= 30

  async function guardar() {
    setOcupado(true)
    const r = await guardarCopia()
    setOcupado(false)
    if (r === 'guardada') avisar('Copia guardada')
    else if (r === 'error') avisar('No se pudo guardar la copia: inténtalo otra vez')
  }

  async function elegir(archivo: File | undefined) {
    if (!archivo) return
    const r = await abrirCopia(archivo)
    if ('error' in r) avisar(r.error)
    else setLeida(r)
  }

  async function recuperar() {
    if (!leida) return
    setOcupado(true)
    if (await recuperarCopia(leida.copia)) window.location.assign('/')
    else {
      setOcupado(false)
      avisar('No se pudo recuperar: tus datos siguen como estaban')
    }
  }

  return (
    <section class={styles.card} aria-labelledby="copia">
      <h2 id="copia" class={styles.titulo}>
        Copia de seguridad
      </h2>
      <p class={`${styles.estado} ${vieja ? styles.aviso : ''}`}>
        {ultima
          ? `Última copia: ${formatShortDate(localDate(new Date(ultima)))} · ${hace(ultima)}`
          : 'Aún no has guardado ninguna'}
      </p>
      <p class={styles.texto}>
        Todo lo tuyo vive solo en este móvil. Guarda la copia fuera (iCloud, Drive, WhatsApp…) para no
        perderlo si cambias de móvil o algo falla.
      </p>
      <div class={styles.botones}>
        <Button onClick={() => void guardar()} disabled={ocupado}>
          Guardar copia
        </Button>
        <label class={styles.recuperar}>
          Recuperar una copia
          <input
            type="file"
            accept="application/json,.json"
            class={styles.archivo}
            onChange={(e) => {
              const input = e.currentTarget
              void elegir(input.files?.[0]).then(() => (input.value = ''))
            }}
          />
        </label>
      </div>
      {leida && (
        <Sheet title="¿Recuperar esta copia?" onClose={() => setLeida(null)} large>
          <ul class={styles.lista} aria-label="Lo que trae">
            <li>
              Hecha el<b>{formatShortDate(localDate(new Date(leida.resumen.fecha)))}</b>
            </li>
            <li>
              Entrenos<b>{formatInt(leida.resumen.entrenos)}</b>
            </li>
            <li>
              Días de comida<b>{formatInt(leida.resumen.dias)}</b>
            </li>
            <li>
              Fotos<b>{formatInt(leida.resumen.fotos)}</b>
            </li>
          </ul>
          <p class={styles.avisoCaja}>
            Lo que hay ahora en este móvil se sustituye por la copia. Antes, MUTA guarda aparte lo de ahora.
          </p>
          <div class={styles.botones}>
            <Button onClick={() => void recuperar()} disabled={ocupado}>
              Recuperar
            </Button>
            <Button variant="secondary" onClick={() => setLeida(null)}>
              Cancelar
            </Button>
          </div>
        </Sheet>
      )}
    </section>
  )
}
