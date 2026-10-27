import { describe, expect, it, vi } from 'vitest'
import { feedback } from './feedback.ts'
import type { Platform } from './platform.ts'

function fakePlatform() {
  return { haptic: vi.fn(), sound: vi.fn() } as unknown as Platform & {
    haptic: ReturnType<typeof vi.fn>
    sound: ReturnType<typeof vi.fn>
  }
}

describe('feedback', () => {
  it('cada momento vibra y suena como en la tabla del documento', () => {
    const p = fakePlatform()
    const on = { sound: true, vibration: true }
    feedback(p, 'setLogged', on)
    feedback(p, 'betterThanLast', on)
    feedback(p, 'record', on)
    feedback(p, 'restEnd', on)
    expect(p.haptic.mock.calls.flat()).toEqual(['light', 'medium', 'success', 'warning'])
    expect(p.sound.mock.calls.flat()).toEqual(['click', 'twoNotes', 'risingThree', 'threeBeeps'])
  })

  it('un error al apuntar vibra pero no suena', () => {
    const p = fakePlatform()
    feedback(p, 'inputError', { sound: true, vibration: true })
    expect(p.haptic).toHaveBeenCalledWith('error')
    expect(p.sound).not.toHaveBeenCalled()
  })

  it('respeta las preferencias de sonido y vibración', () => {
    const p = fakePlatform()
    feedback(p, 'record', { sound: false, vibration: false })
    expect(p.haptic).not.toHaveBeenCalled()
    expect(p.sound).not.toHaveBeenCalled()
  })
})
