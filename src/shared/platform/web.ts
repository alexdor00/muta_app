import type { Haptic, Platform, Sound } from './platform.ts'

// Patrones de vibración (ms) para la tabla «Respuesta al tacto y sonido».
const VIBRATION: Record<Haptic, number | number[]> = {
  light: 10,
  medium: 25,
  success: [20, 60, 20, 60, 40],
  warning: [200, 100, 200, 100, 200],
  error: [60, 40, 60],
}

// Notas de cada sonido: [frecuencia Hz, inicio s, duración s].
const TONES: Record<Sound, [number, number, number][]> = {
  click: [[1800, 0, 0.03]],
  twoNotes: [
    [660, 0, 0.09],
    [880, 0.1, 0.12],
  ],
  risingThree: [
    [523, 0, 0.1],
    [659, 0.11, 0.1],
    [784, 0.22, 0.18],
  ],
  threeBeeps: [
    [880, 0, 0.15],
    [880, 0.3, 0.15],
    [880, 0.6, 0.25],
  ],
}

let audio: AudioContext | null = null
let wakeLock: WakeLockSentinel | null = null
let wantScreenOn = false

async function acquireWakeLock() {
  if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return
  try {
    wakeLock = await navigator.wakeLock.request('screen')
  } catch {
    // Batería baja o el navegador lo niega: la sesión sigue sin pantalla encendida.
  }
}

// El navegador suelta el wake lock al cambiar de app: se vuelve a pedir al volver.
document.addEventListener('visibilitychange', () => {
  if (wantScreenOn && document.visibilityState === 'visible') void acquireWakeLock()
})

export const webPlatform: Platform = {
  haptic(kind) {
    navigator.vibrate?.(VIBRATION[kind])
  },

  sound(kind) {
    try {
      audio ??= new AudioContext()
      const start = audio.currentTime
      for (const [freq, at, length] of TONES[kind]) {
        const osc = audio.createOscillator()
        const gain = audio.createGain()
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.0001, start + at)
        gain.gain.exponentialRampToValueAtTime(0.25, start + at + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + at + length)
        osc.connect(gain).connect(audio.destination)
        osc.start(start + at)
        osc.stop(start + at + length + 0.02)
      }
    } catch {
      // Sin audio disponible: el aviso visual sigue funcionando.
    }
  },

  async keepScreenOn(on) {
    wantScreenOn = on
    if (on) await acquireWakeLock()
    else {
      await wakeLock?.release()
      wakeLock = null
    }
  },

  async notify(title, body) {
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') await Notification.requestPermission()
    if (Notification.permission !== 'granted') return
    const registration = await navigator.serviceWorker?.getRegistration()
    if (registration) await registration.showNotification(title, { body, tag: 'muta' })
    else new Notification(title, { body, tag: 'muta' })
  },

  async saveFile(fileName, contents) {
    const url = URL.createObjectURL(contents)
    const link = Object.assign(document.createElement('a'), { href: url, download: fileName })
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  },

  pickFile(accept) {
    return new Promise((resolve) => {
      const input = Object.assign(document.createElement('input'), { type: 'file', accept })
      input.addEventListener('change', () => resolve(input.files?.[0] ?? null))
      input.addEventListener('cancel', () => resolve(null))
      input.click()
    })
  },
}
