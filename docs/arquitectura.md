# Arquitectura y flujo de datos

La app se organiza por **áreas** (Entreno, Comida, Perfil, Progreso y la pendiente Hoy) y, dentro de cada
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
IndexedDB `plans/current` + `programs` + `rotation/current` + `workouts` (+ `userContent`: fotos, notas, consejos ocultos y los discos del gimnasio)
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

El Perfil (área `profile`) es tu copia de seguridad (`CopiaDeSeguridad`, que `profile/copia.ts` da también a la pantalla de
error de `src/app`) y su cuadro al abrir la app una vez al mes (`AvisoCopia`, también por `profile/copia.ts`). La copia la hace `shared/data/backup`.

Todo lo que se enseña de tus entrenos (la vez anterior, gráficas, tu semana, series por músculo, racha) se calcula
desde `workouts`; no hay otra copia.

## Flujo de datos: Comida

```
IndexedDB `userContent` (nutricion, dieta, compra, menu, platos-tuyos, productos…) + `foodLog` (por día) + `bodyLog` (pesajes y consultas) + `coach` (cambios)
│
▼ use-cases/nutritionStore.ts · cargarComida() → state/comida.ts y state/dieta.ts
│   el objetivo del día: con dieta, lo que suman sus recetas ese día (entreno o descanso); si no, tu objetivo de kcal
│   sin dieta, cada 7 días: domain/review.ts · revisar() → una sugerencia «pendiente» en `coach` (nunca se aplica sola)
│   cargarTipos() → Entreno (index.ts · tiposDeDia, en diferido) → qué días son de entreno según tu rotación
▼ use-cases/recipes.ts · cargarRecetas() → state/recetas.ts: los platos (private/recetas por shared/data/localRecipes.ts;
│   sin él, los de la dieta de ejemplo), tu menú, tus platos y tus productos; domain/fit.ts ajusta un plato a lo que falta,
│   domain/menuCoach.ts propone cambios al menú (nunca los aplica)
▼
Comida (Hoy · Menú · Recetas; la dieta desde Menú) · Plato · Categoría · Tu nutricionista · Tu objetivo · Receta ·
La compra (del menú y de la dieta) · Cocina · Consulta (solo pintan)
│ añadir / quitar / apuntar una receta o un plato → use-cases/foodLog.ts, diet.ts y recipes.ts → `foodLog` (al día que ves)
│ tu menú, cocinar, avisos y propuestas → use-cases/menu.ts → `userContent/menu`; los avisos, a un .ics del calendario
│ la base (shared/content/foods.json) se descarga al abrir «Añadir»; el lector de códigos, al abrir el escáner
▼ «Aplicar desde mañana» → use-cases/target.ts (objetivo) o consult.ts (un ajuste de la dieta desde mañana) y `coach`
```

Comida lee de Perfil solo su objetivo y sus días de entreno (`phaseOf` de su `index.ts`) para el primer cálculo, y de Entreno
(su `index.ts`) los días de entreno y la fuerza en los básicos para la consulta. El escáner consulta Open Food Facts (el único
acceso a internet de Comida) y guarda lo encontrado en `userContent/alimentos-propios` con su código.

## Flujo de datos: Progreso

```
Comida · index.ts · comidaParaProgreso()  ── pesajes y tendencia, ritmo frente al previsto, lo que comiste cada día con tu
                                             objetivo, la cintura de la consulta, la consulta de tu dieta y tu sexo y altura
Entreno · index.ts · entrenoParaProgreso() ── tus etapas (mesociclos, en curso y anteriores) con su fuerza, tu fuerza semana
                                             a semana y desde que empezaste (domain/strengthHistory.ts), tus entrenos y el
                                             récord del básico de cada grupo
          mesocicloParaProgreso() · compararMesociclos() ── una etapa por dentro y dos comparadas (domain/mesocycles.ts)
          renombrar · empezar otra · volver a usar · elegir básico ── los guarda Entreno (mesocycles, plans, userContent)
IndexedDB `bodyLog` (tipo «perimetros»)    ── tus siete medidas
IndexedDB `photos`                         ── tus fotos de progreso (reducidas, solo en el móvil)
IndexedDB `userContent/composicion`        ── tu calibración y tu objetivo de grasa
        │
        ▼  progress/use-cases/progress.ts · cargarProgreso()  (cada vez que se abre la pestaña)
   state/progreso.ts (y lo calculado: composición, evolución, una etapa con domain/stage.ts, un mes frente al anterior)
   → screens/progreso (el mes con su etapa y Días · Cuerpo · Fuerza; la etapa, en su hoja) y screens/hoy (¿Cómo estás
     hoy? y las medidas del mes, para Hoy por index.ts): solo pintan
```

**Hoy** (2026-11-13) no calcula nada: cada área le da sus cosas de hoy como `TareaDeHoy` (`shared/lib/tareaDeHoy.ts`) con
un hook de su `paraHoy.ts` (la API para Hoy, aparte del `index.ts` para que las demás áreas no la carguen: `useHoyDeEntreno`, `useHoyDeComida`, `useHoyDeProgreso`, que traen también sus hojas); Hoy las
junta y ordena (`today/domain/dia.ts`), pinta el anillo y las listas y solo guarda lo que marcas a mano (la compra,
cocinar: `userContent/hoy-marcadas`). Pasos (`bodyLog` tipo `steps`) los guarda Nutrición; ¿Cómo estás hoy? (tipo
`sensaciones`), Progreso.

Progreso no calcula nada de Comida ni de Entreno: cada área lo calcula desde sus datos y lo da por su `index.ts`. Para el
peso de cada mesociclo, Progreso le pasa a Entreno una función con tus pesajes (`PesoEnTramo`). El mesociclo en curso lo
crea y lo cierra Entreno al leerlo (si cambiaste de rutina, se cierra el día antes del nuevo).

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

```
