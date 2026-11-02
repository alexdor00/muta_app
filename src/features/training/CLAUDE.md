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
- **Tu plan** (`screens/tu-plan`, con la tarjeta `MusclesCard` y la hoja `TuRutinaSheet`; no hay pantalla Músculos aparte) es solo maqueta: leen `state/muestra/datos.ts`
  (datos de prueba escritos a mano, **se borran enteros** cuando haya datos reales). Las filas de la hoja «Tu rutina» solo se ven, sin acción. Las tarjetas de sesión son de colores (estilo del prototipo anterior), de unos 270 de alto; la cabecera lleva el título y el perfil a la derecha y, al bajar, queda una barra fija con «Entrenamiento» (`CompactBar`); tocar un músculo saca encima una burbuja con sus series (tocar fuera la cierra); «Empezar» va con la sesión visible del carrusel (con el ratón se arrastra: `useDragScroll`). Al tocar una tarjeta se abre **Ver sesión** (`screens/ver-sesion`, `/entreno/rutina/b1`, a pantalla completa): cabecera con el color de la tarjeta (`SessionHero`, colores en `sessionTone.module.css`), la gráfica del prototipo anterior (`SessionProgress`: eje, área sombreada y fechas, con Tonelaje · Repeticiones · Duración), ejercicios que se despliegan con la última vez (`ExerciseList`) y «Empezar» fijo abajo. El esfuerzo se escribe sin siglas con `effortLabel` (`domain/effort.ts`).
  `MuscleFigure` es el dibujo del cuerpo; sus contornos (`bodyParts.ts`, generado, no se edita a mano) salen de `react-native-body-highlighter` (MIT, hombre, frente y espalda, con su licencia en la cabecera del archivo); en negro los músculos con la mitad o más de las series del que más, en gris medio los demás trabajados; las piezas de `components/` reciben todo por parámetros.
- Nada obligatorio: lo opcional, a elección del usuario; lo que viene del documento, con sus palabras.
- Cada función de `domain/` lleva su prueba; un archivo que solo declara tipos no la necesita.

Para pantallas nuevas: [docs/rediseno.md](../../../docs/rediseno.md). Para datos de rutinas: [docs/datos.md](../../../docs/datos.md).
