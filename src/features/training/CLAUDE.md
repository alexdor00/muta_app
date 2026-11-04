# Entreno (`src/features/training`)

Elegir una rutina del catálogo, ver su detalle y empezarla. Las demás pantallas (Tu plan, Tu rutina, sesión,
resumen, ficha del ejercicio) existen como «pendientes» hasta tener diseño aprobado.

## Capas (de arriba abajo; cada una solo usa las de debajo)

| Capa          | Qué contiene                                                                                        | Puede usar                                              |
| ------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `screens/`    | Una carpeta por pantalla; solo pintan y llaman casos de uso                                         | components, state, use-cases, `shared/ui`, `shared/lib` |
| `components/` | Piezas solo de Entreno (`SlotPanel`, `RoutineAbout`, `DayPicker`); reciben datos y avisan de toques | `shared/ui`, `shared/lib`                               |
| `state/`      | Señales (`routines`, `routineDetail`) y tipos de lo que se ve; **no guarda datos**                  | domain                                                  |
| `use-cases/`  | Cada acción con un solo punto de entrada: cargar, abrir, elegir, empezar                            | domain, state, `shared/data`, `shared/content`          |
| `domain/`     | Funciones puras con su `*.test.ts`: sin efectos ni acceso a datos                                   | `shared/lib`                                            |

`index.ts` es la API pública del área: otras áreas solo importan de ahí.

## Dominio: dónde está cada cosa

- `program.ts` — **los tipos de un programa** (`Exercise`, `Day`, `Week`, `Block`, `ProgramData`, `RestRule`). Único sitio.
- `catalog.ts` — las 40 rutinas (`CATALOG`), su familia y su archivo; `categories.ts` — los 5 grupos que se eligen (Hipertrofia, con MUTA dentro; Powerbuilding; Powerlifting; Mujer; Vuelta al gimnasio), cada uno con su «!» (`about`) y la familia (carpeta original) de cada rutina, con por qué va a cada grupo. Hipertrofia y Mujer se dividen en categorías con tarjeta (`sections.ts`).
- `programInfo.ts`, `programLevel.ts`, `muscles.ts`, `muscleOf.ts` — hechos medidos de una rutina (reparto, volumen, minutos, nivel).
- `routineView.ts` — lo que se enseña: fases, filas, descansos (`applyRestRules`), datos clave (`factsOf`).
- `restCycles.ts` — dónde va el descanso obligatorio cuando el archivo no lo trae: al completar la vuelta al cuerpo (empuje, tirón,
  rodilla y cadera), repartida en una o varias sesiones; cada sesión trae sus `muscles` (de `muscleOf`).
- `sections.ts` — secciones de un tipo: Mujer tiene las suyas (`SECTIONS`: Base y fundamentos, Especialización en glúteo y tren inferior, En casa);
  los demás tipos, una sola con todas sus rutinas. Cada sección dice qué programas lleva (lo anterior a « · » del título) y si se elige por días; `inSection`, `daysOf`, `pickDays`.
- `slots.ts` / `slotPanel.ts` — filas que se pueden cambiar y el modelo de su desplegable.
- `priorities.ts` (opcionales de MUTA y regla de tiempo), `optionals.ts` («(optional)» de los originales),
  `weakPoints.ts` (puntos débiles de Culturismo y Torso y pierna): cada uno marca `slot` en las filas, nunca borra.
- `muscleInPlan.ts` — un músculo en tu plan: series por semana (solo las directas), directos e indirectos, la barra y el rango a mano.
- `sessionTips.ts` — reglas de «Para esta sesión» (tipo de sesión y qué consejo sale; los textos, en el contenido).
- `progression.ts` — **el motor**: doble progresión con RIR (`suggestFor`, la tabla de `docs/conocimiento/02-reglas.md`, sin descarga);
  `exerciseProgress.ts` — máximo y volumen de cada vez; `exerciseLibrary.ts` — la biblioteca: forma, búsqueda y comprobación.
- `adaptVolume.ts` — ajuste de volumen para el coach (no se usa al elegir: las rutinas se enseñan tal cual).

## Convenciones

- Elegir = `use-cases/routineDetail.ts` guarda `weakChoice`/`priorityChoice` y recalcula con `show()`:
  prioridades → puntos débiles → opcionales marcados → descansos. Orden fijo; cada paso recibe y devuelve `ProgramData`.
- Las elecciones se guardan en IndexedDB `plans/current` (`chooseRoutine`). El programa original no se toca.
- El contenido va en los JSON del programa (`restRules`, `restInfo`, `tip`, `weakPoints`), no en el código.
- **Todos los grupos se recorren por frecuencia** (`DayPicker`): se elige los días por semana y salen las rutinas de esos días, en filas
  con su «!» y guardar, también si es una sola. Hipertrofia y Mujer tienen antes categorías con tarjeta (`/entreno/rutinas/mujer`,
  `/mujer/base`…) y «Ver todas» (`/mujer/todas`). Los filtros están en todos los niveles; los días van en círculos y hay equipamiento.
- **La «!» de cada tarjeta ayuda a elegir** (qué es, para quién, por cuál empezar) y sale de los documentos de los programas, resumida:
  nada que el documento no diga. Los nombres y frases de las categorías de Mujer son texto propuesto; el resto sale del catálogo.
- **Las partes de una serie llevan la fase en el nombre** (`Fuerza e hipertrofia · fase 1`, `Hipertrofia · fase 2 · …`); las fases de
  dentro de una rutina se explican en su «!». Los nombres y los grupos se verifican contra el documento original (decisión 2026-10-30).
- **Descansos:** primero lo que dice el documento (días en el archivo y `restRules`); solo si no dice nada, `restCycles.ts` los pone donde
  se completa la vuelta al cuerpo. Un descanso que el documento solo permite no se guarda como obligatorio ([docs/datos.md](../../../docs/datos.md)).
- **La pantalla de una rutina abre todo plegado** (ni la semana 1 ni las sesiones con opciones salen desplegadas).
- La fila es corta (`compactMeta`): volumen como etiqueta y una línea con minutos, fases y semanas. El reparto y el lugar van en el detalle.
- **Tu plan** (`screens/tu-plan`, con la tarjeta `MusclesCard` y la hoja `TuRutinaSheet`; no hay pantalla Músculos aparte) lee tu plan de verdad (ver «Tu plan y los entrenos» abajo). De la hoja «Tu rutina» funcionan todas las filas: «Cambiar de rutina» (lleva al catálogo), «Biblioteca de ejercicios» (A16,
  `ExerciseLibrarySheet` + `screens/biblioteca/BibliotecaHoja.tsx`; sustituye a la hoja, así atrás vuelve a Tu plan), **Foto de la sesión** (`screens/foto-sesion`, `SessionPhotoSheet`; `use-cases/sessionPhotos.ts`: reducida a 1200 px y guardada en `userContent`, solo en el móvil; `state/fotos.ts`; la tarjeta la lleva de fondo con `--photo-scrim`), **Cobertura muscular** (`screens/cobertura`, `CoverageSheet`; la tabla del método en `shared/content/coverage.json`, `domain/coverage.ts`, `use-cases/coverage.ts`; «+» elige la sesión con `screens/comun/ElegirSesionHoja.tsx`), **Rehacer el plan** (`DangerSheet` + `rehacerPlan`: quita lo cambiado a mano y vuelve a la primera semana; entrenos y fotos se quedan) y **Mis consejos** (`screens/mis-consejos`, `MyTipsSheet`; `domain/myTips.ts`, `state/misConsejos.ts`, `use-cases/myTips.ts`: ocultar, cambiar y añadir los de antes de empezar y «Mostrar al empezar», en `userContent`; la sesión usa `consejosAntesVisibles`). La biblioteca: contenido real en
  `shared/content/exercises.json`, buscar y comprobar en `domain/exerciseLibrary.ts`, cargar en `use-cases/exerciseLibrary.ts`; cada fila lleva a la ficha. Las tarjetas de sesión son de colores (estilo del prototipo anterior), de unos 270 de alto; la cabecera lleva el título y el perfil a la derecha y, al bajar, queda una barra fija con «Entrenamiento» (`CompactBar`); tocar un músculo saca encima una burbuja con sus series (tocar fuera la cierra); «Empezar» va con la sesión visible del carrusel (con el ratón se arrastra: `useDragScroll`). Al tocar una tarjeta se abre **Ver sesión** (`screens/ver-sesion`, `/entreno/rutina/b1`, a pantalla completa): cabecera con el color de la tarjeta (`SessionHero`, colores en `sessionTone.module.css`), la gráfica del prototipo anterior (`SessionProgress`: eje, área sombreada y fechas, con Tonelaje · Repeticiones · Duración), ejercicios que se despliegan con la última vez y «Ver ficha» si está en la biblioteca (`ExerciseList`; lo que toca hoy, los músculos y la clave, solo en la ficha completa); lo que no dice la rutina sale en gris como «Sugerido, no lo dice la rutina: …» (`notaSugerido`), también en la sesión y «Empezar» fijo abajo. «Empezar» abre la **sesión en curso** (C01–C06, `screens/sesion`, `/entreno/sesion/b1`; C00 se salta): barra con Salir, tiempo, Terminar y raya de progreso (`WorkoutBar`); el ejercicio abierto (`WorkoutExercise`) con el calentamiento calculado (`domain/warmup.ts`: la regla de `calentamiento.js` del prototipo, solo en el primer ejercicio de cada músculo) y sus series sin columna «Antes»: la vez anterior sale en gris en Kg y Reps y un toque la apunta; teclado propio (`WorkoutKeypad`), descanso abajo (`RestBar`), ★ si mejora la vez anterior, +1 min si las reps caen, números imposibles o muy altos (`domain/workoutSet.ts`), deslizar para eliminar, el ejercicio terminado se pliega y se abre el siguiente; sonido, vibración y pantalla encendida en `use-cases/workoutFeedback.ts`. Lo apuntado vive en `state/sesionEnCurso.ts` y se guarda en IndexedDB a cada cambio. Tocar el tiempo lo para. «···» abre la ficha, cambiar ejercicio solo hoy (con las «substitutions» del programa MUTA), nota, discos por lado y cronómetro de serie (`HojasEjercicio`, `useCronometro`, `domain/workoutTools.ts`). «Terminar» pregunta si quedan series y abre el **resumen** (`screens/resumen`, `WorkoutSummary`, como C24: racha de días con el fuego naranja, semana, cifras y frente a la última vez; `domain/workoutSummary.ts`, `domain/streak.ts`: racha en días: cuentan los descansos que deja tu semana). La línea «B1 · 3 de 24 series» abre **Esta sesión** (`HojasSesion`: tiempo con pausar y contar desde ahora, cambiar de sesión y descartar, que preguntan antes); tocar ⏱ cambia el descanso de ese ejercicio para todas las sesiones (`descansosElegidos`). **Consejos de hoy** (C10, `screens/sesion/HojaConsejos.tsx`, piezas en `SessionTips`): «Para esta sesión» sale de las reglas de `domain/sessionTips.ts` con los ejercicios de hoy en su orden (textos en `shared/content/tips/`, sacados del prototipo con `scripts/tips-from-prototype.cjs`; el de prioridades sale con los músculos en Prioridad y Mantener de la ficha del músculo (`elecciones`)) y «Antes de la primera serie» son los 9 con casilla. Se ven en Ver sesión (tarjeta) y en la sesión con un aviso arriba que solo sale si hay consejos y se va al tocarlo o al marcar la primera serie; nada se abre solo salvo «Mostrar al empezar» (desactivado de serie). Los que se arreglan con un toque («Invertir hoy») y «Hacer ahora» del «···» cambian el orden solo hoy (`state/ordenHoy.ts`, `orden` de la sesión en curso). «Añadir ejercicio» (abajo y en «Esta sesión», C19) elige en la biblioteca (`screens/biblioteca/BibliotecaHoja.tsx` con `onElegir`) y lo añade al final solo para hoy (`anadirEjercicio`, `desdeBiblioteca`: 3 series y la pauta de la biblioteca); «Cambiar ejercicio» tiene «Elegir cualquier ejercicio», con la biblioteca filtrada por su músculo. Los kilos de hoy (calentamiento y «Hoy 62,5 kg» de un ejercicio cerrado) salen del motor (`sugerenciaDe`); en gris sigue la vez anterior. El esfuerzo se escribe sin siglas con `effortLabel` (`domain/effort.ts`).
  La **ficha del ejercicio** toma las repeticiones de tu plan; si el ejercicio no está en la semana que toca, de tu rutina en otra semana (`pautaEnTuRutina` → `domain/workoutPlan.ts · pautaEnPrograma`) y, si tampoco, las típicas de la biblioteca; debajo de la pauta dice de dónde salen. La **ficha del músculo** (A17–A21, `screens/musculo/MusculoHoja.tsx` + `MuscleSheet`) se abre desde los músculos de la ficha del ejercicio y con «Ver ficha» en la burbuja del muñeco de Tu plan: el rango en una barra recta con tu plan como punto naranja (`--range-dot`), Mantener · Desarrollar · Prioridad o a mano (`state/musculos.ts`, se guarda en el plan), dónde lo entrenas y la pestaña Consejos (`shared/content/tips/muscles.json`). Sin énfasis (lo usa el coach). «Añadir un ejercicio» elige uno del músculo en la biblioteca y la sesión a la que va (`editarSesion` + `anadir`, para todas las semanas). En Ver sesión los consejos van plegados.
  La **ficha del ejercicio** (`screens/ejercicio`, `/entreno/ejercicio/peso_muerto_rumano`, a pantalla completa; tarjetas en
  `ExerciseFicha`, modelo en `state/ficha.ts`) sigue el diseño aprobado del 2026-11-02 sin foto, con la gráfica `SessionProgress`
  (Máximo · Volumen) y el muñeco sin toques (`MuscleFigure` sin `onSelect`). El peso sugerido sale del motor (`domain/progression.ts`);
  el descanso cambia `descansosElegidos`; desde la sesión (`?sesion=b1&ej=1`) «Empezar ejercicio» vuelve con él abierto (`pedirEjercicio`).
  `MuscleFigure` es el dibujo del cuerpo; sus contornos (`bodyParts.ts`, generado, no se edita a mano) salen de `react-native-body-highlighter` (MIT, hombre, frente y espalda, con su licencia en la cabecera del archivo); en negro los músculos con la mitad o más de las series del que más, en gris medio los demás trabajados; las piezas de `components/` reciben todo por parámetros.
- **Tu plan y los entrenos** (decisión 2026-11-03): `use-cases/training.ts · cargarPlan` lee `plans/current`, le aplica tus elecciones
  (`domain/planProgram.ts · applyChoices`, lo mismo que el detalle de la rutina) y saca las sesiones de la semana que toca
  (`domain/workoutPlan.ts`: sigla «A1» del nombre o S1, S2…; lo que falta sale de la biblioteca o se rellena y queda en `sugeridos`).
  La sesión que toca va por **rotación** (`rotation/current`): tras terminar una, la siguiente; la semana pasa al completarla.
  Los entrenos terminados van a `workouts` y de ahí sale todo (`domain/workoutHistory.ts`: la vez anterior, gráficas, tu semana,
  series por músculo); la sesión en curso, también en `workouts` con id `en-curso` (sobrevive a recargar). «Me faltó un ejercicio»
  deshace el guardado (`reabrirEntreno`). Sin plan, las pantallas enseñan `screens/comun/SinPlan`; cada una lo carga con `usePlan`.
- **Cambiar ejercicio** (`SwapSheet`): «Solo hoy» o «En mi plan». Primero «Hacen lo mismo» (`domain/equivalence.ts`: mismo músculo y zona
  de énfasis, con el porqué), luego los del programa y la biblioteca. En el plan, `cambiarEnPlan` guarda `plans/current.cambios` y
  `sesionesDeSemana` monta el nuevo con la pauta de la rutina (`enLugarDe`; Ver sesión lo dice y se puede volver).
- **Editar rutina** (A11–A13, `screens/editar-rutina/EditarRutinaHoja.tsx` con `EditRoutineSheet` y `EditExerciseSheet`, desde «Tu rutina»):
  minimalista. Arriba, dos desplegables (`Desplegable`): «Sesión», por su nombre (`nombresDeSesiones`: «Torso 1» y «Torso 2» si se
  repite), y «Descansos», los días de descanso obligatorio tras cada sesión con − / + (`domain/restDays.ts`: los del archivo, los
  del documento o los de la vuelta al cuerpo, como en el detalle de la rutina; cambiados, en `plans/current.descansosTras`). Tu plan
  los respeta: si la última sesión hecha lleva descanso detrás y fue ayer (o anteayer, con dos), hoy sale como descanso
  (`descansasHoy`), la tarjeta dice «Siguiente» y se puede entrenar igual. Cada fila «3 × 6–10 · 3:00» con su asa para moverla
  (arrastrar o flechas del teclado). Un ejercicio: series y descanso (de 15 en 15 s) con − / +; repeticiones (mínimo y máximo, de 1 en 1)
  y «Al terminar la serie», desplegables (uno abierto cada vez); cada toque se guarda solo. «Cambiar por otro» (`SwapSheet soloPlan`) y «Quitar»; añadir de la
  biblioteca y volver a la rutina original (todas: también los descansos). El entrenador (`ConsejoEntrenador`) dice un consejo de la
  sesión cada vez (los de Ver sesión, `consejosDeSesion`), en gris y con «Vale». El salto y la nota ya no se editan aquí. Se guarda en `plans/current.ediciones` por sigla (`domain/routineEdit.ts · aplicarEdicion`, para todas las semanas); el
  descanso, en `descansosElegidos`, y el cambio de ejercicio, en `cambios`. Todo el plan se escribe en cola con el estado completo.
- Nada obligatorio: lo opcional, a elección del usuario; lo que viene del documento, con sus palabras.
- Cada función de `domain/` lleva su prueba; un archivo que solo declara tipos no la necesita.

Para pantallas nuevas: [docs/rediseno.md](../../../docs/rediseno.md). Para datos de rutinas: [docs/datos.md](../../../docs/datos.md).
