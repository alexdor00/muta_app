// Mide el nivel de cada rutina por sus series semanales por músculo y lo guarda en
// src/shared/content/program-levels.json (solo ids, niveles y recuentos).
import fs from 'node:fs'
import { CATALOG } from '../src/features/training/domain/catalog.ts'
import { MUSCLES } from '../src/features/training/domain/muscles.ts'
import { programLevel } from '../src/features/training/domain/programLevel.ts'

const LEVEL = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' }
const out: Record<string, unknown> = {}
for (const entry of CATALOG) {
  const file = [`private/programs/${entry.id}.json`, `src/shared/content/programs/${entry.id}.json`].find(
    (f) => fs.existsSync(f),
  )
  if (!file) continue
  const program = JSON.parse(fs.readFileSync(file, 'utf8'))
  const days = Math.max(...entry.days)
  const fit = programLevel(program, days)
  out[entry.id] = { level: fit.level, outside: fit.outside, sets: fit.sets, days }
  const list = fit.perMuscle.map((m) => `${MUSCLES[m.muscle].label} ${m.sets}`).join(', ')
  console.log(
    `${entry.id.padEnd(36)} ${LEVEL[fit.level].padEnd(12)} fuera P/I/A ${fit.outside.beginner}/${fit.outside.intermediate}/${fit.outside.advanced} · ${list}`,
  )
}
fs.writeFileSync('src/shared/content/program-levels.json', JSON.stringify(out, null, 2) + '\n')
