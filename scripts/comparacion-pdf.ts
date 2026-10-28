// PDF: cada rutina, ejercicio a ejercicio, original frente a adaptada a principiante, intermedio y
// avanzado (ganar músculo), y resumen de series semanales por músculo (también «mantener»).
// Contiene las rutinas privadas: se guarda en private/informes (no va al repositorio).
// Uso: node scripts/comparacion-pdf.ts
import fs from 'node:fs'
import { chromium } from '@playwright/test'
import { adaptToLevel } from '../src/features/training/domain/adaptVolume.ts'
import { CATALOG, sourceOf, type Level } from '../src/features/training/domain/catalog.ts'
import { MUSCLES, type MuscleId } from '../src/features/training/domain/muscles.ts'
import { selectVariant } from '../src/features/training/domain/programInfo.ts'
import { representativeWeek, weeklySets } from '../src/features/training/domain/programLevel.ts'

type Ex = {
  name: string
  sets: number | string | null
  reps: string | null
  rpe: string | null
  percent1RM: string | null
  group?: string | null
  added?: boolean
  removed?: boolean
}
type Day = { name: string; exercises: Ex[] } | { rest: true; note?: string }
type Program = { blocks: { title: string | null; weeks: { week: number; days: Day[] }[] }[] }

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced']
const LABEL = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' }
const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
const info = JSON.parse(fs.readFileSync('src/shared/content/program-info.json', 'utf8'))

const cell = (e: Ex | undefined) => {
  if (!e) return '—'
  if (e.removed) return 'quitado'
  const effort = e.percent1RM ? e.percent1RM : e.rpe ? `RPE ${e.rpe}` : ''
  return `${e.sets ?? '–'} × ${e.reps ?? '–'}${effort ? ` · ${effort}` : ''}`
}
/** Una fila por grupo de progresión (las demás filas del grupo son niveles del mismo ejercicio). */
const visible = (list: Ex[]) =>
  list.filter((e, i) => !e.group || list.findIndex((x) => x.group === e.group) === i)

let html = ''
let index = ''
let n = 0
for (const entry of CATALOG) {
  const id = sourceOf(entry)
  const file = [`private/programs/${id}.json`, `src/shared/content/programs/${id}.json`].find((f) =>
    fs.existsSync(f),
  )
  if (!file) continue
  n++
  const program = selectVariant(JSON.parse(fs.readFileSync(file, 'utf8')), entry.variant) as Program
  const days = Math.max(...entry.days)
  const rep = representativeWeek(program as never)
  const wi = program.blocks[0].weeks.indexOf(rep as never)
  const adapted = Object.fromEntries(
    LEVELS.map((l) => [l, adaptToLevel(program as never, l, days, 'develop') as Program]),
  )
  const maintained = Object.fromEntries(
    LEVELS.map((l) => [l, adaptToLevel(program as never, l, days, 'maintain') as Program]),
  )
  const meta = info[entry.id]
  index += `<li><a href="#r${n}">${esc(entry.title)}</a> <span>${esc(meta?.categories?.join(', '))}</span></li>`

  let sessions = ''
  rep.days.forEach((day: Day, di: number) => {
    if ('rest' in day) {
      sessions += `<tr class="rest"><td colspan="5">Descanso${day.note ? ` · ${esc(day.note)}` : ''}</td></tr>`
      return
    }
    sessions += `<tr class="session"><td colspan="5">${esc(day.name)}</td></tr>`
    const orig = visible(day.exercises)
    const ad = Object.fromEntries(
      LEVELS.map((l) => [
        l,
        visible((adapted[l].blocks[0].weeks[wi].days[di] as { exercises: Ex[] }).exercises),
      ]),
    )
    const rows = Math.max(orig.length, ...LEVELS.map((l) => ad[l].length))
    for (let i = 0; i < rows; i++) {
      const o = orig[i]
      const name = o?.name ?? ad.intermediate[i]?.name ?? ad.beginner[i]?.name ?? ad.advanced[i]?.name
      const added = !o
      const cols = LEVELS.map((l) => {
        const e = ad[l][i]
        const text = cell(e)
        const changed = e && (e.added || e.removed || text !== cell(o))
        return `<td class="${changed ? 'changed' : ''}">${esc(text)}${e?.added ? ' <i>añadido</i>' : ''}</td>`
      }).join('')
      sessions += `<tr><td class="ex">${esc(name)}${added ? ' <i>(añadido)</i>' : ''}</td><td>${added ? '—' : esc(cell(o))}</td>${cols}</tr>`
    }
  })

  const before = weeklySets(rep as never, days)
  const sum = (p: Program) => weeklySets(p.blocks[0].weeks[wi] as never, days)
  const dev = Object.fromEntries(LEVELS.map((l) => [l, sum(adapted[l])]))
  const man = Object.fromEntries(LEVELS.map((l) => [l, sum(maintained[l])]))
  const muscles = (Object.keys(MUSCLES) as MuscleId[]).filter(
    (m) => before[m] || LEVELS.some((l) => dev[l][m] || man[l][m]),
  )
  const sumRows = muscles
    .map((m) => {
      const td = (v?: number) =>
        `<td class="${(v ?? 0) !== (before[m] ?? 0) ? 'changed' : ''}">${v ?? 0}</td>`
      return `<tr><td class="ex">${MUSCLES[m].label}</td><td>${before[m] ?? 0}</td>${LEVELS.map((l) => td(dev[l][m])).join('')}${LEVELS.map((l) => td(man[l][m])).join('')}</tr>`
    })
    .join('')

  html += `<section id="r${n}">
  <h2>${esc(entry.title)}</h2>
  <p class="meta">${esc(meta?.categories?.join(' · '))} · ${esc(meta?.splitLabel)} · ${entry.days.join('–')} días · ~${meta?.minutes} min · volumen ${esc(meta?.volume)}${meta?.cycle?.rotating ? ` · rota en ${meta.cycle.sessions} sesiones` : ''}</p>
  <p class="meta">Semana ${rep.week}${program.blocks[0].title ? ` de «${esc(program.blocks[0].title)}»` : ''} (semana representativa). Objetivo de las series: ganar músculo.</p>
  <table>
    <thead><tr><th>Ejercicio</th><th>Original</th>${LEVELS.map((l) => `<th>${LABEL[l]}</th>`).join('')}</tr></thead>
    <tbody>${sessions}</tbody>
  </table>
  <h3>Series por semana y músculo</h3>
  <table class="sum">
    <thead><tr><th rowspan="2">Músculo</th><th rowspan="2">Original</th><th colspan="3">Ganar músculo</th><th colspan="3">Mantener músculo</th></tr>
    <tr>${LEVELS.map((l) => `<th>${LABEL[l]}</th>`).join('')}${LEVELS.map((l) => `<th>${LABEL[l]}</th>`).join('')}</tr></thead>
    <tbody>${sumRows}</tbody>
  </table>
</section>`
}

const page = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Comparación de rutinas por nivel</title>
<style>
  @page { size: A4; margin: 14mm 12mm; }
  body { font: 10px/1.4 -apple-system, 'Segoe UI', Roboto, sans-serif; color: #111; }
  h1 { font-size: 22px; margin: 0 0 6px; } h2 { font-size: 15px; margin: 0 0 4px; } h3 { font-size: 11px; margin: 10px 0 4px; }
  .lead { color: #555; font-size: 11px; max-width: 160mm; }
  .legend span { display: inline-block; padding: 1px 6px; margin-right: 6px; border-radius: 4px; background: #fff1e8; color: #c2410c; }
  ol.index { columns: 2; font-size: 10px; } ol.index span { color: #888; }
  section { break-before: page; }
  .meta { color: #555; margin: 0 0 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; table-layout: fixed; }
  th, td { border-bottom: 1px solid #e3e3e6; padding: 3px 4px; text-align: left; vertical-align: top; }
  th { background: #f4f4f5; font-weight: 600; }
  td.ex { width: 30%; } table.sum td.ex { width: 18%; }
  tr.session td { background: #111; color: #fff; font-weight: 600; }
  tr.rest td { color: #888; font-style: italic; }
  td.changed { background: #fff1e8; color: #c2410c; font-weight: 600; }
  i { color: #c2410c; font-style: normal; font-size: 9px; }
  tr { break-inside: avoid; }
</style></head><body>
<h1>Comparación de rutinas por nivel</h1>
<p class="lead">Cada rutina con su semana representativa: cada ejercicio tal como viene (Original) y como queda al pulsar «Adaptar a mí» para principiante, intermedio y avanzado, con el objetivo «ganar músculo». Al final de cada rutina, las series directas por semana y músculo, también con «mantener músculo». Reglas: rangos de series de docs/conocimiento; +1 serie al ejercicio con menos (máx. 4–5 y 11 por músculo y sesión) o ejercicio nuevo de 2 series; −1 al de más (primero aislamientos) o quitar un aislamiento; principiante a RPE 7 (compuestos pesados) y 8 (resto).</p>
<p class="legend"><span>naranja</span> = cambia respecto a la original</p>
<ol class="index">${index}</ol>
${html}
</body></html>`

fs.mkdirSync('private/informes', { recursive: true })
fs.writeFileSync('private/informes/comparacion-rutinas.html', page)
const browser = await chromium.launch()
const tab = await browser.newPage()
await tab.setContent(page, { waitUntil: 'load' })
await tab.pdf({
  path: 'private/informes/comparacion-rutinas.pdf',
  format: 'A4',
  printBackground: true,
  margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' },
})
await browser.close()
console.log(`private/informes/comparacion-rutinas.pdf · ${n} rutinas`)
