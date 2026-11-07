# Recorridos y accesibilidad (`tests/e2e`)

Playwright en un iPhone 13 simulado, sobre la app construida **sin rutinas privadas** (como la CI).

- `bienvenida.spec.ts` — bienvenida completa, elegir rutina, detalle y empezar; guarda capturas en `capturas/` (ignoradas por git).
- `plan.ts` — punto de partida de los recorridos de Entreno: perfil, rutina MUTA Cuerpo completo guardada, toca B1 y un
  historial escrito a mano (B1 hace 7, 14 y 21 días). Los recorridos de Entreno importan `test` de aquí, no de Playwright.
- `tu-plan.spec.ts` — Tu plan con tu plan: carrusel y «Empezar», hoja Tu rutina, tocar un músculo, barra al bajar, sin rutina.
- `ver-sesion.spec.ts` — Ver sesión: abrirla desde la tarjeta, gráfica y su medida, desplegar un ejercicio, sesión que no existe.
- `sesion.spec.ts` — sesión en curso: la vez anterior en gris, teclado, descanso, récord, números imposibles, calentamiento calculado, plegar al terminar, deslizar para eliminar (con ratón), «Terminar» sin series, «Esta sesión» y sus hojas, cambiar el descanso, el resumen, lo apuntado sigue al recargar y terminar guarda y pasa a la siguiente.
- `superserie.spec.ts` — cada serie distinta, superserie y técnica de intensidad con una rutina CSV: Editar rutina y la sesión.
- `ficha-mas.spec.ts` — el «···» de la ficha (añadir a una sesión con «Deshacer», cambiar en tu plan), tu material en Perfil
  (lo que no tienes, al final; los discos del gimnasio en la calculadora) y la imagen para compartir el resumen.
- `comida.spec.ts` — Comida con datos de prueba escritos a mano: calcular tu objetivo, añadir con su ración y «Deshacer»,
  solo kcal y proteína, repetir lo de ayer, la semana y tu peso, la sugerencia del entrenador (aplicar, deshacer, «Ahora no»)
  y axe en sus pantallas y hojas (con capturas en `capturas/`).
- `recetas.spec.ts` — Recetas y Menú sin el recetario privado (salen los platos «De ejemplo»): ajustar un plato a lo que
  falta y apuntarlo, un plato en el menú con cuándo cocinarlo, lo de hoy, la compra del menú, cuadrar el día y axe.
- `accesibilidad.spec.ts` — axe (WCAG 2 A y AA) en las pantallas reales y en `/dev/ui` (claro y oscuro). Falla ante fallos graves.
- `sistema-diseno.spec.ts` — las piezas de `/dev/ui` miden lo que dicen los tokens.
- `zz-galeria.spec.ts` — genera la galería de pantallas (solo local).

Convenciones: buscar por rol y nombre accesible (`getByRole`), no por clases. Un recorrido nuevo por pantalla nueva y su
prueba de accesibilidad. Las rutinas privadas no se prueban aquí: se miran a mano o con una sonda local.

Todos los recorridos usan `test` (o `testGuardando`) de `plan.ts`: van **como el móvil por la wifi** (sin https: sin
`crypto.randomUUID`) y recargar o cambiar de página espera a que IndexedDB termine de guardar. Antes de medir (axe o tamaños) con una hoja abierta, `sinAnimaciones(page)` de `plan.ts`.
