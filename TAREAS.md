# Tareas

Se actualiza al terminar cada tarea (ver «Mantenimiento de la documentación» en [CLAUDE.md](CLAUDE.md)).

## Tarea actual

- **Plan de Nutrición, programado** (usuario, 2026-11-18: «programa todo»; misma rama, sin commit): Plan con «Qué comes» y
  «Cuándo cocinas», un solo botón arriba, Tu dieta (por días o según el entreno), un menú y sus comidas (nombre, hora,
  qué días, en todos los menús), un día (menú, tipo, libre), «Cómo se cocina» en el plato, «Cocinas para N personas»,
  alimentos que no quieres y lo leído al cargar un CSV; **sin congelador**. Falta: probarlo en el móvil con tu dieta; las
  comidas siguen siendo 4 huecos con nombre y hora (más de 4 comidas separadas cambiaría el modelo: a decidir).
- **Nutrición como el Word del rediseño** (`Desktop/MUTA-Nutricion-Rediseno/word`, usuario 2026-11-17; misma rama, sin
  commit). Falta probarlo en el móvil; 44 «¿Cómo voy?» pasa a Pendiente (8). Descartados (usuario, 2026-11-23): el
  aspecto nuevo de 38, 39, 47 y 48 (ya funcionan), la tira de días de 46 y apuntar con foto o voz (16). Hecho además (usuario, 2026-11-17): **algo más en el menú** (otro plato, una
  fruta, un yogur, un café… en cualquier comida), «¿Cómo sueles comer?» (repartido, desayuno, comida o cena fuerte), cocinar solo una receta de la tanda, la hoja de una comida y la cantidad más limpias (cifras en una tarjeta, «Volver» a Añadir; cerrar el escáner vuelve a Añadir), **Organizar la semana como una dieta** y **cualquier dieta en CSV, exacta** (ciclo de cualquier largo, «¿cuántas veces a la semana cocinas?», calendario que se toca) y, en tu día, sin «Mañana · Desayuno»: arriba, una tarjeta con foto el
  día que cocinas o compras (`HoyToca`).
- **Probar Progreso mes a mes en un móvil real** (rama `pantalla/progreso`, sin commit aún) con `npm run dev` y tus datos
  (o `/dev/demo`): el mes con ‹ ›, su etapa y sus cifras; Días y la pantalla de cada día; Cuerpo (la foto partida, la tira de
  meses, «Ver tu cambio», tus medidas y la composición); Fuerza (tus básicos, cada grupo y la hoja de un ejercicio); las
  fotos del mes con la cámara y su guía (necesita https o `localhost`; por la wifi, la galería); el modo oscuro. Después,
  commit y PR a `main` detrás de `pantalla/recetas`.
- **Probar Hoy en un móvil real** (hecho el 2026-11-13 en la misma rama, sin commit): tu día con el anillo, «Te queda» y
  «Hecho», ¿Cómo estás hoy?, los pasos, marcar la compra y cocinar, y el día completo. Al hacer el commit, separar Hoy en su
  rama `pantalla/hoy` si se quiere un cambio por rama.
- **Probar «Tu semana, resuelta» en un móvil real** (hecho el 2026-11-13, misma rama, sin commit; `/dev/demo` la trae):
  organizar la semana en Tu plan (la compra el día que elijas; cocinar en tus descansos o tus días), la compra con tu
  despensa, el modo cocina (una receta cada vez, el temporizador, los tápers y «Hecho») y lo de Hoy (la compra, la tanda,
  tus tápers y pasar a hoy la tanda que no hiciste; sin congelador desde el 2026-11-18). Cada comida en táper, con la carne al momento o
  al momento (pantalla «Al momento»). Con el recetario de verdad, mirar que «Pesa en
  crudo» pase a crudo el arroz y la pasta.
- **Siguiente: aprobar la propuesta de la frecuencia** (`MUTA-Frecuencia-propuesta.png`: tu ciclo de 7, 9 o 14 días en
  Editar rutina). Lo que falta de la guía está en [04](docs/conocimiento/04-guia-culturismo-natural.md) §14.
- **Probar Recetas y Menú en un móvil real** (rama `pantalla/recetas`, sale de `pantalla/comida-v2`) con `npm run dev`:
  el recetario con sus fotos, ajustar un plato a lo que falta (y cuando no llega), cuadrar el día, tu producto, tu menú,
  cuándo cocinar, lo de hoy, la compra del menú, los avisos al calendario (.ics) y tu nutricionista. Después, PR a `main`
  detrás de los anteriores.
- **Probar Comida en un móvil real** (rama `pantalla/comida-v2`, sale de `pantalla/comida`): el día con ‹ ›, añadir, la
  ración, el peso de hoy y Tu objetivo; en Dieta, la de ejemplo o la tuya, apuntar del menú, una receta (intercambio y editar), la
  compra, la cocina, la consulta y el escáner con la cámara (necesita https o la red local; Open Food Facts, internet).
  Después, PR a `main` (detrás de los de `pantalla/sesion` y `pantalla/comida`).
- **Probar la rama `pantalla/sesion` en un móvil real** con `npm run dev` (dirección «Network», mismo wifi): Tu plan (tarjetas
  con «▶ Empezar», «Editar», Tu semana, Hoy descansas), Editar rutina, la sesión (teclado, dropsets, notas), Ver sesión y las
  fichas. Hasta ahora todo se ha visto solo en el móvil simulado. Después, PR a `main` con la CI en verde.
- **Unir `pantalla/estilo-blanco-negro` a `main`**: comprobada (check y e2e en verde, 2026-11-05) y subida; `main` solo acepta
  PR. Abrir el PR en https://github.com/alexdor00/muta_app/compare/main...pantalla/estilo-blanco-negro y unirlo con la CI en verde.

## Hecho

- **Las gráficas por meses y un solo desplegable** (2026-11-24, problema 11; misma rama, sin commit): cada gráfica
  (`SessionProgress`: Ver sesión, un día, la ficha y Progreso) con «3 meses ▾» (3 meses, 6 meses, 1 año, Todo) si hay más de
  3 meses de datos, y el cambio del tramo; los 10 `<select>` y las filas de Superserie, Técnica y la sesión de la foto,
  con `MenuDesplegable` / `FilaDesplegable` de `shared/ui`.
- **MUTA para años y tu logro** (2026-11-23/24): el entrenador de Entreno igual de potente que el nutricionista y en equipo
  con él; la sesión (casillas, «Seguir», «Hecha hoy», descansos revisados, tiempo muerto y sesión de otro día); terminar
  la rutina («Repetirla») y comparar tus vueltas a la misma semana (solo la misma rutina); un CSV repetido pregunta si es
  tu rutina de antes; los problemas con el tiempo de uso (todos menos el 11: ver
  [docs/problemas-con-el-tiempo.md](docs/problemas-con-el-tiempo.md)); la copia de seguridad (Perfil, el cuadro cada mes y
  en la pantalla de error); fuera «Tu material»; tu logro (al acabar una etapa y cada 6 meses) y tu premio (al cumplir tu
  objetivo, con tu antes y después) para Instagram, con el peso objetivo en volumen.

- **El entrenador de tu objetivo y la cocina, a fondo** (2026-11-21/22; misma rama, sin commit): la revisión semanal
  como un entrenador (cintura y perímetros, cómo estás, fines de semana, fuerza, proteína, déficit, ritmo > 1,2 %, una
  semana sola no basta, fase final por grasa, salir al llegar a tu objetivo, pausa si se atraganta, semanas que quedan y
  tu última definición; datos de Progreso con `cuerpoParaComida`); la recarga de hidratos solo los días que entrenas,
  contada por sesiones hechas, con «Empezar / Ahora no / Terminar / Deshacer», a mano en «Cambiar objetivo» y su «R» en
  Progreso, sin revisar ni aprender el gasto durante ella y 2 semanas después; el modo cocina desde cualquier plato
  (Cocinar, una receta y Hoy cocinas), raciones de más, pasos en tarjeta y justificados, una ración con sus cifras,
  pesar lo cocinado (todo mezclado o cada cosa aparte) con tus ollas, sus macros por 100 g y lo que aprende de cada
  receta; «···» en Nutrición (recetas, compra, cocinar); Vitest otra vez en marcha (`pool: 'vmThreads'`); la comida
  rápida de 7 cadenas (121 productos de FatSecret España, «aproximado»; `scripts/foods-rapida.cjs`). La revisión semanal como un informe corto (estado, titular, cifras y una recomendación) y los consejos en una frase (2026-11-23); pruebas de los casos de uso de tu objetivo y de las ollas, y arreglado: un menú con platos solo de descanso no salía en tu día. El entrenador de Entreno, igual de potente que el nutricionista y en equipo con él (2026-11-23; ver decisiones), con el mismo informe.
  Verificado: `npm run check` (pruebas incluidas) y e2e.

- **Nutrición, casi todo como el Word del rediseño** (2026-11-17, naranja solo para logros, sin agua): Hoy con el día
  redondo (racha y «Mañana · Desayuno»); Añadir (13–14) y la cantidad con favoritos (15); Tu semana con la tira L–D,
  cambiar un plato solo ese día o en todo el menú, Tus menús, «Proponme un menú» y Organizar en dos pasos (17–22); la compra
  con Lista · En casa (la despensa, ahora con pantalla) y «¿Compra hecha?» (23–26); Recetas con filtros, guardadas, la
  categoría y la receta nueva (27–31); Cocinar con su centro, el modo cocina en tres pasos con temporizador, la comida al
  momento, de crudo a cocinado y cómo pesar (32–40); Tu objetivo con «Cambiar objetivo», «Cómo se calcula» e historial
  en su pantalla (41–43); y la dieta: sin dieta y su cabecera (45–46). Las pastillas Semana · Compra · Objetivo se quedan
  (con el aspecto del Word) y Hoy sigue con su carrusel.

- **Editar rutina, más sencilla** (2026-11-14, propuesta `Desktop/MUTA-Editar-rutina-propuesta.png`): tres hojas con el
  mismo patrón (lista en tarjeta, asa ≡, deslizar para quitar con «Deshacer», «‹» arriba). Tu semana en una lista con
  sesiones y descansos que se mueven con el dedo; el «+» añade un día de entrenamiento (sesión vacía) o de descanso; la
  rotación sigue tu orden. La sesión con su foto de cabecera; el ejercicio con todo en − / + y «Más opciones» plegado.
- **Tu semana, resuelta** (2026-11-13): el piloto automático de compra y cocina (propuesta
  `Desktop/MUTA-Piloto-automatico-propuesta.png`). En Tu plan, la tarjeta con tus 7 días y la hoja para elegir (la compra
  el día que decides; cocinar en tus descansos —cambian con tu rutina—, en tus días o sin tandas; qué va en táper); la
  compra «Tu semana» (lo que falta con tu despensa); tu despensa; el modo cocina (`/comida/tanda/:fecha`); en Hoy, la
  compra, la tanda, tus tápers (el círculo los apunta), «Saca del congelador» y pasar a hoy la tanda que no hiciste
  («Aplicar» / «Ahora no»). Recordatorios queda para qué avisar. Ver decisiones.

- 2026-11-13 (rama `pantalla/progreso`): **Hoy** (propuesta 2 aprobada): solo lo que te queda por hacer hoy. Tu día en una
  tarjeta negra con el anillo continuo, «Faltan N tareas» y tu racha; «Te queda» y «Hecho» con pésate, ¿Cómo estás hoy? (nuevo: sueño,
  energía, hambre, digestiones y estrés; se ve en el día de Progreso), el entreno con su foto, come, pasos (nuevo), la compra y
  cocinar (se marcan a mano), la consulta y las medidas del mes el día que tocan. Cada área da sus cosas por su `paraHoy.ts`.
  El perfil de prueba trae pasos y sensaciones. La ficha del ejercicio ya no cambia el descanso (se ve en su cabecera).

- 2026-11-12 (rama `pantalla/progreso`): **Tarjetas que flotan y una sola escala de letra en toda la app** (propuesta
  «tarjetas»): fondo gris claro y tarjetas blancas con sombra; títulos, textos y cifras con un solo tipo por papel y más
  contenidos; la tarjeta de las calorías como la de la captura; el día y el mes encima de su tarjeta. «Tu entrenador» de
  Entreno, plegado y con «Cambiarlo en Editar rutina».
- 2026-11-10 (rama `pantalla/progreso`): **Progreso con todo lo del prototipo anterior** (`Desktop/prueba`), sin propuesta
  por orden del usuario: pestañas Cuerpo · Comida · Entreno; siete medidas con su historial y cómo medir, «Medidas y fotos»
  cada mes, composición (Marina, calibración, FFMI, objetivo de grasa y evolución), fotos (antes y ahora), recuperación de tus
  consultas y, después, **mes a mes en una pantalla** (2026-11-11): el mes con su etapa (en una hoja) y Días · Cuerpo (fotos comparadas con
  otro mes y «Ver tu cambio») · Fuerza; en Hoy, lo que toca cada semana y cada mes; mesociclos (en curso y archivados,
  detalle con Constancia —con su calendario—, Músculos y Rutina plegada con su foto, renombrar, empezar otro con su balance
  según la guía, volver a usar una rutina y comparar) y récords del básico de cada grupo. En Nutrición, cambiar tu objetivo
  siguiendo una dieta propone ajustarla. Ver [decisiones](docs/decisiones.md) (2026-11-10).

- 2026-11-09 (rama `pantalla/progreso`, sale de `pantalla/recetas`): **Progreso**, sin PNG previo por orden del usuario:
  tu peso (tendencia por periodos y ritmo frente al previsto), tus medidas (brazo, pecho, cintura y muslo, con «Medirme»),
  la semana de comida (frente al objetivo de cada día, proteína por días), tus entrenos (semana, racha, 8 semanas) y tu
  fuerza (básicos y marcas del último mes). Ver [decisiones](docs/decisiones.md) y
  [src/features/progress/CLAUDE.md](src/features/progress/CLAUDE.md).

- 2026-11-09 (rama `pantalla/recetas`): cierre: los Word de `docs/` salen de git (se habían colado en `723bfc1`) y se
  ignoran (`docs/*.docx`, `~$*`).

- 2026-11-09 (rama `pantalla/recetas`): dietas también desde CSV; aviso de congelar lo cocinado a partir del 4.º día;
  la definición no aprieta desde la semana 9; recarga de hidratos propuesta por tu rendimiento (una vuelta de tu rutina a
  mantenimiento). Propuesta de Hoy actualizada (solo lo de hoy).

- 2026-11-09 (rama `pantalla/recetas`): lo que quedaba de la guía en Nutrición (menos suplementos): velocidad por
  fases, tu situación (parón o salida de una definición) con mesetas, hidratos antes y después de entrenar, «si la grasa no
  baja», recarga de hidratos sin dieta y base vegetal primero en las recetas.

- 2026-11-09 (rama `pantalla/recetas`): si te pasas de grasa, las recetas se adaptan: menos grasa (el aceite puede
  quitarse) y menos hidratos para que el día cuadre con tus kcal; aviso en «Para la …» y en Cuadrar el día.

- 2026-11-09 (rama `pantalla/recetas`): «Tu objetivo» más bonito y cohesionado (secciones con título pequeño, nota corta y
  cajitas); las recomendaciones como «Se recomienda…» sin citar documentos (regla en `docs/rediseno.md`).

- 2026-11-09 (rama `pantalla/recetas`): hidratos según el día (ON/OFF) con un interruptor en Tu objetivo: más los días
  de entreno de tu rutina y menos los de descanso, misma media semanal; Tu día dice cuántos gramos cambia.

- 2026-11-09 (rama `pantalla/recetas`): el entrenador sigue el paso a paso de la guía con el segundo cuestionario: mejorar
  = más kilos o reps, solo cuenta con el RIR apuntado, 3 semanas mejorando para subir, un músculo cada vez con +1 o +2
  series (siempre sugerencia), estancado → menos intensidad y luego −1 serie, y las kcal fuera del entrenador.

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

1. Hoy (con su PNG aprobado antes). Progreso, hecho (2026-11-09).
2. Marcar los datos rellenados o estimados en las pantallas que aún no lo hacen (Ver sesión, la sesión y Progreso ya dicen «Sugerido»).
3. Coach: usar las elecciones guardadas (prioridades, puntos débiles) y `adaptVolume`.
4. Copia de seguridad: hecha (2026-11-24, ver docs/problemas-con-el-tiempo.md, problema 10).
5. Fotos de categoría y miniaturas de ejercicio.
6. Quitar el número de días del nombre de otras rutinas (Esencial, Frecuencia alta, PPL, Vuelta al gimnasio) si se quiere el
   mismo criterio que en Powerbuilding.
7. Progreso › Cuerpo: tarjeta «Lo que comes» (usuario, 2026-11-22; PNG antes de programar), debajo del peso. Dos vistas:
   **Días** (el mes que ves: una barra por día con lo que comiste y una línea con tu objetivo de ese día; la «R» en los de
   recarga; vacíos los días sin apuntar) y **Semanas** (una barra por semana con la media diaria y, debajo, cuánto cambió
   tu peso esa semana: «Sem 14–20 nov · 2.310 kcal de media · −0,4 kg»). Arriba, «2.340 kcal de media este mes · objetivo
   2.350 · −1,6 kg». Barras en gris y negro; verde solo en la cifra del peso si baja; nada en rojo.
8. Nutrición · 44 «¿Cómo voy?» del Word del rediseño (usuario, 2026-11-23): tu semana con sus medias, una barra por día,
   el peso y tu punto flojo. PNG antes de programar; el punto flojo no sale de ningún documento (regla a decidir) y se
   pisa con la 7: decidir si van las dos.

9. Problemas con el tiempo de uso: hechos todos ([docs/problemas-con-el-tiempo.md](docs/problemas-con-el-tiempo.md)); queda
   por decidir la 1 B (ver más de 7 días en el carrusel de Tu día).

## Dudas abiertas

- ¿Tercer descanso al final en «Cuerpo completo A/B» (el documento de conocimiento da un ejemplo con descanso doble)?
- ¿Se publica la app (hosting) antes o después de las pantallas de sesión?
