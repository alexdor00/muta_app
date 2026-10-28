// Adapta cada rutina a cada nivel y comprueba cuántos músculos quedan dentro de su rango.
import fs from 'node:fs'
import { adaptToLevel } from '../src/features/training/domain/adaptVolume.ts'
import { CATALOG, type Level } from '../src/features/training/domain/catalog.ts'
import { MUSCLES } from '../src/features/training/domain/muscles.ts'
import {
  levelFromSets,
  representativeWeek,
  weeklySets,
} from '../src/features/training/domain/programLevel.ts'

const L: Record<Level, string> = { beginner: 'P', intermediate: 'I', advanced: 'A' }
for (const entry of CATALOG) {
  const file = [`private/programs/${entry.id}.json`, `src/shared/content/programs/${entry.id}.json`].find(
    (f) => fs.existsSync(f),
  )
  if (!file) continue
  const program = JSON.parse(fs.readFileSync(file, 'utf8'))
  const days = Math.max(...entry.days)
  const parts: string[] = []
  for (const level of ['beginner', 'intermediate', 'advanced'] as Level[]) {
    const adapted = adaptToLevel(program, level, days)
    const fit = levelFromSets(weeklySets(representativeWeek(adapted), days))
    const out = fit.perMuscle.filter((m) => {
      const [min, max] = m.ranges[level]
      return m.sets < min - 0.01 || m.sets > max + 0.01
    })
    parts.push(
      `${L[level]}: ${fit.perMuscle.length - out.length}/${fit.perMuscle.length} en rango${out.length ? ' (fuera: ' + out.map((m) => `${MUSCLES[m.muscle].label} ${m.sets}`).join(', ') + ')' : ''}`,
    )
  }
  console.log(entry.id.padEnd(36), parts.join(' | '))
}
