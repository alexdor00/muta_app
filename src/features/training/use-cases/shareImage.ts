import { platform } from '../../../shared/platform/index.ts'
import { tarjetaCompartir, type TarjetaCompartir } from '../domain/shareCard.ts'

// La imagen es siempre oscura: los colores del tema oscuro de shared/ui/tokens.css (--bg, --surface, --label, --label-2,
// --separator). Un canvas no lee variables de CSS de otro tema.
const COLOR = { fondo: '#000000', arriba: '#1c1c1e', texto: '#f2f2f7', gris: '#aeaeb2', raya: '#38383a' }
const ANCHO = 1080
const ALTO = 1920
const MARGEN = 90
const CONDENSADA = '"Barlow Condensed", "Arial Narrow", sans-serif'
const SISTEMA = '-apple-system, BlinkMacSystemFont, Roboto, "Segoe UI", sans-serif'

/** Parte un texto en líneas que caben en `ancho` (por palabras). */
function lineas(ctx: CanvasRenderingContext2D, texto: string, ancho: number): string[] {
  const out: string[] = []
  for (const palabra of texto.split(/\s+/)) {
    const ultima = out.at(-1)
    if (ultima && ctx.measureText(`${ultima} ${palabra}`).width <= ancho)
      out[out.length - 1] = `${ultima} ${palabra}`
    else out.push(palabra)
  }
  return out
}

/** Recorta un texto con «…» para que quepa en `ancho`. */
function recortar(ctx: CanvasRenderingContext2D, texto: string, ancho: number): string {
  if (ctx.measureText(texto).width <= ancho) return texto
  let t = texto
  while (t.length > 1 && ctx.measureText(`${t}…`).width > ancho) t = t.slice(0, -1)
  return `${t.trimEnd()}…`
}

/** Dibuja la tarjeta (1080 × 1920, el tamaño de una historia) y la devuelve como PNG. */
async function dibujar(t: TarjetaCompartir): Promise<Blob> {
  await document.fonts?.load(`italic 900 100px ${CONDENSADA}`).catch(() => undefined)
  const canvas = Object.assign(document.createElement('canvas'), { width: ANCHO, height: ALTO })
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Sin canvas 2D')
  const degradado = ctx.createLinearGradient(0, 0, 0, ALTO)
  degradado.addColorStop(0, COLOR.arriba)
  degradado.addColorStop(0.6, COLOR.fondo)
  ctx.fillStyle = degradado
  ctx.fillRect(0, 0, ANCHO, ALTO)
  const ancho = ANCHO - 2 * MARGEN

  // Arriba: MUTA y la fecha
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = COLOR.texto
  ctx.font = `italic 900 72px ${CONDENSADA}`
  ctx.fillText('MUTA', MARGEN, 150)
  ctx.fillStyle = COLOR.gris
  ctx.font = `400 40px ${SISTEMA}`
  ctx.textAlign = 'right'
  ctx.fillText(t.fecha, ANCHO - MARGEN, 145)
  ctx.textAlign = 'left'

  // El nombre de la sesión, en grande: baja de tamaño hasta caber en tres líneas
  let tam = 200
  let partes: string[]
  do {
    ctx.font = `italic 900 ${tam}px ${CONDENSADA}`
    partes = lineas(ctx, t.nombre.toUpperCase(), ancho)
    tam -= 10
  } while (partes.length > 3 && tam > 90)
  const alto = (tam + 10) * 0.95
  // Sin récords, el bloque baja para no dejar la parte de abajo vacía
  const baja = t.tituloRecords ? 0 : 260
  const finNombre = 1180 + baja
  const inicio = finNombre - alto * (partes.length - 1)
  ctx.fillStyle = COLOR.gris
  ctx.font = `400 44px ${SISTEMA}`
  ctx.fillText(t.linea, MARGEN, inicio - alto - 10)
  ctx.fillStyle = COLOR.texto
  ctx.font = `italic 900 ${tam + 10}px ${CONDENSADA}`
  partes.forEach((p, i) => ctx.fillText(p, MARGEN, inicio + i * alto))

  // Las cifras en columnas
  const col = ancho / t.cifras.length
  t.cifras.forEach((c, i) => {
    const x = MARGEN + i * col
    ctx.fillStyle = COLOR.texto
    ctx.font = `italic 900 150px ${CONDENSADA}`
    ctx.fillText(c.valor, x, 1400 + baja)
    if (c.unidad) {
      const w = ctx.measureText(c.valor).width
      ctx.fillStyle = COLOR.gris
      ctx.font = `500 46px ${SISTEMA}`
      ctx.fillText(c.unidad, x + w + 12, 1400 + baja)
    }
    ctx.fillStyle = COLOR.gris
    ctx.font = `400 40px ${SISTEMA}`
    ctx.fillText(c.nombre, x, 1460 + baja)
  })

  // Los récords
  if (t.tituloRecords) {
    ctx.fillStyle = COLOR.raya
    ctx.fillRect(MARGEN, 1520, ancho, 2)
    ctx.fillStyle = COLOR.texto
    ctx.font = `italic 900 96px ${CONDENSADA}`
    ctx.fillText(t.tituloRecords.toUpperCase(), MARGEN, 1630)
    t.records.forEach((r, i) => {
      const y = 1720 + i * 72
      ctx.fillStyle = COLOR.gris
      ctx.font = `400 42px ${SISTEMA}`
      ctx.textAlign = 'right'
      ctx.fillText(r.detalle, ANCHO - MARGEN, y)
      const wDetalle = ctx.measureText(r.detalle).width
      ctx.textAlign = 'left'
      ctx.fillStyle = COLOR.texto
      ctx.font = `600 44px ${SISTEMA}`
      ctx.fillText(recortar(ctx, r.nombre, ancho - wDetalle - 40), MARGEN, y)
    })
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Sin imagen'))), 'image/png'),
  )
}

/** Comparte la imagen del resumen (o la guarda si el móvil no deja compartir archivos). */
export async function compartirImagen(datos: Parameters<typeof tarjetaCompartir>[0], archivo: string) {
  const t = tarjetaCompartir(datos)
  const blob = await dibujar(t)
  return platform.shareFile(t.nombre, new File([blob], archivo, { type: 'image/png' }))
}
