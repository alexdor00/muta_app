# Arquitectura y flujo de datos

La app se organiza por **áreas** (Entreno, Comida, Perfil, y las pendientes Hoy y Progreso) y, dentro de cada
una, por **capas**. Lo común vive en `shared/`. Las fronteras no dependen de la disciplina: el linter rechaza un
import prohibido (`eslint.config.js`, tabla «Quién puede usar a quién» del documento de rediseño).

```
app/  →  features/<área>/  →  shared/
          pantallas → casos de uso → dominio (puro)
```

| Desde        | Puede usar                                                                        | No puede usar                              |
| ------------ | --------------------------------------------------------------------------------- | ------------------------------------------ |
| `app/`       | todo                                                                              | —                                          |
| Pantallas    | componentes, estado y casos de uso de su área; `shared/ui`, `shared/lib`          | `shared/data`, dominio directamente        |
| Componentes  | `shared/ui`, `shared/lib`                                                         | estado, casos de uso, datos                |
| Estado       | dominio, `shared/lib`                                                             | datos: no guarda nada                      |
| Casos de uso | dominio, estado, `shared/data`, `shared/content`, `shared/platform`, `shared/lib` | pantallas y componentes                    |
| Dominio      | `shared/lib`                                                                      | todo lo demás: funciones puras sin efectos |
| Otra área    | solo su `index.ts`                                                                | cualquier archivo interno                  |
| `shared/`    | `shared/lib` y su propia parte                                                    | ninguna área                               |

## Flujo de datos: elegir una rutina

```
JSON del programa ── shared/content (MUTA) o private/programs → IndexedDB `programs` (shared/data/programs.ts)
        │
        ▼  use-cases/routineDetail.ts · openRoutine(id)
   selectVariant → show():
        applyChoices         (tus elecciones, en este orden:)             domain/planProgram.ts
          applyPriorities      (opcionales de MUTA, regla de tiempo)      domain/priorities.ts
          applyWeakPoints      (huecos de punto débil)                    domain/weakPoints.ts
          applyMarkedOptionals ("(optional)" de los originales)           domain/optionals.ts
        phasesView           (filas listas para pintar)                   domain/routineView.ts
        applyRestRules       (descansos: archivo → reglas → patrones)     domain/routineView.ts · restCycles.ts
        factsOf              (datos clave)                                domain/routineView.ts
        │
        ▼  state/routines.ts · señal `routineDetail`
   screens/rutina/RutinaScreen.tsx  (solo pinta)
        │  toque en una fila → use-cases/slotPanel.ts → setPriorities / setWeakPoints → show() otra vez
        ▼  «Empezar esta rutina» → use-cases/startRoutine.ts → chooseRoutine → IndexedDB `plans/current`
```

Cada paso de `show()` recibe un `ProgramData` y devuelve otro; no modifica el original. Las filas que se pueden
cambiar llevan `slot` (nunca se borran) y el resto del código decide qué hacer con él.

## Flujo de datos: entrenar

```
IndexedDB `plans/current` + `programs` + `rotation/current` + `workouts` (+ `userContent`: fotos, notas, consejos ocultos y tu material)
        │
        ▼  use-cases/training.ts · cargarPlan()   (cada pantalla de Entreno, con screens/comun/usePlan)
        │  la rutina: del catálogo o tuya (`programs`, id `mia:…`, cargada desde un CSV: use-cases/importRoutine.ts)
   selectVariant → applyChoices → sesionesDeSemana(rotación, biblioteca)        domain/workoutPlan.ts
        │
        ▼  state/plan.ts · `tuPlan`, `entrenos`; `sesiones` = la semana + la vez anterior (domain/workoutHistory.ts)
   Tu plan · Ver sesión · sesión · resumen · fichas  (solo pintan)
        │  cada serie → state/sesionEnCurso.ts → efecto → IndexedDB `workouts/en-curso`
        ▼  «Terminar» → terminarEntreno: `workouts` (terminado) y la rotación avanza → `rotation/current`
```

El Perfil (área `profile`) enseña «Tu material» con `TuMaterial`, que Entreno exporta en su `index.ts`: es la única
pieza de un área que usa otra. Lo que eliges se guarda en `userContent/material` y Entreno lo lee al cargar el plan.

Todo lo que se enseña de tus entrenos (la vez anterior, gráficas, tu semana, series por músculo, racha) se calcula
desde `workouts`; no hay otra copia.

## Flujo de datos: Comida

```n IndexedDB `userContent/nutricion` (tus datos y tu objetivo) + `foodLog` (por día) + `bodyLog` (pesajes) + `coach` (cambios)
│
▼ use-cases/nutritionStore.ts · cargarComida() → state/comida.ts (objetivo del día, semana, tendencia del peso)
│ cada 7 días: domain/review.ts · revisar() → una sugerencia «pendiente» en `coach` (nunca se aplica sola)
▼
Comida (Hoy · Semana) · Tu objetivo (solo pintan)
│ añadir / quitar → use-cases/foodLog.ts → `foodLog`; la base (shared/content/foods.json) se descarga al abrir «Añadir»
▼ «Aplicar desde mañana» → use-cases/target.ts → `userContent/nutricion` (kcal desde mañana) y `coach` (aplicado)

```n
Comida lee de Perfil solo su objetivo y sus días de entreno (`phaseOf` de su `index.ts`) para el primer cálculo.

## Datos y contenido

- **Esquema**: `shared/data/schema.ts` (13 almacenes); cada cambio de formato es una migración numerada con copia previa.
- **Contenido** versionado en JSON, separado del código. Programas de MUTA en `src/shared/content/programs/`;
  los de terceros en `private/programs/` (fuera de git), con `_meta.json` (`rev`): al subirla se recargan todos.
- Lo que elige el usuario (`plans/current`: `programId`, `variant`, `weakPoints`, `priorities`, `chosenAt` y lo que cambia
  en su plan: `descansos`, `musculos`, `cambios`, `ediciones`, `descansosTras`, `nombres`) se guarda aparte del contenido.
- Los e2e y la CI construyen sin `private/` (`VITE_NO_LOCAL_PROGRAMS=1`): solo salen las 2 rutinas de MUTA.

## Calidad

CI (`.github/workflows/ci.yml`): formato → linter con fronteras → CSS con tokens → tipos → pruebas → build →
tamaño (`size-limit`) → guardas del proyecto → recorridos y accesibilidad (Playwright + axe) → Lighthouse.
```
