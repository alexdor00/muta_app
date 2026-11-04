# Datos de las rutinas: cómo se guardan, se verifican y se añaden

Regla: **no se inventa nada.** Ejercicios, orden, series, repeticiones, esfuerzo y notas salen del documento original; lo que no está se rellena solo con las
reglas de `docs/conocimiento` y se marca como rellenado; los textos propios (nombres en español, «!») son traducción o resumen del documento.

## Dónde está cada cosa

- Documentos originales: carpeta del usuario `Entrenamiento\Gym\NIppard` (Excel y PDF por programa). **Fuera de git.**
- Programas de terceros ya extraídos: `private/programs/*.json` (31 archivos) + `_meta.json` con `rev`. **Fuera de git.** Subir `rev` cada vez que cambie un
  archivo: así la app los vuelve a cargar en IndexedDB.
- Programas de MUTA: `src/shared/content/programs/` (en git). Hechos medidos: `src/shared/content/program-info.json` (se regenera con `node scripts/program-info.ts`).
- Herramientas de extracción y verificación: `private/herramientas/` (copia local, fuera de git; algunas llevan rutas absolutas `C:/Users/alexa/Desktop/Muta/…`).
  Texto extraído de todos los originales: `private/herramientas/originales-texto/`.
- Informes generados: `private/informes/` (cómo funciona, comparaciones, fichas).

## Formato de un programa (`domain/program.ts`)

`{ id, name, source, blocks:[{ title, weeks:[{ week, days:[ {name, exercises:[…]} | {rest:true, note} ] }] }], restRules?, restInfo?, weakPoints? }`.
Cada ejercicio: `name` (español) y `originalName` (original), `muscle`, `kind`, `group`, `sets`, `reps`, `rpe`, `percent1RM`, `rest`, `notes`, `substitutions`, `tip`.
Un hueco de punto débil se reconoce por su nombre original (`Weak Point Exercise 1/2`, `UPPER/LOWER BODY WEAK POINT 1`).

## Cómo se verificó que son exactos (hecho una vez; repetir al tocar un programa)

- **Excel (20 programas):** releídos de cero y comparados fila a fila con lo guardado (`verify-xlsx-indep.cjs`, `cmp-xlsx.cjs`): 6.578 filas, 0 diferencias; además
  cada fila debe estar en su Excel y en el mismo orden.
- **PDF (11 programas):** se cuenta cada fila del PDF por su posición y se alinea con lo guardado (`anchors.mjs`, `align2.cjs`, `pdfnames.mjs`, `verify-pdf-indep.mjs`).
  Se corrigieron filas que faltaban (+28 Tren inferior, +8 Optimización, +6 Glúteo), nombres cortados, esfuerzos simplificados y niveles mal agrupados.
- **Formato por campo:** `lint-datos.cjs` revisa que cada campo tenga lo esperado (un descanso que es una nota, un nombre con «DAY 4»… es contaminación al extraer).
- **Al corregir un dato de una rutina local, subir `rev` en `private/programs/_meta.json`** (con una nota de qué cambió). La app guarda una copia de cada rutina en el navegador y solo la vuelve a cargar cuando cambia la revisión; sin subirla, cada navegador sigue con el dato viejo.
- **Normalización** (sin cambiar valores): `scripts/normalize-programs.cjs private/programs`.
- **Nombres en la app.** Los documentos originales y estas notas llaman «Tren inferior» y «Optimización» a dos programas de Mujer;
  en la app se llaman «Desarrollo completo · foco en glúteo» y «Físico equilibrado» (`catalog.ts`, ids `mujer-especializacion` y `mujer-optimizacion`).

## Excepciones conocidas (y por qué)

- Descansos de «Desarrollo completo · foco en glúteo» (`mujer-especializacion`): el documento solo dice que el bloque 1 **se puede** hacer seguido (seis días de entreno y el día 7 de descanso). Se guarda como nota (`restInfo`), no como regla; los descansos salen de la detección por patrones (`restCycles.ts`). Regla general: un descanso que el documento solo permite no se guarda como obligatorio.
- Series de la semana 2 de «En casa» (avanzada, torso 2): no vienen en el PDF; se deducen de las semanas 1 y 3, que coinciden.
- Erratas del documento corregidas: «REP10», «RP8», «PRE8» (= RPE), «2-3mn» (= 2-3 min). Una celda de Optimización dice «RPE» sin número y se deja.
- Test de sentadilla (semana 10): el PDF solo dice «NOTES»; «1 repetición, RPE 9-9.5» sale de sus preguntas frecuentes y queda marcado como rellenado.
- «Especialización en sentadilla»: solo los 4 días de pierna del PDF.
- Descansos que faltaban y esfuerzos: rellenados con las reglas de `docs/conocimiento` y marcados en los datos.

## Añadir o cambiar una rutina

1. Copiar el original a la carpeta de documentos; extraer el texto o la tabla con las herramientas (Excel: `dumpxlsx.cjs`; PDF: `pdftext.mjs`, `extractpdf*.cjs`).
2. Generar el JSON sin interpretar: mismo orden y valores; nombres en español con `originalName`; lo que falte, vacío (nunca inventado).
3. Normalizar, pasar `lint-datos.cjs` y la verificación independiente de su formato (Excel o PDF).
4. Añadir la entrada a `CATALOG` (`domain/catalog.ts`: id, familia = carpeta original, días, tono) y su texto «!» (`domain/about.ts`).
5. Si el archivo no trae descansos, añadir `restRules`/`restInfo` según lo que diga el documento; si no dice nada, no añadir nada (el valor por defecto es descanso
   obligatorio tras la vuelta completa).
6. Subir `rev` en `private/programs/_meta.json`, regenerar `program-info.json` y probar la rutina en el navegador (`npm run dev`).
7. Actualizar `docs/decisiones.md` si hubo una decisión y `TAREAS.md`.

## Puntos débiles

Dos modos: **Culturismo** (un músculo y, de su tabla, ejercicio 1 y 2; dos tablas, fase 1 y fase 2, extraídas del Excel «WEAK POINTS TABLE») y **Torso y pierna**
(músculo y ejercicio por día; tabla de la página 59 del PDF, escrita a mano). Viven en el campo `weakPoints` del programa. Herramientas: `wp-extract.cjs`, `wp-build.cjs`.

## Sustituciones (2026-11-03)

Las sustituciones de cada ejercicio salen del documento, en su orden de preferencia. Las rutinas que no las traían en la tabla
las tienen en la lista «Exercise Substitutions» del final del documento: `private/herramientas/sustituciones.cjs` la lee
(sobre el texto de `pdftotext -layout`), busca cada ejercicio por su nombre original (también sin la técnica: pausa,
excéntrica, top set…), traduce con `translate.cjs` y corrige con `sustituciones-es.tsv` (traducciones revisadas a mano; vacío =
resto de un corte, no es un ejercicio). Solo rellena donde no hay nada. Rev 15 de `_meta.json`: el 74 % de los ejercicios
tienen sustituciones del documento. Sin lista en el documento: Women's Foundation, Optimization, Glute Hypertrophy y At-Home;
pendientes: Women's Specialization (en columnas de la tabla) y Comeback Bridge (la página es una imagen).

## Explicaciones de los documentos y biblioteca local (2026-11-03)

- **Explicaciones.** La columna de notas de cada documento (`notes`, en inglés) está traducida a mano en
  `private/herramientas/notas/notas-es.tsv` (1.140 distintas; las vacías son trozos rotos del PDF). `notas-aplicar.cjs` las pone en
  cada ejercicio como `tip` (el original no se toca). Rev 16 de `_meta.json`. El esfuerzo va en RIR («RPE 9» → «a 1 del fallo»).
- **Biblioteca local.** Los ejercicios originales de las rutinas que no están en la biblioteca de MUTA (ni con alias) los genera
  `node private/herramientas/biblioteca-local.mts` en `private/biblioteca/ejercicios.json`: músculo con `muscleOf`, material,
  tipo y patrón por el nombre, la pauta más habitual y la explicación más repetida de su documento, con los programas de los
  que sale. Quedan fuera los estiramientos y los «a elegir». Volver a generarla al cambiar rutinas, alias o explicaciones.
  Los 25 cuyo documento no trae explicación la tienen de una web de técnica (`private/herramientas/explicaciones-web.tsv`: id,
  texto en español y web); la ficha lo dice («Explicación de strengthlog.com · sale en: …», campo `keyWeb`).
- **Orden de la biblioteca.** El generador cuenta cuántas veces sale cada ejercicio (de MUTA o local, con sus alias) en todas las
  rutinas y lo guarda en `private/biblioteca/usos.json`: al buscar o filtrar por músculo salen primero los más típicos. Sin ese
  archivo (CI, pruebas), el orden de la biblioteca de MUTA.
- **Sin duplicados.** Los nombres que solo cambian la técnica, la intensidad o el tipo de serie (pausa, lastrado, excéntrica, myo-reps,
  serie pesada o de descarga) van en una sola ficha y los demás quedan como `alias`; un paréntesis con «o» es una alternativa y no se
  quita. El generador no escribe si queda un id, un nombre o un ejercicio repetido, también frente a los de MUTA. Revisado el
  2026-11-03: 194 ejercicios locales (14 con alias) y los 141 de MUTA sin duplicados.

## Tu rutina desde un CSV

En Elegir rutina, abajo, «Cargar desde CSV» (y «Descargar plantilla»). Una fila por ejercicio, en el orden en que haces la
semana; la primera fila son los títulos (da igual mayúsculas y tildes; separados por `;` o `,`):

| Columna      | Obligatoria | Ejemplo                                                                                 |
| ------------ | ----------- | --------------------------------------------------------------------------------------- |
| Sesión       | sí          | `Torso` (las filas seguidas con la misma sesión forman esa sesión)                      |
| Ejercicio    | sí          | `Press banca` (si está en la biblioteca, con cualquiera de sus nombres, tiene su ficha) |
| Series       | no          | `3`                                                                                     |
| Repeticiones | no          | `6-10`, `8 a 12`, `5` o una por serie: `4,6,8` (cada serie distinta)                    |
| RIR          | no          | `2` (repeticiones antes del fallo, 0–9)                                                 |
| Descanso     | no          | `3:00`, `90 s`, `2 min` o `180`                                                         |
| Notas        | no          | texto libre                                                                             |

Una fila con `Descanso` en la columna de la sesión es un día de descanso obligatorio en ese punto. Lo que no se rellena se
pone por costumbre y sale como «sugerido». Se guarda en `programs` (id `mia:…`), solo en el móvil.
