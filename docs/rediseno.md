# Documento de rediseño: resumen de referencia

Resumen fiel de «MUTA: rediseño completo» (27 oct 2026, 36 páginas), que vive fuera del repositorio. Sirve para
construir las pantallas que faltan sin tener el PDF delante. Si el PDF cambia, se actualiza este archivo.

**Regla: «Tu diseño» copia las imágenes del usuario; «Propuesta» es diseño nuevo que hay que aprobar. Nada se programa sin diseño aprobado.**

## Principios

Una acción principal por pantalla · el contenido manda (fotos grandes y oscuras, cifras grandes, gris para lo secundario, un solo acento) ·
pestañas para las cuatro áreas, pila para detalles, hojas para tareas cortas, pantalla completa para entrenar · un solo componente por función ·
respuesta inmediata (imagen, sonido, vibración) · pensada para el gimnasio (acciones abajo, botones de 52 px, números ≥ 28 px, pantalla encendida) ·
«Deshacer» mejor que preguntar · accesible (rem, etiquetas, contraste 4,5:1, reducir movimiento) · privada (sin cuenta; copia en un archivo).

## Sistema de diseño (todo sale de `tokens.css`)

- **Color** (claro/oscuro): `--bg` #FFF/#000 · `--surface` #F4F4F5/#1C1C1E · `--surface-2` #E9E9EB/#2C2C2E · `--label` #111113/#F2F2F7 ·
  `--label-2` #6E6E73/#98989F · `--separator` #E3E3E6/#38383A · `--accent` #111113/#F2F2F7 con `--on-accent` #FFF/#000 · estados
  `--good/--warning/--critical`. **Sin naranja** (decisión 2026-10-29): el documento original usaba #FF5A12/#FF6A2A como acento; donde este
  resumen diga «naranja» (descanso, check…), se usa el acento neutro: blanco y negro, y el énfasis por tamaño, peso y contraste.
- **Tipografía** (fuente del sistema, cifras de ancho fijo): título grande 34/41 · título 1 28/34 · título 2 22/28 · titular 17/22 · cuerpo 17/22 ·
  subtítulo 15/20 · nota 13/18 · leyenda 12/16 · cifra grande 48/52.
- **Espacio**: rejilla de 4 · margen lateral 20 · entre bloques 24, dentro 12 · radios 8 chip, 12 control, 20 tarjeta, 28 hoja, 999 píldora ·
  toque ≥ 44 px (botón principal 52) · sin sombras · 150 ms toque, 250 ms hoja, 350 ms pantalla, curva `cubic-bezier(.32,.72,0,1)`.
- **Tacto y sonido**: marcar serie = toque ligero + clic; mejor que la vez anterior = dos notas; récord = tres notas que suben; fin de descanso = tres pitidos.
- **Componentes base**: botón principal (píldora negra 52 px, «›» si lleva a otra pantalla), botón sobre foto (blanco), secundario (gris), celda de lista (64 px),
  control segmentado, tarjeta (radio 20), hoja (desde abajo, se cierra deslizando), círculo de día (36 px), teclado numérico propio (−/+ del salto de peso),
  anillo de descanso, aviso con Deshacer (4 s).

## Pestañas y pantallas

Cuatro pestañas (Hoy, Entreno, Comida, Progreso), bienvenida la primera vez y Perfil tras el icono de la esquina. Orden de construcción:
**Entreno → Bienvenida → Hoy → Progreso → Comida.** La barra de pestañas se ve siempre salvo en una sesión (pantalla completa). Las hojas van como parámetro
de la ruta (`?hoja=descanso`) para que «atrás» las cierre. Si el sistema cierra la app en un entreno, al abrirla vuelve a la sesión.

**Entreno** (9 pantallas de «Tu diseño»): A05 Tu plan → A06 Tu rutina → C00 Sesión: inicio → C01 Ejercicios → C02 Registro ↔ C03 Descanso; C07 ¿Seguro? (hoja),
C08 Esta sesión (hoja), C24 Resumen; Músculos y Ficha del músculo; Ficha del ejercicio. Pendiente de decidir: C00 y C01 separadas (diseño 1) o juntas
(diseño 3, recomendado: un toque menos).

- **A05**: título «Tu plan», tarjeta oscura con foto («Ver detalle ›»), «Esta semana» con 7 círculos (día del mes encima, ✓ en entrenados), músculos (Hoy/Semana,
  Frente/Espalda). Sin plan: «Crea tu plan» → A04. Sesión en curso: «Continuar sesión».
- **A06**: control Semanas/Plan, una celda por sesión (sigla, nombre, ejercicios, minutos). Propuesta: «Editar» (reordenar, añadir, borrar), mantener pulsado =
  Editar sesión / Cambiar foto / Duplicar, lupa → Biblioteca; «Semanas» = el ciclo día a día con sus descansos.
- **C02 Registro** (la más usada): cabecera con foto y «4 series · 8–12 rep», tarjeta con Series/Repeticiones/Descanso, «Registrar serie». Matiz imprescindible:
  **campo de kilos** con la sugerencia del motor; recomendado «Quedan» (RIR) opcional; teclado propio; «Antes: 60 × 10».
- **C03 Descanso**: fondo negro, anillo naranja que se vacía, «Siguiente serie 1/4», «Saltar»; propuesta −15 s/+15 s. +1 min si las reps caen por debajo del 80 %
  de la primera serie; 20 s en superserie.
- **C07**: sale con más de 300 kg o 50 reps; por encima de 600 kg o 100 reps no se acepta.
- **C08**: volumen, calorías (estimado o sustituir por Récords), tiempo, rendimiento; «Ver resumen» y «Volver al plan».
- **C24**: check naranja, «¡Sesión completada!», tiempo y calorías, «Constancia hoy, resultados mañana.», «Volver al plan»; propuesta: «Frente a la última vez»,
  récords, «Compartir».
- **Sin diseño todavía (propuestas)**: Ficha del ejercicio, Biblioteca, Editar sesión, Editar ejercicio, Perfil.
- **Hoy, Comida, Progreso**: ver el PDF (tercera imagen de diseño); Hoy lleva «Comenzar entrenamiento» a la misma C00.

## Casos de uso y datos de Entreno

Casos de uso: `startWorkout`, `logSet` (valida, guarda al momento, arranca el descanso), `undoSet`, `swapExercise(slotRef, exerciseId, scope)`, `finishWorkout`
(una transacción: entreno, ciclo, récords, coach, historial por ejercicio), `reopenWorkout`/`discardWorkout`, `editPlan`, `importBackup`.

Rutas: `/entreno`, `/entreno/rutina`, `/entreno/sesion/:id/inicio`, `/entreno/sesion/:id`, `/entreno/sesion/:id/resumen`, `/entreno/ejercicio/:exerciseId`.

Datos: fechas `2026-10-27`, kg, cm y segundos por dentro; coma decimal en pantalla (`shared/lib/format`); semanas desde el lunes; el ciclo no depende del calendario
(el puntero avanza al terminar una sesión); un entreno que empieza antes de las 4:00 cuenta para el día anterior (propuesta); registros con `id`, `createdAt`,
`updatedAt`, `deletedAt`; lo del usuario aparte del contenido; transacciones; migración numerada con prueba; copia cada 14 días y antes de migrar;
«Importar copia de MUTA» (fase 5).

## Biblioteca y consejos

- **Biblioteca**: 141 ejercicios, 16 músculos, 11 patrones, 6 materiales. Orden: Pecho · Espalda · Hombros · Brazos · Piernas · Core · Cuello; compuestos antes que
  aislamientos; tu material primero; alfabético. Grupos fijos «En tu plan» y «Recientes». Búsqueda sin acentos por nombre y alias (empieza por, contiene, alias).
  Filtros en chips. Campos: `id, name/aliases, primary, contributes (1 o 0,5), kind, pattern, equipment, reps/rir/rest/step, stable, key, media, family`.
- **Consejos** (pegados al ejercicio y al músculo, no a la rutina): máximo 3 a la vista («Ver N más»); una acción por consejo, imperativo, < 120 caracteres; el porqué
  al tocar; sin siglas («RIR 2» = «a 2 del fallo»); no se repiten; se editan con lápiz (ocultar, cambiar, volver al original, añadir «Tuyo»). Estructura:
  `id, scope (general|session|muscle|family|exercise), target, text, why, when (before|during|after), priority, source`.

## Fases de construcción («Hecho cuando…»)

0 Preparar el equipo · 1 Cimientos (tokens, componentes base, `/dev/ui`, navegación, datos, PWA) · 2 Motor (pasar el motor actual con pruebas de mismas entradas y
salidas) · 3 Contenido (141 ejercicios y consejos en JSON con alias y familia) · **4 Entreno pantalla a pantalla** (rama `pantalla/<código>-<nombre>`, captura comparada
con el diseño, matices aprobados, recorrido probado) · 5 Tus datos (importar copia) · 6 Calidad · 7 Publicar · 8 Resto de la app. Las fases 0 y 1 y parte de la 4
(A01–A04, elegir rutina, detalle) están hechas: ver `TAREAS.md`.

## Checklist de cada pantalla

Coincide con su diseño aprobado · vive en su área y solo importa de otra por `index.ts` · solo llama a casos de uso y lee estado · solo variables de `tokens.css` ·
una sola acción principal en la mitad inferior · todo lo tocable ≥ 44 px · estados (vacío, cargando, en curso, error) con texto que dice qué hacer · pantalla de error
propia · modo oscuro y letra al máximo, axe sin errores · botones con nombre y contraste 4,5:1 · «reducir movimiento» = solo fundidos · Deshacer en lo reversible,
confirmación solo en lo destructivo · funciona sin internet y no pierde datos · presupuesto de rendimiento · prueba de recorrido y captura; CI en verde.

## Presupuestos

JS al abrir ≤ 150 KB comprimido (el proyecto exige 50 kB) · abrir Tu plan < 1 s · marcar una serie < 100 ms · Lighthouse ≥ 90.

## Lecciones de la app anterior (por qué existen las reglas)

Constante repetida que dejó 8 pantallas sin abrir → módulos y CI · estilos pisados por `!important` → CSS por componente · Entreno dependía de Hoy y Comida →
fronteras · «24 de 4 esta semana» → un dato, una función · funciones reescritas desde otros archivos → un caso de uso por acción · cálculos sobre todo el historial →
índices e historial por ejercicio · editor de rutina inalcanzable → rutas explícitas · sin historial de cambios → git y ADR.
