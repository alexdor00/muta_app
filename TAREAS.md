# Tareas

Se actualiza al terminar cada tarea (ver «Mantenimiento de la documentación» en [CLAUDE.md](CLAUDE.md)).

## Tarea actual

- **Guía de culturismo natural**: los 23 choques ya están decididos ([04](docs/conocimiento/04-guia-culturismo-natural.md) §14). Falta
  lo optativo (kcal ON/OFF, ritmo de definición por fases), la frecuencia por persona (ciclos de 9 o 14 días) y Hoy y
  Progreso (check diario, perímetros). Plan completo en
  `Desktop/MUTA-guia-aplicacion.docx`.
- **Probar Recetas y Menú en un móvil real** (rama `pantalla/recetas`, sale de `pantalla/comida-v2`) con `npm run dev`:
  el recetario con sus fotos, ajustar un plato a lo que falta (y cuando no llega), cuadrar el día, tu producto, tu menú,
  cuándo cocinar, lo de hoy, la compra del menú, los avisos al calendario (.ics) y tu nutricionista. Después, PR a `main`
  detrás de los anteriores.
- **Probar Comida en un móvil real** (rama `pantalla/comida-v2`, sale de `pantalla/comida`): el día con ‹ ›, añadir, la
  ración, el peso de hoy y Tu objetivo; en Dieta, la de ejemplo o la tuya, apuntar del menú, una receta (intercambio y editar), la
  compra, la cocina, la consulta y el escáner con la cámara (necesita https o la red local; Open Food Facts, internet).
  Después, PR a `main` (detrás de los de `pantalla/sesion` y `pantalla/comida`).
- **Dudas de Comida que siguen abiertas**: ¿una dieta de verdad para cargar (o se crea en la app)? ¿La consulta se queda en
  Comida o pasa a Hoy cuando exista? ¿Una fuente para cuánto aguanta lo cocinado en la nevera?
- **Probar la rama `pantalla/sesion` en un móvil real** con `npm run dev` (dirección «Network», mismo wifi): Tu plan (tarjetas
  con «▶ Empezar», «Editar», Tu semana, Hoy descansas), Editar rutina, la sesión (teclado, dropsets, notas), Ver sesión y las
  fichas. Hasta ahora todo se ha visto solo en el móvil simulado. Después, PR a `main` con la CI en verde.
- **Entreno y Comida están hechas.** Siguiente área: **Hoy** (luego Progreso). Primero el PNG con sus funcionalidades y las
  capturas del prototipo que le corresponden, y esperar a que se apruebe (regla de CLAUDE.md); después, su rama `pantalla/hoy`.
  Hoy ya lleva tu peso y lo de hoy (de Comida, por su `index.ts`); el resto, con su diseño.
- **Unir `pantalla/estilo-blanco-negro` a `main`**: comprobada (check y e2e en verde, 2026-11-05) y subida; `main` solo acepta
  PR. Abrir el PR en https://github.com/alexdor00/muta_app/compare/main...pantalla/estilo-blanco-negro y unirlo con la CI en verde.

## Hecho

- 2026-11-09 (rama `pantalla/recetas`): el entrenador sigue el paso a paso de la guía con el segundo cuestionario: mejorar
  = más kilos o reps, solo cuenta con el RIR apuntado, 3 semanas mejorando para subir, un músculo y una serie cada vez (2
  como mucho), estancado → menos intensidad y luego −1 serie, y las kcal fuera del entrenador.

- 2026-11-09 (rama `pantalla/recetas`): reglas del entrenador decididas con un cuestionario (doble progresión, 80 %
  sugerido, recuperar = no ir peor en el 10 %, 2 músculos por semana, Mantener no sube, «No me interesa», estancado por
  pasos) y se quita «Prepárate» del descanso.

- 2026-11-09 (rama `pantalla/recetas`): la guía en Entreno: «Tu entrenador» en Tu plan (% de series que mejoras y
  +1 serie con «Aplicar»), RIR progresivo por serie, «Fallo» en el teclado, RIR guardado en cada serie, aviso de técnicas en definición, orden de pierna, revisar la técnica antes de cambiar y 14 consejos nuevos.

- 2026-11-08 (rama `pantalla/recetas`): guía de culturismo natural completa en el conocimiento y, en la app, lo
  decidido: esfuerzo siempre en RIR, proteína hasta ~2 g/kg, la consulta ya no sube la proteína al final y sugiere
  recargas, la revisión de volumen mira tu fuerza, 12.000–15.000 pasos si puedes, biblioteca en 5–12 repeticiones y dos
  consejos (dorsal y parciales).

- 2026-11-08 (rama `pantalla/recetas`): proteína y grasa por kilo o en gramos en «Tu objetivo», con lo que dicen
  tus documentos y un aviso si te sales; los hidratos, lo que queda.

- 2026-11-08 (rama `pantalla/recetas`): Tu plan más pequeño y claro (objetivo con «Editar», el aviso del nutricionista
  dentro del menú, Herramientas con nombres claros, la dieta bajo los menús) y, en Cocina, el arroz en crudo y cocido.

- 2026-11-08 (rama `pantalla/recetas`): **Comida pasa a ser Nutrición**: abre en tu día (el día dentro de la tarjeta,
  «Para la cena» y «Ver todas las recetas»), «Tu plan» reúne objetivo, menús y dieta, y la cabecera es como la de Entreno.

- 2026-11-08 (rama `pantalla/recetas`): quitar deslizando (comidas de Hoy, lo apuntado y los platos del menú; el
  plato del menú, solo ese día) y «De lo que sueles comer» en Añadir, que aprende de dos semanas de apuntes.

- 2026-11-07 (rama `pantalla/recetas`): desde el menú, el botón principal pone la receta en el menú; en Hoy manda tu
  menú sobre la dieta y se apunta otra cosa con «+»; la compra con emoticonos, de qué menú sale cada cosa y añadir lo tuyo arriba.

- 2026-11-07 (rama `pantalla/recetas`): repaso de las 53 pantallas y hojas de Comida con capturas (ver decisiones):
  compra por menús en ×1, el aviso no tapa otras hojas, opciones visibles sobre tarjetas, títulos de hoja iguales, apuntar el
  plato del menú desde su comida, categoría con foto, compra con barra de progreso.

- 2026-11-07 (rama `pantalla/recetas`): la hoja «Cocinar» (la lista «Para» salía amontonada: usaba la clase del tick);
  ajustar sin mover verduras ni salsas; lo cocido dice cuánto es en crudo; la compra por pasillos; cambiar un ingrediente
  «solo este día» al apuntar (y para siempre desde el menú); párrafos justificados. La hoja de una comida: sus cuatro cifras en tarjeta, la fila de lo apuntado bien (la flecha sin tamaño se comía el ancho) y sin «0 g» en los platos.

- 2026-11-07 (rama `pantalla/recetas`): **en el móvil por la wifi no se guardaba nada nuevo** (sin https no hay
  `crypto.randomUUID`): ahora `nuevoId()` en `shared/lib/id.ts`, el linter lo exige y los recorridos van sin https. Tus
  datos preguntan qué quieres (definir, mantenerte o volumen); acepta la altura en metros. «Hoy comes» en la pestaña Hoy. Los
  campos de Cocina se ven; la compra con línea bajo cada sección; los productos de supermercado se dicen en gramos
  («100 g», no «1 100 g»); la consulta sin dieta lleva a cargarla.

- Rama `pantalla/recetas` (2026-11-06, sin unir): recetas que se ajustan y tu menú. Diseños aprobados
  `Desktop/MUTA-Recetas-funcionalidades.png` y `Desktop/MUTA-Menu-funcionalidades.png`.
  - El recetario (100 recetas, 6 categorías, una foto por receta sin manos) en `private/recetas`, fuera de git; sin él, los
    platos de ejemplo. Cifras del libro; al cambiar gramos, la diferencia con la base. 97 de 100 se ajustan.
  - Un plato: ajustar a lo que falta (repartido o todo en una comida; si no llega, hasta dónde y salidas), tu producto (tu
    arroz, tu hummus: en todos tus platos o en uno), al menú y a tu dieta. Cuadrar el día con recetas desde Hoy.
  - Comida · Menú (en el sitio de Dieta): la semana con un plato por comida, platos tuyos, cuándo cocinar (día, hora, para
    qué comidas y los gramos de todo), cuadrar la semana, la compra del menú, avisos al calendario y tu nutricionista (propone
    por proteína y kcal; «Aplicar», «Ahora no», «Deshacer»). Lo de hoy, arriba en Comida · Hoy.
  - Más sencilla (diseño `Desktop/MUTA-Comida-sencilla-funcionalidades.png`): tus menús A, B, C… (1 a 7) en desplegables
    con sus fotos y tu semana; en Hoy, el plato del menú con su tick; cambiar un ingrediente por tu marca u otro alimento
    equivalente; la compra en desplegables; filtros claros; el peso y lo de hoy, en la pestaña Hoy.
  - El recetario subido al repositorio (decisión del usuario). Base de 19.157 productos de supermercado (Open Food Facts) y
    el escáner que reconoce lo que ya está; la compra por menús; cantidades «para tu objetivo» o «como en la receta»;
    «+ Añadir menú»; categorías al elegir un plato; la calculadora «Pesa en crudo, come cocinado» en Cocina; tu versión de
    un plato (editarlo) y pasar los menús de tu dieta a tus menús. Comida, completa respecto al prototipo anterior.
  - Decisiones en [docs/decisiones.md](docs/decisiones.md) (2026-11-06) y cómo se rehace el recetario en
    [docs/datos.md](docs/datos.md).
- Rama `pantalla/comida-v2` (2026-11-05, sin unir): Comida versiones 2 y 3. Verificado: `npm run check` (421 pruebas) y los
  109 e2e (los 8 de la dieta, con axe).
  - Estilo de la captura del usuario: tarjeta del día gris con anillo de kcal y macros en %, sin lima; comidas en tarjetas
    con miniatura; ‹ Hoy › para ver y apuntar en otros días.
  - Sin Semana en Comida: será de Progreso (medias, proteína por días, tendencia); el peso de hoy, en Hoy.
  - Dieta (Hoy · Dieta): cargar un archivo, crear la tuya o la de ejemplo del prototipo; el menú del día según tu
    rotación de Entreno, apuntado de un toque; Tu semana con el menú de cada día (entreno o descanso, a mano si quieres).
  - La receta (como Ver sesión: entreno o descanso, raciones), intercambios (solo hoy o para siempre) y editarla como Editar
    rutina; recetas y menús tuyos. La compra (días, secciones, lo que tienes, alguien más, compartir). Cocina (arroz y su
    factor, repartir una olla, calcular un plato y guardarlo).
  - Consulta semanal (cinta, sensaciones, informe del nutricionista con las reglas de la § 8 y del entrenador): propone,
    «Aplicar desde mañana» o «Ahora no», y se deshace.
  - Escáner de códigos (cámara o a mano) con Open Food Facts; lo escaneado queda en Mis alimentos con su código.
  - Decisiones y motivos en [docs/decisiones.md](docs/decisiones.md) (2026-11-05, «Comida versiones 2 y 3»).
- Rama `pantalla/comida` (2026-11-05, sin unir; Comida antes que Hoy por decisión del usuario). Verificado: `npm run check` y
  los e2e de Comida (7 de 7, con axe).
  - Letra igual que en Entreno (un tamaño por papel; sin los tres tamaños propios de Comida). Propuesta de las versiones 2 y 3
    en `Desktop/MUTA-Comida-v2-funcionalidades.png` (hecha en `pantalla/comida-v2`).
  - Diseño aprobado `Desktop/MUTA-Comida-diseno.png`: Hoy (tarjeta lima con lo que te queda, aviso del entrenador, comidas),
    Añadir (buscador por palabras, repetir lo de ayer, solo kcal y proteína, recientes, guardadas, tus alimentos, 16
    categorías), la ración (raciones o gramos, «Así queda tu día»), Semana (media, proteína, peso), Tu objetivo (cómo sale,
    revisión semanal, historial con «Deshacer») y la sugerencia (−150 / +150 kcal con sus comprobaciones).
  - **El entrenador propone, no aplica**: «Aplicar desde mañana» o «Ahora no». Reglas de `docs/conocimiento/02-reglas.md` § 8.
  - Base de 1.493 alimentos (`shared/content/foods.json`, del prototipo), descargada aparte. Detalle en
    [src/features/nutrition/CLAUDE.md](src/features/nutrition/CLAUDE.md).
- Rama `pantalla/sesion` (2026-11-03/04, sin unir; último commit en `git log`). Verificado: `npm run check` y los e2e.
  - Datos reales en todo Entreno: Tu plan, Ver sesión, la sesión, el resumen y las fichas leen tu plan y tus entrenos; la sesión
    va por rotación, se guarda a cada serie y al terminar pasa a la siguiente.
  - Biblioteca: alias de 457 nombres, ejercicios originales de las rutinas (biblioteca local, sin duplicados, los de MUTA
    primero) con su explicación (traducida o, para 25, de una web con su fuente); sustituciones de los documentos.
  - Cada serie distinta y superserie (A14): «4 · 6 · 8» con un interruptor por ejercicio; A1/A2 unidas en Editar rutina
    («Superserie con») y alternas en la sesión, 20 s entre las dos.
  - Los discos del gimnasio (en Tu material y en la calculadora): la calculadora solo usa los que hay.
  - Técnicas de intensidad (dropset, mecánico, rest-pause, parciales): cada serie trae su fila para apuntarla desde el
    principio, y en Editar rutina se pone o quita en el desplegable «Técnica».
  - Datos: sustituciones de Women's Specialization y Comeback Bridge (rev 17); ejercicios sin ficha revisados (solo quedan
    huecos y estiramientos). Galería de capturas rehecha con las pantallas de hoy (`npm run galeria`, 27).
  - Sin «Añadir ejercicio» en la sesión (solo en Editar rutina); filas de las series en un gris más fuerte.
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

- **Hidratos según el día de entreno** (más o menos los días de entreno y de descanso): los documentos no dan una regla;
  el usuario lo deja para más adelante (2026-11-08). Si vuelve, preguntar de qué documento sale.

1. Hoy y Progreso, en ese orden (cada una con su PNG aprobado antes).
2. Marcar los datos rellenados o estimados en las pantallas que aún no lo hacen (Ver sesión y la sesión ya dicen «Sugerido»).
3. Coach: usar las elecciones guardadas (prioridades, puntos débiles) y `adaptVolume`.
4. Importar/exportar copia de seguridad en CSV/JSON desde Perfil.
5. Fotos de categoría y miniaturas de ejercicio.
6. Quitar el número de días del nombre de otras rutinas (Esencial, Frecuencia alta, PPL, Vuelta al gimnasio) si se quiere el
   mismo criterio que en Powerbuilding.

## Dudas abiertas

- ¿Tercer descanso al final en «Cuerpo completo A/B» (el documento de conocimiento da un ejemplo con descanso doble)?
- ¿Se publica la app (hosting) antes o después de las pantallas de sesión?
