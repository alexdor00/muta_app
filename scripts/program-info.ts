// Mide cada rutina del catálogo (con su variante) y guarda hechos y tipos en
// src/shared/content/program-info.json. Uso: node scripts/program-info.ts
import fs from 'node:fs'
import { CATALOG, sourceOf } from '../src/features/training/domain/catalog.ts'
import { MUSCLES } from '../src/features/training/domain/muscles.ts'
import { infoOf, selectVariant, type ProgramInfo } from '../src/features/training/domain/programInfo.ts'

const measured = new Map<string, ProgramInfo>()
for (const entry of CATALOG) {
  const id = sourceOf(entry)
  const file = [`private/programs/${id}.json`, `src/shared/content/programs/${id}.json`].find((f) =>
    fs.existsSync(f),
  )
  if (!file) continue
  const program = selectVariant(JSON.parse(fs.readFileSync(file, 'utf8')), entry.variant)
  measured.set(entry.id, infoOf(program, Math.max(...entry.days)))
}

const out: Record<string, unknown> = {}
for (const entry of CATALOG) {
  const info = measured.get(entry.id)
  if (!info) continue
  // La categoría es la familia del programa original (catalog.ts)
  const categories = [entry.family]
  out[entry.id] = { ...info, categories }
  const cyc = info.cycle.rotating
    ? `rota ${info.cycle.sessions} ses.`
    : `semanal ${info.cycle.sessions}+${info.cycle.rests}D`
  console.log(
    [
      entry.id.padEnd(34),
      categories.join('+').padEnd(26),
      `vol ${info.volume} ${info.volumeRatio}`.padEnd(15),
      info.splitLabel.padEnd(40),
      `${info.minutes}min`.padEnd(6),
      `${info.setsPerExercise}s/ej`.padEnd(8),
      `%1RM ${Math.round(info.strengthShare * 100)}%`.padEnd(9),
      info.equipment.padEnd(4),
      `${info.weeks}sem`.padEnd(6),
      cyc.padEnd(16),
      info.emphasis.length ? `énfasis ${info.emphasis.map((m) => MUSCLES[m].label).join(', ')}` : '',
    ].join(' '),
  )
}
fs.writeFileSync('src/shared/content/program-info.json', JSON.stringify(out, null, 2) + '\n')
