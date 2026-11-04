# Lo común (`src/shared`)

Ningún área depende de otra por dentro: lo que usan varias vive aquí. `shared/` **nunca** importa de un área.

| Carpeta     | Qué es                                                                                                   | Puede usar        |
| ----------- | -------------------------------------------------------------------------------------------------------- | ----------------- |
| `ui/`       | `tokens.css`, `base.css` y componentes (Button, Choice, Sheet, Switch, Toast, ListRow, Tiles…)           | `ui`, `lib`       |
| `data/`     | IndexedDB: `db.ts`, `schema.ts` (almacenes), `migrations/`, copia de seguridad, programas locales        | `data`, `lib`     |
| `content/`  | JSON versionado: programas de MUTA, consejos, `program-info.json`                                        | `content`, `lib`  |
| `platform/` | Vibración, avisos, wake lock, archivos (versión web)                                                     | `platform`, `lib` |
| `lib/`      | Utilidades puras: rutas (`paths.ts`), números y fechas (`format.ts`), `sinClaves` (`object.ts`), errores | `lib`             |

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
- `programs.ts` guarda los programas locales (`private/programs/*.json`, rev en `_meta.json`: subirla al cambiar un archivo).
