import { useEffect, useRef, useState } from 'preact/hooks'
import { formatDecimal, formatInt, parseDecimal } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { COMIDAS, type Alimento, type ComidaId, type Macros } from '../../state/comida.ts'
import {
  buscarCodigo,
  encenderCamara,
  guardarProducto,
  leerCodigo,
  type Resultado,
} from '../../use-cases/scanner.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'
import styles from './Escaner.module.css'

type Props = {
  comida: ComidaId
  onClose: () => void
  /** Elegir la ración del producto (la misma hoja que al buscar). */
  onElegir: (a: Alimento) => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

const CAMPOS: { id: keyof Macros; nombre: string }[] = [
  { id: 'kcal', nombre: 'Kcal' },
  { id: 'protein', nombre: 'Proteína (g)' },
  { id: 'carbs', nombre: 'Hidratos (g)' },
  { id: 'fat', nombre: 'Grasa (g)' },
]

/**
 * Escanear: la cámara lee el código (o lo escribes), se busca en tus alimentos y en Open Food Facts, y se elige la ración.
 * Si no está o no trae los valores, se copian de la etiqueta una vez y se queda guardado con su código.
 */
export function EscanerHoja({ comida, onClose, onElegir, avisar }: Props) {
  const video = useRef<HTMLVideoElement>(null)
  const [camara, setCamara] = useState<'abriendo' | 'si' | 'no'>('abriendo')
  const [escrito, setEscrito] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [nombre, setNombre] = useState('')
  const [valores, setValores] = useState<Record<keyof Macros, string>>({
    kcal: '',
    protein: '',
    carbs: '',
    fat: '',
  })
  const al = COMIDAS.find((c) => c.id === comida)?.al ?? ''

  async function buscar(codigo: string) {
    setBuscando(true)
    const r = await buscarCodigo(codigo)
    setBuscando(false)
    setResultado(r)
    if (r.estado === 'sin-valores') setNombre(r.nombre)
  }

  // La cámara: un fotograma cada medio segundo hasta leer un código
  useEffect(() => {
    if (resultado || !video.current) return
    let apagar: (() => void) | null = null
    let vivo = true
    let reloj = 0
    void encenderCamara(video.current).then((off) => {
      if (!vivo) return off?.()
      apagar = off
      setCamara(off ? 'si' : 'no')
      if (!off) return
      const mirar = async () => {
        if (!vivo || !video.current) return
        const codigo = await leerCodigo(video.current)
        if (codigo && vivo) {
          apagar?.()
          apagar = null
          void buscar(codigo)
          return
        }
        reloj = window.setTimeout(() => void mirar(), 500)
      }
      void mirar()
    })
    return () => {
      vivo = false
      clearTimeout(reloj)
      apagar?.()
    }
  }, [resultado])

  async function guardarEtiqueta(codigo: string) {
    const n = Object.fromEntries(CAMPOS.map((c) => [c.id, parseDecimal(valores[c.id])])) as Record<
      keyof Macros,
      number | null
    >
    if (CAMPOS.some((c) => n[c.id] === null))
      return avisar('Copia los cuatro valores por 100 g de la etiqueta')
    const a = await guardarProducto(nombre, n as Macros, null, codigo)
    avisar(`${a.name}: guardado en Mis alimentos`)
    onElegir(a)
  }

  return (
    <Sheet title={`Escanear ${al}`} onClose={onClose} large>
      <div class={h.stack}>
        {!resultado && (
          <>
            <div class={styles.camera}>
              <video ref={video} class={styles.video} muted aria-label="Cámara" />
              <span class={styles.frame} aria-hidden="true" />
            </div>
            <p class={h.foot} aria-live="polite">
              {buscando
                ? 'Buscando el producto…'
                : camara === 'abriendo'
                  ? 'Abriendo la cámara…'
                  : camara === 'si'
                    ? 'Apunta al código de barras.'
                    : 'Sin cámara o sin permiso: escribe el código.'}
            </p>
            <div class={h.searchRow}>
              <label class={h.search}>
                <input
                  inputMode="numeric"
                  value={escrito}
                  placeholder="Escribe el código"
                  aria-label="Código de barras"
                  onInput={(e) => setEscrito(e.currentTarget.value)}
                />
              </label>
              <Button
                variant="secondary"
                disabled={escrito.replace(/\D/g, '').length < 8}
                onClick={() => void buscar(escrito)}
              >
                Buscar
              </Button>
            </div>
          </>
        )}

        {(resultado?.estado === 'tuyo' || resultado?.estado === 'encontrado') && (
          <Encontrado
            resultado={resultado}
            onElegir={async () => {
              if (resultado.estado === 'tuyo') return onElegir(resultado.alimento)
              const p = resultado.producto
              const a = await guardarProducto(
                [p.nombre, p.marca].filter(Boolean).join(' · '),
                p.por100,
                p.racionG,
                resultado.codigo,
              )
              onElegir(a)
            }}
          />
        )}

        {resultado && resultado.estado !== 'tuyo' && resultado.estado !== 'encontrado' && (
          <>
            <p class={h.sub}>
              {resultado.estado === 'sin-red'
                ? 'Sin internet no puedo buscarlo. Copia los valores de la etiqueta y se queda guardado.'
                : resultado.estado === 'sin-valores'
                  ? 'Está en Open Food Facts, pero sin los valores. Cópialos de la etiqueta (por 100 g):'
                  : 'No está en Open Food Facts. Copia los valores de la etiqueta (por 100 g) y se queda guardado:'}
            </p>
            <label class={h.field}>
              Nombre
              <input value={nombre} onInput={(e) => setNombre(e.currentTarget.value)} />
            </label>
            <div class={h.fields}>
              {CAMPOS.map((c) => (
                <label key={c.id} class={h.field}>
                  {c.nombre}
                  <input
                    inputMode="decimal"
                    value={valores[c.id]}
                    onInput={(e) => setValores({ ...valores, [c.id]: e.currentTarget.value })}
                  />
                </label>
              ))}
            </div>
            <p class={h.foot}>Código {resultado.codigo}</p>
            <Button onClick={() => void guardarEtiqueta(resultado.codigo)}>Guardar y elegir la ración</Button>
          </>
        )}

        {resultado && (
          <Button variant="secondary" onClick={() => setResultado(null)}>
            Escanear otro
          </Button>
        )}
      </div>
    </Sheet>
  )
}

function Encontrado({
  resultado,
  onElegir,
}: {
  resultado: Extract<Resultado, { estado: 'tuyo' | 'encontrado' }>
  onElegir: () => void
}) {
  const v =
    resultado.estado === 'tuyo'
      ? {
          kcal: resultado.alimento.kcal,
          protein: resultado.alimento.protein,
          carbs: resultado.alimento.carbs,
          fat: resultado.alimento.fat,
        }
      : resultado.producto.por100
  const titulo =
    resultado.estado === 'tuyo'
      ? resultado.alimento.name
      : [resultado.producto.nombre, resultado.producto.marca].filter(Boolean).join(' · ') || 'Producto'
  return (
    <>
      <p class={h.foot}>
        {resultado.estado === 'tuyo'
          ? resultado.deLaBase
            ? 'En la base de alimentos'
            : 'En Mis alimentos'
          : 'Encontrado en Open Food Facts'}{' '}
        · por 100 g
      </p>
      <h3 class={h.rowTitle}>{titulo}</h3>
      <div class={h.tiles}>
        {[
          [formatInt(v.kcal), 'kcal'],
          [formatDecimal(v.protein), 'proteína'],
          [formatDecimal(v.carbs), 'hidratos'],
          [formatDecimal(v.fat), 'grasa'],
        ].map(([n, l]) => (
          <div key={l} class={h.tile}>
            <span class={h.tileValue}>{n}</span>
            <span class={h.foot}>{l}</span>
          </div>
        ))}
      </div>
      <Button onClick={onElegir}>Elegir la ración</Button>
      {resultado.estado === 'encontrado' && (
        <p class={h.foot}>Se guarda en Mis alimentos con su código: la próxima vez no hace falta internet.</p>
      )}
    </>
  )
}
