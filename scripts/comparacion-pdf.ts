// PDF: ficha de cada rutina tal cual está diseñada (sin adaptar por nivel), ejercicio a ejercicio
// en su semana representativa, y series semanales por músculo.
// Contiene las rutinas privadas: se guarda en private/informes (no va al repositorio).
// Uso: node scripts/comparacion-pdf.ts
import fs from 'node:fs'
import { chromium } from '@playwright/test'
import { CATALOG, sourceOf } from '../src/features/training/domain/catalog.ts'
import { MUSCLES, type MuscleId } from '../src/features/training/domain/muscles.ts'
import { selectVariant } from '../src/features/training/domain/programInfo.ts'
import { representativeWeek, weeklySets } from '../src/features/training/domain/programLevel.ts'

type Ex = {
  name: string
  sets: number | string | null
  reps: string | null
  rpe: string | null
  percent1RM: string | null
  rest?: string | null
  group?: string | null
}
type Day = { name: string; exercises: Ex[] } | { rest: true; note?: string }
type Program = { blocks: { title: string | null; weeks: { week: number; days: Day[] }[] }[] }

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
const info = JSON.parse(fs.readFileSync('src/shared/content/program-info.json', 'utf8'))
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
  const meta = info[entry.id]
  index += `<li><a href="#r${n}">${esc(entry.title)}</a> <span>${esc(meta?.categories?.join(', '))}</span></li>`

  let sessions = ''
  for (const day of rep.days as Day[]) {
    if ('rest' in day) {
      sessions += `<tr class="rest"><td colspan="5">Descanso${day.note ? ` · ${esc(day.note)}` : ''}</td></tr>`
      continue
    }
    sessions += `<tr class="session"><td colspan="5">${esc(day.name)}</td></tr>`
    for (const e of visible(day.exercises)) {
      const effort = e.percent1RM ? e.percent1RM : e.rpe ? `RPE ${e.rpe}` : '—'
      sessions += `<tr><td class="ex">${esc(e.name)}</td><td>${esc(e.sets ?? '–')}</td><td>${esc(e.reps ?? '–')}</td><td>${esc(effort)}</td><td>${esc(e.rest ?? '—')}</td></tr>`
    }
  }

  const weekly = weeklySets(rep as never, days)
  const sumRows = (Object.keys(MUSCLES) as MuscleId[])
    .filter((m) => weekly[m])
    .map((m) => `<tr><td class="ex">${MUSCLES[m].label}</td><td>${weekly[m]}</td></tr>`)
    .join('')

  html += `<section id="r${n}">
  <h2>${esc(entry.title)}</h2>
  <p class="meta">${esc(meta?.categories?.join(' · '))} · ${esc(meta?.splitLabel)} · ${entry.days.join('–')} días · ~${meta?.minutes} min · volumen ${esc(meta?.volume)}${meta?.cycle?.rotating ? ` · rota en ${meta.cycle.sessions} sesiones` : ''}</p>
  <p class="meta">Semana ${rep.week}${program.blocks[0].title ? ` de «${esc(program.blocks[0].title)}»` : ''} (semana representativa).</p>
  <table>
    <thead><tr><th>Ejercicio</th><th>Series</th><th>Reps</th><th>Esfuerzo</th><th>Descanso</th></tr></thead>
    <tbody>${sessions}</tbody>
  </table>
  <h3>Series por semana y músculo</h3>
  <table class="sum"><thead><tr><th>Músculo</th><th>Series</th></tr></thead><tbody>${sumRows}</tbody></table>
</section>`
}

const page = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Fichas de rutinas</title>
<style>
  @page { size: A4; margin: 14mm 12mm; }
  body { font: 10px/1.4 -apple-system, 'Segoe UI', Roboto, sans-serif; color: #111; }
  h1 { font-size: 22px; margin: 0 0 6px; } h2 { font-size: 15px; margin: 0 0 4px; } h3 { font-size: 11px; margin: 10px 0 4px; }
  .lead { color: #555; font-size: 11px; max-width: 160mm; }
  ol.index { columns: 2; font-size: 10px; } ol.index span { color: #888; }
  section { break-before: page; }
  .meta { color: #555; margin: 0 0 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; table-layout: fixed; }
  table.sum { width: 50%; }
  th, td { border-bottom: 1px solid #e3e3e6; padding: 3px 4px; text-align: left; vertical-align: top; }
  th { background: #f4f4f5; font-weight: 600; }
  td.ex { width: 40%; }
  tr.session td { background: #111; color: #fff; font-weight: 600; }
  tr.rest td { color: #888; font-style: italic; }
  tr { break-inside: avoid; }
</style></head><body>
<h1>Fichas de rutinas</h1>
<p class="lead">Cada rutina exactamente como está diseñada, igual para todos los niveles: su semana representativa ejercicio a ejercicio y las series directas por semana y músculo. El nivel y el objetivo solo sirven para recomendar; el volumen lo ajustará el coach según cómo respondas (1–2 series de un músculo, una cosa cada vez).</p>
<ol class="index">${index}</ol>
${html}
</body></html>`

fs.mkdirSync('private/informes', { recursive: true })
fs.writeFileSync('private/informes/fichas-rutinas.html', page)
const browser = await chromium.launch()
const tab = await browser.newPage()
await tab.setContent(page, { waitUntil: 'load' })
await tab.pdf({
  path: 'private/informes/fichas-rutinas.pdf',
  format: 'A4',
  printBackground: true,
  margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' },
})
await browser.close()
console.log(`private/informes/fichas-rutinas.pdf · ${n} rutinas`)
