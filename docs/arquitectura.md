# Arquitectura y flujo de datos

La app se organiza por **áreas** (Entreno, Perfil, y las pendientes Hoy, Comida y Progreso) y, dentro de cada
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
        applyPriorities      (opcionales de MUTA, regla de tiempo)        domain/priorities.ts
        applyWeakPoints      (huecos de punto débil)                      domain/weakPoints.ts
        applyMarkedOptionals ("(optional)" de los originales)             domain/optionals.ts
        phasesView           (filas listas para pintar)                   domain/routineView.ts
        applyRestRules       (filas de descanso)                          domain/routineView.ts
        factsOf              (datos clave)                                domain/routineView.ts
        │
        ▼  state/routines.ts · señal `routineDetail`
   screens/rutina/RutinaScreen.tsx  (solo pinta)
        │  toque en una fila → use-cases/slotPanel.ts → setPriorities / setWeakPoints → show() otra vez
        ▼  «Empezar esta rutina» → use-cases/startRoutine.ts → chooseRoutine → IndexedDB `plans/current`
```

Cada paso de `show()` recibe un `ProgramData` y devuelve otro; no modifica el original. Las filas que se pueden
cambiar llevan `slot` (nunca se borran) y el resto del código decide qué hacer con él.

## Datos y contenido

- **Esquema**: `shared/data/schema.ts` (13 almacenes); cada cambio de formato es una migración numerada con copia previa.
- **Contenido** versionado en JSON, separado del código. Programas de MUTA en `src/shared/content/programs/`;
  los de terceros en `private/programs/` (fuera de git), con `_meta.json` (`rev`): al subirla se recargan todos.
- Lo que elige el usuario (`plans/current`: `programId`, `variant`, `weakPoints`, `priorities`, `chosenAt`) se guarda
  aparte del contenido.
- Los e2e y la CI construyen sin `private/` (`VITE_NO_LOCAL_PROGRAMS=1`): solo salen las 2 rutinas de MUTA.

## Calidad

CI (`.github/workflows/ci.yml`): formato → linter con fronteras → CSS con tokens → tipos → pruebas → build →
tamaño (`size-limit`) → guardas del proyecto → recorridos y accesibilidad (Playwright + axe) → Lighthouse.
