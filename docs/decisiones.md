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

## 2026-11-04 · La ficha del ejercicio, con dos gráficas

El usuario pidió ver lo que mejora con dos gráficas en vez de una con pestañas: el 1RM estimado y el tonelaje total, una
debajo de otra. El tonelaje cuenta las bajadas y mini-series y va en toneladas, la cifra y el eje igual.

## 2026-11-04 · «Empezar» dentro de la tarjeta y «Tu rutina» en un botón de ajustes

El botón «Empezar» ocupaba una franja entera. Ahora cada tarjeta de sesión lleva una píldora blanca «▶ Empezar» abajo a la
derecha, a la altura del título y «Tu rutina» se abre con una píldora «✎ Editar» en la cabecera, junto al perfil (primero se probó un ▶ redondo
y un ⚙; el usuario prefirió botones con texto, a juego). Nueva variable de diseño: `--float-shadow`.

## 2026-11-04 · Textos de información y consejos, justificados

El usuario pidió los textos de información y consejos «como en Word»: justificados (rectos por los dos lados), con las
palabras partidas en español para que no queden huecos grandes. Solo los párrafos; títulos, botones y cifras siguen igual.
Las pruebas de accesibilidad tienen 90 s cada una: axe no cabía en 30 s con todas las pruebas a la vez.

## 2026-11-04 · Gris más oscuro y textos de las fichas a 15 px

El gris de los textos secundarios (`--label-2`) pasa de #6e6e73 a #48484a en claro (y de #98989f a #aeaeb2 en oscuro): se
lee mejor y vale para toda la app. Los textos en negro de los consejos, los títulos de
las tarjetas de la ficha del ejercicio y los ejercicios de Ver sesión van a 15 px en seminegrita, todos iguales; la pauta de
cada ejercicio de Ver sesión, a 13 px. En la ficha del músculo, «Dónde lo entrenas» a 15 px (las series, a 13) y «La clave»
a 15 px sin negrita.

## 2026-11-04 · Editar rutina, empezando por tu semana

La tira de píldoras con puntos y lunas no se entendía, y «descanso» servía para dos cosas. Editar rutina se abre ahora con tu
semana como una lista en orden: las sesiones numeradas y, debajo, los días de descanso como filas que lo dicen («Día de
descanso · Quitar»); «+ Añadir un día de descanso» pregunta después de qué sesión. Tocar una sesión abre sus ejercicios. En
cada ejercicio, el descanso se llama «Descanso entre series», con una línea que lo explica.

## 2026-11-04 · Cada serie distinta y superserie (A14)

Las repeticiones «4, 6, 8» de un documento o de un CSV se guardan serie a serie y se escriben «4 · 6 · 8»; en Editar rutina, el
interruptor «Cada serie distinta» pone un desplegable por serie, y apagado vuelve al rango de siempre. La superserie sale de la
letra del nombre (A1/A2) y se puede unir o separar con «Superserie con» (solo con el de al lado, para no reordenar). En la
sesión no se abren los dos ejercicios a la vez: tras una serie del primero se descansan 20 s ([02-reglas.md](conocimiento/02-reglas.md))
y se abre el otro con un aviso; tras el último, su descanso normal y vuelta al primero. Así la pantalla sigue con un solo
ejercicio abierto y no estorba.

## 2026-11-04 · Cierre de Entreno: «···» de la ficha, tu material, imagen para compartir

- **«···» de la ficha**: solo lo que la ficha no hace ya. «Añadir a una sesión» y, si está en tu plan, «Cambiar en tu plan
  por otro». Fuera «Mi nota» (la ficha ya tiene «Tus notas») y «Ocultar La clave» (no aporta). Cambiar un ejercicio de tu
  plan tiene un solo caso de uso (`cambiarEjercicioDelPlan`) para la ficha y Editar rutina.
- **Tu material**: se guarda lo que te **falta** (`userContent/material`), así que sin elegir lo tienes todo, como el
  gimnasio completo de la bienvenida. Lo que no tienes no se esconde: baja al final, en gris, y se puede elegir (por si un
  día entrenas en otro sitio). Vive en Entreno, que es quien lo usa; el Perfil lo enseña con `TuMaterial` del `index.ts`.
- **Imagen para compartir (C25)**: dibujada en canvas a 1080 × 1920 (tamaño de historia), siempre oscura con los colores del
  tema oscuro de `tokens.css`; se comparte como archivo o, si el navegador no deja, se descarga. Si falla, el texto de antes.
- **Tu rutina (A06) y C00 no se hacen**: «Tu semana» de Tu plan y Editar rutina ya enseñan el ciclo con sus descansos, y
  «Empezar» abre la sesión directamente con sus consejos.
- El interruptor pasa a `shared/ui/Switch` (lo usan Editar rutina y el Perfil).

## 2026-11-04 · Los discos del gimnasio

- Dentro de **Tu material** (con barra): un círculo por disco de un gimnasio normal (25 a 1,25 kg), todos encendidos de
  serie. Se guarda lo que **falta**, igual que el material, y se puede cambiar también desde la calculadora de discos, que
  es donde se ve que falta uno.
- Se da por hecho que de cada disco que hay, hay los que hagan falta. Con discos que faltan, el reparto voraz puede fallar
  (sin 20, 10 ni 5, 30 kg por lado salía 25 + 2,5 + 2,5): `discosPorLado` busca la combinación con menos discos y, si
  empatan, la de discos más grandes.

## 2026-11-05 · La bajada del dropset, a la vista desde el principio

El usuario echaba en falta un sitio para apuntar las bajadas: «+ Bajada» solo salía al marcar la serie. Ahora cada serie de
un ejercicio con dropset o rest-pause trae su primera fila vacía (sin fondo, para que no parezca otra serie, y con huecos
grises para escribir); «+ Bajada» añade más cuando la última tiene algo. Los kilos de la bajada no se sugieren: la
rutina no siempre dice cuánto bajar.

## 2026-11-05 · Todas las técnicas de intensidad, y elegirlas en Editar rutina

Se buscaron en las rutinas las técnicas que traen: dropset, dropset mecánico, myo-reps, cluster, parciales en estiramiento
(«Lengthened Partials»), parciales integrados, fallo, estiramientos estáticos y superserie. Se apuntan aparte de la serie
cuatro: dropset (bajadas), dropset mecánico (cambios de variante con el mismo peso), rest-pause —con myo-reps y cluster—
(mini-series con el mismo peso) y parciales en estiramiento. Las demás se hacen dentro de la serie y no llevan filas. La
explicación de cada una sale de las notas de las rutinas. En Editar rutina, el desplegable «Técnica» (al final de la
pauta, cerrado: no molesta) pone cualquiera a cualquier ejercicio o quita la de la rutina.

## 2026-11-05 · Sin «Añadir ejercicio» en la sesión, y filas de la sesión más marcadas

- **Añadir ejercicio, solo en Editar rutina.** El usuario lo quiere fuera de la pantalla en la que apunta los pesos, para
  que no estorbe. Se quitan el botón de abajo y la fila de «Esta sesión» (C19).
- **Las filas de las series**, un gris más fuerte (`--surface-2`), y la hecha un tono más (`--surface-3`, nuevo).
- **Consejo de la técnica de intensidad** (Editar rutina), del usuario: mejor en la última serie del último ejercicio de
  un músculo. Si hay tiempo, rinde más una serie normal de más, siempre que sigas ganando fuerza.

## 2026-11-05 · Comida antes que Hoy, y el entrenador solo propone

- **Comida se hace antes que Hoy**, por decisión del usuario (el documento de rediseño ponía Hoy → Progreso → Comida). Diseño
  aprobado: `Desktop/MUTA-Comida-diseno.png` (versión 1: Hoy, Añadir, la ración, Semana, Tu objetivo y la sugerencia).
- **El entrenador propone, nunca aplica.** El prototipo tenía «Ajuste automático»; el usuario quiere sugerencias: la revisión
  semanal enseña qué cambia, por qué y lo que ha comprobado, y solo cambia con «Aplicar desde mañana» (con «Deshacer» e
  historial). Por lo mismo, el objetivo **se guarda** al calcularlo: bajar de peso no lo recalcula solo; se recalcula si cambias
  tu fase o tus datos.
- **El peso se apunta en Comida** (Semana · «+ Pesarme») hasta que exista la pestaña Hoy; va a `bodyLog`, donde la leerán Hoy
  y Progreso.
- **El buscador busca cada palabra** en el nombre («salmon plancha» encuentra «Salmón a la plancha»); el prototipo exigía la
  frase entera.
- **La base de alimentos** (1.493, BEDCA y USDA) va en `shared/content/foods.json` y se descarga aparte al abrir «Añadir»:
  no pesa al abrir la app. Su prueba admite, nombrándolas, las kcal que no cuadran con 4P + 4H + 9G por fibra, alcohol,
  polioles o vinagre.

## 2026-11-05 · Comida, con los tamaños de letra de Entreno

- **Un tamaño por papel en toda la app**, a petición del usuario: títulos, datos, subtítulos y cifras de Comida miden lo mismo
  que en Entreno (tabla en [rediseno.md](rediseno.md), «Tipografía»). Se quitan los tres tamaños propios de Comida
  (`--text-food-hero` 68, `--text-food-number` 44, `--text-food-tile` 28): «por comer», tu objetivo y la ración usan la cifra
  protagonista de Entreno (40) y la media, el peso, la sugerencia y las cifras de la ración, la de tarjeta (30). Las kcal de
  cada fila pasan a 15 y los rótulos en mayúsculas, sin negrita, como «Tu semana».

## 2026-11-05 · Comida versiones 2 y 3: dieta, recetas, compra, cocina, consulta y escáner

El usuario pidió «todas las funcionalidades de Comida» sin contestar aún las dudas del PNG
(`Desktop/MUTA-Comida-v2-funcionalidades.png`); se toma lo más prudente en cada una y queda dicho aquí:

- **Sin lima y con el estilo de su captura**: la tarjeta del día es gris, con un anillo de kcal («1.560 kcal de 2.500») y
  las barras de cada macro con su porcentaje; las comidas, en tarjetas con miniatura redonda (sin fotos aún: el icono de
  Comida) y ‹ Hoy › para ver y apuntar en otros días. La etiqueta de la tarjeta negra pasa de lima a blanco y la raya del
  objetivo de Semana, de naranja a gris (la decisión del 2026-10-29: sin naranja).
- **No se inventa una dieta.** `Entrenamiento/Dieta/Dieta Alexandru.docx` son notas (recetas sueltas y una lista de compra),
  no una dieta con menús de entreno y descanso. La app permite **cargar un archivo**, **crear la tuya** con tus recetas
  (desde cero) o **probar la de ejemplo del prototipo** (marcada siempre «de ejemplo, no pautada para ti»).
- **Formato propio `muta-dieta` v1 (JSON)**, el que guarda «Guardar como archivo»: claves en español y validado entero al
  leerlo. No se lee el `muta-diet` del prototipo: no hay ningún archivo así en el equipo. Recetas anidadas con dos versiones
  no caben bien en un CSV como el de las rutinas.
- **Las cifras de la dieta salen de sus recetas** (una sola fuente): el objetivo de un día es lo que suman las de ese día;
  sin recetas, vale tu objetivo de kcal. Con dieta no corre la revisión de kcal de la versión 1: manda la consulta.
- **Entreno o descanso** sale de tu rotación de Entreno (su `index.ts`, en diferido), como Tu semana; sin rutina, tus días
  repartidos (regla del prototipo, «sugerido»); cada día se puede cambiar a mano.
- **La consulta semanal va en Comida** (Hoy aún no existe); lo que apuntas (cintura, sueño, escalas) va a `bodyLog` tipo
  `checkin`, donde Hoy y Progreso lo podrán leer. Sigue las reglas 1–8 de la sección 8 y **solo propone**: «Aplicar desde
  mañana» (un ajuste de kcal, pasos o fase) o «Ahora no»; lo aplicado se deshace. La regla 6 (proteína hacia 1,9 g/kg) se
  da como consejo: los gramos los pones tú en tus recetas. «1.000 pasos menos que el plan» no se usa: la app no cuenta pasos.
- **Intercambios**: la regla del prototipo, quitando además lo cocinado (al horno, asado, frito, a la plancha), las harinas,
  los cereales de desayuno y el mismo alimento (también su harina o bebida): salían «Harina de arroz» o «Corn flakes».
- **El escáner** usa `barcode-detector` (MIT) con el lector zxing (`zxing-wasm`, MIT): el `.wasm` (unos 950 kB) lo sirve la
  app y se descarga solo al abrir el escáner; por defecto la librería lo bajaba de un CDN. Open Food Facts es lo único que
  sale a internet; lo encontrado se guarda en «Mis alimentos» con su código y la próxima vez no hace falta red. La cámara,
  por `shared/platform` (`startCamera`).

## 2026-11-05 · Sin Semana en Comida: será de Progreso

El usuario: habrá una pantalla de Progreso con sus funcionalidades, y Semana (las barras de los 7 días frente al objetivo,
los días con la proteína hecha y la tendencia del peso) no va en Comida. Se quita con su resumen y sus barras. Se queda lo
que necesitan la revisión del entrenador y la consulta: la tendencia y el ritmo del peso (`domain/weight.ts`) y apuntar el
peso, que pasa a Hoy («+ Pesarme» bajo la tarjeta del día) hasta que exista la pestaña Hoy.

## 2026-11-06 · Recetas que se ajustan, tu menú, tus productos y lo de hoy

Diseños aprobados por el usuario: `Desktop/MUTA-Recetas-funcionalidades.png` («está perfecto») y
`Desktop/MUTA-Menu-funcionalidades.png` («dalee»).

- **El recetario es de terceros**: sus 100 recetas y una foto por receta van en `private/recetas/` (fuera de git), como las
  rutinas, y se cargan con `shared/data/localRecipes.ts` (no con `VITE_NO_LOCAL_PROGRAMS`). La app no lleva el nombre de la
  autora. Sin recetario (CI, e2e) salen los platos de la dieta de ejemplo, marcados «De ejemplo».
- **Una foto por receta, sin manos**: la del plato terminado; en la 68 y la 74 salían dedos y se usa la mitad derecha de la
  del último paso (el plato servido). Cuadradas, 480 px, webp.
- **Se parte siempre de las cifras del libro.** Al casar sus ingredientes con la base de alimentos, la suma suele salir más
  alta que lo que dice el libro (solo 284 de 923 ingredientes vienen en gramos; el resto en unidades). Con el criterio del
  diseño («si se aleja más de un 10 %, solo se escala entera») solo se podrían ajustar 8 recetas. Por eso el total es el del
  libro y, al cambiar gramos, se suma solo la diferencia con los valores por 100 g de la base. Se ajustan 97 de 100 (no: la
  granola y el pan de plátano, que dan el total de varias raciones, y dos con los ingredientes en una sola línea).
- **Los gramos de lo que viene en unidades son sugeridos** (`private/herramientas/recetario-piezas.tsv`: un kiwi 75 g, una
  rebanada de pan 35 g…; cucharada 15 g, cucharadita 5 g, taza de líquido 240 g) y la receta lo marca «sugerido».
- **Cómo se ajusta**: se mueven los ingredientes que aportan (≥ 40 kcal; su macro principal, la proteína si da un 30 % de
  sus kcal) entre la mitad y dos veces y media lo del libro (sugerido), de 5 en 5 g, buscando a la vez proteína, hidratos y
  grasa (error en kcal de cada macro). Si no llega, dice hasta dónde y ofrece repartir, añadir algo u otra receta.
- **Reparto de lo que falta entre comidas** (desayuno 25 %, comida 35 %, merienda 15 %, cena 25 %) y **qué categorías van
  con cada comida** (batidos, panes y postres en desayuno y merienda; sopas, pescado y carne en comida y cena): sugeridos,
  ningún documento los fija.
- **Menú ocupa el sitio de Dieta** en Comida (Hoy · Menú · Recetas); la dieta se abre desde Menú (`?vista=dieta`). La
  compra sale del menú en los días con platos y de la dieta en los demás.
- **Avisos por el calendario**: la app no tiene servidor y no puede sonar a una hora con el móvil bloqueado. «Añadir la
  semana al calendario» comparte un `.ics` con su alarma; las horas de las comidas (8:00, 14:00, 17:30, 21:00) son
  sugeridas. Lo de hoy sale arriba en Comida · Hoy hasta que exista la pestaña Hoy.
- **Tu nutricionista** mira los próximos 7 días con al menos 3 comidas en el menú: si no llegas a la proteína (15 g o más)
  propone cambiar un plato; si te pasas o te faltan 200 kcal o más, ajustar los gramos de ese día (umbrales sugeridos).
  Solo propone: «Aplicar», «Ahora no» y «Deshacer». Cuánto aguanta lo cocinado en la nevera no lo dice ni lo limita: no hay
  fuente.
- **Tu producto** (tu arroz, tu hummus) se guarda en Mis alimentos (escaneado o a mano) y cuenta en todos tus platos o solo
  en uno (`userContent/productos`); las kcal del plato se recalculan con sus valores.

## 2026-11-06 · Comida más sencilla: tus menús A, B, C…, el tick y cambiar un alimento

Diseño aprobado: `Desktop/MUTA-Comida-sencilla-funcionalidades.png` («me parece bien»).

- **Tus menús en vez de la semana día a día**: de 1 a 7 menús (A, B, C…), cada uno con un plato por comida, y tu semana de
  lunes a domingo (seguidos A B C A… o elegidos). Los gramos de cada plato se ajustan solos al objetivo de cada día (entreno
  o descanso) y a lo que le toca a esa comida. Lo guardado con la forma anterior (huecos por día) no se lee: se empieza con
  un menú A vacío (la rama no estaba publicada).
- **Hoy con tick**: cada comida trae el plato de su menú; el tick lo apunta con sus gramos de ese día y quitarlo lo desapunta.
- **Cambiar un ingrediente**: tu marca (mismos gramos; en todos tus platos o en uno) u otro alimento con la misma cantidad
  de su macro principal (la regla de los intercambios de la dieta; solo hoy o siempre en ese plato). El plato cuenta con
  sus valores: el total del libro más la diferencia.
- **El nutricionista** mira cada menú en su próximo día: proteína corta → cambiar un plato del menú; kcal cortas y una
  comida vacía → un plato para ella. Los gramos ya se ajustan solos, así que «ajustar el día» deja de proponerse.
- **El peso pasa a la pestaña Hoy** (con lo de hoy con hora: la compra y lo que cocinas), por `features/nutrition/index.ts`.
  El resto de Hoy tendrá su propio diseño.
- **La compra en desplegables** (abierta la primera sección con algo por comprar), sin la lista de recetas de cada producto.
- **Filtros de una categoría**: «Cuadran» pasa a «Para el desayuno / la cena…» y «≤ 20 min» a «Rápidas», en una fila.
- **Las fotos del recetario siguen fuera de git** hasta que el usuario decida (el repositorio es público).

## 2026-11-06 · El recetario se sube al repositorio (público)

El usuario decide subir las recetas y las fotos del recetario «tal cual», sabiendo que el repositorio es público («la
aplicación es para mí y para un amigo»). Pasan de `private/recetas/` a `src/shared/content/recetario/` (sin el nombre de la
autora en la app). Excepción a la regla 7 de CLAUDE.md solo para el recetario: las rutinas de terceros siguen en `private/`.
Los generadores siguen en `private/herramientas/`; tras rehacerlo, se copia a `src/shared/content/recetario/`.

## 2026-11-06 · Supermercados, compra por menús, cantidades sugeridas y la calculadora de platos

- **Base de supermercados**: 19.157 productos de Mercadona, Lidl, Carrefour, Alcampo, Ahorramás, Dia y Eroski desde Open
  Food Facts (datos abiertos, ODbL; `node scripts/foods-off.mjs` → `src/shared/content/foods-super.json`, 374 kB
  comprimido). Los supermercados no publican sus productos con calorías y copiar sus webs incumple sus condiciones. Se
  descarga aparte, detrás de los genéricos, y queda en el móvil. El escáner busca en tus alimentos, después en la base y por
  último en internet. Los equivalentes de un ingrediente salen solo de los genéricos.
- **La compra**: por días (lo de tu semana) o por los menús que elijas y cuántas veces cada uno.
- **Cantidades sugeridas**: cada comida de un menú va «para tu objetivo» (ajustada) o «como en la receta», a tu elección.
- **«+ Añadir menú»** visible; «Cambiar» en Tu semana abre cuántos menús y qué día va cada uno.
- **Calculadora de platos en Cocina** («Pesa en crudo, come cocinado»), arriba, con los platos de tus menús; se llega desde
  Menú (Cocina) y desde «Cuándo cocinarlo» (Pesar lo cocinado). No molesta en Hoy ni en Recetas.
- **CI**: el servidor de los recorridos tarda más en construirse; su límite pasa de 120 s a 300 s.

## 2026-11-06 · Tu versión de un plato y tu dieta como tus menús

- **Editar un plato** (del prototipo: «Recetario editable» y «Editor de platos»): nombre, gramos para siempre, quitar o
  añadir ingredientes y pasos. Un plato del recetario no se cambia: «Hacer tu versión» lo guarda como tuyo (el total
  sigue partiendo del libro y suma la diferencia).
- **Tu dieta como tus menús** (lo que prometía el diseño sencillo): «Pasar sus menús a tus menús» crea un menú tuyo por
  cada menú de la dieta (su primera receta de cada comida), tu semana como la de la dieta y sus recetas como platos tuyos;
  se deshace. La dieta y su consulta siguen en su vista.

## 2026-11-06 · Lo grande se guarda en el móvil al usarlo, no al instalar

Las fotos del recetario y los productos de supermercado (unos 5 MB) ya no van en lo que se guarda al instalar la app: se
guardan la primera vez que se usan (caché «muta-grande») y después funcionan sin cobertura. Instalar era lento y, en la
CI, se cruzaba con las recargas de los recorridos. Las revisiones de accesibilidad esperan a que acaben las animaciones.

## 2026-11-07 · Los identificadores, también sin https (el móvil por la wifi)

En el móvil la app se abre por la wifi (`http://192.168…`): sin https, el navegador no da `crypto.randomUUID`, y todo lo
que guardaba algo nuevo fallaba en silencio (calcular tu objetivo, apuntar, menús, la compra, las sesiones de Entreno).
Ahora todo usa `nuevoId()` de `shared/lib/id.ts` (con `crypto.getRandomValues`, que sí está siempre); el linter prohíbe
`crypto.randomUUID` y los recorridos se pasan sin él, como en el móvil.

Además, la primera vez que calculas tu objetivo se pregunta qué quieres (definir, mantenerte o volumen; viene marcado lo
de tu bienvenida, que antes se usaba sin preguntar). La pestaña Hoy enseña lo que comes hoy según tu menú.

## 2026-11-07 · Ajustar sin tocar verduras, lo cocido en crudo, la compra por pasillos y cambiar un día

- **Ajustar** (sugerido): solo se mueve lo principal (carne, pescado, huevos y lácteos, cereales, legumbres, tubérculos,
  fruta y grasas). Las verduras, salsas y caldos (la base los guarda como verdura) y las bebidas se quedan como en la
  receta: salía un bowl con 325 g de cebolla y 50 g de pollo. El macro de cada ingrediente se recalcula al leer el recetario.
  Se siguen ajustando 96 de 100.
- **Lo cocido, en crudo**: el arroz, la pasta y las legumbres cocidos dicen «≈ 90 g en crudo», por sus kcal frente a su
  pareja en crudo de la base (lo cocido gana agua, no kcal). Solo si la base tiene la pareja.
- **La compra por pasillos** (sugerido): fruta, verdura, carne, pescado, huevos y lácteos, pan y cereales, legumbres,
  conservas y salsas, aceites y especias, frutos secos, dulces, bebidas, platos preparados, suplementos y otros. Lo que la
  base guarda junto (caldo y salsas como verdura, frutos secos como grasa) o no tiene, por su nombre.
- **Cambiar un ingrediente** en los dos sitios (elegido por el usuario): al apuntar el día, «solo este día» (o siempre en
  el plato), y si ya estaba apuntado se vuelve a apuntar; desde el menú, para siempre. El cambio de un día ya no borra el
  de siempre: van con claves distintas.
- **Texto justificado** en todos los párrafos (elegido por el usuario), con guiones.

## 2026-11-07 · Repaso de todas las pantallas y hojas de Comida

Auditoría con capturas de las 53 pantallas y hojas (con el recetario real). Arreglado: la compra «por menús» empieza en
×1 (con ×0 salía vacía); el aviso con «Deshacer» se quita al abrir otra hoja (tapaba su contenido); las opciones sobre una
tarjeta gris van en blanco (`--choice-bg`; no se veían); las tres hojas con título pequeño, como las demás; las líneas de
cifras, sin justificar; la consulta ya no manda a «Comida · Semana»; el plato del menú se apunta desde su comida del día;
un menú sin platos sale abierto. Más vistoso: la categoría de recetas con su foto arriba, la compra con barra de lo que
ya tienes, el nutricionista con «Todo cuadra».

## 2026-11-07 · Desde el menú, al menú; tu menú antes que la dieta; la compra con emoticonos

- Una receta abierta desde un menú (al elegir su plato) tiene como botón principal «Poner en Menú A · desayuno» (o
  «Volver al menú» si ya está); «Apuntar … hoy» pasa a secundario y no se ofrece «Ajustar a lo que falta», que es para
  lo que comes hoy. Antes el botón negro apuntaba hoy y llevaba a equivocarse.
- Comida · Hoy: si ese día tienes un menú tuyo con platos, manda el tuyo; la dieta, solo los días sin menú tuyo (antes la
  dieta de ejemplo tapaba tus menús). Cada comida con plato del menú lleva también su «+» para apuntar otra cosa.
- La compra: cada cosa con un emoticono (por su nombre o su sección; solo decora) y los menús de los que sale; «+ Añadir
  algo que no está en el menú» arriba.

## 2026-11-08 · Quitar deslizando y lo que sueles comer

- **Quitar deslizando** (sin X a la vista): el gesto de la sesión de Entreno pasa a `shared/ui/useDeslizar.ts` y a la
  pieza `Deslizable` (asoma «Quitar» en rojo). En Comida · Hoy, deslizar una comida quita lo apuntado y el plato del menú
  solo ese día (`sinPlato` en el menú); en su hoja, cada apunte; en Menú, cada plato del menú. Todo con «Deshacer».
- **Lo que sueles comer** (`domain/usual.ts`): con 7 días apuntados de los últimos 14, la app conoce lo que repites (2
  veces o más), cuánto sueles echar (la mediana) y en qué comida. Cuando al día le falta proteína (15 g), hidratos (20 g)
  o grasa (8 g) y quedan 100 kcal o más, «Añadir» propone 3 de esos alimentos con sus gramos, sin pasarse de las kcal que
  quedan. Umbrales sugeridos; solo propone, lo apuntas tú.
- **Hidratos según el día de entreno**: los documentos de conocimiento no dan una regla (solo «hidratos antes y después
  de entrenar» y «el resto, a hidratos»). Queda pendiente, a petición del usuario.

## 2026-11-08 · Comida pasa a ser Nutrición: tu día y «Tu plan»

Diseño aprobado por el usuario (`Desktop/MUTA-Comida-tu-plan-propuesta.png`), con dos cambios suyos: se llama
**Nutrición** (pestaña y título) y la cabecera es como la de Entreno (título y, al bajar, barra fija con «Nutrición»
pequeño y centrado).

- Nutrición abre en **tu día** (sin pestañas Hoy · Menú · Recetas): el día con sus flechas va dentro de la tarjeta del
  anillo; al final, «Para la cena · te faltan…» (recetas ya ajustadas) y «Ver todas las recetas ›».
- **«Tu plan»** (junto al perfil, como «Editar» en Entreno) reúne tu objetivo (la tarjeta negra con «Cambiar fase»,
  «Fijar a mano» y «Cómo sale ›», que lleva a Tu objetivo con la revisión y el historial), tus menús de la semana, la
  compra, la cocina, los avisos y la dieta pautada. `?vista=plan` (la vieja `?vista=menu` lleva aquí).
- Las recetas, como vista a la que se llega desde tu día (`?vista=recetas`) y al elegir un plato del menú.
- Por dentro el área sigue llamándose `nutrition` y las rutas `/comida/…` no cambian.
