# Lo común (`src/shared`)

Ningún área depende de otra por dentro: lo que usan varias vive aquí. `shared/` **nunca** importa de un área.

| Carpeta     | Qué es                                                                                            | Puede usar        |
| ----------- | ------------------------------------------------------------------------------------------------- | ----------------- |
| `ui/`       | `tokens.css`, `base.css` y componentes (Button, Choice, Sheet, ListRow, Tiles…)                   | `ui`, `lib`       |
| `data/`     | IndexedDB: `db.ts`, `schema.ts` (almacenes), `migrations/`, copia de seguridad, programas locales | `data`, `lib`     |
| `content/`  | JSON versionado: programas de MUTA, consejos, `program-info.json`                                 | `content`, `lib`  |
| `platform/` | Vibración, avisos, wake lock, archivos (versión web)                                              | `platform`, `lib` |
| `lib/`      | Utilidades puras: rutas (`paths.ts`), registro de errores                                         | `lib`             |

## Convenciones

- **ui**: todo color, tamaño y radio sale de variables de `tokens.css`; cada componente con su CSS Module; botones de 44 px mínimo.
  Un componente recibe datos y avisa de toques: no conoce el estado ni los casos de uso.
- **data**: el esquema lleva versión; cada cambio de formato es una migración numerada con su prueba y una copia previa.
  Los registros llevan `id`, `createdAt`, `updatedAt`, `deletedAt`. Lo que cambia el usuario va aparte del contenido.
- **content**: archivos JSON que no se editan a mano sin revisar su prueba. Los programas de terceros **no** van aquí: van en `private/`.
- `programs.ts` guarda los programas locales (`private/programs/*.json`, rev en `_meta.json`: subirla al cambiar un archivo).
