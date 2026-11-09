# Nutrición (`src/features/nutrition`, antes Comida)

Apuntar lo que comes, tu objetivo de kcal, tu menú de la semana con las recetas que se ajustan a lo que te falta y, si
quieres, una dieta con menús, recetas, compra, cocina y consulta semanal; y el escáner de códigos. Diseños: versión 1 aprobada el 2026-11-05 (`Desktop/MUTA-Comida-diseno.png`) y versiones
2 y 3 (`Desktop/MUTA-Comida-v2-funcionalidades.png`), con el estilo que pidió el usuario: tarjeta del día gris con anillo
(sin lima), comidas en tarjetas con miniatura y ‹ Hoy › para cambiar de día. Recetas y menú: `Desktop/MUTA-Recetas-
funcionalidades.png`, `Desktop/MUTA-Menu-funcionalidades.png` y, más sencilla (tus menús A, B, C…, el tick, cambiar un
alimento), `Desktop/MUTA-Comida-sencilla-funcionalidades.png` (2026-11-06). Nutrición con tu día y «Tu plan»:
`Desktop/MUTA-Comida-tu-plan-propuesta.png` (2026-11-08). Capas y límites, los de
[Entreno](../training/CLAUDE.md): las pantallas no importan el dominio; lo que necesitan lo reexportan `state/comida.ts` y
`state/dieta.ts` (y `state/recetas.ts`). Otras áreas solo usan `index.ts`: `HoyDeComida` (tu peso, lo que comes hoy según tu menú y lo de hoy con hora), para Hoy. «Tus datos» pregunta la primera vez qué quieres (definir, mantenerte o volumen).

## Regla de oro: el entrenador y el nutricionista **proponen**, nunca cambian nada solos

Tu objetivo se calcula una vez y se **guarda**; solo cambia si tú lo cambias o aceptas una sugerencia («Aplicar desde
mañana»; «Ahora no» la deja en el historial; la última aceptada se deshace). Con dieta pasa lo mismo con la consulta: sus
propuestas (kcal, pasos, fase) se añaden como un ajuste desde mañana solo si las aplicas, y se deshacen.
Velocidad por fases (`porFases`, `ritmoDeLaSemana`) y tu situación en mantenimiento (`situacion`: parón o salida de una
definición, con mesetas de +200 kcal) los propone la revisión semanal (`revisar`: `motivo` y `extra` en la sugerencia, que
`aplicarSugerencia` guarda); `consejosDeLaSemana` añade «si la grasa no baja» y la recarga; `notaHidratos`, en Tu día, los
hidratos antes y después de entrenar; `mejoresPara` pone primero la base vegetal (`parteVegetal`). Si te pasas de grasa (o de proteína), lo que falta del día (`faltaDelDia`, en `domain/fit.ts`) quita lo que sobra de los
hidratos que quedan y `ajustar` puede dejar a 0 lo que aporta sobre todo grasa: las recetas vienen con menos grasa y el
día cuadra con tus kcal (`grasaDeMas` lo avisa en «Para la …» y en Cuadrar el día). Hidratos según el día (ON/OFF, `onOff` en tus ajustes): con el interruptor, `objetivoDe` da más hidratos los días de
entreno y menos los de descanso (`tipoDe`, de tu rutina) con la misma media semanal (`kcalDelDia`, `entrenosDeLaSemana`);
Tu día lo dice (`hidratosDelDia`). Con dieta cargada manda la dieta. Proteína y grasa van por kilo o en gramos fijos (`Reparto`, `macrosObjetivo`); los hidratos, lo que queda. Fuera de lo que
dicen los documentos (`avisosReparto`: proteína 1,5–2 g/kg, grasa desde 0,6) solo se avisa; si algo de fuera los contradice,
mandan los documentos. En volumen, la revisión semanal no sube kcal si tu fuerza en los básicos no baja (`progresas`,
`fuerzaBasicos`, cargada de Entreno al abrir); la consulta con dieta no sube la proteína al final y sugiere recargas de
hidratos según cómo estás (guía G1, decisiones del 2026-11-08 en `docs/conocimiento/04-guia-culturismo-natural.md` §14).

## Dónde está cada cosa

- `domain/food.ts` — alimentos (por 100 g, con `codigo` si lo escaneaste) y apuntes (`receta` si salió del menú):
  `macrosDe`, `sumar`, `COMIDAS` (nombres sugeridos), comida por la hora, raciones o gramos, buscador y recientes.
- `domain/targets.ts`, `weight.ts`, `review.ts`, `week.ts` — objetivo (Mifflin-St Jeor…), tendencia y ritmo del peso (los usa la
  revisión), la revisión semanal sin dieta y la letra de cada día. `docs/conocimiento/02-reglas.md` · sección 8.
- `domain/diet.ts` — la dieta: menús en un ciclo de 7 días, recetas con gramos de entreno y de descanso, la receta que
  «ajusta» (absorbe las kcal de la consulta y de la fase, de 5 en 5 g), el día con tu dieta (`diaDeDieta`), el reparto sin
  rutina y el archivo (`leerDieta` / `aArchivo`, formato `muta-dieta` v1). `dietSample.ts`, la dieta de ejemplo del prototipo.
- `domain/swaps.ts` (intercambios: mismos gramos del macro principal), `shopping.ts` (la compra por pasillos: por categoría y, lo que
  la base guarda junto o no tiene, por su nombre; sugerido), `kitchen.ts` (arroz y su factor, repartir una olla, un plato por 100 g,
  lo cocido en crudo por sus kcal), `barcode.ts` (variantes
  EAN/UPC y Open Food Facts), `consult.ts` (la consulta con dieta, reglas 1–8 de la sección 8, y las señales de la sección 5).
- `domain/recipes.ts` — un plato (del recetario, de ejemplo o tuyo): leer el recetario, su macro principal (las verduras, salsas, caldos y bebidas no se mueven: `NO_SE_AJUSTA`), buscar, qué
  categorías van con cada comida (sugerido) y tus productos (el cambio de un solo día, con `claveDelDia`; convive con el de siempre) (`productoEn`, `valoresCon`). `fit.ts` — ajustar un plato a lo
  que falta (parte del total del libro y suma la diferencia; de 5 en 5 g, entre ×0,5 y ×2,5, sugerido), hasta dónde llega,
  el reparto entre comidas (sugerido) y cuadrar el día. `menu.ts` — tus menús (1 a 7, un plato por comida) y tu semana (qué menú va cada día), cocinados, día de la compra,
  avisos, lo de hoy, las recetas para la compra y el `.ics`. `menuCoach.ts` — lo que propone tu nutricionista (por menú).
  En `recipes.ts`, tus cambios de un ingrediente (`platoCon`: tu marca u otro alimento equivalente; todos, plato u hoy).
- `state/comida.ts` — señales y lo calculado; `diaVisto` (el día de ‹ ›: lo apuntado va a ese día), `dieta`, `tiposEntreno`,
  `tipoDe(fecha)` (lo que eliges → tu rutina → tus días repartidos) y `objetivoDelDia` (con dieta, lo que suman sus recetas).
- `state/recetas.ts` — los platos, las fotos, tu menú, tus productos, lo que falta, la siguiente comida y sus platos, lo de
  hoy y las propuestas (`propuestas`).
- `state/dieta.ts` — el menú del día que ves, tu semana con la dieta, cifras, `recetaComoToca`, la compra y las consultas.
- `use-cases/nutritionStore.ts` — carga y guarda todo; con dieta no hace la revisión de kcal. `cargarTipos()` pide a Entreno
  (por su `index.ts`, en diferido) qué días son de entreno. `target.ts`, `foodLog.ts` como en la versión 1.
- `use-cases/recipes.ts` (cargar el recetario de `private/` o los de ejemplo, apuntar un plato, tus platos, cambiar un
  ingrediente y sus equivalentes, poner un plato en tu dieta) y `menu.ts` (cuántos menús y qué día, el plato de cada comida,
  cocinar, avisos y calendario, aplicar, «Ahora no» y deshacer lo que propone el nutricionista).
- `use-cases/diet.ts` (empezar, dejar, archivo, apuntar una receta, editar recetas y menús, intercambios), `shopping.ts`,
  `kitchen.ts`, `consult.ts` (preparar el informe; aplicar, «Ahora no», deshacer; la fuerza la da Entreno) y `scanner.ts`
  (lector zxing con su `.wasm` servido por la app, nunca de un CDN; Open Food Facts; guardar con su código).
- `components/` — `DayHero` (tarjeta gris con anillo y macros), `DayNav` (‹ Hoy ›), `MealList` (con el plato de tu menú y su tick) y
  `MenuList` (tarjetas con miniatura), `Platos` (foto, fila, tarjeta y carrusel), `DietWeek` (como Tu semana), `CoachCard`, `TrendChart` (en la sugerencia),
  `TargetHero`. La letra es la de Entreno, un tamaño por papel: sin tamaños propios.
- `screens/comida` — la pestaña Nutrición: abre en tu día; `Cabecera` (como Entreno, con «Tu plan» y la barra compacta), `?vista=plan`
  (`PlanVista`: la tarjeta del objetivo y `MenuVista`; `?vista=menu` lleva aquí), `?vista=recetas` y `?vista=dieta` (desde Tu plan); sin
  Semana: será de Progreso; el peso y lo de hoy, en la pestaña Hoy: `screens/hoy/HoyDeComida`) y sus hojas (añadir, escáner, ración, solo kcal, crear,
  comida del día, peso, datos, empezar dieta, día de la dieta, tu dieta, receta nueva, elegir plato, un plato del menú,
  tus menús, opciones de un menú, cocinar, avisos, crear plato, cuadrar el día). `screens/plato` — un plato
  (`/comida/plato/:id`, con ajustar, cambiar un ingrediente,
  al menú y a tu dieta), una categoría (`/comida/recetas/:categoria`) y tu nutricionista (`/comida/nutricionista`). Pantallas completas: `objetivo`,
  `receta` (`/comida/receta/:id`, con intercambios y editar), `compra`, `cocina` y `consulta`. Lo común en `screens/comun`.

- La base: `foodLog.cargarAlimentos()` (los genéricos) y, detrás, `cargarSupermercados()` (19.157 productos con marca y código).
  La compra, por días o por menús. Tu versión de un plato: `platoEditado` + `EditarPlatoHoja`; tu dieta a tus menús:
  `menu.menusDeTuDieta()`. Cocina lleva arriba «Pesa en crudo, come cocinado» (`screens/cocina/PesaCrudo.tsx`).

## Datos

- `userContent`: `nutricion`, `alimentos-propios`, `comidas-guardadas`, `dieta` (la que sigues: dieta, inicio, ajustes,
  días elegidos, factor del arroz y recetas originales), `compra`, `menu` (huecos, cocinados, compra, avisos, propuestas
  descartadas y aplicadas), `platos-tuyos` y `productos`.
- El recetario es de terceros: `private/recetas/` (fuera de git), por `shared/data/localRecipes.ts`; ver docs/datos.md.
- `foodLog` (por fecha), `bodyLog` (`weight`: pesajes; `checkin`: lo que apuntas en la consulta), `coach` (`area:
'nutricion'`: cambios del objetivo; `area: 'dieta'`: cada consulta con sus propuestas y su estado).
- La base de alimentos es `shared/content/foods.json` (`node scripts/foods-from-prototype.cjs`).

## Pendiente

Fotos de lo que apuntas sin receta (icono). Con una dieta de verdad, comprobar la consulta en el móvil unas semanas. Lo de hoy
pasa a la pestaña Hoy cuando exista.
