// Reducir una foto antes de guardarla (una del móvil pesa varios megas): la usan la foto de una sesión (Entreno) y tus
// fotos de progreso (Progreso). Solo en el navegador.

/** La imagen con su lado mayor en `lado` px como mucho y en JPEG; si no se puede reducir, la misma. */
export async function reducirImagen(archivo: Blob, lado: number): Promise<Blob> {
  const bmp = await createImageBitmap(archivo)
  const escala = Math.min(1, lado / Math.max(bmp.width, bmp.height))
  const lienzo = document.createElement('canvas')
  lienzo.width = Math.round(bmp.width * escala)
  lienzo.height = Math.round(bmp.height * escala)
  lienzo.getContext('2d')?.drawImage(bmp, 0, 0, lienzo.width, lienzo.height)
  bmp.close()
  return new Promise((ok) => lienzo.toBlob((b) => ok(b ?? archivo), 'image/jpeg', 0.85))
}
