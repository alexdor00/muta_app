// Genera los programas propios de MUTA a partir de docs/conocimiento/01-contenido.md (§8).
const fs = require('fs')
const md = fs.readFileSync('docs/conocimiento/01-contenido.md', 'utf8')
const section = md.slice(md.indexOf('## 8. Plantillas de rutina'), md.indexOf('## 9.'))
const HEAD_CUT = / (en|con|de pie|tumbado|sentado|inclinado|a una|agarre|pies|rumano|banca|\()/
const head = (s) => s.split(HEAD_CUT)[0]
const HEAVY = /^(Sentadilla( hack| pendular)?|Peso muerto rumano|Press banca|Press militar|Hip thrust)$/
const COMPOUND =
  /Sentadilla|Prensa|Búlgara|Zancada|Step-up|Peso muerto|Remo|Jalón|Dominada|Press|Fondos|Flexiones|Hip thrust|Hiperextensi/
const DEFAULTS = {
  heavy: { reps: '6-10', rpe: '8', rest: '~3 min' },
  compound: { reps: '8-12', rpe: '9', rest: '~2-3 min' },
  isolation: { reps: '10-15', rpe: '9', rest: '~1-2 min' },
}
function program(id, name, key) {
  const part = section.slice(section.indexOf(`### ${key}`)).split(/\n### /)[0]
  const days = part
    .split(/\n\*\*/)
    .slice(1)
    .map((chunk) => {
      const [title, ...lines] = chunk.split('\n')
      const exercises = lines
        .filter((l) => /^\d+\. /.test(l))
        .map((l) => {
          const m = l.match(/^\d+\. (.+?) (\d+)( \(opc\))?: (.+)$/)
          const [, muscle, sets, opc, opts] = m
          const raw = opts
            .split(' → ')
            .map((o) => o.replace(/\s*\((Scott|en el descanso del press|prefatiga[^)]*)\)/g, '').trim())
          const first = raw[0]
          const expanded = raw.map((o, i) => {
            if (i === 0 || /^[A-ZÁÉÍÓÚ]/.test(o)) return o
            if (o === 'con cuerda') return `${first} con cuerda`
            return `${head(first)} ${o}`
          })
          const options = [...new Set(expanded.map(fix))]
          const kind = HEAVY.test(options[0])
            ? 'heavy'
            : COMPOUND.test(options[0]) &&
                !/Extensión|Elevación|Curl|Laterales|Pullover|Crunch|Aducción|Abducción/.test(options[0])
              ? 'compound'
              : 'isolation'
          const d = DEFAULTS[kind]
          return {
            name: options[0],
            originalName: options[0],
            muscle,
            kind,
            optional: Boolean(opc),
            warmupSets: null,
            sets: Number(sets),
            reps: d.reps,
            rpe: d.rpe,
            percent1RM: null,
            rest: d.rest,
            technique: null,
            substitutions: options.slice(1),
            notes: null,
            filled: ['reps', 'rpe', 'rest'],
          }
        })
      return { name: title.replace(/\*\*$/, '').replace(' · ', ' · '), exercises }
    })
  return { id, name, source: 'muta', blocks: [{ title: null, weeks: [{ week: 1, days }] }] }
}
// Nombres que el documento escribe abreviados o con nombre de persona → nombre completo.
const FIX = {
  Búlgara: 'Sentadilla búlgara',
  Goblet: 'Sentadilla goblet',
  Hack: 'Sentadilla hack',
  Pendular: 'Sentadilla pendular',
  Multipower: 'Sentadilla en multipower',
  Zancadas: 'Zancadas',
  'Cruces polea baja': 'Cruces en polea baja',
  'Crunch polea': 'Crunch en polea',
  'Crunch suelo': 'Crunch en suelo',
  'Elevación polea': 'Crunch en polea',
  'Elevación suelo': 'Crunch en suelo',
  'Curl bayesian en polea': 'Curl en polea por detrás del cuerpo',
  'Curl bayesian inclinado con mancuernas': 'Curl inclinado con mancuernas',
  'Curl femoral nórdico': 'Curl nórdico',
  'Curl sentado': 'Curl femoral sentado',
  'Curl tumbado': 'Curl femoral tumbado',
  'Curl predicador concentrado': 'Curl concentrado',
  'Curl predicador predicador a una mano': 'Curl predicador a una mano',
  Predicador: 'Curl predicador',
  'Predicador a una mano': 'Curl predicador a una mano',
  'Predicador araña': 'Curl araña',
  'Predicador concentrado': 'Curl concentrado',
  Extensión: 'Extensión de cuádriceps',
  'Extensión cuerda': 'Extensión en polea con cuerda',
  'Extensión sobre la cabeza sobre la cabeza con mancuerna': 'Extensión sobre la cabeza con mancuerna',
  'Jalón agarre abierto': 'Jalón al pecho agarre abierto',
  'Jalón al pecho asistidas': 'Dominadas asistidas',
  'Jalón asistidas': 'Dominadas asistidas',
  'Jalón agarre neutro (extensión)': 'Jalón agarre neutro',
  'Laterales banda': 'Laterales con banda',
  'Laterales banda (en los descansos del remo)': 'Laterales con banda',
  'Laterales mancuernas': 'Laterales con mancuernas',
  'Laterales máquina': 'Laterales en máquina',
  'Peso muerto con mancuernas': 'Peso muerto rumano con mancuernas',
  'Press militar barra': 'Press militar',
  'Press militar mancuernas': 'Press militar con mancuernas',
  'Press plano banca': 'Press banca',
  'Press plano plano con mancuernas': 'Press plano con mancuernas',
  'Remo pecho apoyado': 'Remo con pecho apoyado',
  'Remo pecho apoyado (codos abiertos)': 'Remo con pecho apoyado (codos abiertos)',
  'Remo pecho apoyado con mancuerna': 'Remo con mancuerna',
  'Remo pecho apoyado en máquina': 'Remo en máquina',
  'Remo pecho apoyado invertido': 'Remo invertido',
  'Remo pecho apoyado pecho apoyado': 'Remo con pecho apoyado',
  'Talones a una pierna': 'Elevación de talones a una pierna',
  'Talones de pie': 'Elevación de talones de pie',
  'Talones en prensa': 'Elevación de talones en prensa',
  'Talones sentado': 'Elevación de talones sentado',
  Hiperextensiones: 'Hiperextensión',
}
const fix = (n) => FIX[n] ?? n

const out = 'src/shared/content/programs'
fs.writeFileSync(
  `${out}/muta-cuerpo-completo-4d.json`,
  JSON.stringify(program('muta-cuerpo-completo-4d', 'Cuerpo completo A/B · 4 días', 'fb4'), null, 2) + '\n',
)
fs.writeFileSync(
  `${out}/muta-ppl-6d.json`,
  JSON.stringify(program('muta-ppl-6d', 'Empuje, tirón y pierna · 6 días', 'ppl6'), null, 2) + '\n',
)
for (const f of fs.readdirSync(out)) {
  const p = JSON.parse(fs.readFileSync(`${out}/${f}`))
  const days = p.blocks[0].weeks[0].days
  console.log(p.name, '·', days.map((d) => `${d.name}(${d.exercises.length})`).join(', '))
  console.log(
    '  ej.:',
    days[1].exercises
      .slice(0, 4)
      .map((e) => `${e.name} ${e.sets}x${e.reps} [${e.substitutions.join(' / ')}]`)
      .join(' | '),
  )
}
