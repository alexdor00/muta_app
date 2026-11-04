# Tareas

Se actualiza al terminar cada tarea (ver «Mantenimiento de la documentación» en [CLAUDE.md](CLAUDE.md)).

## Tarea actual

- **Probar la rama `pantalla/sesion` en un móvil real** con `npm run dev` (dirección «Network», mismo wifi): Tu plan (tarjetas
  con «▶ Empezar», «Editar», Tu semana, Hoy descansas), Editar rutina, la sesión (teclado, dropsets, notas), Ver sesión y las
  fichas. Hasta ahora todo se ha visto solo en el móvil simulado. Después, PR a `main` con la CI en verde.
- **Entreno está completo.** Siguiente área, en el orden del documento de rediseño (Entreno → Bienvenida → **Hoy** →
  Progreso → Comida): **Hoy**. Primero el PNG con sus funcionalidades y las capturas del prototipo que le corresponden, y
  esperar a que se apruebe (regla de CLAUDE.md); después, su rama `pantalla/hoy`.
- **Datos**: sustituciones de Women's Specialization y Comeback Bridge (a mano, de sus PDF; ver [docs/datos.md](docs/datos.md));
  ficha para los nombres de las rutinas sin pareja en la biblioteca (`private/informes/ejercicios-sin-ficha.txt`), con datos
  verificados.
- **Unir la rama `pantalla/estilo-blanco-negro` a `main`** (PR en GitHub, con la CI en verde): revisarla antes en un móvil real con
  `npm run dev` (grupos, selector de días, «!» de cada tarjeta, descansos). Hasta ahora solo se ha visto en el navegador simulado.
- Después, **arreglar la galería de capturas** (`npm run galeria`): espera el texto «Recomendadas para ti», que ya no existe en la app.
- Proteger la rama `main` en GitHub (Settings → Branches → exigir que la CI pase, job `check`). La hace el dueño del repositorio.

## Hecho

- Rama `pantalla/sesion` (2026-11-03/04, sin unir; último commit en `git log`). Verificado: `npm run check` y los e2e.
  - Datos reales en todo Entreno: Tu plan, Ver sesión, la sesión, el resumen y las fichas leen tu plan y tus entrenos; la sesión
    va por rotación, se guarda a cada serie y al terminar pasa a la siguiente.
  - Biblioteca: alias de 457 nombres, ejercicios originales de las rutinas (biblioteca local, sin duplicados, los de MUTA
    primero) con su explicación (traducida o, para 25, de una web con su fuente); sustituciones de los documentos.
  - Cada serie distinta y superserie (A14): «4 · 6 · 8» con un interruptor por ejercicio; A1/A2 unidas en Editar rutina
    («Superserie con») y alternas en la sesión, 20 s entre las dos.
  - Los discos del gimnasio (en Tu material y en la calculadora): la calculadora solo usa los que hay.
  - Lo último de Entreno: el «···» de la ficha (añadir a una sesión con «Deshacer», cambiar en tu plan), «Tu material» en
    Perfil (lo que no tienes, al final y en gris en la biblioteca y al cambiar) y la imagen para compartir el resumen (C25).
    Tu rutina (A06) y C00 no se hacen (ver [decisiones](docs/decisiones.md)). Cada serie es una fila gris; la hecha, más oscura.
  - Editar rutina (A11–A13), minimalista: «Tu semana» con sesiones y descansos, nombre y foto de cada sesión, ejercicios con
    − / + que se guardan solos, «Repeticiones antes del fallo», el entrenador (consejos y cobertura del método) en su hoja.
  - Tu plan: tarjetas a todo el ancho con «▶ Empezar», «Editar» en la cabecera, Tu semana con lo planeado y ✓, «Hoy
    descansas» con «Entrenar igualmente»; tu rutina desde un CSV en Elegir rutina.
  - Sesión: tus notas para siempre (también en la ficha), «···» en cuadrícula, dropsets y rest-pause, consejos que se ocultan.
  - Ver sesión: el cambio de cada ejercicio frente a la vez anterior y «N de M suben». Ficha: gráficas de 1RM estimado y
    tonelaje total; repeticiones de tu plan, tu rutina o típicas, diciendo de dónde salen.
  - Decisiones con fecha en [docs/decisiones.md](docs/decisiones.md); detalle de cada pieza en
    [src/features/training/CLAUDE.md](src/features/training/CLAUDE.md).
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

1. Hoy, Progreso y Comida, en ese orden (cada una con su PNG aprobado antes).
2. Marcar los datos rellenados o estimados en las pantallas que aún no lo hacen (Ver sesión y la sesión ya dicen «Sugerido»).
3. Coach: usar las elecciones guardadas (prioridades, puntos débiles) y `adaptVolume`.
4. Importar/exportar copia de seguridad en CSV/JSON desde Perfil.
5. Fotos de categoría y miniaturas de ejercicio.
6. Quitar el número de días del nombre de otras rutinas (Esencial, Frecuencia alta, PPL, Vuelta al gimnasio) si se quiere el
   mismo criterio que en Powerbuilding.

## Dudas abiertas

- ¿Tercer descanso al final en «Cuerpo completo A/B» (el documento de conocimiento da un ejemplo con descanso doble)?
- ¿Se publica la app (hosting) antes o después de las pantallas de sesión?
