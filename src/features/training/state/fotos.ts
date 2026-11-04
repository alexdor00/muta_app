// Tus fotos de las sesiones (A29–A30), listas para enseñar: sigla → dirección de la imagen en memoria. Las carga y guarda
// use-cases/sessionPhotos.ts.
import { signal } from '@preact/signals'

export const fotosSesion = signal<Record<string, string>>({})
