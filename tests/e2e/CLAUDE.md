# Recorridos y accesibilidad (`tests/e2e`)

Playwright en un iPhone 13 simulado, sobre la app construida **sin rutinas privadas** (como la CI).

- `bienvenida.spec.ts` — bienvenida completa (con los pasos de comida: tus datos y tu objetivo, que queda guardado), saltar la comida con «Ahora no, solo entreno», elegir rutina, detalle y empezar; guarda capturas en `capturas/` (ignoradas por git).
- `plan.ts` — punto de partida de los recorridos de Entreno: perfil, rutina MUTA Cuerpo completo guardada, toca B1 y un
  historial escrito a mano (B1 hace 7, 14 y 21 días). Los recorridos de Entreno importan `test` de aquí, no de Playwright.
- `tu-plan.spec.ts` — Tu plan con tu plan: carrusel y «Empezar», hoja Tu rutina, tocar un músculo, barra al bajar, sin rutina.
- `ver-sesion.spec.ts` — Ver sesión: abrirla desde la tarjeta, gráfica y su medida, desplegar un ejercicio, sesión que no existe.
- `sesion.spec.ts` — sesión en curso: la vez anterior en gris, teclado, descanso, récord, números imposibles, calentamiento calculado, plegar al terminar, deslizar para eliminar (con ratón), «Terminar» sin series, «Esta sesión» y sus hojas, cambiar el descanso, el resumen, lo apuntado sigue al recargar y terminar guarda y pasa a la siguiente.
- `fin-de-rutina.spec.ts` — terminar una rutina con semanas contadas (una de 2 semanas escrita a mano): el aviso en el resumen y en Tu plan, «Repetirla» (otra etapa, «· vuelta 2», que se compara con la anterior a la misma semana desde la hoja de la etapa), «Ahora no», «Me faltó un ejercicio» lo quita, las de MUTA no terminan, con una sola etapa no se compara y un CSV repetido pregunta si es tu rutina de antes (capturas `fin-*.png`). Usa `testGuardando` (sin el plan de prueba de MUTA, que mezclaría sus entrenos).
- `superserie.spec.ts` — cada serie distinta, superserie y técnica de intensidad con una rutina CSV: Editar rutina y la sesión.
- `ficha-mas.spec.ts` — los discos del gimnasio en la calculadora (solo se usan los que hay y se recuerdan) y la imagen para
  compartir el resumen.
- `copia.spec.ts` — tu copia de seguridad: guardarla (se descarga), recuperarla en un móvil vacío (se ve qué trae y vuelven
  tus entrenos), un archivo que no es una copia y el cuadro al abrir la app (a la semana sin copia; «Ahora no», un mes; recién empezado, no).
- `comida.spec.ts` — Comida con datos de prueba escritos a mano: calcular tu objetivo, añadir con su ración y «Deshacer»,
  solo kcal y proteína, repetir lo de ayer, la semana y tu peso, la sugerencia del entrenador (aplicar, deshacer, «Ahora no»)
  y axe en sus pantallas y hojas (con capturas en `capturas/`).
- `progreso.spec.ts` — Progreso mes a mes: sin datos (dónde empezar); lo que toca en Hoy (la hoja del mes con medidas y foto);
  tu mes (Días y la pantalla de un día con cada serie frente a la vez anterior, Cuerpo con su foto, una medida en su gráfica y la composición con su calibración, Fuerza por
  grupo y la hoja de la etapa con constancia, músculos, rutina y comida; sigue al recargar); renombrar, empezar otra y
  comparar; una medida imposible; las fotos del mes con la cámara (sin cámara en la prueba: de la galería, postura a
  postura); axe y capturas `progreso*.png`.
- `logro.spec.ts` — tu logro y tu premio con el perfil de `/dev/demo`: el premio al cumplir tu grasa objetivo (con tu antes y después por postura, axe, «Guardar en Fotos» descarga `muta-premio.png`), al volver a una pestaña el logro de una etapa que acabó, «Tu premio» desde la hoja de la etapa y sin objetivo cumplido no hay premio (capturas `premio.png`, `logro.png`).
- `demo.spec.ts` — el perfil de prueba de `/dev/demo` se carga y se ve en Progreso (Días y un día, Cuerpo con la foto partida y «Ver tu cambio», Fuerza con un ejercicio abierto y la etapa) y en Hoy (capturas `demo-*.png`).
- `recetas.spec.ts` — Recetas y Menú sin el recetario privado (salen los platos «De ejemplo»):
  apuntar un plato con su hoja, un plato en el menú y su tick en Hoy, la compra del menú, quitar un ingrediente de la receta
  (con «Deshacer»), tus menús por días de la semana, cuadrar el día y axe.
- `semana-resuelta.spec.ts` — tu semana resuelta (piloto de compra y cocina): elegir el día de la compra y cocinar hoy,
  verla en Mi plan · Cocina y en Hoy, tachar en la compra (sin despensa), el modo cocina hasta «Hecho» y pasar a hoy una tanda que no
  hiciste; axe en cada pantalla. `nutricion.ts` — un perfil con su objetivo y escribir tu menú (lo usan las de Nutrición).
- `accesibilidad.spec.ts` — axe (WCAG 2 A y AA) en las pantallas reales y en `/dev/ui` (claro y oscuro). Falla ante fallos graves.
- `sistema-diseno.spec.ts` — las piezas de `/dev/ui` miden lo que dicen los tokens.
- `zz-galeria.spec.ts` — genera la galería de pantallas (solo local).

Convenciones: buscar por rol y nombre accesible (`getByRole`), no por clases. Un recorrido nuevo por pantalla nueva y su
prueba de accesibilidad. Las rutinas privadas no se prueban aquí: se miran a mano o con una sonda local.

Todos los recorridos usan `test` (o `testGuardando`) de `plan.ts`: van **como el móvil por la wifi** (sin https: sin
`crypto.randomUUID`) y recargar o cambiar de página espera a que IndexedDB termine de guardar. Antes de medir (axe o tamaños) con una hoja abierta, `sinAnimaciones(page)` de `plan.ts`.
