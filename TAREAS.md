# Tareas

Se actualiza al terminar cada tarea (ver «Mantenimiento de la documentación» en [CLAUDE.md](CLAUDE.md)).

## Tarea actual

- **Rama `pantalla/sesion`** (sale de `pantalla/ver-sesion`): commit 712da0d con la sesión en curso, el resumen, la biblioteca
  (A16), las fichas del ejercicio y del músculo (A17–A21), los consejos de hoy (C10) y la hoja «Tu rutina» con «Cambiar de rutina»;
  encima, **sin commit**, los **datos reales**: Tu plan, Ver sesión, la sesión, el resumen y las fichas leen la rutina guardada y tus
  entrenos (`workouts`); la sesión que toca va por rotación, lo apuntado se guarda a cada serie y sigue al recargar, y al terminar
  se guarda y pasa a la siguiente (decisión 2026-11-03). Ya no hay `state/muestra/`. Verificado: `npm run check` (243 tests) y e2e 65 de 65.
  Unidos por alias 457 nombres de las rutinas con la biblioteca: el 76 % de los ejercicios tienen ficha (antes, el 22 %).
  «Cambiar ejercicio» propone los que hacen lo mismo (músculo y zona: estirado, acortado…) y cambia solo hoy o en tu plan.
  Ver sesión despliega cada ejercicio con su ficha en pequeño y lo sugerido se ve en gris («Sugerido, no lo dice la rutina: …»).
  Falta verlo en un móvil real.
- **Sustituciones de los documentos** (rutinas locales, rev 15): el 74 % de los ejercicios las traen (antes, el 48 %); ver
  [docs/datos.md](docs/datos.md). Faltan Women's Specialization y Comeback Bridge.
- **Explicaciones y biblioteca local**: las 1.140 explicaciones de los documentos traducidas (9.901 ejercicios las enseñan) y
  208 ejercicios originales de las rutinas en la biblioteca local, con su explicación («Cómo hacerlo · Del documento de …»).
- **Editar rutina (A11–A13)** hecha: reordenar, añadir, editar la pauta, copiar, quitar, cambiar por otro y volver a la rutina
  original, para todas las semanas (e2e 72 de 72). Falta: superserie y «cada serie distinta» (A14), que piden cambiar la sesión y el
  motor, y «Añadir un ejercicio» desde la ficha del músculo. Verlo en el móvil real.
- **Lo que falta de Entreno**: Tu rutina (A06) y Sesión: inicio (C00) siguen «pendientes»; editar consejos (A22–A25) y el «···» de la ficha; «No está en tu material» (el perfil no guarda
  el material); el consejo de prioridades; la imagen para compartir (hoy, texto);
  ficha para los 235 nombres de las rutinas que no tienen pareja en la biblioteca (`private/informes/ejercicios-sin-ficha.txt`):
  hay que añadirlos a la biblioteca con datos verificados. Las cuatro filas «Pronto» de la hoja «Tu rutina».
  Semana de descarga: solo si la rutina la pauta (decisión 2026-11-02).

- **Unir la rama `pantalla/estilo-blanco-negro` a `main`** (PR en GitHub, con la CI en verde): revisarla antes en un móvil real con
  `npm run dev` (grupos, selector de días, «!» de cada tarjeta, descansos). Hasta ahora solo se ha visto en el navegador simulado.
- Después, **arreglar la galería de capturas** (`npm run galeria`): espera el texto «Recomendadas para ti», que ya no existe en la app.
- Proteger la rama `main` en GitHub (Settings → Branches → exigir que la CI pase, job `check`). La hace el dueño del repositorio.

## Hecho

- Rama `pantalla/tu-plan` (commit 3e6659b, sin unir): Tu plan con el nuevo diseño y datos de prueba; e2e 11 de 11.
- Rama `pantalla/ver-sesion` (2026-11-02, sale de `pantalla/tu-plan`, sin unir): Ver sesión con datos de prueba: cabecera con el
  color de la sesión, gráfica del prototipo anterior con Tonelaje · Repeticiones · Duración, ejercicios sin foto que se despliegan con
  la última vez, «Empezar» fijo. El carrusel de Tu plan se arrastra con ratón. 152 tests, e2e 17 de 17. Falta verlo en el móvil y
  la lógica real.
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
  - Limpieza de lo que no tenía función (informe y generador de diseño obsoletos, estilos sin uso), con una sola fuente para el
    rango de días y la cuenta de rutinas. Verificado: `npm run check` (145 tests) y e2e (6 de 6).

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

- ¿Tercer descanso al final en «Cuerpo completo A/B» (el documento de conocimiento da un ejemplo con descanso doble)?
- ¿Se publica la app (hosting) antes o después de las pantallas de sesión?
