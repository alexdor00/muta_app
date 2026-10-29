// Comprueba que cada ejercicio de las rutinas tenga músculo asignado.
import fs from 'node:fs'
import { muscleOf } from '../src/features/training/domain/muscleOf.ts'

const dirs = ['private/programs', 'src/shared/content/programs']
const unknown = new Map<string, number>()
let total = 0
for (const dir of dirs) {
  for (const f of fs.readdirSync(dir).filter((name) => name.endsWith('.json') && !name.startsWith('_'))) {
    const p = JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8'))
    for (const b of p.blocks)
      for (const w of b.weeks)
        for (const d of w.days)
          for (const e of d.exercises ?? []) {
            total++
            if (!muscleOf(e)) {
              const k = e.originalName ?? e.name
              unknown.set(k, (unknown.get(k) ?? 0) + 1)
            }
          }
  }
}
const miss = [...unknown].sort((a, b) => b[1] - a[1])
console.log(`filas ${total}, sin músculo ${miss.reduce((n, [, c]) => n + c, 0)} (${miss.length} nombres)`)
console.log(
  miss
    .slice(0, 60)
    .map(([k, c]) => `${c}× ${k}`)
    .join('\n'),
)
