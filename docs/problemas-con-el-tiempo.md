(hecho) (hecho)(hecho) (hecho)# Problemas con el tiempo de uso

Revisión del 2026-11-23: cómo se comporta MUTA cuando se usa a diario durante meses y años, qué falla y cómo arreglarlo.
Cada problema trae varias opciones; la marcada con **(recomendada)** es la que se propone. Nada de esto está arreglado aún.

**Cómo se comprobó.** Con el perfil de prueba de `/dev/demo` ampliado a 3 años (unos 600 entrenos, peso de cada mañana y
comida de cada día, sin guardarlo en git), se recorrieron en un iPhone 13 simulado Hoy, Entreno, Ver sesión, la ficha,
Nutrición, Tu objetivo, Progreso (Días, Cuerpo y Fuerza en meses de hace 1 y 2,5 años) y la etapa, con la app construida.
Lo demás se comprobó leyendo el código, y cada caso dice cómo se comprobó.

**Resultado general:** ninguna pantalla da error ni se cuelga, y 3 años de datos ocupan unos 2 MB. Los problemas son
datos que se pierden o no se ven, fechas que confunden y pantallas que se vuelven lentas o difíciles de leer.

| #   | Problema                                                                   | Cuándo se nota           | Gravedad | ¿Pantalla nueva? |
| --- | -------------------------------------------------------------------------- | ------------------------ | -------- | ---------------- |
| 1   | Guardar un día no leído borraba lo que tenía (hecho)                       | Por otro camino          | Alta     | No               |
| 2   | Con la app abierta al pasar la medianoche, Nutrición sigue en ayer (hecho) | La primera noche         | Alta     | No               |
| 3   | Una sesión olvidada sin pausar dura horas o días (hecho)                   | La primera vez           | Media    | Poco (un aviso)  |
| 4   | Progreso no ve la comida de hace más de 35 días (hecho)                    | Al mes y medio           | Media    | No               |
| 5   | La racha de días redondos de Nutrición no pasa de 35 (hecho)               | Al mes                   | Baja     | No               |
| 6   | Al cambiar de rutina se mezclan y se cortan los historiales (hecho)        | Al primer cambio         | Media    | No               |
| 7   | Al acabar la rutina vuelve a la semana 1 sin avisar (hecho)                | 8–16 semanas             | Media    | Sí (PNG)         |
| 8   | Fechas sin año                                                             | Al año                   | Media    | No               |
| 9   | Progreso cada vez más lento                                                | Al año                   | Media    | No               |
| 10  | No hay copia de seguridad                                                  | Cuando falle el móvil    | Muy alta | Sí (PNG)         |
| 11  | Las gráficas acaban siendo un serrucho                                     | 6–12 meses               | Baja     | Sí (PNG)         |
| 12  | Todas las fotos se cargan cada vez (hecho)                                 | 2–5 años                 | Baja     | No               |
| 13  | Copias que una versión nueva no sabrá leer                                 | Con la próxima migración | Media    | No               |

---

## A corto plazo (días o semanas)

### 1. Guardar un día que la app no había leído borraba lo que tenía (hecho: C)

**Qué pasaba.** Nutrición lee los últimos 35 días al abrirse (`nutritionStore.ts · cargarComida`). Al guardar un día,
`guardarDia` sustituía lo guardado por la lista en memoria; en un día no leído, esa lista está vacía y lo de antes se perdía.
**Corrección del 2026-11-23:** desde la pantalla no se llegaba a ese caso, porque el carrusel de Tu día solo enseña 7 días
(de hoy a hace 6). Podía pasar por otro camino (por ejemplo, con el problema 2).

- **A.** Al ver un día que no está leído, leerlo antes de enseñarlo y de guardar.
- **B.** El carrusel no pasa de 35 días atrás (siempre los últimos 35: al pasar un día, el más antiguo sale). Hoy enseña 7;
  pasar a 35 cambia la pantalla (35 tarjetas y sus puntos): pendiente de decidir.
- **C (hecho, 2026-11-23).** `guardarDia` conserva lo guardado de un día no leído y suma lo nuevo; en un día leído, guarda lo
  que ves (así quitar una comida sigue funcionando).

### 2. Con la app abierta al pasar la medianoche, Nutrición sigue en el día de ayer (hecho)

**Hecho (2026-11-23), opción A:** `nutritionStore.ts · vigilarElDia`: al volver a la app, si es otro día, Nutrición se vuelve a cargar con hoy.

**Qué pasa.** En el móvil la app se queda abierta de fondo. Nutrición calcula «hoy» una sola vez por sesión (`carga ??=`), así
que a la mañana siguiente lo que apuntas va al día anterior y el objetivo, el anillo y la revisión usan el día equivocado.
Las otras áreas calculan el día al abrirse. Comprobado en el código.

- **A (recomendada).** Al volver a la app (`visibilitychange`), si cambió el día, actualizar «hoy» en todas las áreas y
  recargar lo de Nutrición. Un solo sitio en `src/app/`.
- **B.** Comprobar la fecha cada minuto con un temporizador. Funciona también con la app en primer plano a medianoche,
  pero gasta más.
- **C.** Al volver tras más de X horas, recargar la app entera. Lo más seguro y lo más brusco: se pierde por dónde ibas.

### 3. Una sesión olvidada sin pausar dura horas o días (hecho)

**Hecho (2026-11-23), opciones A y B:** `state/tiempoSesion.ts` (`sinTiempoMuerto`, `finDeLaSesion`; los descansos no se revisan con `conHueco`) y la hoja `otroDia` al entrar en una sesión de otro día («Seguir con ella» o «Guardarla como estaba»). De paso: terminar con la sesión en pausa ya no cuenta la pausa.

**Qué pasa.** El tiempo de la sesión corre aunque cierres la app (`segundosSesion`). Si la dejas a medias sin pausar y la
terminas al día siguiente, se guarda con 20 horas. Eso estropea la gráfica de Duración y hace que el ajuste de descansos
(`descansoTrasSesion`) lea «la sesión pasó de 75 min» y proponga bajarlos. Comprobado en el código.

- **A (recomendada).** Si pasan más de X minutos sin apuntar ninguna serie, contar ese hueco como pausa. X sería «sugerido»,
  por ejemplo 30 min. No hace falta pantalla nueva.
- **B.** Al volver a una sesión de otro día, preguntar: «¿Sigues con ella o la guardas como estaba?». Hace falta un aviso,
  así que primero un PNG.
- **C.** Las dos: A para el tiempo y B para la fecha en que se guarda.
- Además, en cualquier opción, los descansos no se revisan si la sesión tuvo un hueco largo.

### 4. Progreso no ve la comida de hace más de 35 días (hecho)

**Hecho (2026-11-23), opción A:** `forProgreso.ts · totalesDeSiempre` lee todos tus días guardados (lo de memoria manda).

**Qué pasa.** Progreso pide la comida a Nutrición (`comidaParaProgreso`), que solo tiene los 35 días cargados. Una etapa de
hace meses dice «Sin comida apuntada en esta etapa» aunque comieras y lo apuntaras cada día. Comprobado en el móvil
simulado.

- **A (recomendada).** Que `comidaParaProgreso` lea todo `foodLog` (solo kcal y proteína de cada día), aparte de lo cargado
  para Nutrición.
- **B.** Guardar el total de cada día al apuntar (un resumen pequeño por día) y que Progreso lea solo eso. Más rápido con
  años de datos, pero hay que rellenar los días ya guardados.
- **C.** Que Progreso pida solo el tramo del mes o la etapa que mira. Lo más ligero; más cambios en Progreso.

### 5. La racha de días redondos de Nutrición no pasa de 35 (hecho)

**Hecho (2026-11-23), opción A:** `state/comida.ts · rachaRedonda` sin tope; si llega al primer día leído, `leerLaRacha` lee 60 días más hasta que se corte.

**Qué pasa.** La frase «N días seguidos» se cuenta con los días cargados (35) y tiene un tope de 60 (`HoyVista.tsx`). Con más
de 35 días seguidos, la racha se queda parada. Comprobado en el código.

- **A (recomendada).** Arreglar el 1 o el 4 (leer los días que falten) y quitar el tope de 60.
- **B.** Guardar la racha al cerrar cada día (en `userContent`) y sumar. Rápido, pero es un dato más que puede descuadrarse.

---

## A medio plazo (2 a 6 meses)

### 6. Al cambiar de rutina se mezclan y se cortan los historiales (hecho)

**Hecho (2026-11-23).** La gráfica de una sesión, opción A: `progresoDeSesion` con la rutina (`programId`). El historial, como pidió el usuario: unir cada ejercicio con su ejercicio de la biblioteca (ya lo estaban todos los de las rutinas salvo los huecos «a elegir», los estiramientos de 30 s y «sacar la barra», que no son series de trabajo; `private/informes/ejercicios-sin-ficha.txt`) y preguntar los dudosos (no queda ninguno). Se reconoce por esa unión (`Clave`, `claveEjercicio`): la vez anterior, el peso que propone el motor, el récord, la ficha y Progreso (`unificarNombres`). De paso se arregla que la ficha no encontraba tu historial cuando en la rutina el ejercicio se llamaba distinto que en la biblioteca.

**Qué pasa.** Comprobado en el código, en dos sitios:

- La gráfica de una sesión en Ver sesión agrupa por la sigla (`progresoDeSesion`). Si la rutina nueva también tiene una
  «A1», su gráfica mezcla las A1 de las dos rutinas, que llevan ejercicios distintos.
- El historial de un ejercicio va por su nombre exacto (`historialDe`). Si en la rutina nueva se llama distinto («Press de
  banca» y «Press banca con barra»), se pierden la vez anterior en gris, el peso que propone el motor, la ficha y el récord:
  empieza de cero.

Soluciones para la gráfica de la sesión:

- **A (recomendada).** Agruparla por rutina y sigla: cada rutina tiene su propia A1.
- **B.** Por etapa: la gráfica empieza con la etapa de ahora. Coincide con cómo se mira Progreso.

Soluciones para el historial del ejercicio:

- **A (recomendada).** Agruparlo por el ejercicio de la biblioteca (`ejercicioId`, con `exercise-aliases.json`) y, si no
  tiene, por su nombre. Así la misma máquina sigue su historia aunque se llame distinto.
- **B.** Al cambiar de rutina, preguntar qué ejercicios son el mismo. Exacto, pero pesado.

### 7. Al acabar la rutina vuelve a la semana 1 sin avisar (hecho)

**Hecho (2026-11-23), opción A**, con lo que pidió el usuario al verlo: las rutinas de una sola semana (MUTA y CSV) no terminan; solo se comparan etapas de la misma rutina, a la misma semana y primero con el mismo objetivo; un CSV que parece una rutina tuya pregunta si es la misma. Detalle en `docs/decisiones.md` (2026-11-23).

**Qué pasa.** Al terminar la última semana de un programa (`avanzar` devuelve `INICIO`), la app vuelve a la semana 1 sin
decirlo. La etapa no se cierra y nadie pregunta qué hacer. Comprobado en el código.

- **A (recomendada).** Al terminar la última sesión, el resumen y el entrenador lo dicen y proponen «Repetir la rutina ·
  Cambiar de rutina · Empezar otra etapa». Si repites, se abre una etapa nueva. Lo que diga de descargas sale de los
  documentos. Primero un PNG.
- **B.** Solo un aviso en Tu plan («Terminaste la rutina: empiezas otra vuelta») y la etapa sigue. Mínimo, sin decisión.
- **C.** Dejar de avanzar al acabar hasta que elijas. Fuerza a decidir, pero bloquea si no quieres pensar.

### 8. Fechas sin año (hecho)

**Hecho (2026-11-24), opción A:** `formatShortDate`, `formatDayDate` y `formatLongDate` llevan el año si no es el de hoy («18 sep 2024»); así sale en todas las pantallas a la vez.

**Qué pasa.** La etapa dice «24 nov – 28 sep» y la gráfica «27 nov – 16 nov». En cuanto llevas más de un año no se sabe de
qué año es cada fecha. Comprobado en el móvil simulado.

- **A (recomendada).** Poner el año cuando la fecha no es de este año o el tramo cruza de un año a otro («24 nov 2023 – 28 sep
  2024»). Un cambio en `format.ts`, en los sitios que escriben un tramo.
- **B.** Poner siempre el año en los tramos. Más simple; más largo.
- **C.** Año con dos cifras («24 nov 23»). Corto, pero se lee peor.

### 9. Progreso cada vez más lento (hecho)

**Hecho (2026-11-24), opción A:** la gráfica de cada sesión se calcula una vez por sesión (antes, una por entreno, ordenando todo cada vez), tus básicos una vez y cada nombre se busca una vez en la biblioteca. Con 3 años de datos, Progreso pasa de 5,5 s a 0,3 s.

**Qué pasa.** Con 3 años, Progreso tarda 5,5 s en abrirse, frente a menos de 1,2 s del resto, porque recalcula toda la
historia (`entrenoParaProgreso`) cada vez que entras. Medido en el móvil simulado.

- **A (recomendada).** Primero medir qué parte tarda. Después guardar lo calculado en memoria y recalcular solo si hay
  entrenos nuevos. Arregla las visitas siguientes, no la primera.
- **B.** Calcular solo el mes y la etapa que miras. Arregla también la primera visita; más cambios.
- **C.** Guardar el resumen de cada mes cerrado en la base de datos. Lo más rápido con muchos años; más complejo de mantener.

---

## A largo plazo (1 año o más)

### 10. No hay copia de seguridad (hecho)

**Hecho (2026-11-24), opción A**, con lo que pidió el usuario: el recordatorio, cada mes (sin ninguna copia, a la semana de empezar); «Recuperar una copia» también en la pantalla de error; un `.json` (no un `.zip`) con las fotos en base64. «Cambiar de perfil» y «Empezar de cero» no se hicieron (cargar el perfil de una copia es recuperarla). «Tu material» se quitó.

**Qué pasa.** `exportBackup` existe y tiene pruebas, pero no hay botón ni recordatorio que lo use (Perfil lo deja para
cuando tenga diseño; es el pendiente 4 de `TAREAS.md`). Todo vive solo en el móvil. Si lo cambias, lo pierdes, se rompe o
borras los datos del navegador, se pierden años. En Safari sin instalar la app, iOS puede borrarlo solo. Además, las fotos
no caben en un JSON (se guardarían vacías). Comprobado en el código.

- **A (recomendada).** «Guardar copia» y «Recuperar copia» en Perfil. Un archivo `.zip` con los datos en JSON y las fotos
  aparte, más el recordatorio cada 14 días (`needsBackupReminder`, ya escrito). Primero un PNG.
- **B.** Lo mismo sin fotos, en un JSON. Más simple; las fotos se perderían.
- **C.** Copia en la nube (cuenta, servidor). Lo más cómodo; necesita servidor y cuentas, y la app hoy no tiene ninguno.

### 11. Las gráficas acaban siendo un serrucho

**Qué pasa.** Ver sesión, la ficha y las de peso pintan todo desde el principio. Con 150 sesiones la línea queda apretada y
el cambio de los últimos meses no se ve. No falla. Comprobado en el móvil simulado.

- **A (recomendada).** De serie, los últimos 3 meses, con «3 m · 6 m · 1 año · Todo» debajo, como las de Progreso. Primero
  un PNG.
- **B.** Al pasar de cierto número de puntos, juntar por semanas (la media o la mejor de la semana). Sin botones; se pierde
  el detalle de cada sesión.
- **C.** Desde la etapa de ahora, con «Todo». Coherente con Progreso, pero una etapa corta da muy pocos puntos.

### 12. Todas las fotos se cargan cada vez (hecho)

**Hecho (2026-11-24), opciones A y B** (usuario: «aplica las dos medidas»): cada foto se abre en memoria solo cuando una pantalla la enseña (`vistaDe`, en `use-cases/progress.ts`) y cada foto guarda su miniatura (320 px, sugerido; las de antes la reciben de fondo, `completarMiniaturas`), que usan la tira de meses y «Elige la foto» del logro.

**Qué pasa.** Progreso lee todas tus fotos al abrirse (`getAll('photos')`) aunque solo enseñe dos. Con 5 años serían unas 180
fotos (unos 30 MB): en móviles modestos puede ir a tirones. Comprobado en el código; no medido.

- **A (recomendada).** Leer al abrir solo la lista (fecha y postura) y la imagen cuando se va a enseñar.
- **B.** Guardar también una miniatura pequeña para la tira de meses y «Ver tu cambio», y la grande solo al abrirla.

### 13. Copias que una versión nueva no sabrá leer (hecho)

**Hecho (2026-11-24):** recuperar guarda aparte lo de ahora (`guardarAparte`, las 3 últimas) y una copia de una versión anterior se recupera (lo que no traía queda vacío).

**Qué pasa.** Antes de cada cambio de formato se guardan 3 copias completas de la base, fotos incluidas, así que con muchas
fotos ocupan el triple un tiempo. Y `validateBackup` rechaza las copias de una versión anterior («todavía no sabe
convertir»): cuando se haga la opción 10, una copia vieja no se podría recuperar tras una actualización. Comprobado en el
código.

- **A (recomendada).** Al recuperar una copia, pasarla por las mismas migraciones que la base. En las copias automáticas,
  guardar solo la última si lleva fotos.
- **B.** Guardar solo 1 copia automática y avisar al recuperar una copia vieja de que se convierte.

---

## Lo que está bien con el tiempo

- **Espacio:** 3 años de datos ocupan unos 2 MB.
- **Con tope:** el registro de errores (200), los avisos ya vistos del entrenador (200) y las copias automáticas (3).
- **Fechas:** el calendario de Días, Tu semana y la racha de Entreno van mes a mes y funcionan al cambiar de año. El cambio
  de hora no descuadra los días (se cuenta en UTC).
- **Los dos entrenadores** solo miran sus últimas semanas: no se vuelven lentos.
- **Las actualizaciones** nunca se aplican durante un entreno (`updatePolicy.ts`).
- **Las gráficas** no dan error con 150 sesiones, y el punto tocado sigue sobre la línea.

## Orden propuesto

1. Sin pantalla nueva, en una rama: 1, 2, 4, 5, 6, 8, 9, 12 y 3 A.
2. Con PNG antes: 10 (la más urgente de todas), 7 y 11, y 3 B si se quiere.
3. Con la 10: la 13.
