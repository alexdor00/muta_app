# Comida (`src/features/nutrition`)

Apuntar lo que comes, tu semana, tu objetivo de kcal y, si quieres, una dieta con menús, recetas, compra, cocina y consulta
semanal; y el escáner de códigos. Diseños: versión 1 aprobada el 2026-11-05 (`Desktop/MUTA-Comida-diseno.png`) y versiones
2 y 3 (`Desktop/MUTA-Comida-v2-funcionalidades.png`), con el estilo que pidió el usuario: tarjeta del día gris con anillo
(sin lima), comidas en tarjetas con miniatura y ‹ Hoy › para cambiar de día. Capas y límites, los de
[Entreno](../training/CLAUDE.md): las pantallas no importan el dominio; lo que necesitan lo reexportan `state/comida.ts` y
`state/dieta.ts`.

## Regla de oro: el entrenador y el nutricionista **proponen**, nunca cambian nada solos

Tu objetivo se calcula una vez y se **guarda**; solo cambia si tú lo cambias o aceptas una sugerencia («Aplicar desde
mañana»; «Ahora no» la deja en el historial; la última aceptada se deshace). Con dieta pasa lo mismo con la consulta: sus
propuestas (kcal, pasos, fase) se añaden como un ajuste desde mañana solo si las aplicas, y se deshacen.

## Dónde está cada cosa

- `domain/food.ts` — alimentos (por 100 g, con `codigo` si lo escaneaste) y apuntes (`receta` si salió del menú):
  `macrosDe`, `sumar`, `COMIDAS` (nombres sugeridos), comida por la hora, raciones o gramos, buscador y recientes.
- `domain/targets.ts`, `weight.ts`, `review.ts`, `week.ts` — objetivo (Mifflin-St Jeor…), tendencia y ritmo del peso (los usa la
  revisión), la revisión semanal sin dieta y la letra de cada día. `docs/conocimiento/02-reglas.md` · sección 8.
- `domain/diet.ts` — la dieta: menús en un ciclo de 7 días, recetas con gramos de entreno y de descanso, la receta que
  «ajusta» (absorbe las kcal de la consulta y de la fase, de 5 en 5 g), el día con tu dieta (`diaDeDieta`), el reparto sin
  rutina y el archivo (`leerDieta` / `aArchivo`, formato `muta-dieta` v1). `dietSample.ts`, la dieta de ejemplo del prototipo.
- `domain/swaps.ts` (intercambios: mismos gramos del macro principal), `shopping.ts` (la compra por secciones; nombres de
  sección sugeridos), `kitchen.ts` (arroz y su factor, repartir una olla, un plato por 100 g), `barcode.ts` (variantes
  EAN/UPC y Open Food Facts), `consult.ts` (la consulta con dieta, reglas 1–8 de la sección 8, y las señales de la sección 5).
- `state/comida.ts` — señales y lo calculado; `diaVisto` (el día de ‹ ›: lo apuntado va a ese día), `dieta`, `tiposEntreno`,
  `tipoDe(fecha)` (lo que eliges → tu rutina → tus días repartidos) y `objetivoDelDia` (con dieta, lo que suman sus recetas).
- `state/dieta.ts` — el menú del día que ves, tu semana con la dieta, cifras, `recetaComoToca`, la compra y las consultas.
- `use-cases/nutritionStore.ts` — carga y guarda todo; con dieta no hace la revisión de kcal. `cargarTipos()` pide a Entreno
  (por su `index.ts`, en diferido) qué días son de entreno. `target.ts`, `foodLog.ts` como en la versión 1.
- `use-cases/diet.ts` (empezar, dejar, archivo, apuntar una receta, editar recetas y menús, intercambios), `shopping.ts`,
  `kitchen.ts`, `consult.ts` (preparar el informe; aplicar, «Ahora no», deshacer; la fuerza la da Entreno) y `scanner.ts`
  (lector zxing con su `.wasm` servido por la app, nunca de un CDN; Open Food Facts; guardar con su código).
- `components/` — `DayHero` (tarjeta gris con anillo y macros), `DayNav` (‹ Hoy ›), `MealList` y `MenuList` (tarjetas con
  miniatura; aún sin fotos: el icono de Comida), `DietWeek` (como Tu semana), `CoachCard`, `TrendChart` (en la sugerencia),
  `TargetHero`. La letra es la de Entreno, un tamaño por papel: sin tamaños propios.
- `screens/comida` — la pestaña: Hoy · Dieta (`?vista=dieta`; sin Semana: las medias, la proteína por días y la tendencia del peso serán de Progreso; el peso de hoy se apunta en Hoy) y sus hojas (añadir, escáner, ración, solo kcal, crear,
  comida del día, peso, datos, empezar dieta, día de la dieta, tu dieta, receta nueva). Pantallas completas: `objetivo`,
  `receta` (`/comida/receta/:id`, con intercambios y editar), `compra`, `cocina` y `consulta`. Lo común en `screens/comun`.

## Datos

- `userContent`: `nutricion`, `alimentos-propios`, `comidas-guardadas`, `dieta` (la que sigues: dieta, inicio, ajustes,
  días elegidos, factor del arroz y recetas originales) y `compra`.
- `foodLog` (por fecha), `bodyLog` (`weight`: pesajes; `checkin`: lo que apuntas en la consulta), `coach` (`area:
'nutricion'`: cambios del objetivo; `area: 'dieta'`: cada consulta con sus propuestas y su estado).
- La base de alimentos es `shared/content/foods.json` (`node scripts/foods-from-prototype.cjs`).

## Pendiente

Fotos de cada comida (la miniatura lleva un icono hasta que las haya). Con una dieta de verdad, comprobar la consulta en el
móvil durante unas semanas.
