# MUTA

App de entrenamiento instalable (PWA) en español. Se construye pantalla a pantalla siguiendo el documento
de rediseño; hoy está hecha el área **Entreno** (elegir rutina y ver su detalle) y la **bienvenida**.
Repositorio público: `alexdor00/muta_app`. Cómo trabajar con ella: ver «Reglas globales».

## Stack

Preact + TypeScript + Vite · `@preact/signals` (estado) · `preact-iso` (rutas) · `idb` (IndexedDB) ·
CSS Modules + `tokens.css` · Vitest · Playwright (+ axe) · ESLint (fronteras) · Stylelint · Prettier ·
size-limit · Lighthouse CI · Node 24.

## Comandos

| Para                                         | Comando                                                     |
| -------------------------------------------- | ----------------------------------------------------------- |
| Servidor de desarrollo (móvil por wifi)      | `npm run dev`                                               |
| Todas las comprobaciones locales             | `npm run check` (formato, linter, CSS, tipos, tests, build) |
| Pruebas unitarias                            | `npm test` (o `npx vitest run <archivo>`)                   |
| Recorridos y accesibilidad en móvil simulado | `npm run e2e`                                               |
| Tamaño y reglas del proyecto                 | `npm run size` · `npm run guardas`                          |
| Rendimiento y accesibilidad (Lighthouse)     | `npm run lighthouse` (tras `npm run build`)                 |
| Formato                                      | `npm run format`                                            |

Los e2e se construyen sin las rutinas privadas (`VITE_NO_LOCAL_PROGRAMS=1`), igual que la CI.

## Mapa de módulos (cada uno con su CLAUDE.md si lleva uno)

- `src/app/` — arranque, rutas, pestañas, pantalla de error, actualizaciones → [CLAUDE.md](src/app/CLAUDE.md)
- `src/features/training/` — **Entreno**: catálogo, detalle de rutina, elecciones → [CLAUDE.md](src/features/training/CLAUDE.md)
- `src/features/profile/` — bienvenida y perfil → [CLAUDE.md](src/features/profile/CLAUDE.md)
- `src/features/today|nutrition|progress/` — Hoy, Comida, Progreso: solo pantallas «pendientes» todavía
- `src/shared/` — lo común: `ui`, `data`, `content`, `platform`, `lib` → [CLAUDE.md](src/shared/CLAUDE.md)
- `tests/e2e/` — recorridos, accesibilidad y capturas → [CLAUDE.md](tests/e2e/CLAUDE.md)
- `scripts/` — generadores de contenido y documentos (no forman parte de la app)
- `private/` — rutinas de terceros y documentos originales: **fuera de git**
- `docs/` — documentación (ver abajo)

## Documentación de detalle

- [Arquitectura y flujo de datos](docs/arquitectura.md)
- [Diseño: resumen del documento de rediseño](docs/rediseno.md): pantallas pendientes, sistema de diseño, checklist
- [Datos de las rutinas](docs/datos.md): cómo se verifican y cómo se añade una rutina sin inventar
- [Decisiones técnicas](docs/decisiones.md) y [notas ADR](docs/adr/README.md)
- [Reglas y conocimiento de entrenamiento](docs/conocimiento/README.md) · [Diseños](docs/diseno/)
- [Tareas](TAREAS.md): qué está hecho, qué toca ahora y qué falta

## Al empezar una sesión (también tras /clear)

Leer este archivo, `TAREAS.md` y el `CLAUDE.md` del módulo; resumir en cinco líneas qué hay hecho, la tarea actual y las dudas abiertas, y esperar.

## Reglas globales

1. **No inventar.** Ejercicios, orden, series, repeticiones y textos salen de los documentos originales o de
   `docs/conocimiento`. Si un dato no está, se dice y se pregunta; lo que se rellena por costumbre se marca
   como «sugerido».
2. Todo en **español** (interfaz, comentarios, commits, respuestas). Esfuerzo en **RIR**, no RPE.
3. **Un dato, una fuente.** Los tipos de un programa viven solo en `domain/program.ts`. Antes de crear un tipo,
   función o constante, buscar si ya existe (`npm run guardas` falla con duplicados).
4. **Nada se sobrescribe**: una función se cambia en su archivo, no se envuelve desde otro; sin `as never`/`any`.
5. Dependencias entre capas: pantallas → casos de uso → dominio; las pantallas solo pintan y llaman casos de uso.
   El linter rechaza un import prohibido (`eslint.config.js`).
6. Estilos solo con variables de `tokens.css`: sin colores ni tamaños a mano, sin `!important`.
7. Los datos de terceros (`private/`) no se suben ni se copian a `src/`; sin nombres de personas en la app.
8. Un cambio = una rama (`refactor/…`, `pantalla/…`), un commit con sentido y todo en verde antes de unirlo.
9. Pantalla nueva: sin diseño aprobado no se programa. Ver el checklist del documento de rediseño.

## Mantenimiento de la documentación

- Módulo nuevo → añadirlo al mapa de arriba y crear su `CLAUDE.md`.
- Cambia una convención de un módulo → actualizar el `CLAUDE.md` de ese módulo, no este.
- Cambia el flujo entre módulos → actualizar `docs/arquitectura.md`.
- Decisión técnica relevante → añadirla a `docs/decisiones.md` con fecha y motivo (y, si es grande, una nota nueva
  en `docs/adr/`; las antiguas no se borran: se sustituyen con otra nota).
- Al terminar cada tarea → actualizar `TAREAS.md` (mover a «Hecho» y definir la tarea actual).
- Mantener este archivo **por debajo de 120 líneas**: si crece, el detalle pasa a `docs/`.
- No duplicar información entre archivos: enlazarla.
- Si no está claro dónde va algo, preguntar antes de escribirlo.
- `npm run guardas` comprueba lo mecánico (existencia de los CLAUDE.md, límite de líneas, enlaces).
