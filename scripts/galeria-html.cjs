// Junta las capturas de tests/e2e/capturas/galeria en un único HTML (imágenes incrustadas).
const fs = require('fs')
const dir = 'tests/e2e/capturas/galeria'
const shots = JSON.parse(fs.readFileSync(`${dir}/galeria.json`, 'utf8'))
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

const LOGIC = `
<h2>Lógica: qué ve cada usuario</h2>
<ol>
  <li><b>Abrir la app.</b> Sin perfil guardado → Bienvenida. Con perfil → Hoy.</li>
  <li><b>Objetivo (1/2).</b> Marca la fase: ganar músculo = volumen, perder grasa = definición, sentirte mejor = mantenimiento (calorías y coach).</li>
  <li><b>Nivel y días (2/2).</b> Principiante: de 2 a 5 días. Intermedio y avanzado: de 2 a 6. Si pasas a principiante con 6 marcado, baja a 5.</li>
  <li><b>Elige tu rutina.</b>
    <ul>
      <li><b>Recomendadas para ti</b>: rutinas de tus días y tu nivel. Si no hay de esos días exactos, las del número de días más cercano.</li>
      <li><b>Principiante que pide más de 4 días</b>: se le recomiendan de 4 con el aviso «más días no es mejor», y aparte «Si prefieres 5 días». Nunca una solo de 6.</li>
      <li><b>Principiante</b>: además de las de su nivel, ve las de intermedio con la etiqueta «Ajustada a tu nivel». Al elegirlas, series ×0,7 (mínimo 1) y RPE 7 en compuestos pesados / 8 en el resto; los valores originales se guardan.</li>
      <li><b>Orden</b>: primero las de su nivel (las de MUTA delante), al final las ajustadas.</li>
      <li><b>Ver rutinas de otros días</b>: el resto, escondido detrás de un botón.</li>
      <li>Al tocar una tarjeta se guarda como plan actual y se va a Entreno; la elegida lleva «Tu rutina».</li>
    </ul>
  </li>
  <li><b>Pestañas.</b> Se ocultan en la bienvenida, la sesión en curso y el resumen (pantalla completa).</li>
</ol>`

const cards = shots
  .map(
    (s) => `<figure>
  <img src="data:image/png;base64,${fs.readFileSync(`${dir}/${s.file}.png`).toString('base64')}" alt="${esc(s.title)}" loading="lazy">
  <figcaption><b>${esc(s.title)}</b><span>${esc(s.why)}</span></figcaption>
</figure>`,
  )
  .join('\n')

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>MUTA · Pantallas</title>
<style>
  :root { color-scheme: light dark; --bg:#f4f4f5; --card:#fff; --label:#111113; --label-2:#6e6e73; }
  @media (prefers-color-scheme: dark) { :root { --bg:#000; --card:#1c1c1e; --label:#f2f2f7; --label-2:#98989f; } }
  body { margin:0; background:var(--bg); color:var(--label); font:15px/1.45 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  main { max-width:1200px; margin:0 auto; padding:24px 16px 64px; }
  h1 { font-size:28px; margin:0 0 4px; } .sub { color:var(--label-2); margin:0 0 24px; }
  section.logic { background:var(--card); border-radius:16px; padding:8px 20px 16px; margin-bottom:32px; }
  section.logic li { margin:6px 0; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:20px; }
  figure { margin:0; background:var(--card); border-radius:16px; overflow:hidden; display:flex; flex-direction:column; }
  figure img { width:100%; display:block; border-bottom:1px solid rgb(128 128 128 / 20%); }
  figcaption { padding:12px 14px 16px; display:flex; flex-direction:column; gap:6px; }
  figcaption span { color:var(--label-2); font-size:13px; }
</style></head>
<body><main>
<h1>MUTA · Todas las pantallas</h1>
<p class="sub">Capturas en un iPhone simulado, generadas el ${new Date().toLocaleDateString('es-ES')} con <code>npm run galeria</code>.</p>
<section class="logic">${LOGIC}</section>
<div class="grid">
${cards}
</div>
</main></body></html>`

fs.writeFileSync(`${dir}/galeria.html`, html)
console.log(`${dir}/galeria.html · ${shots.length} pantallas · ${(html.length / 1024 / 1024).toFixed(1)} MB`)
