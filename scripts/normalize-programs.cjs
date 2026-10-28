// Corrige errores de extracción sin cambiar valores: mueve cada dato a su columna.
// - %1RM con «RPE8» → va al RPE (si estaba vacío); «N/A» → vacío; 0.775 → «77,5 %».
// - Descanso con notas pegadas (PDF «En casa») → el descanso a su campo y el texto a las notas.
// Uso: node scripts/normalize-programs.cjs private/programs
const fs = require('fs')
const path = require('path')
const dir = process.argv[2]
let moved = 0
let rests = 0

const pct = (v) => `${(Math.round(Number(v) * 1000) / 10).toString().replace('.', ',')} %`

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('_'))) {
  const p = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
  for (const b of p.blocks)
    for (const w of b.weeks)
      for (const d of w.days)
        for (const e of d.exercises ?? []) {
          const raw = e.percent1RM
          if (raw != null) {
            const rpe = String(raw).match(/^RPE\s*(\d+(?:[.,]\d)?(?:-\d+(?:[.,]\d)?)?)$/i)
            if (rpe) {
              if (e.rpe == null || e.rpe === '') e.rpe = rpe[1]
              e.percent1RM = null
              moved++
            } else if (/^n\/?a$/i.test(String(raw).trim())) {
              e.percent1RM = null
              moved++
            } else if (/^0?\.\d+$/.test(String(raw).trim())) {
              e.percent1RM = pct(raw)
              moved++
            }
          }
          // Sin RPE ni %1RM (p. ej. tras quitar un «N/A»): RPE por tipo de ejercicio, como en translate.cjs.
          if ((e.rpe == null || e.rpe === '') && e.percent1RM == null && e.kind) {
            e.rpe = { heavy: '8', compound: '9', isolation: '9-10' }[e.kind]
            e.filled = [...new Set([...(e.filled ?? []), 'rpe'])]
            moved++
          }
          if (typeof e.rest === 'string' && e.rest.length > 14) {
            const m = e.rest.match(
              /(\d+(?:[.,]\d+)?(?:\s*-\s*\d+(?:[.,]\d+)?)?\s*(?:min|mins|sec|secs|s)\b)/i,
            )
            if (m) {
              const extra = e.rest
                .replace(m[1], ' ')
                .replace(/\s{2,}/g, ' ')
                .trim()
              e.rest = m[1].replace(/\s+/g, '')
              if (extra && !(e.notes ?? '').includes(extra))
                e.notes = [e.notes, extra].filter(Boolean).join(' ')
              rests++
            }
          }
        }
  fs.writeFileSync(path.join(dir, file), JSON.stringify(p, null, 2))
}
console.log(`%1RM/RPE movidos: ${moved} · descansos separados de las notas: ${rests}`)
