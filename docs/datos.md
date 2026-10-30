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
