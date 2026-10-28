// Adapta cada rutina a cada nivel y objetivo («Adaptar a mí») y comprueba que todos los
// músculos quedan dentro de su rango. Uso: node scripts/check-adapt.ts
import fs from 'node:fs'
import { adaptToLevel, type SetsGoal } from '../src/features/training/domain/adaptVolume.ts'
import { CATALOG, sourceOf, type Level } from '../src/features/training/domain/catalog.ts'
import { MUSCLES, rangeFor } from '../src/features/training/domain/muscles.ts'
import { selectVariant } from '../src/features/training/domain/programInfo.ts'
import {
  levelFromSets,
  representativeWeek,
  weeklySets,
} from '../src/features/training/domain/programLevel.ts'

let checks = 0
let failures = 0
for (const entry of CATALOG) {
  const id = sourceOf(entry)
  const file = [`private/programs/${id}.json`, `src/shared/content/programs/${id}.json`].find((f) =>
    fs.existsSync(f),
  )
  if (!file) continue
  const program = selectVariant(JSON.parse(fs.readFileSync(file, 'utf8')), entry.variant)
  const days = Math.max(...entry.days)
  // Se compara la misma semana antes y después (la mediana puede cambiar al adaptar)
  const rep = representativeWeek(program)
  const index = program.blocks[0].weeks.indexOf(rep)
  const originalFit = levelFromSets(weeklySets(rep, days))
  for (const goal of ['develop', 'maintain'] as SetsGoal[]) {
    for (const level of ['beginner', 'intermediate', 'advanced'] as Level[]) {
      const sets = weeklySets(adaptToLevel(program, level, days, goal).blocks[0].weeks[index], days)
      for (const m of originalFit.perMuscle) {
        const mode =
          goal === 'maintain'
            ? m.priority[level]
              ? 'develop'
              : 'maintain'
            : m.priority[level]
              ? 'priority'
              : 'develop'
        const [min, max] = rangeFor(m.muscle, level, mode)
        const s = sets[m.muscle] ?? 0
        checks++
        if (s < min - 0.01 || s > max + 0.01) {
          failures++
          console.log(
            `${entry.id} · ${level} · ${goal}: ${MUSCLES[m.muscle].label} ${s} (rango ${min}–${max})`,
          )
        }
      }
    }
  }
}
console.log(`${checks} comprobaciones (rutina × nivel × objetivo × músculo) · fuera de rango: ${failures}`)
