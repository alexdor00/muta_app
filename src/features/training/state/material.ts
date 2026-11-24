// Los discos del gimnasio (la calculadora de discos de la sesión): los que no hay. «Tu material» se quitó (usuario,
// 2026-11-24); solo quedan los discos, que se encienden y apagan en la propia calculadora. Lo carga y guarda
// use-cases/myEquipment.ts.
import { signal } from '@preact/signals'

/** Los discos (kg) que no hay; la calculadora de discos de la sesión no los usa. */
export const discosQueFaltan = signal<number[]>([])
