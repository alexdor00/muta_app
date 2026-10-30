// Genera un HTML con cómo funciona cada parte de MUTA: private/informes/como-funciona.html.
// Lleva capturas de rutinas de terceros, así que va a private/ (no se sube).
// Uso: node scripts/como-funciona-html.ts <carpeta-con-las-capturas-jpg>
import fs from 'node:fs'
import {
  CATALOG,
  recommend,
  sourceOf,
  type Level,
  type Phase,
} from '../src/features/training/domain/catalog.ts'
import { CATEGORIES, categoryOf } from '../src/features/training/domain/categories.ts'

const dir = process.argv[2]
if (!dir) throw new Error('Falta la carpeta con las capturas')
const INFO = JSON.parse(fs.readFileSync('src/shared/content/program-info.json', 'utf8')) as Record<
  string,
  { volume: 'bajo' | 'medio' | 'alto'; equipment: 'gym' | 'home'; minutes: number; weeks: number }
>
const esc = (s: unknown) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const img = (name: string) =>
  `data:image/jpeg;base64,${fs.readFileSync(`${dir}/${name}.jpg`).toString('base64')}`
const fig = (name: string, caption: string) =>
  `<figure class="phone"><img src="${img(name)}" alt="${esc(caption)}" loading="lazy"><figcaption>${esc(caption)}</figcaption></figure>`
const shots = (...items: [string, string][]) =>
  `<div class="shots">${items.map(([n, c]) => fig(n, c)).join('')}</div>`

// ── Datos que salen de la propia app
const FOLDER: Record<string, string> = {
  muta: '(propias, de tu base de conocimiento)',
  mujer: '(Women) Programs',
  culturismo: 'Bodybuilding',
  extras: 'Extras Material',
  'frecuencia-alta': 'High Frequency Full Body Program',
  'fuerza-hipertrofia': 'Powerbuilding',
  fuerza: 'Powerlifting and Strength Programs',
  ppl: 'PPL Programs',
  esencial: 'The Essentials Program (45 min)',
  'torso-pierna': 'UpperLower Program',
}
const categoryRows = CATEGORIES.map((c) => {
  const entries = CATALOG.filter((e) => categoryOf(e.family) === c.id)
  const folders = [...new Set(entries.map((e) => FOLDER[e.family]))].join(' · ')
  return `<tr><th>${esc(c.title)}</th><td>${esc(folders)}</td><td class="num">${entries.length}</td><td>${esc(c.description)}</td></tr>`
}).join('')

const available = new Set(CATALOG.map(sourceOf))
const infos = Object.fromEntries(CATALOG.map((e) => [e.id, INFO[e.id]]).filter(([, v]) => v)) as never
const LEVEL: Record<Level, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
}
const PHASE: Record<Phase, string> = { bulk: 'volumen', cut: 'definición', maintenance: 'mantenimiento' }
const PROFILES: { days: number; level: Level; phase: Phase }[] = [
  { days: 3, level: 'beginner', phase: 'bulk' },
  { days: 5, level: 'beginner', phase: 'bulk' },
  { days: 4, level: 'intermediate', phase: 'bulk' },
  { days: 4, level: 'intermediate', phase: 'cut' },
  { days: 6, level: 'advanced', phase: 'bulk' },
  { days: 2, level: 'intermediate', phase: 'maintenance' },
]
const recRows = PROFILES.map((p) => {
  const r = recommend({ daysPerWeek: p.days, level: p.level, phase: p.phase }, available, infos)
  const top = r.recommended
    .slice(0, 3)
    .map((e) => `<li>${esc(e.title)} <span class="muted">· volumen ${INFO[e.id]?.volume ?? '—'}</span></li>`)
    .join('')
  return `<tr><th>${LEVEL[p.level]} · ${p.days} días<br><span class="muted">${PHASE[p.phase]}</span></th><td>${r.targetDays !== p.days ? `<span class="tag">busca ${r.targetDays} días</span> ` : ''}<ol>${top}</ol></td><td class="num">${r.recommended.length}</td></tr>`
}).join('')
const total = CATALOG.length
const gymHome = CATALOG.filter((e) => INFO[e.id]?.equipment === 'home').length

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MUTA · Cómo funciona cada cosa</title>
<style>
  :root { --bg:#fff; --text:#111; --muted:#6b6b72; --line:#e3e3e6; --card:#f4f4f5; --accent:#ff5a12; --ok:#1a7f4b; --warn:#b45309; }
  @media (prefers-color-scheme: dark) { :root { --bg:#0e0e10; --text:#f2f2f3; --muted:#9a9aa2; --line:#2c2c2f; --card:#1a1a1d; --accent:#ff6a2a; --ok:#4ade80; --warn:#fbbf24; } }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font:16px/1.55 -apple-system,'Segoe UI',Roboto,sans-serif; }
  header.top { padding:56px 20px 32px; max-width:1040px; margin:0 auto; }
  header.top h1 { margin:0 0 8px; font-size:clamp(28px,5vw,44px); line-height:1.1; }
  header.top p { margin:0; color:var(--muted); max-width:62ch; }
  nav.toc { position:sticky; top:0; z-index:5; background:color-mix(in srgb,var(--bg) 92%,transparent); backdrop-filter:blur(8px); border-bottom:1px solid var(--line); }
  nav.toc ul { display:flex; gap:6px; overflow-x:auto; margin:0 auto; padding:10px 20px; max-width:1040px; list-style:none; }
  nav.toc a { display:block; white-space:nowrap; padding:6px 12px; border-radius:999px; background:var(--card); color:var(--text); text-decoration:none; font-size:14px; }
  nav.toc a:hover { background:var(--accent); color:#fff; }
  main { max-width:1040px; margin:0 auto; padding:0 20px 80px; }
  section { padding:40px 0 8px; border-bottom:1px solid var(--line); }
  section:last-child { border-bottom:0; }
  h2 { margin:0 0 6px; font-size:28px; }
  h2 .n { color:var(--accent); margin-right:8px; }
  h3 { margin:28px 0 8px; font-size:19px; }
  p { margin:8px 0; max-width:70ch; }
  .lead { color:var(--muted); font-size:18px; }
  .muted { color:var(--muted); }
  ul, ol { padding-left:22px; max-width:70ch; }
  li { margin:4px 0; }
  table { width:100%; border-collapse:collapse; margin:14px 0; font-size:15px; }
  th, td { text-align:left; vertical-align:top; padding:10px 12px; border-bottom:1px solid var(--line); }
  thead th { background:var(--card); font-size:13px; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); }
  tbody th { font-weight:600; white-space:nowrap; }
  td.num { text-align:right; font-variant-numeric:tabular-nums; }
  td ol, td ul { margin:0; padding-left:18px; }
  .tag { display:inline-block; padding:1px 9px; border-radius:999px; background:var(--card); font-size:13px; color:var(--muted); }
  .tag.doc { background:color-mix(in srgb,var(--ok) 18%,transparent); color:var(--ok); }
  .tag.calc { background:color-mix(in srgb,var(--accent) 16%,transparent); color:var(--accent); }
  .tag.mine { background:color-mix(in srgb,var(--warn) 18%,transparent); color:var(--warn); }
  .box { background:var(--card); border-radius:16px; padding:16px 20px; margin:16px 0; }
  .box.ok { border-left:4px solid var(--ok); } .box.warn { border-left:4px solid var(--warn); } .box.key { border-left:4px solid var(--accent); }
  .box p:first-child { margin-top:0; } .box p:last-child { margin-bottom:0; }
  .flow { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin:18px 0; }
  .flow span { padding:8px 14px; border-radius:12px; background:var(--card); font-size:14px; font-weight:600; }
  .flow i { color:var(--muted); font-style:normal; }
  .shots { display:flex; flex-wrap:wrap; gap:20px; margin:20px 0; }
  figure.phone { margin:0; width:min(250px,44vw); }
  figure.phone img { width:100%; height:auto; display:block; border-radius:22px; border:1px solid var(--line); box-shadow:0 8px 30px rgba(0,0,0,.12); }
  figure.phone figcaption { margin-top:8px; font-size:13px; color:var(--muted); line-height:1.35; }
  .cols { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:16px; }
  .cols .box { margin:0; }
  code { background:var(--card); padding:1px 6px; border-radius:6px; font-size:.92em; }
  @media (max-width:640px){ th, td { padding:8px 6px; } tbody th { white-space:normal; } }
</style>
</head>
<body>
<header class="top">
  <h1>MUTA · Cómo funciona cada cosa</h1>
  <p>Todo lo que hace la app hoy, pantalla a pantalla y con las capturas reales. Al final, qué sale de los documentos originales, qué calcula la app y qué he decidido yo. · 28 de octubre de 2026</p>
</header>
<nav class="toc"><ul>
  <li><a href="#recorrido">Recorrido</a></li><li><a href="#bienvenida">Bienvenida</a></li><li><a href="#recomendadas">Para ti</a></li>
  <li><a href="#categorias">Categorías</a></li><li><a href="#lista">La lista</a></li><li><a href="#rutina">La rutina</a></li>
  <li><a href="#empezar">Antes de empezar</a></li><li><a href="#datos">De dónde sale cada dato</a></li><li><a href="#falta">Qué falta</a></li>
</ul></nav>
<main>

<section id="recorrido">
  <h2><span class="n">1</span>El recorrido</h2>
  <p class="lead">De abrir la app a empezar una rutina, en este orden.</p>
  <div class="flow"><span>Bienvenida</span><i>→</i><span>Objetivo</span><i>→</i><span>Nivel y días</span><i>→</i><span>Elige tu rutina</span><i>→</i><span>Tipo de entrenamiento</span><i>→</i><span>La rutina</span><i>→</i><span>Antes de empezar</span><i>→</i><span>Entreno</span></div>
  <p>Hay <b>${total} rutinas</b> repartidas en <b>${CATEGORIES.length} tipos</b>. La app solo recomienda; <b>cualquier rutina se puede elegir</b>. Las rutinas de terceros viven solo en tu dispositivo (carpeta <code>private/</code>); en el repositorio público solo están las 2 de MUTA y la lógica.</p>
</section>

<section id="bienvenida">
  <h2><span class="n">2</span>Bienvenida y perfil</h2>
  <p class="lead">Dos pasos cortos. De ahí salen tres datos: objetivo (fase), nivel y días por semana.</p>
  ${shots(['a01', 'Bienvenida'], ['a03', 'Paso 1 de 2: tu objetivo'], ['a04', 'Paso 2 de 2: nivel y días'])}
  <table>
    <thead><tr><th>Objetivo que eliges</th><th>Fase que se guarda</th><th>Para qué sirve</th></tr></thead>
    <tbody>
      <tr><th>Ganar músculo</th><td>Volumen</td><td>Recomienda rutinas con más volumen</td></tr>
      <tr><th>Perder grasa</th><td>Definición</td><td>Medio punto menos de volumen: en déficit no se sube volumen</td></tr>
      <tr><th>Sentirte mejor</th><td>Mantenimiento</td><td>Igual que definición</td></tr>
    </tbody>
  </table>
  <h3>Reglas del principiante</h3>
  <ul>
    <li><b>4 días recomendados</b>, con el aviso «más días no es mejor». Puede elegir una de <b>5 días</b> como máximo.</li>
    <li>El día 6 no se ofrece en la bienvenida a un principiante; el intermedio conserva los 6.</li>
  </ul>
  <div class="box key"><p>El perfil solo sirve para <b>recomendar</b> (orden de la lista, «Para ti» y el tope de días del principiante). <b>No cambia las series</b> de ninguna rutina: se usan tal como están diseñadas.</p></div>
</section>

<section id="recomendadas">
  <h2><span class="n">3</span>«Para ti»: cómo se ordenan las rutinas</h2>
  <p class="lead">Tres criterios, en este orden de importancia.</p>
  <ol>
    <li><b>Tus días.</b> Primero las rutinas de los días que elegiste (o del número más cercano que exista).</li>
    <li><b>Volumen que te encaja.</b> Cada rutina es de volumen bajo, medio o alto. Te encaja: principiante entre bajo y medio, intermedio medio, avanzado entre medio y alto; en definición y mantenimiento, medio punto menos. Cuanto más cerca, antes sale.</li>
    <li><b>Desempate:</b> las de MUTA primero y las de gimnasio antes que las de casa.</li>
  </ol>
  <p>Ejemplos reales, calculados ahora con las ${total} rutinas:</p>
  <table>
    <thead><tr><th>Perfil</th><th>Primeras recomendadas</th><th>Cuántas</th></tr></thead>
    <tbody>${recRows}</tbody>
  </table>
  ${shots(['elegir', 'Elige tu rutina: «Para ti» y los tipos'])}
</section>

<section id="categorias">
  <h2><span class="n">4</span>Los tipos de entrenamiento</h2>
  <p class="lead">Son las carpetas de tus programas originales, en el mismo orden, más las rutinas de MUTA. Cada rutina está en una sola, la de su archivo; las variantes de un mismo archivo van siempre juntas.</p>
  <table>
    <thead><tr><th>Tipo</th><th>Carpeta original</th><th>Rutinas</th><th>De qué va</th></tr></thead>
    <tbody>${categoryRows}</tbody>
  </table>
  <p class="muted">Los nombres en español son traducción mía. ${gymHome} rutinas son para hacer en casa.</p>
</section>

<section id="lista">
  <h2><span class="n">5</span>La lista de un tipo</h2>
  <p class="lead">Cabecera, número de rutinas, filtros y una fila por rutina.</p>
  ${shots(['categoria', 'Un tipo: filas con «!» y guardar'], ['filtros', 'Los filtros'], ['info-lista', 'La «!» de una fila'])}
  <h3>Qué dice cada fila</h3>
  <ul>
    <li><b>Línea 1:</b> volumen · reparto · gimnasio o casa. <b>Línea 2:</b> días · minutos por sesión · fases y semanas (o «sin fecha de fin»).</li>
    <li><b>Etiquetas:</b> «Para tus días» y «Tu rutina». Una tercera línea, «Mejora los básicos», en las 9 rutinas que lo dicen como objetivo en su documento.</li>
    <li><b>«!»</b> abre «De qué trata»: resumen, para quién es, cómo funciona y notas de su versión. <b>El marcador</b> la guarda para verla luego.</li>
  </ul>
  <h3>Cómo se miden los datos de la fila</h3>
  <table>
    <thead><tr><th>Dato</th><th>Cómo se calcula</th></tr></thead>
    <tbody>
      <tr><th>Volumen</th><td>Media de las series semanales de los grupos grandes ÷ el punto medio del rango «desarrollar» de tu tabla. Menos de 0,7: bajo · hasta 1,15: medio · más: alto.</td></tr>
      <tr><th>Minutos</th><td>Por sesión: series × (descanso + 0,75 min) + 8 min de calentamiento general + 1 min por serie de aproximación. El descanso sale del texto de la rutina; si no lo trae: pesados 3 min, aislamientos 1,5, el resto 2,5.</td></tr>
      <tr><th>Reparto</th><td>Cuerpo completo, torso y pierna, empuje-tirón-pierna, mixto o por grupos, según el nombre de las sesiones.</td></tr>
      <tr><th>Ciclo</th><td>Semanal, o «rota» cuando las sesiones no van atadas a días de la semana (como las de MUTA).</td></tr>
    </tbody>
  </table>
  <h3>Filtros</h3>
  <p>Días por semana · reparto · duración (hasta 45 min, 50–65, 70 o más) · volumen · ciclo · y «Fuerza: mejoran los básicos».</p>
</section>

<section id="rutina">
  <h2><span class="n">6</span>La rutina</h2>
  <p class="lead">Se enseña exactamente como está diseñada, sin ajustar nada por tu nivel.</p>
  ${shots(['detalle', 'Datos clave'], ['estructura', 'Estructura: fase, semana y día'])}
  <ul>
    <li><b>Datos:</b> días, duración, programa (fases y semanas), reparto, volumen, lugar y, si toca, «Mejora los básicos».</li>
    <li><b>Estructura:</b> eliges fase y semana, y cada día se abre con sus ejercicios: series × repeticiones, esfuerzo y descanso. Los descansos de la rutina aparecen como día de descanso.</li>
    <li><b>Esfuerzo en RIR</b> (repeticiones en reserva = 10 − RPE): RPE 8 se ve «RIR 2»; un rango «7-8» se ve «RIR 2-3». Si la serie va por porcentaje de tu máximo, se ve el porcentaje.</li>
  </ul>
  <div class="box"><p><b>«Mejora los básicos»</b> solo lo llevan las rutinas que lo dicen como objetivo en su documento: Fuerza e hipertrofia (4), las dos especializaciones de sentadilla y banca, PPL técnica y pico, Torso y pierna y Tren inferior.</p></div>
</section>

<section id="empezar">
  <h2><span class="n">7</span>Antes de empezar</h2>
  <p class="lead">Al pulsar «Empezar esta rutina», si la rutina tiene algo que personalizar se abre una hoja. <b>Nada es obligatorio</b>: el botón «Empezar rutina» siempre está activo y se puede empezar tal como está.</p>

  <h3>MUTA: prioridades, opcionales y tiempo</h3>
  ${shots(['empezar-muta-1', 'Prioridades (hasta 4) y opcionales'], ['empezar-muta-2', 'Opcionales y duración'], ['empezar-muta-3', 'Con 45 min se quita lo que sobra'])}
  <ul>
    <li><b>Prioridades:</b> hasta 4 músculos que quieres mejorar más.</li>
    <li><b>Opcionales</b> (los «(opc)» de tus plantillas), cada uno a tu gusto: el <b>hombro anterior</b> entra solo si es prioridad; el <b>posterior</b> se quita a principiantes salvo prioridad; aductores, cuádriceps extra y glúteo extra entran por defecto. Lo que marcas a mano manda.</li>
    <li><b>Duración por sesión</b> (regla del generador): si una sesión pasa de tus minutos —75 por defecto—, se quita el <b>último opcional no prioritario</b>; si no queda ninguno, se resta <b>1 serie</b> al ejercicio con más series no prioritario (nunca por debajo de 2). Puedes elegir 45, 60, 75, 90 o <b>sin límite</b>. Los opcionales de tus prioridades y los que pusiste a mano no se tocan, y la hoja avisa de lo que se ha quitado.</li>
  </ul>

  <h3>Culturismo: un punto débil</h3>
  ${shots(['empezar-culturismo-1', 'Eliges un músculo'], ['empezar-culturismo-2', 'Y, de su tabla, el ejercicio 1 y 2'])}
  <ul>
    <li>Eliges <b>un músculo</b>; el programa te da 2-3 ejercicios para el hueco «ejercicio 1» y otros para el «ejercicio 2».</li>
    <li>Elige uno solo de cada lista. El ejercicio 2 es para cuando el músculo está recuperado.</li>
    <li>Ambos son opcionales («No añadir»). Si no eliges, el hueco desaparece.</li>
    <li>Los músculos que el programa ya trabaja mucho (isquios, gemelos, espalda media, bíceps, tríceps en la fase 1…) no traen ejercicios: te enseña su <b>consejo</b> (no añadas más volumen) y quita el hueco.</li>
  </ul>

  <h3>Torso y pierna: tus puntos débiles y en qué día</h3>
  ${shots(['empezar-torso-1', 'Eliges tus músculos'], ['empezar-torso-2', 'Y los repartes por días'])}
  <ul>
    <li>Eliges los músculos que quieras (el programa recomienda <b>2 o 3</b>, siempre los mismos) y un ejercicio de cada uno.</li>
    <li><b>«¿En qué día?»</b>: ya viene repartido (torso en días de torso, pierna en días de pierna). Lo cambias como quieras: cualquier músculo en cualquier día, varios en un día se alternan por semana, ninguno deja el día libre.</li>
  </ul>
  <div class="box"><p>Lo que eliges <b>se guarda con tu plan</b> y vuelve al reabrir la rutina. Sin elegir nada, la rutina se queda con sus reglas por defecto.</p></div>
</section>

<section id="datos">
  <h2><span class="n">8</span>De dónde sale cada dato</h2>
  <p class="lead">Para no confundir lo que dicen tus documentos con lo que añade la app.</p>
  <table>
    <thead><tr><th>Qué</th><th>Origen</th></tr></thead>
    <tbody>
      <tr><th>Ejercicios, series, repeticiones, esfuerzo, descanso, notas, semanas, fases y orden</th><td><span class="tag doc">Del documento</span> Copiado del Excel (20 programas) o del PDF (11 programas).</td></tr>
      <tr><th>Tablas de puntos débiles y consejos</th><td><span class="tag doc">Del documento</span> Los consejos, traducidos.</td></tr>
      <tr><th>Opcionales de MUTA, reglas de hombro y regla de tiempo, máximo 4 prioridades</th><td><span class="tag doc">De tu base de conocimiento</span></td></tr>
      <tr><th>Tipo de entrenamiento</th><td><span class="tag doc">Carpeta original</span></td></tr>
      <tr><th>Minutos, volumen, reparto, ciclo, semanas</th><td><span class="tag calc">Calculado</span> Con las fórmulas de arriba.</td></tr>
      <tr><th>Descansos y esfuerzos que faltaban</th><td><span class="tag mine">Rellenado</span> Con las reglas de tu base de conocimiento y marcado como rellenado en los datos.</td></tr>
      <tr><th>Nombres en español, textos de la «!», «Mejora los básicos»</th><td><span class="tag mine">Mío</span> Resumen de la presentación de cada documento; «básicos» solo si el documento lo dice como objetivo.</td></tr>
      <tr><th>La forma de elegir (hoja «Antes de empezar», reparto por días, tiempos disponibles)</th><td><span class="tag mine">Mío</span> Diseño de la interfaz sobre las reglas anteriores.</td></tr>
    </tbody>
  </table>
  <h3>Cómo se comprobó que los datos son exactos</h3>
  <div class="box ok">
    <p><b>Excel (20 programas):</b> releídos de cero y comparados fila a fila con lo guardado: <b>6.578 filas, 0 diferencias</b>. Una segunda comprobación independiente exigió que cada fila esté en su Excel, en el mismo orden.</p>
    <p><b>PDF (11 programas):</b> se contó cada fila del PDF por su posición y se alineó con lo guardado. Se encontraron y corrigieron errores míos de extracción: filas que faltaban (+28 en Tren inferior, +8 en Optimización, +6 en Glúteo), nombres cortados, esfuerzos simplificados en Base y niveles mal agrupados en En casa.</p>
  </div>
  <div class="box warn">
    <p><b>Excepciones que quedan (y por qué):</b></p>
    <ul>
      <li>Las series de la semana 2 de En casa (Avanzada, torso nº 2) no vienen en el PDF; se deducen de las semanas 1 y 3, que coinciden.</li>
      <li>Erratas del propio documento corregidas: «REP10», «RP8» y «PRE8» (= RPE) y «2-3mn» (= 2-3 min). Una celda de Optimización pone «RPE» sin número y se deja tal cual.</li>
      <li>El test de sentadilla (semana 10): el PDF solo dice «NOTES»; «1 repetición, RPE 9-9.5» sale de sus preguntas frecuentes y queda marcado como rellenado.</li>
      <li>En Especialización en sentadilla solo van los 4 días de pierna del PDF, sin días de torso.</li>
    </ul>
  </div>
</section>

<section id="falta">
  <h2><span class="n">9</span>Lo que todavía no hace</h2>
  <div class="cols">
    <div class="box"><p><b>Pantallas sin diseñar:</b> «Hoy» y «Tu plan» enseñan un texto provisional; el entreno y el registro de series aún no existen.</p></div>
    <div class="box"><p><b>El coach:</b> el ajuste de series por músculo ya está probado, pero no está conectado. Cuando exista, usará tus prioridades guardadas y cambiará 1-2 series solo cuando tus datos lo pidan.</p></div>
    <div class="box"><p><b>Marcar lo rellenado:</b> aún no se ve en la app qué descansos o esfuerzos son estimados (están marcados en los datos).</p></div>
    <div class="box"><p><b>Otras ideas pendientes:</b> exportar e importar rutinas (CSV), «Crea tu rutina», fotos en los tipos de entrenamiento.</p></div>
  </div>
</section>

</main>
</body>
</html>`

fs.mkdirSync('private/informes', { recursive: true })
fs.writeFileSync('private/informes/como-funciona.html', html)
console.log('private/informes/como-funciona.html ·', Math.round(html.length / 1024), 'KB')
