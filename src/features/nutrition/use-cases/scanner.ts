// El escáner: lee un código de barras de la cámara (lector zxing, MIT, que va con la app: se descarga aparte la primera
// vez), lo busca primero en tus alimentos, después en la base (con los productos de supermercado) y por último en Open Food
// Facts (necesita internet) y lo guarda en «Mis alimentos»
// con su código, para que la próxima vez salga sin internet. Regla del prototipo (js/comida/productos-super.js).
import { logError } from '../../../shared/lib/logger.ts'
import { platform } from '../../../shared/platform/index.ts'
import { mismoCodigo, productoDeOff, variantesDeCodigo, type Producto } from '../domain/barcode.ts'
import type { Alimento, Macros } from '../domain/food.ts'
import { propios } from '../state/comida.ts'
import { cargarSupermercados, crearAlimento } from './foodLog.ts'

const FORMATOS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] as const
const OFF = 'https://world.openfoodfacts.org/api/v2/product'
const CAMPOS = 'product_name,product_name_es,brands,nutriments,serving_quantity'

type Lector = { detect: (imagen: ImageBitmapSource) => Promise<{ rawValue: string }[]> }
let lector: Promise<Lector> | null = null

/** El lector de códigos, con su .wasm servido por la app (nunca desde un CDN). */
function elLector(): Promise<Lector> {
  lector ??= Promise.all([
    import('barcode-detector/ponyfill'),
    import('zxing-wasm/reader/zxing_reader.wasm?url'),
  ]).then(([{ BarcodeDetector, prepareZXingModule }, { default: wasm }]) => {
    prepareZXingModule({
      overrides: {
        locateFile: (ruta: string, prefijo: string) => (ruta.endsWith('.wasm') ? wasm : prefijo + ruta),
      },
    })
    return new BarcodeDetector({ formats: [...FORMATOS] })
  })
  lector.catch(() => (lector = null))
  return lector
}

/** Enciende la cámara de atrás en un <video>; devuelve cómo apagarla (null sin cámara o sin permiso). */
export function encenderCamara(video: HTMLVideoElement): Promise<(() => void) | null> {
  return platform.startCamera(video)
}

/** El código que se ve en la imagen (un fotograma de la cámara), o null si no hay ninguno. */
export async function leerCodigo(imagen: ImageBitmapSource): Promise<string | null> {
  try {
    const [primero] = await (await elLector()).detect(imagen)
    return primero?.rawValue ?? null
  } catch (error) {
    logError(error, 'leer un código de barras')
    return null
  }
}

export type Resultado =
  | { estado: 'tuyo'; codigo: string; alimento: Alimento; deLaBase?: boolean }
  | { estado: 'encontrado'; codigo: string; producto: Producto & { por100: Macros } }
  | { estado: 'sin-valores'; codigo: string; nombre: string }
  | { estado: 'no-esta'; codigo: string }
  | { estado: 'sin-red'; codigo: string }

/** Busca un código: en tus alimentos, en la base y, si no está, en Open Food Facts (con sus variantes EAN/UPC). */
export async function buscarCodigo(codigo: string): Promise<Resultado> {
  const c = codigo.replace(/\D/g, '')
  const tuyo = propios.value.find((a) => mismoCodigo(a.codigo, c))
  if (tuyo) return { estado: 'tuyo', codigo: c, alimento: tuyo }
  const enBase = (await cargarSupermercados()).find((a) => mismoCodigo(a.codigo, c))
  if (enBase) return { estado: 'tuyo', codigo: c, alimento: enBase, deLaBase: true }
  try {
    let sinValores: string | null = null
    for (const v of variantesDeCodigo(c)) {
      const res = await fetch(`${OFF}/${v}.json?fields=${CAMPOS}`)
      if (!res.ok) continue
      const p = productoDeOff(await res.json())
      if (p?.por100) return { estado: 'encontrado', codigo: c, producto: { ...p, por100: p.por100 } }
      if (p) sinValores = p.nombre
    }
    return sinValores !== null
      ? { estado: 'sin-valores', codigo: c, nombre: sinValores }
      : { estado: 'no-esta', codigo: c }
  } catch (error) {
    logError(error, 'buscar un código en Open Food Facts')
    return { estado: 'sin-red', codigo: c }
  }
}

/** Guarda un producto en «Mis alimentos» con su código (de Open Food Facts o copiado de la etiqueta). */
export function guardarProducto(
  nombre: string,
  por100: Macros,
  racionG: number | null,
  codigo: string,
): Promise<Alimento> {
  return crearAlimento({
    name: nombre.trim() || `Producto ${codigo}`,
    ...por100,
    servingG: racionG && racionG > 0 ? racionG : 100,
    servingLabel: racionG && racionG > 0 ? 'ración del envase' : '100 g',
    codigo,
  })
}
