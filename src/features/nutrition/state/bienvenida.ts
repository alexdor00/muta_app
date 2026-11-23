import { signal } from '@preact/signals'
import type { Cuerpo } from '../domain/targets.ts'

/** Tus datos mientras recorres los pasos de comida de la bienvenida (se guardan al aceptar tu objetivo). */
export const datosBienvenida = signal<{ cuerpo: Cuerpo; pasos: number } | null>(null)
