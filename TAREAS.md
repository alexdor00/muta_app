# Tareas

Se actualiza al terminar cada tarea (ver «Mantenimiento de la documentación» en [CLAUDE.md](CLAUDE.md)).

## Tarea actual

- Cerrar la rama `refactor/una-fuente-de-verdad`: pasar la CI, unirla a `main` y decidir la protección de la rama principal.

## Hecho

- Estructura por áreas con fronteras comprobadas por el linter, CI, 10 ADR y sistema de diseño (`tokens.css`).
- Bienvenida (A01–A04) y perfil guardado.
- Elegir rutina: 40 rutinas en 10 tipos (las carpetas originales), «!» con de qué trata cada una, filtros, guardadas.
- Rutinas contrastadas con los documentos originales (ejercicios, orden, series, repeticiones).
- Detalle de rutina: esfuerzo en RIR, opcionales de MUTA, puntos débiles (Culturismo y Torso y pierna) con buscador por
  grupo muscular, indicaciones del documento, descansos en todas las rutinas, semanas plegables.
- Un solo sitio para los tipos de un programa; pantalla sin lógica; reglas de descanso en JSON; pruebas por módulo
  (112 tests); `.gitattributes`; axe, size-limit y Lighthouse CI; documentación para trabajar con poco contexto.
- Rama `refactor/una-fuente-de-verdad` unida a `main` con la CI en verde (2026-10-29).

## Pendiente (por prioridad)

1. Pantallas de Entreno sin diseño: Tu plan, Tu rutina, sesión (C00–C03, C07, C08, C24), ficha del ejercicio.
2. Marcar en la app los datos rellenados o estimados (no vienen del original).
3. Coach: usar las elecciones guardadas (prioridades, puntos débiles) y `adaptVolume`.
4. Editor de rutina (reordenar, enlazar superseries, aplicar las reglas del documento).
5. Importar/exportar copia de seguridad en CSV/JSON desde Perfil.
6. Áreas Hoy, Comida y Progreso (cuando haya diseño aprobado).
7. Fotos de categoría y miniaturas de ejercicio.
8. Revisar el contraste del texto naranja pequeño (etiqueta «Recomendada»): no llega a 4,5:1 en claro.

## Dudas abiertas

- ¿Descanso «sugerido» u «obligatorio» en las rutinas de «Esencial» cuyo original dice «sugerido»? Ahora se respeta lo que dice el original.
- ¿Tercer descanso al final en «Cuerpo completo A/B» (el documento de conocimiento da un ejemplo con descanso doble)?
- ¿Se publica la app (hosting) antes o después de las pantallas de sesión?
