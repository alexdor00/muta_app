import { useEffect, useState } from 'preact/hooks'
import { formatDecimal, parseDecimal } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { CameraIcon, ChevronRightIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import {
  ajustesCuerpo,
  diasDelMes,
  fotos,
  fotosPorMes,
  hoy,
  LIMITES_CM,
  medidas,
  PERIMETROS,
  POSES,
  resumen,
  type PerimetroId,
  type Pose,
} from '../../state/progreso.ts'
import { apuntarMedidas, elegirDiaMedidas, guardarFotos } from '../../use-cases/progress.ts'
import { CamaraGuia } from './CamaraGuia.tsx'
import styles from './Progreso.module.css'

type Props = { onClose: () => void; avisar: (texto: string) => void }

/**
 * Tus medidas y tus fotos del mes, juntas (una vez al mes): las siete medidas en cm y frente, perfil y espalda. Lo que
 * dejes en blanco no se guarda; se guarda en tu mes y lo ves en «Tus meses».
 */
export function MesHoja({ onClose, avisar }: Props) {
  const deHoy = medidas.value.find((m) => m.date === hoy.value)
  const [textos, setTextos] = useState<Partial<Record<PerimetroId, string>>>(() =>
    Object.fromEntries(PERIMETROS.map((p) => [p.id, deHoy?.[p.id] ? formatDecimal(deHoy[p.id] ?? 0) : ''])),
  )
  const yaHoy = Object.fromEntries(
    fotos.value.filter((f) => f.date === hoy.value).map((f) => [f.pose, f.url]),
  ) as Partial<Record<Pose, string>>
  const [elegidas, setElegidas] = useState<Partial<Record<Pose, Blob>>>({})
  const [vistas, setVistas] = useState<Partial<Record<Pose, string>>>({})
  const [guardando, setGuardando] = useState(false)
  const [camara, setCamara] = useState(false)
  // La guía de la cámara: tu última foto de cada postura de antes de este mes
  const guias = Object.fromEntries(
    POSES.flatMap((p) => {
      const ultima = fotosPorMes(fotos.value, p.id)
        .filter((x) => x.mes < hoy.value.slice(0, 7))
        .at(-1)
      return ultima ? [[p.id, ultima.foto.url]] : []
    }),
  ) as Partial<Record<Pose, string>>
  const elegir = (pose: Pose, archivo: Blob) => {
    setElegidas((x) => ({ ...x, [pose]: archivo }))
    setVistas((x) => ({ ...x, [pose]: URL.createObjectURL(archivo) }))
  }
  useEffect(() => () => Object.values(vistas).forEach((u) => URL.revokeObjectURL(u)), [vistas])

  // Tu día del mes, escrito a mano: del 1 al último día de este mes (en un mes más corto, su último día)
  const maxDia = diasDelMes(hoy.value.slice(0, 7))
  const guardado = ajustesCuerpo.value.diaMedidas
  const [diaTexto, setDiaTexto] = useState(guardado ? String(guardado) : '')
  function guardarDia() {
    const n = diaTexto ? Number(diaTexto) : null
    if (n !== null && (n < 1 || n > maxDia)) {
      setDiaTexto(guardado ? String(guardado) : '')
      return avisar(`Escribe un día del 1 al ${maxDia}`)
    }
    if (n !== guardado) void elegirDiaMedidas(n)
  }

  async function guardar() {
    const cm: Partial<Record<PerimetroId, number>> = {}
    for (const p of PERIMETROS) {
      const texto = textos[p.id] ?? ''
      if (!texto.trim()) continue
      const n = parseDecimal(texto)
      if (n === null || n < LIMITES_CM.min || n > LIMITES_CM.max)
        return avisar(`${p.nombre}: escribe los cm (entre ${LIMITES_CM.min} y ${LIMITES_CM.max})`)
      cm[p.id] = Math.round(n * 10) / 10
    }
    const hayMedidas = Object.keys(cm).length > 0
    const hayFotos = Object.keys(elegidas).length > 0
    if (!hayMedidas && !hayFotos) return avisar('Escribe una medida o elige una foto')
    setGuardando(true)
    if (hayMedidas) await apuntarMedidas(cm)
    const ok = hayFotos ? await guardarFotos(elegidas) : true
    setGuardando(false)
    if (!ok) return avisar('No se pudieron guardar las fotos: prueba con otras')
    onClose()
    avisar(
      hayMedidas && hayFotos
        ? 'Medidas y fotos guardadas'
        : hayMedidas
          ? 'Medidas apuntadas'
          : 'Fotos guardadas',
    )
  }

  return (
    <Sheet
      title="Medidas y fotos del mes"
      onClose={onClose}
      large
      footer={
        <Button onClick={() => void guardar()} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </Button>
      }
    >
      <div class={styles.hoja}>
        <label class={styles.campo}>
          <span>Cada mes, el día</span>
          <input
            inputMode="numeric"
            enterKeyHint="done"
            maxLength={2}
            aria-label={`Día del mes de tus medidas y fotos, del 1 al ${maxDia}`}
            value={diaTexto}
            placeholder="—"
            onInput={(e) => setDiaTexto(e.currentTarget.value.replace(/\D/g, ''))}
            onBlur={guardarDia}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
          {/* Sin unidad, pero con su hueco: el número queda alineado con los de las medidas */}
          <span class={styles.unidad} aria-hidden="true" />
        </label>
        <p class={styles.nota}>El día de cada mes en que te haces las fotos y las medidas.</p>
        <h3 class={styles.subtitulo}>Fotos</h3>
        <div class={styles.fotos}>
          {POSES.map((p) => {
            const vista = vistas[p.id] ?? yaHoy[p.id]
            return (
              <label key={p.id} class={`${styles.foto} ${styles.subir}`}>
                {vista ? <img src={vista} alt="" /> : <CameraIcon />}
                <span>{p.nombre}</span>
                <input
                  type="file"
                  accept="image/*"
                  aria-label={`Foto de ${p.nombre.toLowerCase()}`}
                  onChange={(e) => {
                    const archivo = e.currentTarget.files?.[0]
                    if (archivo) elegir(p.id, archivo)
                  }}
                />
              </label>
            )
          })}
        </div>
        <button type="button" class={styles.hacerFotos} onClick={() => setCamara(true)}>
          <span class={styles.hacerFotosIcono} aria-hidden="true">
            <CameraIcon />
          </span>
          <span class={styles.hacerFotosTexto}>
            <b>Hacer las fotos</b>
            <span>
              {Object.keys(guias).length
                ? 'Con la guía del mes pasado. '
                : 'Misma luz y distancia cada mes. '}
              Solo se guardan en este móvil.
            </span>
          </span>
          <ChevronRightIcon />
        </button>
        {camara && <CamaraGuia guias={guias} onFoto={elegir} onClose={() => setCamara(false)} />}
        <h3 class={styles.subtitulo}>Medidas (cm)</h3>
        {PERIMETROS.map((p) => {
          const ultima = resumen.value[p.id]
          return (
            <label key={p.id} class={styles.campo}>
              <span>{p.nombre}</span>
              <input
                inputMode="decimal"
                aria-label={`${p.nombre} en cm`}
                value={textos[p.id] ?? ''}
                placeholder={ultima ? formatDecimal(ultima.cm) : '—'}
                onInput={(e) => {
                  const valor = e.currentTarget.value
                  setTextos((t) => ({ ...t, [p.id]: valor }))
                }}
              />
              <span class={`${styles.nota} ${styles.unidad}`}>cm</span>
            </label>
          )
        })}
      </div>
    </Sheet>
  )
}
