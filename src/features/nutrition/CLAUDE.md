# Nutrición (`src/features/nutrition`, antes Comida)

Apuntar lo que comes, tu objetivo de kcal, tu menú de la semana con las recetas que se ajustan a lo que te falta y, si
quieres, una dieta con menús, recetas, compra, cocina y consulta semanal; y el escáner de códigos. Diseños: versión 1 aprobada el 2026-11-05 (`Desktop/MUTA-Comida-diseno.png`) y versiones
2 y 3 (`Desktop/MUTA-Comida-v2-funcionalidades.png`), con el estilo que pidió el usuario: tarjeta del día gris con anillo
(sin lima), comidas en tarjetas con miniatura y un carrusel de tarjetas de día, los siete hasta hoy (`CarruselCocina` con `puntosAbajo`), cada una con su día centrado arriba, que se desliza como las de Entreno (2026-11-15). Recetas y menú: `Desktop/MUTA-Recetas-
funcionalidades.png`, `Desktop/MUTA-Menu-funcionalidades.png` y, más sencilla (tus menús A, B, C…, el tick, cambiar un
alimento), `Desktop/MUTA-Comida-sencilla-funcionalidades.png` (2026-11-06). Nutrición con tu día y «Tu plan»:
`Desktop/MUTA-Comida-tu-plan-propuesta.png` (2026-11-08). Capas y límites, los de
[Entreno](../training/CLAUDE.md): las pantallas no importan el dominio; lo que necesitan lo reexportan `state/comida.ts` y
`state/dieta.ts` (y `state/recetas.ts`). Otras áreas solo usan `index.ts`; Hoy, `paraHoy.ts` con `useHoyDeComida` ( pésate, come, tus pasos —`PasosHoja`, `bodyLog` tipo `steps`,
`apuntarPasos`, objetivo `objetivoPasos`: el de tu dieta o 10.000—, la compra y cocinar con su hora y la consulta el día que toca). «Tus datos» pregunta la primera vez qué quieres (definir, mantenerte o volumen).

## Regla de oro: el entrenador y el nutricionista **proponen**, nunca cambian nada solos

Tu objetivo se calcula una vez y se **guarda**; solo cambia si tú lo cambias o aceptas una sugerencia («Aplicar desde
mañana»; «Ahora no» la deja en el historial; la última aceptada se deshace). Con dieta pasa lo mismo con la consulta: sus
propuestas (kcal, pasos, fase) se añaden como un ajuste desde mañana solo si las aplicas, y se deshacen.
La dieta se crea en la app o se carga del archivo de MUTA o de un CSV (`domain/dietCsv.ts`, con `shared/lib/csv.ts`). La
recarga de hidratos (`domain/refeed.ts`: semana ≥ 8, rendimiento cayendo en varias sesiones tras venir estable —lo da
Entreno—, una cada 3 semanas, una vuelta de tu rutina a mantenimiento) se propone en Tu día y en la revisión. Desde la
semana 9 de la definición no se aprieta (`SEMANA_FINAL`: −0,75 % como mucho, −100 kcal). Lo cocinado aguanta 3 días en la nevera y
no se congela nada (usuario, 2026-11-18): lo que caería más tarde se hace al momento (`pasanDeLaNevera`). Velocidad por fases (`porFases`, `ritmoDeLaSemana`) y tu situación en mantenimiento (`situacion`: parón o salida de una
definición, con mesetas de +200 kcal) los propone la revisión semanal (`revisar`: `motivo` y `extra` en la sugerencia, que
`aplicarSugerencia` guarda); `consejosDeLaSemana` añade «si la grasa no baja» y la recarga; `notaHidratos`, en Tu día, los
hidratos antes y después de entrenar; `mejoresPara` pone primero la base vegetal (`parteVegetal`). Si te pasas de grasa (o de proteína), lo que falta del día (`faltaDelDia`, en `domain/fit.ts`) quita lo que sobra de los
hidratos que quedan y `ajustar` puede dejar a 0 lo que aporta sobre todo grasa: las recetas vienen con menos grasa y el
día cuadra con tus kcal (`grasaDeMas` lo avisa en «Para la …» y en Cuadrar el día). Hidratos según el día (ON/OFF, `onOff` en tus ajustes): con el interruptor, `objetivoDe` da más hidratos los días de
entreno y menos los de descanso (`tipoDe`, de tu rutina) con la misma media semanal (`kcalDelDia`, `entrenosDeLaSemana`);
Tu día lo dice (`hidratosDelDia`). **Tu objetivo** es una sola pantalla (`screens/objetivo/ObjetivoScreen.tsx`, 2026-11-15; «Editar» de Tu plan lleva a ella): tu objetivo sin tarjeta (`TargetHero`), lo de editarlo (`EditarObjetivo`: qué quieres, velocidad, proteína y grasa, hidratos por día, «Poner mis kcal» y «Mis datos»), la revisión semanal y, plegados, «Cómo se calcula» y el historial. Orden (2026-11-15, más fácil): la cifra, la revisión semanal, qué quieres y velocidad en una tarjeta, hidratos según el día y, plegado en «Más ajustes», velocidad por fases, proteína y grasa, «Poner mis kcal» y «Mis datos». Con dieta cargada manda la dieta: al guardar tu objetivo, propone ajustarla («¿Ajustar tu dieta?»: `propuestaHaciaObjetivo`, `cambioHaciaObjetivo` en `domain/dietTarget.ts` y `kcalPorTipo`; un ajuste desde hoy como el de la consulta, que se deshace con `quitarAjuste`; sin ON/OFF se mueve igual toda la dieta y conserva su reparto). Proteína y grasa van por kilo o en gramos fijos (`Reparto`, `macrosObjetivo`); los hidratos, lo que queda. Fuera de lo que
dicen los documentos (`avisosReparto`: proteína 1,5–2 g/kg, grasa desde 0,6) solo se avisa; si algo de fuera los contradice,
mandan los documentos. En volumen, la revisión semanal no sube kcal si tu fuerza en los básicos no baja (`progresas`,
`fuerzaBasicos`, cargada de Entreno al abrir); la consulta con dieta no sube la proteína al final y sugiere recargas de
hidratos según cómo estás (guía G1, decisiones del 2026-11-08 en `docs/conocimiento/04-guia-culturismo-natural.md` §14).

## Dónde está cada cosa

- `domain/food.ts` — alimentos (por 100 g, con `codigo` si lo escaneaste) y apuntes (`receta` si salió del menú):
  `macrosDe`, `sumar`, `COMIDAS` (nombres sugeridos), comida por la hora, raciones o gramos, buscador y recientes.
- `domain/targets.ts`, `weight.ts`, `review.ts` — objetivo (Mifflin-St Jeor…), tendencia y ritmo del peso (los usa la
  revisión) y la revisión semanal sin dieta. `docs/conocimiento/02-reglas.md` · sección 8.
- **El entrenador** (usuario, 2026-11-22: «como un entrenador real»; decisiones del 2026-11-22): `domain/senales.ts` (cómo
  estás, perímetros, fines de semana, proteína, déficit, grasa final y los consejos de la semana) y `review.ts` (las reglas
  4–8 de la consulta también sin dieta, la salida al llegar a tu grasa objetivo y la pausa); `state/entrenador.ts` (lo que
  gastas, la revisión de hoy, la recarga y los consejos; `cuerpoProgreso`, lo que da Progreso con `cuerpoParaComida`,
  que `cargarCuerpo` lee al cargar y al abrir la revisión). En equipo con el entrenador de Entreno (2026-11-23): le da `nutricionParaEntreno` (`use-cases/forEntreno.ts`: fase, recarga, último cambio de kcal, `comidaParaEntreno` y cómo estás) y recibe `deEntreno` (parón y la última subida de series) para la revisión. Los textos, en `screens/objetivo/textoRevision.ts` (`resumenRevision`: estado, titular, cifras en filas y una recomendación; usuario, 2026-11-23: «más profesional y acotado»). Una
  sugerencia puede cambiar de fase (`extra.fase`, con «Deshacer»); al dejar una definición se guarda cómo fue
  (`ultimaDefinicion`, que «Cambiar objetivo» enseña al volver a definir). La recarga (`domain/refeed.ts`): por
  rendimiento o por cómo estás, solo los días que entrenas, acaba al hacer las sesiones de una vuelta (`recargaEfectiva`);
  en tu día, «Empezar / Ahora no» y, mientras dura, «Terminar»; a mano, en «Cambiar objetivo» (`FilaRecarga`).
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
- `use-cases/nutritionStore.ts` — carga y guarda todo (al volver a la app otro día, se recarga con hoy: `vigilarElDia`); los días en memoria, en `use-cases/diasLeidos.ts` (los últimos 35 al abrir; la racha de días redondos, `rachaRedonda`, lee más si hace falta; guardar un día no leído conserva lo que tenía); Progreso lee toda tu comida (`forProgreso.ts · totalesDeSiempre`); con dieta no hace la revisión de kcal. `cargarTipos()` pide a Entreno
  (por su `index.ts`, en diferido) qué días son de entreno. `target.ts`, `foodLog.ts` como en la versión 1.
- `use-cases/recipes.ts` (cargar el recetario de `private/` o los de ejemplo, apuntar un plato, tus platos, cambiar un
  ingrediente y sus equivalentes, poner un plato en tu dieta) y `menu.ts` (cuántos menús y qué día, el plato de cada comida,
  cocinar, avisos y calendario, aplicar, «Ahora no» y deshacer lo que propone el nutricionista).
- `use-cases/diet.ts` (empezar, dejar, archivo, apuntar una receta, editar recetas y menús, intercambios), `shopping.ts`,
  `kitchen.ts`, `consult.ts` (preparar el informe; aplicar, «Ahora no», deshacer; la fuerza la da Entreno) y `scanner.ts`
  (lector zxing con su `.wasm` servido por la app, nunca de un CDN; Open Food Facts; guardar con su código).
- `components/` — `DayHero` (tarjeta blanca con el anillo abierto y «kcal por comer», cada macro en una línea, la frase y «+ Añadir» y «Cuadrar con recetas»; el día va encima, fuera), `DayNav` (‹ Hoy ›, en `shared/ui`: también lo usa Progreso para el mes), `MealList` (con el plato de tu menú y su tick) y
  `MenuList` (tarjetas con miniatura), `Platos` (foto, fila, tarjeta y carrusel), `DietWeek` (como Tu semana), `CoachCard` (`TrendChart`, la gráfica del peso, está en `shared/ui`: la usan la sugerencia y Progreso, que le pone sus etapas con `tramos`),
  `TargetHero`. La letra es la de Entreno, un tamaño por papel: sin tamaños propios.
- `screens/bienvenida` — los pasos 3 y 4 de la bienvenida (usuario, 2026-11-17), con `shared/ui/Pasos`: «Cuatro datos y calculo lo que necesitas» (sexo, edad, altura, peso y pasos; los entrenos vienen del perfil) y «Tu objetivo, listo» (las kcal en grande, el reparto, el ritmo si es definición y cómo se calcula; `previaDelObjetivo` no guarda nada, «Elegir mi rutina» llama a `guardarDatos` con el ritmo). «Ahora no, solo entreno» salta a elegir rutina sin objetivo. Los datos entre pasos, en `state/bienvenida.ts`.
- `screens/comida/AnadirHoja` — Añadir como el rediseño (13 y 14, usuario 2026-11-17): pastillas de comida, buscador, atajos (código, solo kcal, crear; foto y voz, sin hacer: necesitan IA), «De tu menú · Hecho» y «Lo mismo que ayer · Repetir», Recientes · Favoritos · Tuyos; al buscar, alimentos y recetas con foto. En Tu día, cuando el día queda redondo, la frase con la racha (sin «Mañana · Desayuno»: repetía tus comidas, usuario 2026-11-17).
- **Plan** (usuario, 2026-11-18; diseño `Desktop/MUTA-Plan-Diseno`): `?vista=plan`, `PlanVista` con dos miradas. «Qué comes»: la tira de la semana con la letra de cada menú en su color (`components/LetraMenu`, `--menu-1…7`), el día (toca para `UnDiaHoja`: otro menú solo ese día —`MenuSemanal.porDia`—, tipo de día —`tipoDelDia`, también sin dieta en `Ajustes.tipoElegido`— o día libre —`libres`—) y sus comidas con `components/FilaComida` (hora y nombre, plato, de qué olla sale o «Al momento», kcal; al tocar, `CambiarPlatoHoja`). «Cuándo cocinas» (`AgendaCocina`): los próximos 7 días con la compra, cada vez que cocinas (platos con su parte: `partesDeTanda`) y lo que va al momento; «Cómo cocinas ›» abre `OrganizarHoja` (con «Cocinas para», `Personas`). Sin menús, `PlanVacio`: usar tu dieta, cargarla (CSV: `EmpezarDietaHoja` con lo leído —`dietResumen.ts`— y, desde Plan, `menusDeTuDieta` + `cocinarComoLaDieta`), crearla o «Proponme una». **Tu dieta** (`?vista=menus`, `TusMenusVista` + `CicloVista`): por días (largo, menú de cada día, si se cocina, qué día es hoy) o según el entreno (`porTipo`, un ciclo de 14 días con tu rutina), tus menús, «Alimentos que no quieres» (`NoQuieroHoja`, `noQuiero`: fuera de lo que se propone —`platosQueQuieres`— y aviso si tu menú los lleva) y cargar una dieta. **Un menú** (`MenuVista`): entreno · descanso, sus kcal y macros, sus comidas (con antelación o al momento); cada comida abre `ComidaMenuHoja` (nombre y hora —`comidas`, `horaDeComida`, que usan las tandas y el .ics—, qué días va —`conDiasDeComida`: el plato pasa a una ración con `solo`—, lo que lleva y «En todos los menús» —`comunes`: `conPlato`/`conExtra` cambian todos—). Un plato: los gramos de descanso (sin «Cómo se cocina»: lo decide «Cómo cocinas», usuario 2026-11-21). Lo de dominio, en `domain/menuPlan.ts`; lo que se cambia, en `use-cases/plan.ts` (con «Deshacer»). Cocinas para N personas (`personas`): la olla y la compra se multiplican (`porPersonas`) y al repartir te toca tu parte.
- Recetas, como el rediseño (27–31, usuario 2026-11-17): `RecetasVista` (buscar con «Filtrar y ordenar», «Para ti hoy», las categorías con foto y tus guardadas), `plato/CategoriaScreen` (el orden y filtros rápidos en pastillas), `plato/FiltrosHoja` (ordenar, tiempo, dificultad, con lo que tienes en casa, solo guardadas: `filtrarPlatos` en `domain/recipes.ts` y `state/filtroRecetas.ts`), `plato/RecetaFila` (con el marcador: `recetasGuardadas`, `userContent/recetas-guardadas`, `alternarRecetaGuardada`) y `PlatoScreen` (la foto arriba, del alto de Ver sesión, con volver, cambiar la foto —`FotoPlatoHoja` con `shared/ui/FotoEditable`, `use-cases/recipePhotos.ts`: tu foto de cualquier plato en `userContent` `foto-plato:<id>`, centrada con `encuadre-platos`; quitarla vuelve la que traía—, compartir —`compartirReceta`— y guardar; tiempo, dificultad y categoría en pastillas; Ingredientes · Pasos con las raciones; abajo «Me la he comido», «Al menú» y la olla, que abre los pasos).
- Cocinar, como el rediseño (32–40): `/comida/cocina` sin `?h=` es el centro (`cocina/Herramientas.tsx`: lo de hoy, cocinar una comida ahora y las herramientas); con `?h=crudo|repartir|plato|pesar`, una de ellas (el conversor usa `parejasCocidas`). El modo cocina de una tanda (`TandaScreen`) va en tres pasos: «Hoy cocinas» con lo que sacas, los pasos uno a uno con su temporizador (los minutos que dice el paso) y repartir cada olla; «Terminar» la marca hecha. «Saca esto» va por pasillos, como la compra (`seccionDe`). Repartir pesa la olla y reparte según las kcal de cada comida (`repartirOlla`), con lo cocinado por 100 g. Arriba, «Qué cocinas: Todo · una receta» (`soloDeUnPlato`): con una sola, sus ingredientes, pasos y reparto; «Receta hecha» y, cuando están todas, la tanda. Una comida al momento: `RecetaCocina` con «Pesa para 1 ración» (lo de tu táper, «ya lo tienes hecho») y «Hecho y apuntar la cena».
- `screens/comida/HoyCocinas` — `HoyToca`, arriba del todo en tu día: cocinar y la compra en una tarjeta con hasta tres fotos y una línea con su botón para cada cosa (`compraDeLaSemana.platos`); `HoyCocinas`, solo cocinar, en el centro de Cocinar (usuario, 2026-11-17). En tu día ya no van «Para la …» ni la nota de los hidratos (está en Tu objetivo, bajo los macros: `notaHidratos`); el día completo cierra el anillo en negro con el tick en naranja. Los botones de esa tarjeta, grises como Semana · Compra · Objetivo (en negro al pulsar).
- Algo más en el menú (usuario, 2026-11-17; `domain/menuExtras.ts`): `MenuPlan.extras` (`ExtraMenu`: un alimento con sus gramos y macros, u otro plato del recetario —`platoId`, una ración—) en cualquier comida, además del plato o sin él. Se añade con «Añadir algo más» (`ExtraHoja`, `anadirExtra`/`quitarExtra`, con «Deshacer»); suma al día (`totalDelDia`), el plato se ajusta a lo que queda (`gramosDeHueco`), sale en la compra (`extrasDeDias`) y el tick lo apunta con el plato (`extrasApuntados` si la comida solo lleva extras). «¿Cómo sueles comer?», arriba de Tus menús (`ElegirComoComes`: cuatro tarjetas con barritas del reparto y las kcal de cada comida): repartido, desayuno, comida o cena fuerte (`menu.comoComes`, `REPARTOS` en `domain/fit.ts`, sugerido; `repartoActual` lo usan lo que le toca a cada comida, repartir lo que falta y «Proponme un menú»; con «Deshacer»).
- `screens/comida` — la pestaña Nutrición: abre en tu día; `Cabecera` (como Entreno, con la barra compacta y, sin el perfil, `Accesos`: solo «Plan» —usuario, 2026-11-18: cocinar y la compra salen en su tarjeta cuando tocan y desde Plan; tu objetivo, en «Tu objetivo ›» de tu día—; Tu semana lleva la compra, cocinar, pesar, recordatorios y el recetario; Tu objetivo, tu dieta, que vuelve a él), `?vista=plan`
  («Tu semana»: `MenuVista` —usuario, 2026-11-15—: `LoQueToca` arriba, un menú cada vez con pestañas A · B · C · +, sus comidas en lista (foto, plato y kcal; deslizar quita), sus kcal y sus días L–D, que se tocan para ponerle ese menú; abajo Pesar, Recetario y Avisos; `?vista=menu` lleva aquí), `?vista=recetas` y `?vista=dieta`; sin
  Semana: está en Progreso, que la pide con `comidaParaProgreso` del `index.ts` (`use-cases/forProgreso.ts`: lo que comiste cada día con tu objetivo, la cintura de tus consultas, la última y la próxima consulta, y tu sexo y tu altura para la composición); el peso y lo de hoy, en la pestaña Hoy: `screens/hoy/useHoyDeComida`) y sus hojas (añadir, escáner, ración, solo kcal, crear,
  comida del día, peso, datos, empezar dieta, día de la dieta, tu dieta, receta nueva, elegir plato, un plato del menú,
  tus menús, opciones de un menú, cocinar aparte —`CocinarHoja`: un día y una hora para varias comidas de cualquier plato; lo que ya cocinas otra vez, tachado; un cocinado por plato a la misma hora (`guardarSesion`)—, avisos, crear plato, cuadrar el día). `screens/plato` — un plato
  (`/comida/plato/:id`, con ajustar, cambiar un ingrediente,
  al menú y a tu dieta), una categoría (`/comida/recetas/:categoria`) y tu nutricionista (`/comida/nutricionista`). Pantallas completas: `objetivo`,
  `receta` (`/comida/receta/:id`, con intercambios y editar), `compra`, `cocina` y `consulta`. Lo común en `screens/comun`.

- La base: `foodLog.cargarAlimentos()` (los genéricos) y, detrás, `cargarSupermercados()` (19.157 productos con marca y código).
  La compra, por días, por menús o hasta tu próxima compra (tu semana resuelta). Tu versión de un plato: `platoEditado` + `EditarPlatoHoja`; tu dieta a tus menús:
  `menu.menusDeTuDieta()`. Cocina lleva arriba «Pesa en crudo, come cocinado» (`screens/cocina/PesaCrudo.tsx`).

## Tu semana, resuelta (piloto automático de compra y cocina, 2026-11-13)

- **Cualquier dieta, exacta** (usuario, 2026-11-17): el ciclo de la dieta dura lo que diga (`Dieta.ciclo`, hasta `MAX_CICLO`;
  `cocinar`: sus días de cocinar; `Receta.soloDescanso`); el CSV (`dietCsv.ts`, `PLANTILLA_DIETA`; formato en
  docs/datos.md) y el archivo (`dietArchivo.ts`: `leerDieta`, `aArchivo`). Tus menús van en un ciclo (`MenuSemanal.ciclo`,
  `menuDelDia`, `menusDeLaSemana`; «Cada menú dura» lo crea desde hoy; tocar un día de la semana vuelve a semanas) y tu
  dieta pasa a ellos tal cual (`dietaAMenus.ts`). Organizar: «Cocinas» [Como dice tu dieta · 1–5 veces a la semana · Cada
  día] (`porVeces` en `diasDeCocina.ts`: mejor el día que empieza un menú y tus descansos, repartidas, sin pasar de 3 días;
  tandas por bloques, la víspera si cocinas después de comer) y el calendario de 14 días que se toca (`CalendarioCocina`,
  `Piloto.anadidas` y `saltadas`). Lo de cocinar y la compra de tus menús, en `menuCocina.ts`.
- **Organizar la semana como una dieta** (usuario, 2026-11-17: «seguir una dieta a la perfección sin pensar», sencillo y con
  desplegables): `OrganizarPreguntas` en una tarjeta de filas —«Cada menú dura» (1–3 días: `menu.diasPorMenu`,
  `conDiasPorMenu`, A A B B C C A), «Cocinas» (`ModoCocina`: «Al empezar cada menú» —`porMenu`: el día que cambia el menú y,
  si pasan 3 días, otra vez; cada tanda cubre los días enteros de su menú y, si cocinas después de comer, la tarde de antes—,
  tus descansos, los días que elijas o cada día) con su hora, y «Compras» (un día fijo, «El día que cocino» —`compra.conCocina`:
  cada compra, lo de su tanda hasta la siguiente; `fechasDeCompra`, `diasDeCompra`— o cuando quieras) con su hora— y «Dejas
  hecho». «Aplicar» guarda menús y piloto juntos (`aplicarSemana`, con «Deshacer»: `volverASemana`).

- `domain/autopilot.ts` — el piloto (dentro de tu menú, `menu.piloto`): el día de la compra (lo eliges tú), cómo cocinas
  (`descanso`: MUTA elige entre tus descansos —`tipoDe`, los de tu rutina— los justos para que nada pase de 3 días en la
  nevera, `porDescanso` con su coste sugerido; `dias`: los que elijas; `no`) y cómo preparas cada comida (`preparar`: táper; una parte al momento —`mixto`: la tanda hace lo que aguanta y lo demás se hace ese día: lo que elijas en cada plato, `frescos` y `esFresco`; sin elegir, la proteína, `esProteina`, por el macro de la receta—; o al momento, también varias veces al día) (`porPlato`: solo lo que dice una dieta cargada; ya no se cambia a mano, usuario 2026-11-21). Las tandas que
  ya pasaron quedan fijas (`tandas`, las deja `alDia` al abrir, con tus días de entreno leídos: `tiposLeidos`); las que
  vienen siguen a tu regla. Cada tanda cubre las comidas en táper desde su hora hasta la siguiente (`HORA_COMIDA`,
  `domain/menuCalendar.ts`); lo que pasa de 3 días no entra en la tanda: se hace al momento. La compra pide lo de las tandas de esa semana y lo que
  se prepara al momento (`huecosDeLaCompra`).
- **Sin despensa** (usuario, 2026-11-21: «bórrala para siempre»): no se estima lo que tienes en casa. La compra es todo lo de
  tus menús (`porComprar`, en `domain/shopping.ts`); lo que ya tengas, lo tachas. Al cargar, se borra `userContent/despensa`.
- `state/autopilot.ts` y `use-cases/autopilot.ts`. Pantallas: `LoQueToca` (arriba de Tu semana —usuario, 2026-11-16: sin pantalla aparte, lo de la semana ya sale en Hoy—: lo próximo, que abre la compra o el modo cocina, y «Organizar», que abre `OrganizarHoja`; sin nada organizado, lo que propone MUTA) y
  `OrganizarHoja` («Compra y cocina» —usuario, 2026-11-16: una sola idea, «tus días de cocina»—: la primera vez, «¿Cocinas para varios días?»; después, ¿qué días cocinas? —los siete días y el interruptor de tus descansos— y ¿qué día compras?, con su hora, y «Así queda»: cada día de cocina con «Cambiar», que abre su hora y lo que cocinas (sin marcar cada comida aparte: `marcadas` ya no cuenta, usuario 2026-11-21); «Aplicar» / «Ahora no», con «Deshacer»), `compra/CompraSemana` (modo
  «Tu semana» de la compra), `tanda/TandaScreen` (`/comida/tanda/:fecha`, o `?aparte=HH:MM` para lo que cocinas aparte, `aparteComoTanda`: el modo cocina, una receta cada vez (sin «Pesa en crudo»: cada receta con su foto grande, sus ingredientes —en crudo lo que se cuece— y sus pasos, `RecetaCocina`) con sus pasos (justificados; se tachan al tocarlos); repartir en tápers; «Hecho»; la pantalla no se apaga) y `tanda/AlMomentoScreen` (`/comida/al-momento/:fecha/:comida`: «Tus comidas de hoy», las que quedan por apuntar en un carrusel —`CarruselCocina`, como el de tu rutina en Entreno; el modo cocina usa el mismo—, cada una con su receta y «Hecho y apuntado» debajo; piezas comunes en `tanda/Cocinar.tsx`).
  La compra se pliega por secciones (al entrar, todas plegadas) y «Compartir la lista» da un Excel (`shared/lib/excel.ts`, `seccionesDeLaCompra`; si el móvil no comparte archivos, se descarga). En Hoy (`useHoyDeComida`): la compra, la tanda, «Tus comidas de hoy» (una fila que abre su pantalla) y, si no
  cocinaste, la propuesta de pasar la tanda a hoy.

## Datos

- `userContent`: `nutricion`, `alimentos-propios`, `comidas-guardadas`, `dieta` (la que sigues: dieta, inicio, ajustes,
  días elegidos, factor del arroz y recetas originales), `compra`, `menu` (huecos, cocinados, compra, avisos, propuestas
  descartadas y aplicadas; `piloto`: tu semana resuelta), `platos-tuyos` y `productos`.
- El recetario es de terceros: `private/recetas/` (fuera de git), por `shared/data/localRecipes.ts`; ver docs/datos.md.
- `foodLog` (por fecha), `bodyLog` (`weight`: pesajes; `checkin`: lo que apuntas en la consulta), `coach` (`area:
'nutricion'`: cambios del objetivo; `area: 'dieta'`: cada consulta con sus propuestas y su estado).
- La base de alimentos es `shared/content/foods.json` (`node scripts/foods-from-prototype.cjs`).

## Pendiente

Fotos de lo que apuntas sin receta (icono). Con una dieta de verdad, comprobar la consulta en el móvil unas semanas.
