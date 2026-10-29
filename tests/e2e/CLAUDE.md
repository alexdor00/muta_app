# Recorridos y accesibilidad (`tests/e2e`)

Playwright en un iPhone 13 simulado, sobre la app construida **sin rutinas privadas** (como la CI).

- `bienvenida.spec.ts` — bienvenida completa, elegir rutina, detalle y empezar; guarda capturas en `capturas/` (ignoradas por git).
- `accesibilidad.spec.ts` — axe (WCAG 2 A y AA) en las pantallas reales y en `/dev/ui` (claro y oscuro). Falla ante fallos graves.
- `sistema-diseno.spec.ts` — las piezas de `/dev/ui` miden lo que dicen los tokens.
- `zz-galeria.spec.ts` — genera la galería de pantallas (solo local).

Convenciones: buscar por rol y nombre accesible (`getByRole`), no por clases. Un recorrido nuevo por pantalla nueva y su
prueba de accesibilidad. Las rutinas privadas no se prueban aquí: se miran a mano o con una sonda local.
