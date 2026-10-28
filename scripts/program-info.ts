// Mide cada rutina del catálogo (con su variante) y guarda hechos y tipos en
// src/shared/content/program-info.json. Uso: node scripts/program-info.ts
import fs from 'node:fs'
import { CATALOG, sourceOf, type CatalogEntry } from '../src/features/training/domain/catalog.ts'
import { categorize } from '../src/features/training/domain/categories.ts'
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

// Etapa de un programa: mismo archivo y mismos bloques (p. ej. torso-pierna y cuerpo completo de la
// etapa 2 de En casa). Si el glúteo es prioridad en una, lo es en toda la etapa.
const stage = (e: CatalogEntry) => `${sourceOf(e)}|${e.variant?.blocks?.join(',') ?? '*'}`
const gluteStages = new Set(CATALOG.filter((e) => measured.get(e.id)?.emphasis.includes('gluteo')).map(stage))

const out: Record<string, unknown> = {}
for (const entry of CATALOG) {
  const info = measured.get(entry.id)
  if (!info) continue
  const categories = categorize(info, {
    foundation: entry.foundation,
    intent: entry.intent,
    gluteStage: gluteStages.has(stage(entry)),
  })
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
