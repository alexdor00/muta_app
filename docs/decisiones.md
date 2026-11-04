# Decisiones técnicas

Registro corto con fecha y motivo. Las diez decisiones de arquitectura están en [docs/adr/](adr/README.md)
(plataforma, interfaz, estructura, lógica, estado, datos, contenido, diseño, calidad, actualizaciones).
Si una decisión cambia, se añade una línea nueva que la sustituye; no se borra la vieja.

| Fecha      | Decisión                                                                                                                                                                                                                                                                                                                | Motivo                                                                                                                                                                                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-27 | Las rutinas de terceros viven solo en `private/` (fuera de git) y la app sale sin ellas en la CI                                                                                                                                                                                                                        | Son documentos con derechos de otras personas; el repositorio es público                                                                                                                                                                                                                       |
| 2026-10-28 | Los 10 tipos de entrenamiento son las carpetas del programa original, más MUTA                                                                                                                                                                                                                                          | Que la clasificación sea la del original, no una opinión                                                                                                                                                                                                                                       |
| 2026-10-28 | Las rutinas se enseñan y empiezan **tal cual**: sin «Adaptar a mí» ni selector de nivel                                                                                                                                                                                                                                 | Fidelidad al diseño de cada programa; el ajuste de volumen queda para el coach (`adaptVolume.ts`)                                                                                                                                                                                              |
| 2026-10-28 | Esfuerzo en **RIR**, no RPE (RIR = 10 − RPE)                                                                                                                                                                                                                                                                            | Más fácil de entender entre series                                                                                                                                                                                                                                                             |
| 2026-10-28 | Los nombres de los ejercicios se muestran en español (traducción propia) y se guarda el original en `originalName`                                                                                                                                                                                                      | Interfaz en español sin perder la referencia al documento                                                                                                                                                                                                                                      |
| 2026-10-28 | Datos medidos (volumen, reparto, minutos, nivel) por cálculo, no escritos a mano                                                                                                                                                                                                                                        | Una sola función por dato; evita incoherencias                                                                                                                                                                                                                                                 |
| 2026-10-28 | Nada es obligatorio al elegir; lo opcional queda a elección del usuario                                                                                                                                                                                                                                                 | Pedido explícito                                                                                                                                                                                                                                                                               |
| 2026-10-28 | Regla de tiempo de MUTA (75 min): quitar el último opcional no prioritario y, si no, −1 serie; se puede quitar                                                                                                                                                                                                          | Del documento de conocimiento; opcional para el usuario                                                                                                                                                                                                                                        |
| 2026-10-28 | Las opciones se eligen en la propia fila, en gris más oscuro con flecha; la hoja «Antes de empezar» se elimina                                                                                                                                                                                                          | Más simple y visible; ver [ADR 11](adr/0011-opciones-dentro-de-la-rutina.md)                                                                                                                                                                                                                   |
| 2026-10-28 | Los ejercicios normales no se sustituyen; solo lo opcional de MUTA y los puntos débiles (con la lista del documento)                                                                                                                                                                                                    | El documento dice que el generador elige solo la primera opción disponible                                                                                                                                                                                                                     |
| 2026-10-28 | Las indicaciones del documento (superserie, «entre series de…») salen como **texto**, sin reordenar ni enlazar                                                                                                                                                                                                          | Reglas de reordenado, para el editor de rutina                                                                                                                                                                                                                                                 |
| 2026-10-28 | El descanso entre series no se enseña en las filas                                                                                                                                                                                                                                                                      | Pedido explícito; los días de descanso sí                                                                                                                                                                                                                                                      |
| 2026-10-29 | Descanso en todas las rutinas: el del archivo; si no, `restRules`; si no hay, obligatorio tras la vuelta completa                                                                                                                                                                                                       | Pedido explícito; solo «sugerido»/«opcional» donde el documento lo dice                                                                                                                                                                                                                        |
| 2026-10-29 | Semanas distintas → plegables; iguales → etiquetas                                                                                                                                                                                                                                                                      | Menos ruido cuando todas las semanas son iguales                                                                                                                                                                                                                                               |
| 2026-10-29 | Tipos de un programa en `domain/program.ts` (único sitio) y sin `as never`                                                                                                                                                                                                                                              | Evitar copias que se desincronizan; ver [ADR 11](adr/0011-opciones-dentro-de-la-rutina.md)                                                                                                                                                                                                     |
| 2026-10-29 | La pantalla de la rutina solo pinta: `slotPanel` y `startRoutine` son casos de uso                                                                                                                                                                                                                                      | Regla del documento de rediseño                                                                                                                                                                                                                                                                |
| 2026-10-29 | Contenido (reglas de descanso, indicaciones) en el JSON del programa, no en el código                                                                                                                                                                                                                                   | Decisión 7: contenido versionado y separado                                                                                                                                                                                                                                                    |
| 2026-10-29 | `.gitattributes` con LF fijo                                                                                                                                                                                                                                                                                            | Evitar avisos y diferencias LF/CRLF en Windows                                                                                                                                                                                                                                                 |
| 2026-10-29 | Axe en los e2e, `size-limit` (entrada ≤ 50 kB), Lighthouse CI (≥ 90) y `npm run guardas`                                                                                                                                                                                                                                | Calidad del documento de rediseño; valores de partida                                                                                                                                                                                                                                          |
| 2026-10-29 | Trabajo por ramas (`refactor/…`, `pantalla/…`)                                                                                                                                                                                                                                                                          | Documento de rediseño: una rama por cambio                                                                                                                                                                                                                                                     |
| 2026-10-29 | Paleta en blanco y negro, sin naranja: `--accent` neutro y `--on-accent` para lo que va encima; los degradados de las tarjetas siguen en color                                                                                                                                                                          | Pedido explícito, siguiendo una referencia visual; sustituye al acento naranja del rediseño                                                                                                                                                                                                    |
| 2026-10-29 | Descanso obligatorio donde se completa la vuelta al cuerpo (empuje, tirón, rodilla y cadera), no solo al final de la semana                                                                                                                                                                                             | Pedido explícito: puede ser una sesión de cuerpo completo o varias (parte de la pierna, torso, otra parte de la pierna); primero valen el archivo y sus reglas                                                                                                                                 |
| 2026-10-30 | Las partes de una serie llevan la fase en el nombre (Fuerza e hipertrofia · fase 1, 2 y 3; Hipertrofia · fase 1 y 2) y su «!» explica el orden; las fases de dentro de una rutina (Optimización, Frecuencia alta…) se explican en su «!». «En casa» va por nivel (principiante, intermedio, avanzado) y no por «etapas» | Pedido explícito, verificado en los manuales: Powerbuilding es «Phase 1/2/3 del Powerbuilding System»; el documento de En casa no usa «stage», solo niveles                                                                                                                                    |
| 2026-10-30 | Cinco grupos en vez de diez tipos: Hipertrofia (con MUTA dentro), Powerbuilding, Powerlifting, Mujer y Vuelta al gimnasio, cada uno con su «!» (y cada tarjeta de dentro). Los diez tipos (carpetas originales) siguen como «familia» de cada rutina                                                                    | Pedido explícito; cada grupo se verificó con el objetivo que dice el documento original y con los ejercicios (porcentajes de tu máximo). Esencial va en Hipertrofia (su documento dice hipertrofia con poco volumen, no mantenimiento); sustituye a la decisión del 2026-10-28 sobre los tipos |
| 2026-10-30 | Limpieza: solo se borra lo que no se usa y tampoco está planificado (se comprobó por exportaciones, archivos, CSS y dependencias); los diseños de pantallas pendientes y los scripts de informes se quedan                                                                                                              | Pedido explícito; lo borrado queda en el historial de git                                                                                                                                                                                                                                      |
| 2026-10-30 | Al abrir una rutina no sale nada desplegado (ni la semana 1 ni las sesiones con opciones); no se escribe «sin fecha de fin»; los textos de descanso del documento van resumidos                                                                                                                                         | Pedido explícito: pantallas más cortas y limpias; los textos largos se acortan sin perder lo que dicen                                                                                                                                                                                         |
| 2026-10-29 | El dato «Descanso» no sale cuando la rutina no lo indica; sin avisos de «la rutina no los indica»                                                                                                                                                                                                                       | Pedido explícito: nada de textos que explican lo que falta (los descansos obligatorios siguen en la lista de días)                                                                                                                                                                             |
| 2026-10-29 | Todos los tipos se recorren por frecuencia (selector de días) con filas cortas; Mujer, además, por categorías                                                                                                                                                                                                           | Pedido explícito: extender a todas las rutinas lo hecho en Mujer; los demás tipos no tienen categorías porque tienen pocas rutinas                                                                                                                                                             |
| 2026-10-30 | En Esencial, el descanso «sugerido» u «obligatorio» se respeta rutina a rutina según su original; `restCycles.ts` solo actúa si el documento no dice nada                                                                                                                                                               | Confirmado por el dueño: en Esencial hay rutinas con descanso obligatorio y otras con descanso sugerido                                                                                                                                                                                        |
| 2026-10-30 | El cuerpo de la tarjeta Músculos (Tu plan) usa los trazados de `react-native-body-highlighter` (MIT, los mismos del prototipo anterior) copiados a `bodyParts.ts`, no la librería                                                                                                                                       | El dibujo a mano y los polígonos de `react-body-highlighter` no daban el nivel del diseño; se copian solo los contornos (con su licencia) para no añadir una dependencia                                                                                                                       |
| 2026-10-30 | Las tarjetas de sesión de Tu plan son de colores (lima, rayas azules, naranja, negro), con la sigla y el título en Barlow Condensed (OFL, en `public/fonts/`), como en el prototipo anterior                                                                                                                            | Lo pidió el usuario; es la excepción a la paleta sin naranja, solo en estas tarjetas (`--session-1…4` en `tokens.css`)                                                                                                                                                                         |
| 2026-11-01 | La barra de pestañas mide `--tab-bar-height` y lo fijo abajo (el pie «Empezar esta rutina») va encima de ella                                                                                                                                                                                                           | Con la barra fija abajo, el pie del detalle de rutina quedaba tapado y no se podía pulsar (lo detectó el e2e de la bienvenida)                                                                                                                                                                 |
| 2026-10-29 | Mujer por secciones (Base y fundamentos, Especialización en glúteo y tren inferior, En casa) con selector de días, «Ver todas» y filtros en cada nivel                                                                                                                                                                  | Diseño aportado por el dueño (agrupar por objetivo y contexto, no por volumen o días); solo Mujer, el resto de tipos igual                                                                                                                                                                     |

## 2026-11-02 · La racha del resumen final va en naranja

La app sigue sin naranja (decisión del 2026-10-29), salvo en el resumen final de la sesión, copiado del prototipo anterior a petición
del usuario: el fuego de la racha, los círculos de los días entrenados y el signo de lo que mejora (↑ +). También, como en el
prototipo, la palabra «Descanso» (o «¡A por ella!») de la barra de descanso y la llama del calentamiento; los números no. Es el
token `--streak`; no se usa para nada más.

## 2026-11-02 · Semana de descarga solo si la pauta la rutina

No hay descarga programada: la sesión solo va en modo descarga (menos series, más lejos del fallo) cuando la rutina lo dice en su
documento. MUTA no la pone cada N semanas ni la activa el coach por señales de fatiga, aunque la app anterior lo hiciera
([docs/conocimiento/02-reglas.md](conocimiento/02-reglas.md), «Descarga»).

## 2026-11-02 · La biblioteca de ejercicios se extrae del prototipo con un script

Los 141 ejercicios salen de la constante `EXERCISES` de `prueba/js/nucleo/conocimiento.js` con
`scripts/exercises-from-prototype.cjs`, que renombra los campos según [03-migracion.md](conocimiento/03-migracion.md) y falla si
encuentra un valor desconocido. Así no se copia ni se inventa nada a mano, y si el prototipo cambia basta con volver a ejecutarlo.

## 2026-11-02 · Ficha del ejercicio con el diseño nuevo y el motor de doble progresión

La ficha sigue el diseño que trajo el usuario, sin foto y con una gráfica del progreso. «Peso sugerido» sale del motor
(`domain/progression.ts`, la tabla de [02-reglas.md](conocimiento/02-reglas.md)), sin el caso de descarga. La tarjeta
«Descanso» cambia el descanso del ejercicio en el plan (sin «Saltar»), y «Empezar ejercicio» solo sale si vienes de la sesión.

## 2026-11-02 · La racha se cuenta en días y el descanso cuenta

El usuario pidió que los días de descanso cuenten para la racha. La racha pasa de semanas (como en el prototipo) a días:
suman los días entrenados y los de descanso del plan, y solo la rompe un día de entreno sin entrenar. Hoy no la rompe mientras
no hayas entrenado (`domain/streak.ts · diasDeRacha`).

## 2026-11-03 · Consejos de hoy: a la vista antes de empezar, sin estorbar

Los consejos que dependen de los ejercicios de hoy salen en Ver sesión y, en la sesión, en un aviso que solo aparece si hay alguno
y se va al tocarlo o al marcar la primera serie; los 9 generales (los que uno acaba sabiéndose) solo dentro de la hoja. Nada se
abre solo salvo que actives «Mostrar al empezar». Como un consejo de orden no sirve si no se puede cambiar el orden, la sesión
lo cambia solo hoy («Invertir hoy», «Hacer ahora»), y la ficha avisa cuando se compara un ejercicio hecho en otro puesto.

## 2026-11-03 · Ficha del músculo: el rango en una barra recta, con el punto naranja

El usuario pidió el rango de series en una barra recta (no en medio círculo, como el prototipo) y el punto de tu plan en naranja:
el naranja deja de ser solo de la racha y los récords (token `--range-dot`, el mismo color que `--streak`). El énfasis
(Equilibrado · Estirado · Acortado) no se pone: solo sirve al coach, que aún no existe.

## 2026-11-03 · Datos reales en Entreno: rotación, relleno marcado y semana al completarla

Tu plan, Ver sesión, la sesión, el resumen y las fichas dejan los datos de prueba y leen la rutina guardada y tus entrenos
(`workouts`). El usuario decidió tres cosas:

- **La sesión que toca va por rotación**: la siguiente a la última que hiciste. No hay días fijos de la semana; por eso la
  racha cuenta los descansos que deja tu semana (7 menos sus sesiones), no qué día caen (`domain/streak.ts`).
- **Lo que no trae la rutina se rellena y se marca**: el 78 % de los ejercicios de las rutinas no está en la biblioteca y casi
  ninguno trae su músculo. Primero manda la rutina, luego la biblioteca y, si no, un valor por costumbre (3 series, 8–12, a 2
  del fallo, 2,5 kg; el descanso, por tipo) que queda en `sugeridos`; el músculo sale del nombre (`muscleOf`). Con un rango de
  RPE vale el más alto; con uno de descanso, el medio (`restMinutes`, el mismo que los minutos de la rutina).
- **La semana pasa al completarla**, no por calendario; tras la última semana de la última fase se vuelve a empezar.

Las sesiones sin sigla en su nombre («Torso 1») se llaman S1, S2… por su orden en la semana. La sesión en curso se guarda a
cada cambio con una copia de sus ejercicios, así el resumen compara con la vez anterior aunque el entreno ya esté guardado.

## 2026-11-03 · Nombres de las rutinas unidos con la biblioteca (alias)

De 754 nombres de ejercicio en las rutinas, solo 61 estaban en la biblioteca. El usuario pidió unir todos los que sean el mismo
ejercicio. Se revisaron uno a uno (con el nombre original en inglés y, en los dudosos, los documentos originales) y se unieron
457 en `shared/content/exercise-aliases.json`. Criterio: **mismo movimiento con el mismo material**. Cuentan como el mismo la
técnica (pausa, excéntrica, 21s, parciales, dropset, lastrado), el ángulo o el recorrido, hacerlo a una mano y el prefijo de
superserie; **no** el cambio de agarre (supino, inverso), de material (barra, mancuernas, máquina, banda) ni los «a elegir» o
«X o Y». En pantalla se ve el nombre de la rutina; la ficha, la clave y los datos son los de la biblioteca. Quedan 235 sin pareja.

## 2026-11-03 · Cambiar un ejercicio por otro que hace lo mismo, hoy o en tu plan

El usuario pidió poder cambiar los ejercicios raros por otros que entrenen el mismo grupo de la misma forma (estiramiento,
etc.). «Hacer lo mismo» se define con las zonas de énfasis de `docs/conocimiento/02-reglas.md` (bíceps estirado o acortado,
tríceps cabeza larga, glúteo estirado o acortado, pecho superior, femoral bisagra o curl, dorsal vertical o remo, cuádriceps
recto femoral o vastos): mismo músculo principal y misma zona obligatorios; después, el mismo patrón o tipo y los
secundarios en común (`domain/equivalence.ts`). La zona sale del nombre, también del original en inglés. «Cambiar ejercicio»
deja elegir **solo hoy** o **en mi plan**: en el plan se guarda «ejercicio de la rutina → el nuevo» (`plans/current.cambios`)
y el nuevo conserva la pauta de la rutina (series, repeticiones, esfuerzo y descanso); se puede volver al de la rutina.

## 2026-11-03 · Los ejercicios originales de cada rutina, en la biblioteca con la explicación de su documento

El usuario pidió que los ejercicios originales de cada rutina estén en la biblioteca con las explicaciones de los documentos.
Como son de terceros, van en una biblioteca local (`private/biblioteca`, fuera de git) que la app une a la de MUTA para buscar,
abrir su ficha («Cómo hacerlo · Del documento de …»), cambiar ejercicio y proponer equivalentes. Las explicaciones se tradujeron
a mano (no con un traductor automático) y se ponen en cada ejercicio de las rutinas; en la ficha pequeña de Ver sesión manda
la explicación del documento de esa rutina sobre la clave de la biblioteca.

## 2026-11-03 · Editar rutina: por sesión, para todas las semanas, y la escritura del plan en cola

Editar rutina (A11–A13) guarda lo que cambias en cada sesión aparte de la rutina (`plans/current.ediciones`, por sigla) y vale para
todas las semanas, como «Cambiar ejercicio · En mi plan». El descanso y el ejercicio cambiado por otro siguen siendo de todo el plan.
Al probarlo salió un error: dos cambios casi a la vez (la pauta y el descanso) leían y escribían el plan por separado y el segundo
pisaba al primero. Ahora todas las escrituras del plan van en cola y cada una guarda el estado completo más reciente.

## 2026-11-03 · Editar rutina, más sencilla, y explicaciones de la web para lo que el documento no explica

El usuario pidió una Editar rutina minimalista y con los consejos del entrenador. Se quitan el salto de peso, la nota, copiar a
otra sesión y subir/bajar un puesto; cada cambio se guarda solo (sin «Guardar cambios») y «Al terminar la serie» queda en una lista
plegada. Las sesiones se nombran por lo que trabajan, no por su sigla. El entrenador enseña un solo consejo cada vez, los mismos de
Ver sesión, más uno nuevo de docs/conocimiento (no más de ~8–11 series directas del mismo músculo por sesión). Para los 25
ejercicios de la biblioteca local sin explicación en su documento, el usuario pidió buscarla en internet: se escribió en español a
partir de webs de técnica y la ficha dice de qué web sale.

## 2026-11-03 · Descansos obligatorios que se pueden cambiar, y Tu plan los respeta

El usuario pidió poder cambiar los descansos obligatorios. El plan sigue yendo por rotación, sin días fijos: un descanso va «tras
una sesión» (uno o dos días). De serie, los de la rutina (los del archivo, los del documento o, si no dice nada, al completar la
vuelta al cuerpo); cambiados en Editar rutina, se guardan en el plan para todas las semanas. Hoy toca descanso si la última sesión
hecha lo lleva detrás y aún no han pasado esos días; no bloquea: se puede entrenar igual. En Ver sesión, el ejercicio desplegado ya
no repite lo que toca hoy, los músculos ni la clave (están en la ficha completa).

## 2026-11-03 · Repeticiones a mano y de dónde salen las de la ficha

En Editar ejercicio las repeticiones se ponen a mano (mínimo y máximo, de 1 en 1) en un desplegable, en vez de mover el rango
entero. La ficha del ejercicio usaba la pauta de la biblioteca cuando el ejercicio no estaba en la semana que toca; ahora busca
antes en toda tu rutina (las repeticiones y el esfuerzo que más se repiten) y dice de dónde salen: de tu plan, de tu rutina o
típicas de ese ejercicio.

## 2026-11-04 · Las cuatro filas «Pronto» de «Tu rutina»

Aprobadas en `Desktop/MUTA-Entreno-lo-que-falta-minimalista.png`. Las fotos de las sesiones y tus consejos van en el almacén
`userContent` (ya existía): las fotos, reducidas a 1200 px en JPEG para no llenar el móvil. La cobertura usa la tabla del método
de docs/conocimiento tal cual, pasada a `shared/content/coverage.json` con los ejercicios de la biblioteca que cubren cada parte.
«Rehacer el plan» no vuelve a la bienvenida: rehace el plan con la rutina y lo que elegiste al escogerla (y tu nivel), quita lo
cambiado a mano y vuelve a la primera semana. El botón rojo de las hojas de confirmar pasa a `--surface`: sobre `--surface-2`
el rojo daba 4,45:1 (axe pide 4,5:1).

## 2026-11-04 · La hoja «Tu rutina», con menos filas, y tus notas para siempre

El usuario vio la hoja «Mis consejos» recargada y pidió revisar si hacía falta todo lo del «···». Quedan tres filas (Editar
rutina, Cambiar de rutina, Biblioteca). La foto de la sesión pasa a Editar rutina; la cobertura del método, al entrenador de
Editar rutina (con «Añadir …» a esa sesión); «Rehacer el plan» desaparece porque repetía «Volver a la rutina original · Todas»
(que ahora repone también los descansos y los músculos); «Mis consejos» se queda en ocultar un consejo desde «Consejos de hoy»
(sin editar ni escribir los tuyos). Las notas de un ejercicio, que antes solo vivían en la sesión en curso, se guardan para
siempre por ejercicio («Tus notas») y salen en la sesión y en su ficha. La prueba de accesibilidad espera a que acaben las
animaciones antes de medir el contraste.

## 2026-11-04 · Editar rutina: «Tu semana» arriba, nombre propio de cada sesión y el entrenador en su hoja

El usuario vio raros los desplegables de sesión y descansos y los consejos sueltos. La sesión se elige en una tira de
píldoras («Tu semana») y el descanso tras cada una se pone tocando el hueco de después (1, 2 o ninguno). Cada sesión puede
llevar el nombre que quieras (se guarda en el plan y sale en todas partes). Los consejos van en una fila que abre su hoja,
numerados como en la ficha del músculo. Un descanso de 0 en el documento (pasar directamente al siguiente) se enseña como
«sin descanso», sin cambiar el dato.

## 2026-11-04 · Tu semana con lo planeado, el día de descanso y tu rutina desde un CSV

«Tu semana» de Tu plan ya no deja vacío lo que falta: desde el primer día sin entrenar reparte las sesiones que tocan en su
orden con sus descansos obligatorios (si un día no entrenas, todo se corre, porque la rutina va por rotación). Cuando hoy
toca descanso, la tarjeta de la sesión deja paso a «Hoy descansas» con «Entrenar igualmente». El esfuerzo de un ejercicio
se escribe como «Repeticiones antes del fallo» con − / +, en vez de una lista. El usuario pidió cargar su propia rutina
desde un CSV: se guarda como un programa más (`programs`, id `mia:…`) y el plan la lee como las del catálogo.

## 2026-11-04 · Dropsets y rest-pause en la sesión, y el cambio de cada ejercicio en Ver sesión

Los ejercicios con dropset (bajar el peso y seguir) o rest-pause / myo-reps (pausa corta y más repeticiones con el mismo peso)
se reconocen por lo que dice su documento. En la sesión, tras marcar una serie, se apuntan sus bajadas o mini-series como
filas finas debajo; se guardan dentro de la serie y suman al volumen, pero la progresión sigue mirando la serie principal.
En Ver sesión, como en la app anterior, cada ejercicio lleva a la derecha cuánto cambió su máximo estimado (o sus
repeticiones, si va sin peso) frente a la vez anterior, y arriba cuántos suben. El «+» naranja del prototipo no tenía
contraste suficiente como texto: va como flecha (↑ naranja, ↓ gris).
