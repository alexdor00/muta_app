# Tareas

Se actualiza al terminar cada tarea (ver «Mantenimiento de la documentación» en [CLAUDE.md](CLAUDE.md)).

## Tarea actual

- **Rama `pantalla/sesion`** (sale de `pantalla/ver-sesion`, sin commit): sesión en curso con datos de prueba y las funcionalidades del prototipo
  anterior de esta pantalla (ver `Desktop\MUTA-C01-sesion-todas-funcionalidades.png`): la vez anterior en gris, teclado propio, descanso,
  récord, calentamiento calculado (`domain/warmup.ts`), validación, deslizar o mantener pulsado para eliminar (con «Deshacer»),
  plegar al terminar, pausa al tocar el tiempo, «···» (cambiar hoy, nota, discos, cronómetro), descanso abajo solo con Saltar y la tarjeta final al terminar.
  Hechas también «Esta sesión», tiempo, descanso del ejercicio, cambiar de sesión y descartar (C08, C09, C18, C20, C21).
  Falta: guardar en IndexedDB, añadir ejercicio y consejos de hoy (sin biblioteca ni textos), la ficha del ejercicio y la imagen
  para compartir (hoy comparte texto). Sin datos de prueba para
  «La clave», nota ni superserie. Semana de descarga: solo si la rutina la pauta (decisión 2026-11-02).
- **Biblioteca de ejercicios (A16)**, en la misma rama y sin commit: los 141 ejercicios del prototipo anterior, sacados con
  `scripts/exercises-from-prototype.cjs` a `src/shared/content/exercises.json` (con su prueba), buscador sin tildes y filtro por
  músculo. Se abre desde «Tu rutina» y cada ejercicio lleva a su ficha. Falta «No está en tu material»: el perfil aún no guarda el material.
- **Ficha del músculo (A17–A21)**, sin commit: barra recta del rango con el punto naranja de tu plan, Mantener · Desarrollar ·
  Prioridad y a mano, dónde lo entrenas y Consejos (sacados del prototipo). Sin énfasis. Falta: «Añadir un ejercicio» (con Editar
  rutina, A11), editar y añadir consejos (A22–A23) y guardar lo elegido en el plan real. También: barra del descanso a lo ancho y
  consejos de Ver sesión plegados.
- **Consejos de hoy (C10)**, sin commit: en Ver sesión (tarjeta), en la sesión (aviso que se va al empezar) y en «Esta sesión»;
  «Para esta sesión» según los ejercicios de hoy y los 9 de antes de empezar con casilla; «Invertir hoy» y «Hacer ahora» cambian el
  orden solo hoy; «Mostrar al empezar», desactivado. La ficha avisa si la última vez y la anterior el ejercicio iba en otro puesto.
  Arreglado: descartar ya no deja otra sesión vacía contando; soltar el dedo fuera de la fila (el teclado se abre debajo)
  ya no borra la serie por «mantener pulsado». Falta: el consejo de prioridades (cuando la sesión lea el plan real) y
  «Editar consejos» (A22–A25).
- **La sesión usa el motor y la biblioteca**, sin commit: los kilos de hoy salen de la doble progresión (ya no hay kilos a mano),
  «Añadir ejercicio» (C19) añade uno de la biblioteca solo para hoy y «Cambiar ejercicio» deja elegir cualquiera, filtrado por su
  músculo.
- **Ficha del ejercicio** (diseño del 2026-11-02, sin foto), en la misma rama y sin commit: nombre, músculos y pauta, la clave
  (sin siglas: `plainEffort`), peso sugerido con el **motor de doble progresión** (`domain/progression.ts`), gráfica Máximo ·
  Volumen con historial de prueba, músculos en el muñeco, descanso (lista y −15/+15, para todas las sesiones) y, desde la sesión,
  «Empezar ejercicio», que vuelve con ese ejercicio abierto. Sin «···» (cabecera y la clave): editar consejos aún no existe.

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
