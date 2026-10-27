// Genera docs/diseno-y-logica.html: diseño elegido, lógica y qué ve cada usuario.
// Uso: node scripts/diseno-logica-html.cjs <carpeta-jpg> <matriz.json>
const fs = require('fs')
const [imgDir, matrixFile] = process.argv.slice(2)
const matrix = JSON.parse(fs.readFileSync(matrixFile, 'utf8'))
const img = (name, alt) =>
  `<img src="data:image/jpeg;base64,${fs.readFileSync(`${imgDir}/${name}.jpg`).toString('base64')}" alt="${alt}" loading="lazy">`
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const LEVEL = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' }

const shot = (name, title, text) =>
  `<figure class="shot">${img(name, title)}<figcaption><b>${title}</b>${text}</figcaption></figure>`

const famList = (fams) =>
  fams.length
    ? `<ul class="fams">${fams
        .map(
          (f) =>
            `<li><b>${esc(f.family)}</b> <span class="muted">· ${esc(f.summary)}</span>${
              f.entries.length > 1 || f.entries.some((e) => e.adjusted || e.muta)
                ? `<div class="entries">${f.entries
                    .map(
                      (e) =>
                        `${esc(e.title)} <span class="muted">(${esc(e.subtitle)})</span>${e.muta ? ' <span class="tag muta">MUTA</span>' : ''}${e.adjusted ? ' <span class="tag adj">ajustada</span>' : ''}`,
                    )
                    .join('<br>')}</div>`
                : ''
            }</li>`,
        )
        .join('')}</ul>`
    : '<span class="muted">—</span>'

const rows = matrix
  .map(
    (c) => `<tr>
  <th>${LEVEL[c.level]}<br><span class="big">${c.days} días</span>${c.targetDays !== c.days ? `<br><span class="tag adj">busca ${c.targetDays}</span>` : ''}</th>
  <td>${c.notice ? `<p class="notice">${esc(c.notice)}</p>` : ''}${famList(c.recommended)}</td>
  <td>${famList(c.alsoAllowed)}</td>
  <td class="num">${c.othersCount}</td>
</tr>`,
  )
  .join('\n')

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>MUTA · Diseño y lógica</title>
<style>
  :root { color-scheme: light dark; --bg:#fff; --surface:#f4f4f5; --label:#111113; --label-2:#6e6e73; --sep:#e3e3e6; --accent:#ff5a12; }
  @media (prefers-color-scheme: dark) { :root { --bg:#000; --surface:#1c1c1e; --label:#f2f2f7; --label-2:#98989f; --sep:#38383a; --accent:#ff6a2a; } }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--label); font:16px/1.55 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  main { max-width:1100px; margin:0 auto; padding:40px 16px 80px; }
  h1 { font-size:34px; line-height:1.15; margin:0 0 8px; } h2 { font-size:24px; margin:56px 0 12px; } h3 { font-size:18px; margin:28px 0 8px; }
  .lead { font-size:18px; color:var(--label-2); max-width:760px; margin:0; }
  .muted { color:var(--label-2); } .big { font-size:20px; }
  .card { background:var(--surface); border-radius:16px; padding:16px 20px; }
  .grid2 { display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:16px; }
  .shots { display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:16px; margin-top:16px; }
  .shot { margin:0; } .shot img { width:100%; border-radius:16px; border:1px solid var(--sep); display:block; }
  .shot figcaption { font-size:13px; color:var(--label-2); margin-top:8px; } .shot figcaption b { display:block; color:var(--label); font-size:14px; }
  .flow { display:flex; gap:8px; flex-wrap:wrap; align-items:center; font-size:14px; }
  .flow span.step { background:var(--surface); border-radius:999px; padding:6px 12px; } .flow span.arrow { color:var(--label-2); }
  ol li, ul li { margin:6px 0; }
  .table-wrap { overflow-x:auto; margin-top:12px; }
  table { border-collapse:collapse; width:100%; min-width:760px; font-size:14px; }
  th, td { text-align:left; vertical-align:top; padding:12px; border-bottom:1px solid var(--sep); }
  thead th { font-size:12px; text-transform:uppercase; letter-spacing:.05em; color:var(--label-2); }
  tbody th { width:120px; } td.num { text-align:center; width:70px; font-size:18px; }
  .fams { margin:0; padding-left:18px; } .entries { font-size:12.5px; margin:4px 0 6px; line-height:1.5; }
  .tag { display:inline-block; font-size:11px; padding:1px 7px; border-radius:999px; border:1px solid var(--sep); color:var(--label-2); }
  .tag.muta { border-color:var(--accent); color:var(--accent); } .tag.adj { background:var(--surface); }
  .notice { background:var(--surface); border-left:3px solid var(--accent); padding:8px 10px; border-radius:8px; margin:0 0 8px; font-size:13px; }
  code { background:var(--surface); padding:1px 6px; border-radius:6px; font-size:.9em; }
  .todo li::marker { content:'○  '; }
</style></head>
<body><main>

<h1>MUTA · Diseño y lógica de la bienvenida y la elección de rutina</h1>
<p class="lead">Qué diseño se ha elegido, qué reglas deciden lo que ve cada persona y, combinación a combinación, qué rutinas le aparecen. Las capturas y la tabla salen de la app real (${new Date().toLocaleDateString('es-ES')}).</p>

<h2>1. El recorrido</h2>
<div class="flow">
  <span class="step">Bienvenida</span><span class="arrow">→</span>
  <span class="step">1/2 · Objetivo</span><span class="arrow">→</span>
  <span class="step">2/2 · Nivel y días</span><span class="arrow">→</span>
  <span class="step">Elige tu rutina (tipos)</span><span class="arrow">→</span>
  <span class="step">Versiones de un tipo</span><span class="arrow">→</span>
  <span class="step">Entreno · Tu plan</span>
</div>
<div class="shots">
  ${shot('01-bienvenida', 'Bienvenida', 'Solo la primera vez (sin perfil). Foto a pantalla completa con el moño arriba, MUTA y el lema bajo la cintura, «Comenzar» sobre el glúteo.')}
  ${shot('02-objetivo', '1/2 · Define tu objetivo', 'Tres tarjetas. Viene marcado «Ganar músculo».')}
  ${shot('03-plan-principiante', '2/2 · Personaliza tu plan', 'Nivel en pastillas y días en círculos, misma altura. Principiante: 2 a 5 días.')}
  ${shot('07-rutinas-intermedio-4', 'Elige tu rutina', 'Una tarjeta por tipo de entrenamiento, con «N opciones · días».')}
  ${shot('10b-familia-hipertrofia', 'Versiones de un tipo', 'Arriba «Para ti», debajo «Más de este tipo». Cualquiera se puede elegir.')}
  ${shot('11-tu-plan', 'Tu plan (provisional)', 'Destino tras elegir. Pendiente de diseño.')}
</div>

<h2>2. Diseño elegido</h2>
<div class="grid2">
  <div class="card"><h3>Estética</h3>
    <ul>
      <li><b>Bienvenida</b>: tu diseño A01 (foto oscura a pantalla completa, MUTA, lema, píldora blanca).</li>
      <li><b>Pasos</b>: tu diseño A03–A04 (título grande, tarjetas con borde naranja al elegir, pastillas y círculos negros).</li>
      <li><b>Elegir rutina</b>: la referencia que mandaste: avatar arriba, título grande de letra fina, tarjetas grandes con foto y el título en blanco abajo a la izquierda. Sin fotos propias todavía: degradados oscuros.</li>
    </ul>
  </div>
  <div class="card"><h3>Coherencia garantizada</h3>
    <ul>
      <li>Todo sale de <code>tokens.css</code>: colores, letras, espacios, alturas (<code>--control</code> 48 px, <code>--control-lg</code> 52 px), radios y movimiento. Claro y oscuro.</li>
      <li>Piezas comunes en <code>shared/ui</code>: botón, opciones, tarjeta con foto, cabecera.</li>
      <li>Una regla automática (Stylelint, también en la CI) prohíbe colores, px o letra a mano fuera de los tokens.</li>
      <li><code>/dev/ui</code> enseña todas las piezas y una prueba mide que cumplen los tokens.</li>
    </ul>
  </div>
</div>
<div class="shots">
  ${shot('24-dev-ui-claro', '/dev/ui · claro', 'Sistema de diseño completo.')}
  ${shot('25-dev-ui-oscuro', '/dev/ui · oscuro', 'Las mismas piezas en oscuro.')}
</div>

<h2>3. La lógica</h2>
<div class="grid2">
  <div class="card"><h3>Bienvenida</h3>
    <ol>
      <li><b>Objetivo → fase</b>: ganar músculo = <b>volumen</b>, perder grasa = <b>definición</b>, sentirte mejor = <b>mantenimiento</b>. Se guarda para Comida (calorías) y el coach.</li>
      <li><b>Días permitidos</b>: principiante 2–5; intermedio y avanzado 2–6. Si pasas a principiante con 6 marcado, baja a 5.</li>
      <li>Al terminar se guarda el perfil y se va a elegir rutina. Desde entonces la app abre en Hoy.</li>
    </ol>
  </div>
  <div class="card"><h3>Qué rutinas se recomiendan</h3>
    <ol>
      <li>Entran las rutinas <b>de tus días y tu nivel</b>. Si no hay de esos días exactos, las del número de días más cercano.</li>
      <li><b>Principiante que pide más de 4</b>: se buscan de 4, con un aviso («más días no es mejor») y aparte «Si prefieres 5 días». Nunca una solo de 6.</li>
      <li><b>Principiante</b> también ve las de intermedio, marcadas <span class="tag adj">ajustada</span>: al elegirlas, series ×0,7 (mínimo 1) y RPE 7 en compuestos pesados / 8 en el resto. El original se guarda.</li>
      <li><b>Orden</b>: primero las de tu nivel (las de MUTA delante), al final las ajustadas.</li>
      <li>Se agrupan <b>por tipo</b>: una tarjeta por familia. Si la familia tiene una sola versión, tocarla la elige directamente.</li>
      <li><b>Libertad</b>: «Ver rutinas de otros días» enseña todas las demás. Cualquier rutina se puede elegir.</li>
    </ol>
  </div>
</div>
<div class="card" style="margin-top:16px"><h3>Tipos de entrenamiento (familias)</h3>
  <p class="muted" style="margin:0">Hipertrofia · Empuje, tirón y pierna · Frecuencia alta · Fuerza e hipertrofia (powerlifting) · Glúteo y pierna · Esencial 45 min · Base · En casa. Las dos rutinas de tu base de conocimiento (<span class="tag muta">MUTA</span> Cuerpo completo A/B y Empuje, tirón y pierna) van siempre en el código; las otras 25 están solo en tu ordenador (<code>private/</code>).</p>
</div>

<h2>4. Qué ve cada usuario</h2>
<p class="muted">Calculado con el código de la app, con las 27 rutinas disponibles. «Otras» es lo que queda detrás de «Ver rutinas de otros días».</p>
<div class="table-wrap"><table>
  <thead><tr><th>Nivel y días</th><th>Recomendadas para ti</th><th>Si prefieres 5 días</th><th>Otras</th></tr></thead>
  <tbody>
${rows}
  </tbody>
</table></div>

<h3>Lo que se lee en la tabla</h3>
<ul>
  <li><b>2 días</b>: solo hay una rutina (Esencial 45 min) para cualquier nivel.</li>
  <li><b>Principiante 4–5 días</b>: muchas familias aparecen gracias a las rutinas ajustadas; las pensadas para principiante son Hipertrofia (Cuerpo completo A/B), Esencial, Base y En casa.</li>
  <li><b>Intermedio y avanzado con 5 días</b>: hasta 8 tipos recomendados. Es donde más ayuda tendría una sola recomendación destacada (ver punto 5).</li>
</ul>

<h2>5. Lo que todavía no hace (propuesta pendiente)</h2>
<ul class="todo">
  <li><b>Una recomendación destacada «Para ti»</b> con el porqué en una línea, y el resto debajo.</li>
  <li><b>Ajuste por fase</b>: en definición, volumen de cada grupo hacia «mantener», prioridad a compuestos y fuera aislamientos opcionales; en volumen, rango «desarrollar».</li>
  <li><b>Ajuste por tiempo y material</b>: requiere preguntar en la bienvenida minutos por sesión y dónde entrenas.</li>
  <li><b>Fotos propias</b> para cada tipo de rutina.</li>
</ul>

</main></body></html>`

fs.writeFileSync('docs/diseno-y-logica.html', html)
console.log(`docs/diseno-y-logica.html · ${(html.length / 1024).toFixed(0)} KB`)
