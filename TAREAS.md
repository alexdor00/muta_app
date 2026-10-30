# Tareas

Se actualiza al terminar cada tarea (ver «Mantenimiento de la documentación» en [CLAUDE.md](CLAUDE.md)).

## Tarea actual

- Revisar en el móvil (`npm run dev`) la rama `pantalla/estilo-blanco-negro` y unirla a `main`: grupos, selector de días,
  «!» de cada tarjeta y descansos. Aún no se ha visto a mano en un móvil real.
- Revisar «En casa · principiante · peso corporal»: sale como «Gimnasio» (afecta al filtro de equipamiento).
- Proteger la rama `main` en GitHub (Settings → Branches → exigir que la CI pase, job `check`). La hace el dueño del repositorio.

## Hecho

- Estructura por áreas con fronteras comprobadas por el linter, CI, 10 ADR y sistema de diseño (`tokens.css`).
- Bienvenida (A01–A04) y perfil guardado.
- Rutinas contrastadas con los documentos originales (ejercicios, orden, series, repeticiones).
- Detalle de rutina: esfuerzo en RIR, opcionales de MUTA, puntos débiles (Culturismo y Torso y pierna) con buscador por
  grupo muscular, indicaciones del documento, descansos en todas las rutinas, semanas plegables.
- Un solo sitio para los tipos de un programa; pantalla sin lógica; reglas de descanso en JSON; pruebas por módulo;
  `.gitattributes`; axe, size-limit y Lighthouse CI; documentación para trabajar con poco contexto.
- Documentación autosuficiente tras /clear: `docs/rediseno.md` (resumen del PDF de rediseño) y `docs/datos.md` (verificación y alta de rutinas).
- Rama `refactor/una-fuente-de-verdad` unida a `main` con la CI en verde (2026-10-29).
- Rama `pantalla/estilo-blanco-negro` (2026-10-30, 145 tests):
  - Paleta sin naranja (los degradados de las tarjetas siguen en color).
  - Cinco grupos verificados con los documentos originales: Hipertrofia (con MUTA y Esencial dentro), Powerbuilding,
    Powerlifting, Mujer y Vuelta al gimnasio. «Mantenimiento» no existe: el documento de Esencial dice hipertrofia con poco volumen.
  - Hipertrofia y Mujer con categorías con tarjeta; el resto, directo al selector de días. «!» en todas las tarjetas.
  - Filas cortas, filtros con días en círculos y equipamiento, nada desplegado al abrir una rutina.
  - Partes de una serie con la fase en el nombre (Fuerza e hipertrofia · fase 1–3, Hipertrofia · fase 1–2); En casa por nivel.
  - Descanso obligatorio donde se completa la vuelta al cuerpo (`restCycles.ts`) solo si el documento no dice nada.
  - Textos de descanso más cortos y datos corregidos (revisión 14 de las rutinas locales).

## Pendiente (por prioridad)

1. Pantallas de Entreno sin diseño: Tu plan, Tu rutina, sesión (C00–C03, C07, C08, C24), ficha del ejercicio.
2. Marcar en la app los datos rellenados o estimados (no vienen del original).
3. Coach: usar las elecciones guardadas (prioridades, puntos débiles) y `adaptVolume`.
4. Editor de rutina (reordenar, enlazar superseries, aplicar las reglas del documento).
5. Importar/exportar copia de seguridad en CSV/JSON desde Perfil.
6. Áreas Hoy, Comida y Progreso (cuando haya diseño aprobado).
7. Fotos de categoría y miniaturas de ejercicio.
8. Quitar el número de días del nombre de otras rutinas (Esencial, Frecuencia alta, PPL, Vuelta al gimnasio) si se quiere el
   mismo criterio que en Powerbuilding.

## Dudas abiertas

- ¿Descanso «sugerido» u «obligatorio» en las rutinas de «Esencial» cuyo original dice «sugerido»? Ahora se respeta lo que dice el original.
- ¿Tercer descanso al final en «Cuerpo completo A/B» (el documento de conocimiento da un ejemplo con descanso doble)?
- ¿Se publica la app (hosting) antes o después de las pantallas de sesión?
