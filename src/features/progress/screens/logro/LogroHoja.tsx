import { useEffect, useState } from 'preact/hooks'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { compartirLogro, dibujarLogro, guardarLogro } from '../../use-cases/imagenLogro.ts'
import {
  datosDe,
  marcarVisto,
  opcionesDeFoto,
  type DatosLogro,
  type OpcionFoto,
  type Pendiente,
} from '../../use-cases/logros.ts'
import styles from './LogroHoja.module.css'

type Props = { pendiente: Pendiente; onClose: () => void; avisar: (texto: string) => void }

/**
 * Tu logro o tu premio (usuario, 2026-11-24; `Desktop/MUTA-Logro-Instagram-propuesta.png` y
 * `Desktop/MUTA-Premio-objetivo-propuesta.png`): la imagen tal cual se guarda, elegir la foto (la de una sesión o, en el
 * premio, tu antes y después de una postura) y «Compartir en Instagram», «Guardar en Fotos» o «Ahora no».
 */
export function LogroHoja({ pendiente, onClose, avisar }: Props) {
  const premio = pendiente.tipo === 'premio'
  const [opciones, setOpciones] = useState<OpcionFoto[] | null>(null)
  const [elegida, setElegida] = useState<string | null>(null)
  const [hecho, setHecho] = useState<{ datos: DatosLogro; imagen: Blob; url: string } | null>(null)
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    void opcionesDeFoto(pendiente.etapaId, premio).then((o) => {
      setOpciones(o)
      setElegida(o[0]?.id ?? null)
    })
  }, [pendiente.etapaId, premio])

  useEffect(() => {
    if (!opciones) return
    let vivo = true
    let url: string | null = null
    const foto = opciones.find((o) => o.id === elegida) ?? null
    void datosDe(pendiente, foto)
      .then(async (datos) => {
        if (!datos || !vivo) return
        const imagen = await dibujarLogro(datos)
        url = URL.createObjectURL(imagen)
        if (vivo) setHecho({ datos, imagen, url })
      })
      .catch(() => avisar('No se pudo hacer la imagen'))
    return () => {
      vivo = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [opciones, elegida, pendiente, avisar])

  const cerrar = () => {
    void marcarVisto(pendiente)
    onClose()
  }
  async function compartir() {
    if (!hecho) return
    setOcupado(true)
    const r = await compartirLogro(hecho.datos, hecho.imagen)
    setOcupado(false)
    if (r === 'saved') avisar('Imagen guardada')
    if (r !== 'none') void marcarVisto(pendiente)
  }
  async function guardar() {
    if (!hecho) return
    await guardarLogro(hecho.datos, hecho.imagen)
    avisar('Imagen guardada')
    void marcarVisto(pendiente)
  }

  return (
    <Sheet title={premio ? 'Tu premio' : 'Tu logro'} onClose={cerrar} large>
      <div class={styles.hoja}>
        {hecho ? (
          <img class={styles.imagen} src={hecho.url} alt={`${hecho.datos.etiqueta}: ${hecho.datos.titulo}`} />
        ) : (
          <div class={styles.imagen} aria-busy="true" />
        )}
        {opciones && opciones.length > 1 && (
          <fieldset class={styles.fotos}>
            <legend class={styles.leyenda}>Elige la foto</legend>
            {opciones.map((o) => (
              <button
                key={o.id}
                type="button"
                class={`${styles.foto} ${o.id === elegida ? styles.elegida : ''}`}
                aria-pressed={o.id === elegida}
                aria-label={o.urls.length === 2 ? `Antes y después: ${o.nombre}` : `Foto de ${o.nombre}`}
                onClick={() => setElegida(o.id)}
              >
                {(o.minis ?? o.urls).map((u) => (
                  <span key={u} style={{ backgroundImage: `url("${u}")` }} />
                ))}
              </button>
            ))}
          </fieldset>
        )}
        <div class={styles.botones}>
          <Button onClick={() => void compartir()} disabled={!hecho || ocupado}>
            Compartir en Instagram
          </Button>
          <Button variant="secondary" onClick={() => void guardar()} disabled={!hecho}>
            Guardar en Fotos
          </Button>
          <button type="button" class={styles.ahoraNo} onClick={cerrar}>
            Ahora no
          </button>
        </div>
      </div>
    </Sheet>
  )
}
