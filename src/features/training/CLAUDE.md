# Entreno (`src/features/training`)

Elegir una rutina del catálogo, ver su detalle y empezarla. Las demás pantallas (Tu plan, Tu rutina, sesión,
resumen, ficha del ejercicio) existen como «pendientes» hasta tener diseño aprobado.

## Capas (de arriba abajo; cada una solo usa las de debajo)

| Capa          | Qué contiene                                                                           | Puede usar                                              |
| ------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `screens/`    | Una carpeta por pantalla; solo pintan y llaman casos de uso                            | components, state, use-cases, `shared/ui`, `shared/lib` |
| `components/` | Piezas solo de Entreno (`SlotPanel`, `RoutineAbout`); reciben datos y avisan de toques | `shared/ui`, `shared/lib`                               |
| `state/`      | Señales (`routines`, `routineDetail`) y tipos de lo que se ve; **no guarda datos**     | domain                                                  |
| `use-cases/`  | Cada acción con un solo punto de entrada: cargar, abrir, elegir, empezar               | domain, state, `shared/data`, `shared/content`          |
| `domain/`     | Funciones puras con su `*.test.ts`: sin efectos ni acceso a datos                      | `shared/lib`                                            |

`index.ts` es la API pública del área: otras áreas solo importan de ahí.

## Dominio: dónde está cada cosa

- `program.ts` — **los tipos de un programa** (`Exercise`, `Day`, `Week`, `Block`, `ProgramData`, `RestRule`). Único sitio.
- `catalog.ts` — las 40 rutinas (`CATALOG`), su familia y su archivo; `categories.ts` — los 10 tipos (carpetas originales).
- `programInfo.ts`, `programLevel.ts`, `muscles.ts`, `muscleOf.ts` — hechos medidos de una rutina (reparto, volumen, minutos, nivel).
- `routineView.ts` — lo que se enseña: fases, filas, descansos (`applyRestRules`), datos clave (`factsOf`).
- `slots.ts` / `slotPanel.ts` — filas que se pueden cambiar y el modelo de su desplegable.
- `priorities.ts` (opcionales de MUTA y regla de tiempo), `optionals.ts` («(optional)» de los originales),
  `weakPoints.ts` (puntos débiles de Culturismo y Torso y pierna): cada uno marca `slot` en las filas, nunca borra.
- `adaptVolume.ts` — ajuste de volumen para el coach (no se usa al elegir: las rutinas se enseñan tal cual).

## Convenciones

- Elegir = `use-cases/routineDetail.ts` guarda `weakChoice`/`priorityChoice` y recalcula con `show()`:
  prioridades → puntos débiles → opcionales marcados → descansos. Orden fijo; cada paso recibe y devuelve `ProgramData`.
- Las elecciones se guardan en IndexedDB `plans/current` (`chooseRoutine`). El programa original no se toca.
- El contenido va en los JSON del programa (`restRules`, `restInfo`, `tip`, `weakPoints`), no en el código.
- Nada obligatorio: lo opcional, a elección del usuario; lo que viene del documento, con sus palabras.
- Cada función de `domain/` lleva su prueba; un archivo que solo declara tipos no la necesita.

Para pantallas nuevas: [docs/rediseno.md](../../../docs/rediseno.md). Para datos de rutinas: [docs/datos.md](../../../docs/datos.md).
