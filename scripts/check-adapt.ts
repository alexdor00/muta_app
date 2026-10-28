// Adapta cada rutina a cada nivel y objetivo («Adaptar a mí») y comprueba que todos los
// músculos quedan dentro de su rango. Uso: node scripts/check-adapt.ts
import fs from 'node:fs'
import { adaptToLevel, type SetsGoal } from '../src/features/training/domain/adaptVolume.ts'
import { CATALOG, sourceOf, type Level } from '../src/features/training/domain/catalog.ts'
import { MUSCLES, rangeFor } from '../src/features/training/domain/muscles.ts'
import { categorize, isAdaptable } from '../src/features/training/domain/categories.ts'
import { emphasisOf, infoOf, selectVariant } from '../src/features/training/domain/programInfo.ts'
import { muscleOf } from '../src/features/training/domain/muscleOf.ts'
import {
  levelFromSets,
  representativeWeek,
  weeklySets,
} from '../src/features/training/domain/programLevel.ts'

let checks = 0
let failures = 0
/** Fuera de rango porque el músculo depende de un básico por %1RM, que no se toca. */
let limited = 0
for (const entry of CATALOG) {
  const id = sourceOf(entry)
  const file = [`private/programs/${id}.json`, `src/shared/content/programs/${id}.json`].find((f) =>
    fs.existsSync(f),
  )
  if (!file) continue
  const program = selectVariant(JSON.parse(fs.readFileSync(file, 'utf8')), entry.variant)
  const days = Math.max(...entry.days)
  // Rutinas especiales (minimalistas): no se adaptan
  if (!isAdaptable(categorize(infoOf(program, days), { foundation: entry.foundation }))) {
    console.log(`${entry.id}: especial, no se adapta`)
    continue
  }
  // Se compara la misma semana antes y después (la mediana puede cambiar al adaptar)
  const rep = representativeWeek(program)
  const index = program.blocks[0].weeks.indexOf(rep)
  const originalFit = levelFromSets(weeklySets(rep, days))
  const emphasis = new Set(emphasisOf(weeklySets(rep, days)))
  // Series fijas por %1RM de cada músculo (no se pueden quitar)
  const locked: Record<string, number> = {}
  for (const d of rep.days as { exercises?: { percent1RM?: string; sets?: unknown; name: string }[] }[])
    for (const e of d.exercises ?? [])
      if (e.percent1RM && typeof e.sets === 'number')
        locked[muscleOf(e) ?? ''] = (locked[muscleOf(e) ?? ''] ?? 0) + e.sets
  for (const goal of ['develop', 'maintain'] as SetsGoal[]) {
    for (const level of ['beginner', 'intermediate', 'advanced'] as Level[]) {
      const sets = weeklySets(adaptToLevel(program, level, days, goal).blocks[0].weeks[index], days)
      for (const m of originalFit.perMuscle) {
        const special = emphasis.has(m.muscle)
        const mode =
          goal === 'maintain' ? (special ? 'develop' : 'maintain') : special ? 'priority' : 'develop'
        const [min, max] = rangeFor(m.muscle, level, mode)
        const s = sets[m.muscle] ?? 0
        checks++
        const fixed = locked[m.muscle] ?? 0
        const out = s < min - 0.01 || s > max + 0.01
        if (out && fixed > 0) {
          limited++
          continue
        }
        if (out) {
          failures++
          console.log(
            `${entry.id} · ${level} · ${goal}: ${MUSCLES[m.muscle].label} ${s} (rango ${min}–${max})`,
          )
        }
      }
    }
  }
}
console.log(
  `${checks} comprobaciones (rutina × nivel × objetivo × músculo) · fuera de rango: ${failures} · limitadas por %1RM: ${limited}`,
)
