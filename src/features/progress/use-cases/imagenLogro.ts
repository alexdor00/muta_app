// La imagen de tu logro o tu premio (usuario, 2026-11-24: «que te den ganas de subirlo a Instagram»): 1080 × 1920, siempre
// oscura como la de compartir una sesión; tus fotos arriba, grandes (una, o tu antes y después lado a lado); debajo, el
// titular y las cifras centradas en la letra de MUTA (sin la estrecha). Compartir o guardar en Fotos.
import { platform } from '../../../shared/platform/index.ts'
import type { DatosLogro } from './logros.ts'

const ANCHO = 1080
const ALTO = 1920
const ALTO_FOTO = 1150
const MARGEN = 64
const SISTEMA = '-apple-system, BlinkMacSystemFont, Roboto, "Segoe UI", sans-serif'
// Los del tema oscuro (tokens.css); el verde y el naranja, los de mejora y logro
const COLOR = {
  fondo: '#0a0a0c',
  texto: '#f2f2f7',
  gris: '#a1a1a8',
  caja: 'rgba(255,255,255,0.08)',
  borde: 'rgba(255,255,255,0.10)',
  mejora: '#5fd38a',
  logro: '#ff7a1a',
}

function cargarImagen(url: string): Promise<HTMLImageElement | null> {
  return new Promise((ok) => {
    const img = new Image()
    img.onload = () => ok(img)
    img.onerror = () => ok(null)
    img.src = url
  })
}

/** Pinta una foto llenando su hueco sin deformarla (como `object-fit: cover`), con la parte de arriba a la vista. */
function cubrir(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const escala = Math.max(w / img.width, h / img.height)
  const [sw, sh] = [w / escala, h / escala]
  const sx = (img.width - sw) / 2
  const sy = Math.max(0, (img.height - sh) * 0.2)
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

function caja(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

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

function recortar(ctx: CanvasRenderingContext2D, texto: string, ancho: number): string {
  if (ctx.measureText(texto).width <= ancho) return texto
  let t = texto
  while (t.length > 1 && ctx.measureText(`${t}…`).width > ancho) t = t.slice(0, -1)
  return `${t.trimEnd()}…`
}

/** Dibuja la imagen y la devuelve como PNG. */
export async function dibujarLogro(d: DatosLogro): Promise<Blob> {
  const canvas = Object.assign(document.createElement('canvas'), { width: ANCHO, height: ALTO })
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Sin canvas 2D')
  ctx.fillStyle = COLOR.fondo
  ctx.fillRect(0, 0, ANCHO, ALTO)

  // Las fotos: una a todo lo ancho o dos lado a lado (tu antes y después)
  const imgs = (await Promise.all(d.fotos.map((f) => cargarImagen(f.url)))).filter(
    (x): x is HTMLImageElement => x !== null,
  )
  const hueco = 8
  const ancho = imgs.length === 2 ? (ANCHO - hueco) / 2 : ANCHO
  imgs.forEach((img, i) => cubrir(ctx, img, i * (ancho + hueco), 0, ancho, ALTO_FOTO))
  // Arriba, una sombra para leer «MUTA»; abajo, la foto se funde con el fondo
  const arriba = ctx.createLinearGradient(0, 0, 0, 260)
  arriba.addColorStop(0, 'rgba(0,0,0,0.55)')
  arriba.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = arriba
  ctx.fillRect(0, 0, ANCHO, 260)
  const abajo = ctx.createLinearGradient(0, ALTO_FOTO - 360, 0, ALTO_FOTO)
  abajo.addColorStop(0, 'rgba(10,10,12,0)')
  abajo.addColorStop(1, COLOR.fondo)
  ctx.fillStyle = abajo
  ctx.fillRect(0, ALTO_FOTO - 360, ANCHO, 360)

  // Las fechas de tu antes y después, sobre cada foto
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  d.fotos.forEach((f, i) => {
    if (!f.etiqueta || imgs.length !== 2) return
    ctx.font = `700 30px ${SISTEMA}`
    const w = ctx.measureText(f.etiqueta).width + 44
    const cx = i * (ancho + hueco) + ancho / 2
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    caja(ctx, cx - w / 2, ALTO_FOTO - 250, w, 58, 29)
    ctx.fill()
    ctx.fillStyle = COLOR.texto
    ctx.fillText(f.etiqueta, cx, ALTO_FOTO - 221)
  })

  // MUTA y la etiqueta (en naranja si es tu premio: es un logro)
  ctx.textAlign = 'left'
  ctx.font = `800 34px ${SISTEMA}`
  ctx.fillStyle = COLOR.texto
  ctx.fillText('M U T A', MARGEN, 92)
  ctx.font = `700 28px ${SISTEMA}`
  const etiqueta = d.etiqueta.toUpperCase()
  const we = ctx.measureText(etiqueta).width + 44
  ctx.fillStyle = d.premio ? COLOR.logro : 'rgba(255,255,255,0.18)'
  caja(ctx, ANCHO - MARGEN - we, 62, we, 60, 30)
  ctx.fill()
  ctx.fillStyle = d.premio ? '#111111' : COLOR.texto
  ctx.textAlign = 'center'
  ctx.fillText(etiqueta, ANCHO - MARGEN - we / 2, 93)

  // El titular y su línea
  let y = ALTO_FOTO + 30
  ctx.fillStyle = COLOR.texto
  ctx.font = `800 64px ${SISTEMA}`
  ctx.fillText(recortar(ctx, d.titulo, ANCHO - 2 * MARGEN), ANCHO / 2, y)
  y += 64
  ctx.fillStyle = COLOR.gris
  ctx.font = `400 32px ${SISTEMA}`
  ctx.fillText(recortar(ctx, d.sub, ANCHO - 2 * MARGEN), ANCHO / 2, y)
  if (d.destacado) {
    // Tu ejercicio estrella: su etiqueta pequeña y, debajo, el ejercicio con sus kilos (en dos líneas si no cabe)
    y += 62
    ctx.fillStyle = COLOR.mejora
    ctx.font = `700 24px ${SISTEMA}`
    ctx.fillText('TU EJERCICIO ESTRELLA', ANCHO / 2, y)
    ctx.fillStyle = COLOR.texto
    ctx.font = `600 34px ${SISTEMA}`
    for (const l of lineas(ctx, d.destacado, ANCHO - 2 * MARGEN).slice(0, 2)) {
      y += 46
      ctx.fillText(l, ANCHO / 2, y)
    }
  }

  // Las cifras: tres por fila, centradas
  y += 56
  const cols = 3
  const gap = 20
  const w = (ANCHO - 2 * MARGEN - gap * (cols - 1)) / cols
  const h = 170
  d.cifras.forEach((c, i) => {
    const [fila, col] = [Math.floor(i / cols), i % cols]
    // La última fila, si no está llena, centrada
    const enFila = Math.min(cols, d.cifras.length - fila * cols)
    const x = MARGEN + ((cols - enFila) * (w + gap)) / 2 + col * (w + gap)
    const top = y + fila * (h + gap)
    ctx.fillStyle = COLOR.caja
    caja(ctx, x, top, w, h, 32)
    ctx.fill()
    ctx.strokeStyle = COLOR.borde
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = c.tono === 'mejora' ? COLOR.mejora : c.tono === 'logro' ? COLOR.logro : COLOR.texto
    // Una cifra larga («15,5 → 13,9 %») baja de tamaño hasta caber, en vez de cortarse
    let tam = 50
    do {
      ctx.font = `italic 600 ${tam}px ${SISTEMA}`
      tam -= 2
    } while (tam >= 32 && ctx.measureText(c.valor).width > w - 28)
    ctx.fillText(recortar(ctx, c.valor, w - 24), x + w / 2, top + 72)
    ctx.fillStyle = COLOR.gris
    ctx.font = `400 28px ${SISTEMA}`
    ctx.fillText(recortar(ctx, c.nombre, w - 24), x + w / 2, top + 124)
  })

  // Lo pequeño, abajo
  ctx.fillStyle = COLOR.gris
  ctx.font = `400 28px ${SISTEMA}`
  ctx.fillText(recortar(ctx, d.linea, ANCHO - 2 * MARGEN), ANCHO / 2, ALTO - 70)

  return new Promise((ok, ko) => canvas.toBlob((b) => (b ? ok(b) : ko(new Error('Sin imagen'))), 'image/png'))
}

const nombre = (d: DatosLogro) => `muta-${d.premio ? 'premio' : 'logro'}.png`

/** Abre el menú de compartir del móvil con la imagen (ahí están Instagram, WhatsApp, «Guardar imagen»…). */
export async function compartirLogro(d: DatosLogro, imagen: Blob): Promise<'shared' | 'saved' | 'none'> {
  return platform.shareFile(d.titulo, new File([imagen], nombre(d), { type: 'image/png' }))
}

/** La descarga (en el móvil, a Fotos o a Archivos). */
export async function guardarLogro(d: DatosLogro, imagen: Blob): Promise<void> {
  await platform.saveFile(nombre(d), imagen)
}
