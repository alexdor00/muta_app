# Progreso (`src/features/progress`)

Progreso **mes a mes, en una sola pantalla** (usuario, 2026-11-11). Una etapa es tu mesociclo (una rutina y una alimentación
con un objetivo): cada mes dice la suya y la abre en una hoja. Cada cosa sale una vez. Tamaños, letra y color, los de
`docs/rediseno.md`, y **los patrones del resto de MUTA** (propuesta «cohesión», 2026-11-11): títulos de sección como «Comidas»
(`TituloSeccion`), listas planas sobre blanco como los ejercicios de Ver sesión (`plana`, `filaPlana`), las mejoras con la
flecha naranja (`Cambio`), las cifras protagonistas en letra condensada y cada sesión con su color.

- `screens/progreso/ProgresoScreen.tsx` (`/progreso?mes=AAAA-MM&ver=dias|cuerpo|fuerza`; de serie, el mes de hoy y Días):
  cabecera con su barra fija al bajar, `CabeceraMes` (como el día de Nutrición: encima, `DayNav` con el mes y el año; en la tarjeta, la etapa en
  una píldora que abre su hoja y tres cifras frente al mes anterior: tu peso, tu fuerza y tus sesiones con el % de constancia del mes) y, debajo:
  - **Días** (`Dias.tsx`): una tarjeta como «Tu semana» de Entreno con un círculo por día (el que entrenaste, negro con su
    sigla); un entreno lleva a su pantalla. Sin lista debajo (usuario, 2026-11-11).
  - **Cuerpo** (`Cuerpo.tsx`): frente, perfil y espalda; la foto del mes y la de un mes de antes en una sola, partida por una
    línea que se desliza; la tira de meses elige el de antes (de serie, el primero); «▶ Ver tu cambio» (`TuCambio.tsx`, a
    pantalla completa del ancho de un móvil, `?hoja=cambio`: empieza parado; la línea de tus meses; tu peso y tu cintura con lo
    que cambiaron desde el primero). Tus medidas en lista plana (antes → ahora y el cambio con su
    flecha; cada fila, `MedidaHoja` con su gráfica de todos los meses), «Tu composición» (`Composicion` y `CalibrarHoja`) y, en el de ahora,
    «Medidas y fotos de este mes» (`MesHoja`, con «Hacer las fotos»: `CamaraGuia`, la cámara del móvil con tu foto del mes
    pasado encima, transparente, como guía, postura a postura; sin cámara, de la galería). Lo estimado lo dice: «Grasa
    estimada» (fórmula de la Marina), el peso de tendencia y el 1RM estimado de tus básicos.
  - **Fuerza** (`FuerzaPorGrupo.tsx`): arriba, tus básicos como la gráfica de Ver sesión; «Por grupo muscular» en lista
    plana; al abrir uno, sus ejercicios (sus básicos primero) con su mejor serie del mes frente a la de antes y «Récord». Un
    ejercicio abre `EjercicioHoja` (`?hoja=ejercicio`): su mejor serie, su gráfica, cada día del mes con sus series y su ficha.
  - `EtapaHoja` (`?hoja=etapa`): fechas, semana y rutina; peso, fuerza y récords desde que empezó; filas a Constancia, Tus
    músculos y Tu rutina (`../mesociclo/Pestanas.tsx`, cada una su hoja; atrás vuelve a la etapa); su comida; la fila «Frente a «…» ›» con la otra vuelta de su misma rutina (`d.pareja`; su frase, `veredicto`) y `AccionesEtapa`
    (renombrar, «Empezar otra etapa» o «Volver a usar esta rutina»; sus hojas, `HojasEtapa`, en la pantalla) y comparar
    (`CompararHoja`: solo etapas de la misma rutina, a la misma semana —la carrera contra ti mismo, cifras antes → ahora, sesión a sesión y ejercicio a ejercicio—; sin otra con su rutina, no sale).
  - `Piezas.tsx` (`Grafica`: la gráfica de Entreno, `SessionProgress`, para tus básicos, un ejercicio y una medida;
    `Cambio`, `TituloSeccion` y `FilaHoja`) y `formato.ts` (cómo se escriben
    las cifras). Estilos en `Progreso.module.css`; «Ver tu cambio», en `TuCambio.module.css`; el círculo, en
    `Composicion.module.css`; la rutina, en `../mesociclo/Mesociclo.module.css`.
- **Tu logro y tu premio** (usuario, 2026-11-24; `Desktop/MUTA-Logro-Instagram-propuesta.png`, `Desktop/MUTA-Premio-objetivo-propuesta.png`):
  el **logro** sale al acabar una etapa y cada 6 meses de la que llevas (`domain/logro.ts · pendientes`, `mesesCumplidos`), con la
  foto de una sesión; el **premio**, al cumplir tu objetivo (`objetivoCumplido`: definición, tu grasa objetivo; volumen, tu peso
  objetivo —`PesoObjetivo` en «Tu composición», `ajustesCuerpo.pesoObjetivo`—), con tu antes y después (`antesYAhora`: la
  última foto de antes de la etapa y la última de ella). Cifras: el logro, toneladas, fuerza, récords, tu cuerpo según el objetivo
  (cintura en definición, si no peso), constancia, horas y tu ejercicio estrella (`estrellaDe`); el premio, grasa → (estimada),
  cintura, masa magra, peso (definición) o FFMI (`ffmiDe`), masa magra y los perímetros que crecen (volumen), fuerza y récords.
  `use-cases/logros.ts` (cuáles tocan, con lo visto en `userContent/logros` —`desde`: lo de antes de la función no se
  celebra—, y sus datos), `use-cases/imagenLogro.ts` (la imagen 1080 × 1920 en canvas, oscura; compartir o guardar en Fotos),
  `screens/logro/LogroHoja.tsx` (la imagen tal cual, elegir la foto, «Compartir en Instagram · Guardar en Fotos · Ahora no») y
  `AvisoLogro` (sale solo al abrir la app o una pestaña, uno cada vez; `logro.ts`, aparte del `index.ts`, lo da a `src/app`). En
  `EtapaHoja`, «Tu logro» y «Tu premio» para abrirlos cuando quieras.
- `screens/dia/DiaScreen.tsx` (`/progreso/dia/:fecha`, a pantalla completa), igual que Ver sesión: `SessionHero` con la foto de
  esa sesión (`fotoDelEntreno`; sin la tuya, la de serie de su tono), su gráfica (`SessionChart`, hasta ese día) y «Ejercicios», cada uno con una tabla, serie a serie, frente a la «Sesión anterior» (`laVezAnterior`, `domain/day.ts`) y el cambio de su 1RM; desde Hoy (`?de=hoy`), «‹» vuelve a Hoy. Se vuelve a leer cada vez que se abre: recién entrenado, trae la sesión de hoy. Arriba la gráfica y debajo los ejercicios; «Cómo estabas», al final. «‹» vuelve a la pantalla de la que vienes (`useVolver`, dentro de `SessionHero`).
- `screens/hoy/` — `useHoyDeProgreso`, para la pestaña Hoy (por `paraHoy.ts`): ¿Cómo estás hoy? (`SensacionesHoja`, cinco
  preguntas de tres opciones, `domain/feelings.ts`; `bodyLog` tipo `sensaciones`, `apuntarSensaciones`; se ve en el día de
  Progreso) y, el día que tocan, las medidas y fotos del mes (abre `MesHoja`; si no, «Próximo: …», que también la abre). El día del mes lo escribes en `MesHoja` (del 1 al último de este mes, `diasDelMes`; en un mes más corto, su último día; `diaMedidas`, en los ajustes de `userContent/composicion`; `cuandoToca`: desde ese día hasta que las hagas; sin día, a las 4 semanas). Apuntar se hace en Hoy;
  Progreso es para mirar.
- `domain/` — `stage.ts` (un periodo: tu cuerpo al empezar —el último dato de antes— y ahora, tu comida de media, tus fotos
  de antes y de ahora, las cifras de un tramo, un mes —`otroMes`, `mesesEntre`— con tu fuerza y cada ejercicio frente al
  anterior y un ejercicio frente a la vez anterior), `measures.ts` (los siete perímetros con cómo
  tomarlos, su resumen y `cuandoToca`), `composition.ts` (fórmula de la Marina, calibración, FFMI, objetivos de grasa y
  evolución; `docs/conocimiento/02-reglas.md` § 9) y `photos.ts` (las posturas y tus fotos de una postura mes a mes).
- `state/progreso.ts` — lo que llega de Comida y de Entreno, tus medidas, tus fotos (con su `url`), tus ajustes de la
  composición, el detalle de la etapa del mes y lo que se calcula (`enEtapa`, `primerMes`, `etapaDelMes`, `serieDeMedida`, `cuerpoEl`,
  `composicion`, `evolucion`, `resumen` y `toca`).
- `use-cases/progress.ts` — `cargarProgreso()` (cada vez que se abre), `abrirCamara()` (la de delante o la de atrás), `apuntarMedidas()` (`bodyLog`, tipo `perimetros`),
  `guardarFotos()`/`borrarFoto()` (almacén `photos`, reducidas a 1200 px con `reducirImagen` y con su miniatura de 320 px —las de antes la reciben de fondo—; cada foto se abre en memoria solo al enseñarla: `url` y `mini` de `FotoVista`) y la composición
  (`userContent/composicion`). `use-cases/mesocycles.ts` — abrir una etapa, compararlas, renombrar, empezar otra, volver a
  usar una rutina: todo lo hace Entreno; aquí se le pasa tu peso de cada tramo.

Da a Comida, por su `index.ts`, `cuerpoParaComida` (`use-cases/forComida.ts`: tus medidas, cómo estás y tu grasa con tu
objetivo y las semanas que te quedan) para la revisión semanal. En Días, los de recarga de hidratos llevan una «R».

Lo que no es suyo lo pide por los `index.ts`: Comida (`comidaParaProgreso`: peso, tendencia, ritmo, lo que comiste cada día
con tu objetivo, la consulta de tu dieta, la cintura de tus consultas, tu sexo y tu altura) y Entreno (`entrenoParaProgreso`:
tus etapas con su fuerza, tu fuerza semana a semana y desde que empezaste, tus entrenos y tus récords;
`mesocicloParaProgreso`, `compararMesociclos` y las acciones). Progreso **no calcula** eso: se calcula en su área.

Convenciones: las capas y sus límites son las de [Entreno](../training/CLAUDE.md). Guarda solo tus medidas, tus fotos y tus
ajustes de la composición. Las hojas con datos se abren con `useSheet(...).showWith({...})`.
