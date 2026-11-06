# Lo común (`src/shared`)

Ningún área depende de otra por dentro: lo que usan varias vive aquí. `shared/` **nunca** importa de un área.

| Carpeta     | Qué es                                                                                                                             | Puede usar        |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `ui/`       | `tokens.css`, `base.css` y componentes (Button, Choice, Sheet, Switch, Toast, ListRow, Tiles…)                                     | `ui`, `lib`       |
| `data/`     | IndexedDB: `db.ts`, `schema.ts` (almacenes), `migrations/`, copia de seguridad, programas locales                                  | `data`, `lib`     |
| `content/`  | JSON versionado: programas de MUTA, consejos, `program-info.json`                                                                  | `content`, `lib`  |
| `platform/` | Vibración, avisos, wake lock, archivos, compartir texto o imagen, la cámara de atrás (`startCamera`, el escáner) (versión web)     | `platform`, `lib` |
| `lib/`      | Utilidades puras: rutas (`paths.ts`), números y fechas (`format.ts`: `addDays`, `daysBetween`, `formatInt`…), `sinClaves`, errores | `lib`             |

## Convenciones

- **ui**: todo color, tamaño y radio sale de variables de `tokens.css`; cada componente con su CSS Module; botones de 44 px mínimo.
  Un componente recibe datos y avisa de toques: no conoce el estado ni los casos de uso.
- **data**: el esquema lleva versión; cada cambio de formato es una migración numerada con su prueba y una copia previa.
  Los registros llevan `id`, `createdAt`, `updatedAt`, `deletedAt`. Lo que cambia el usuario va aparte del contenido.
- **content**: archivos JSON que no se editan a mano sin revisar su prueba. Los programas de terceros **no** van aquí: van en `private/`.
- `exercises.json` es la biblioteca (141 ejercicios): sale del prototipo anterior con `node scripts/exercises-from-prototype.cjs`; no se
  edita a mano, se vuelve a generar. Los 4 de cuello no traen fuente: el prototipo los da como criterio orientativo.
- `exercise-aliases.json`: nombre de un ejercicio en una rutina → id de la biblioteca, cuando es el mismo ejercicio con otro nombre
  (técnica, ángulo, recorrido, una mano, superserie). Revisado a mano uno a uno (decisión 2026-11-03); se edita a mano y su
  prueba comprueba que cada id existe. Lo que no tiene pareja está en `private/informes/ejercicios-sin-ficha.txt`.
- `tips/pre.json` (los 9 de antes de empezar), `tips/muscles.json` (la clave, los 137 consejos y el reparto de cada músculo) y `tips/session.json` (textos de las reglas de la sesión, por id) salen del prototipo con
  `node scripts/tips-from-prototype.cjs`; tampoco se editan a mano.
- `data/localExercises.ts` carga la biblioteca local (`private/biblioteca/ejercicios.json`: los ejercicios originales de las rutinas con la
  explicación de su documento; ver [docs/datos.md](../../docs/datos.md)) y `usos.json` (cuántas veces sale cada ejercicio en tus rutinas: la
  biblioteca enseña primero los más típicos); como las rutinas locales, no se carga con `VITE_NO_LOCAL_PROGRAMS`
  (e2e, CI y Vitest).
- `foods.json` es la base de alimentos de Comida (1.493 por 100 g, BEDCA y USDA): sale del prototipo con
  `node scripts/foods-from-prototype.cjs`; no se edita a mano. Comida la importa aparte (no pesa al abrir la app).
- `tokens.css` lleva lo de Comida (la tarjeta negra `--target-hero`, el anillo `--ring`, la miniatura `--meal-thumb`, los platos `--dish-*`), alias de
  Entreno; sin lima. La letra es la misma escala para todas las áreas (ver «Tipografía» en [docs/rediseno.md](../../docs/rediseno.md)).
- `data/localRecipes.ts` carga el recetario (`content/recetario/`: recetas y una foto por receta; ver
  [docs/datos.md](../../docs/datos.md)); no se carga con `VITE_NO_LOCAL_PROGRAMS`. `foods-super.json`: los productos de
  supermercado de Open Food Facts (`node scripts/foods-off.mjs`); no se edita a mano.
- `programs.ts` guarda los programas locales (`private/programs/*.json`, rev en `_meta.json`: subirla al cambiar un archivo).
