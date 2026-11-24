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

## 2026-11-08 · Tu plan, más pequeño y claro; en Cocina, crudo y cocido

Aprobado por el usuario (`Desktop/MUTA-Tu-plan-propuesta.png`), con su cambio: la dieta de tu nutricionista va bajo
los menús, fuera de Herramientas.

- El objetivo, en una tarjeta gris pequeña (fase, kcal, tres cajitas de macros) con un solo «Editar». La hoja «Tu
  objetivo»: ¿Qué quieres? (Definir · Mantenerte · Volumen) y Velocidad se guardan ahí; «Poner mis kcal» (antes «Fijar a
  mano»), «Cómo se calcula» (antes «Cómo sale») y «Mis datos» llevan a Tu objetivo.
- Lo que propone tu nutricionista va dentro del menú al que afecta (punto naranja y «Ver ›»), sin el banner negro.
- «Herramientas»: Lista de la compra, Cocinar y pesar y Recordatorios, con dibujo y una línea de qué hay dentro.
- La dieta se carga con su archivo de dieta de MUTA (JSON), no CSV.
- Cocina: lo que se cuece (el arroz cocido de una receta) sale en crudo, que es como se pesa, con lo que pesará cocido
  debajo («Arroz blanco (crudo) 175 g · ≈ 478 g cocido»), en «Pesa en crudo» y en la hoja Cocinar.

## 2026-11-08 · Proteína y grasa, por kilo o en gramos

Pedido por el usuario: cambiar la proteína y la grasa por g/kg de peso o a mano, con las recomendaciones oficiales para
hombres y mujeres, y **si algo de fuera contradice nuestros documentos, mandan nuestros documentos**.

- En la hoja «Tu objetivo», «Proteína y grasa»: «Por kilo de peso» (de 0,1 en 0,1) o «En gramos» (de 5 en 5, fijos aunque
  cambie tu peso: `proteinaG`/`grasaG` en tus ajustes). Los hidratos siempre son lo que queda. De serie, 1,5 y 0,6 g/kg.
- Debajo, lo que dicen nuestros documentos (`docs/conocimiento/01-contenido.md`, sección de nutrición, y la guía de
  culturismo natural: los hidratos mandan, la proteína suficiente, no excesiva): proteína ~1,5 g/kg; 1,8–2,2 solo muy
  definido y en déficit fuerte; grasa al menos 0,6 g/kg. Fuera de eso, un aviso que no impide guardar (`avisosReparto`).
- Fuera: ISSN 2017 (1,4–2,0 g/kg; 2,3–3,1 en déficit en entrenados), ISSN mujer deportista 2023 (1,4–2,2), Helms 2014
  (2,3–3,1 g/kg de masa magra en déficit). Lo que pasa de 2,2 contradice los documentos: no se recomienda, solo se avisa. Los
  documentos no dan otra cifra para mujeres: mismo rango, sin bajar la grasa del suelo (salud hormonal).
- Cambiar el reparto no cambia tus kcal ni descarta sugerencias, y no va al historial de tu objetivo.

## 2026-11-08 · La guía de culturismo natural entra en el conocimiento

El usuario aporta la «Guía definitiva de culturismo natural» (PDF de 30 páginas, de transcripciones de vídeos y clases).
Se resume en [04-guia-culturismo-natural.md](conocimiento/04-guia-culturismo-natural.md) (fuente G1); el PDF no se sube.

- Choca en 20 puntos con 01 y 02 (proteína en definición, kcal ON/OFF, ritmo de la definición, pausas por calendario,
  cuándo subir o bajar volumen, RIR 0 frente a fallo, repeticiones, bíceps y tríceps, pasos…). Entre dos documentos
  nuestros no se elige solo: hasta que el usuario decida, la app sigue con 01 y 02.
- Sus propuestas para la app (§13) quedan sin aprobar: cada una pasa por diseño.

## 2026-11-08 · Lo que se sigue de la guía de culturismo natural

El usuario decide los 23 choques entre la guía (G1) y 01/02 (tabla en
[04-guia-culturismo-natural.md](conocimiento/04-guia-culturismo-natural.md) §14). Manda la guía en 1, 3 (optativo),
4 (optativo), 5, 6, 7, 8, 9, 11, 12, 16, 18, 21 (solo un poco), 22 y 23 (según la persona); se queda lo de antes en 2, 10,
13, 14, 15, 17, 19 y 20. Lo aplicado ya:

- **El esfuerzo, siempre en RIR** («RIR 2», nunca «al fallo» ni «a N del fallo»): RIR 0 no es fallo. Cambia la regla del
  documento de rediseño («sin siglas»).
- Proteína: aviso por encima de 2 g/kg; la consulta con dieta ya no sube la proteína en la fase final y sugiere una
  recarga de hidratos de varios días con hambre o poca energía en la segunda mitad (sin cifras: la guía no las da).
- Revisión semanal en volumen: si el peso sube despacio pero tu fuerza en los básicos no baja, no se suben las kcal.
- Pasos: mínimo 10.000 antes de comer menos; se recomiendan 12.000–15.000, los que puedas.
- Biblioteca: al añadir un ejercicio, repeticiones en 5–12 (las rutinas ya hechas no cambian).
- Consejos de dorsal (descolgar solo un poco) y de parciales (puntuales, casi nunca en definición).
- Lo demás (ON/OFF, ritmo por fases, frecuencia por persona, el entrenador de Entreno) necesita diseño aprobado.

## 2026-11-09 · La guía de culturismo natural en Entreno

Pedido por el usuario («hazme absolutamente todo esto»), con su frase: casi todas las series mejoran y recuperas →
**puedes** subir volumen.

- «Casi todas» = 80 % de las series comparadas (sugerido: la guía no da cifra). Con menos de 4 series no se lee nada.
- **Tu entrenador** (Tu plan): por músculo y en los últimos 7 días, cada serie frente a la misma de la vez anterior. Solo
  propone (+1 serie, «Aplicar / Ahora no»); nunca cambia ejercicios ni quita series.
- Para saber cómo vas, cada serie guarda ahora su **RIR** y si fue **fallo** (antes no se guardaba). El entrenador aún no
  los usa; quedan para la recuperación cuando haya check diario.
- **RIR progresivo**: las primeras series con uno de margen más y la última al RIR de la rutina; cada semana del bloque,
  una serie más al objetivo. Es lo que sale en gris: la rutina sigue mandando.
- Entreno lee tu fase de Nutrición (solo la lee) para el aviso de técnicas en definición y el tono del entrenador.

## 2026-11-09 · Las reglas del entrenador (cuestionario)

El usuario pidió mirarlo mejor y lo decidió con un cuestionario. Todo son sugerencias («Aplicar / Ahora no»).

1. **«Casi todas»**: los documentos no dan cifra; el ejemplo de la guía (§5: mejorar en 4 de 5 series indica volumen
   corto) encaja con el 80 %. Se queda en 80 %, marcado «sugerido». El texto: «toca subir volumen».
2. **Cada semana** (la guía: «paso a paso cada semana»): los últimos 7 días, y las dos semanas de antes para ver si algo se
   repite.
3. **Mejorar = doble progresión**: llegar al máximo del rango de repeticiones con el mismo peso o más, o haber subido el
   peso sin bajar del mínimo del rango. Ir peor = baja el 1RM estimado (sin contar subir el peso dentro del rango).
4. **Recuperas = las series no bajan**: con el 10 % o más yendo peor, no se sube.
5. **Subir**: +1 serie en el ejercicio con menos series; no todos a la vez (como mucho 2 músculos por semana, sugerido),
   primero los de Prioridad; los de Mantener no suben, y «No me interesa» pasa el músculo a Mantener.
6. **Ir peor** (≥ 10 %): aviso (sueño, estrés, comida); si se repite la semana siguiente, −1 serie (nunca por debajo de 2).
7. **Estancado**: 1.ª semana, sueño, comida y estrés (en volumen, un poco más de kcal, mejor los días de entreno); 2.ª, el
   RIR; 3.ª, +1 serie. Nunca cambiar de ejercicio.
8. **Un cambio por músculo** y una semana de espera para ver su efecto.
9. **Definición**: subir igual que en volumen; el estancamiento solo da un aviso suave (mantener ya vale).
10. Todos los músculos con al menos 4 series que comparar (los de Mantener, solo si van peor).

Se quita el aviso «Prepárate» a 15 s del final del descanso (no lo quiere el usuario).

## 2026-11-09 · El entrenador sigue el paso a paso de la guía (segundo cuestionario)

Sustituye en lo que cambia a «Las reglas del entrenador (cuestionario)». Comprobado en la guía (p. 11): «es mejor 10 series
manteniendo en 8–9 y progresando en 1–2 que 5 progresando en 4» y «progresar en el 100 % suele indicar volumen bajo».

1. **Mejorar = más kilos o más repeticiones** que la misma serie de la vez anterior (guía: «carga o repeticiones»), y
   solo se propone subir tras **3 semanas seguidas** mejorando en casi todas (el usuario dijo 3–4: se usan 3).
2. **Paso 1 de la guía**: un ejercicio solo cuenta si tiene el RIR apuntado en todas sus series, a ±1 del de la rutina.
3. **Subir**: lo puedes hacer tú con cualquier músculo; el entrenador solo lo recomienda en los que progresan, **un músculo
   por semana y una serie**, y como mucho **+2 series por músculo** en total.
4. **+1 serie**; si no cabe, añadir un ejercicio en otra sesión a **48 h o más** de las que ya trabajan ese músculo y sin
   pisar los músculos de ese día (solo texto).
5. **Estancado**: sueño, comida y estrés → el RIR → un poco menos de intensidad (RIR +1) → −1 serie.
6. **Las kcal no las toca el entrenador**: van en la revisión de peso de Nutrición, que ya no las sube si progresas en tus
   básicos.
7. «Tras una definición, no priorizar» queda pendiente: el usuario no lo tenía claro.
8. Ir peor: aviso y, si se repite, −1 serie (igual). 9. «Casi todas» = 80 % (igual). 10. Definición: igual.

## 2026-11-09 · El entrenador sugiere 1 o 2 series, sin tope total

Aclaración del usuario: el entrenador nunca sube nada por sí solo; siempre es una sugerencia, de **1 serie o 2 como mucho**.
Se quita el tope de «+2 series por músculo en total» (no tenía sentido: no sube solo). Cada sugerencia de subir trae
«Aplicar: 3 → 4 series» y, si caben (máx. 4/5 por ejercicio y 11 del músculo en la sesión), «3 → 5 series».

## 2026-11-09 · Hidratos según el día (ON/OFF)

Decidido por el usuario (choque 3, optativo): **solo hidratos**, con un **interruptor** en Tu objetivo; la app sabe qué días
te toca entrenar por tu rutina de Entreno (sin rutina, tus días repartidos) y les da más hidratos, y menos a los de
descanso, con **las mismas kcal en la semana**: el déficit, el volumen o el mantenimiento no cambian.

- La diferencia entre un día de entreno y uno de descanso, en parte de tus kcal: **10 % (sugerido)**, 15 % o 20 %. La guía
  no da cifra (su gráfica es ilustrativa, ~20 %; al salir de competir, menos del 10 %).
- Cálculo: con n días de entreno en la semana, descanso = kcal − n·d·kcal/7 y entreno = descanso + d·kcal. La proteína y
  la grasa no cambian; los hidratos son lo que queda.
- Tu día dice «Día de entreno: +N g de hidratos» o «Día de descanso: −N g». Con una dieta cargada manda la dieta.

## 2026-11-09 · Si te pasas de grasa, las recetas se adaptan

Pedido por el usuario. Lo que falta del día ya no es solo «objetivo − comido» por separado: si te pasas de grasa (o de
proteína), lo que sobra se quita de los hidratos que quedan, a igualdad de kcal (1 g de grasa = 2,25 g de hidratos), así
el día sigue cuadrando con tu objetivo. Con 0 g de grasa por comer, al ajustar una receta lo que aporta sobre todo grasa
(el aceite, el aguacate) puede bajar hasta 0, y las que mejor encajan son las magras. Lo avisan «Para la …» («con menos
grasa» y la grasa de cada plato) y Cuadrar el día.

## 2026-11-09 · Lo que quedaba de la guía en Nutrición

Pedido por el usuario («haz todo menos lo de los suplementos, diseño cohesionado»). Todo son sugerencias; las cifras que la
guía no da van marcadas como «sugerido» aquí.

- **Velocidad por fases** (definición, interruptor): semanas 1–4 tu velocidad + 0,25 (máx. 1 %), 5–8 la tuya y desde la 9
  − 0,25 (mín. 0,5 %) — sugerido. La revisión semanal propone el nuevo objetivo al pasar de etapa.
- **Tu situación** (mantenimiento): «Tras parón» o «Tras definir». Cada vez que el peso se estabiliza (±0,15 %/sem), la
  revisión propone +200 kcal en hidratos (01 `reverse`); tras un parón, dos mesetas y ya se puede definir (guía §10).
- **Hidratos alrededor del entreno**: los días de entreno, Tu día recomienda comer la mayor parte de los hidratos antes y
  después de entrenar (sin hora: la app no sabe a qué hora entrenas).
- **«Si la grasa no baja»** (definición, bajando más despacio de lo previsto) y **recarga de hidratos sin dieta** (semana 9
  o más y tu fuerza bajando: 2–3 días comiendo lo de mantenimiento, nunca uno — sugerido), como consejos de la revisión.
- **Base vegetal**: entre recetas que encajan parecido, primero las de más legumbre, verdura, fruta y semillas (hasta un
  15 % menos de error — sugerido).
- Fuera: los suplementos (no los quiere el usuario) y los perímetros en la revisión (llegan con Progreso).

## 2026-11-09 · El «efecto rebote» tras una definición no se aplica

La guía pide no priorizar ningún músculo al salir de una definición muy profunda (por debajo del ~10 % de grasa, «fase de
supervivencia»). El usuario decide no aplicarlo: MUTA no lleva a nadie por debajo del ~8 % de grasa, así que ese caso no
se da aquí. El entrenador sigue igual tras una definición.

## 2026-11-09 · Dudas de Nutrición resueltas y recarga de hidratos

Decidido por el usuario:

- **Dietas**: se crean en la app o se cargan de un archivo: el de MUTA (JSON) o un **CSV** con una fila por ingrediente
  (menú, comida, receta, ingrediente, gramos o gramos de entreno y descanso; valores por 100 g y «días» opcionales: lo
  que falte se busca en la base). El lector de CSV pasa a `shared/lib/csv.ts` (lo usan rutinas y dietas).
- **La consulta semanal se queda en Nutrición.** Hoy es solo para lo que hay que hacer hoy; lo semanal y lo mensual, en su
  pestaña (la propuesta de Hoy quita «Para ti»; como mucho, «Hoy toca tu consulta» ese día).
- **Lo cocinado aguanta 3–4 días en la nevera** (FoodSafety.gov/USDA, revisado en 2023; no hay tabla oficial de la AESAN
  y fuentes de consumo españolas dan ~2 días para arroz, pasta y legumbres). Al cocinar para más de 3 días, aviso de
  congelar esas raciones.
- **Velocidad de la definición**: lineal o por fases, como un entrenador real; desde la semana 9 (ya bastante definido)
  no se aprieta: como mucho −0,75 % por semana y, si hay que bajar, −100 kcal (sugerido).
- **Recarga de hidratos**: desde la semana 8 (segunda mitad), cuando tu rendimiento baja en varias sesiones (2 o más en 10
  días) tras venir estable o mejorando —una sola sesión mala no cuenta—; dura una vuelta completa de tu rutina (como
  mucho 14 días); se come lo de mantenimiento con todo lo de más en hidratos (como las pausas de dieta de 01, MATADOR);
  como mucho una cada 3 semanas. Se propone en Tu día y en la revisión («Empezar» / «Ahora no»: no vuelve en 7 días).
  Con el check diario de Hoy se sumará la energía.
- **Hidratos según el día**: se queda 10 · 15 · 20 %.

## 2026-11-09 · Los Word de docs/ no se suben

`docs/MUTA-instrucciones-periodicas.docx` (tu guía de prompts) y su temporal de Word se colaron en git en `723bfc1` al
añadir la carpeta `docs` entera. Salen del repositorio (se quedan en tu ordenador) y `.gitignore` ignora `docs/*.docx` y
`~$*`. Siguen en el historial de la rama `pantalla/recetas` en GitHub: quitarlos de ahí exige reescribir el historial
(pendiente de que el usuario lo decida).

## 2026-11-09 · Progreso, sin PNG previo

El usuario pide Progreso completo y cohesionado con el resto, **sin PNG antes** (excepción a la regla 9 solo para esta
pantalla). Se hace con lo que ya decían los documentos y las decisiones:

- **Lo que lleva**: tu peso (tendencia, gráfica de 4 semanas, 3 meses o todo, y tu ritmo frente al previsto de tu fase,
  como la revisión semanal), tus medidas (brazo, pecho, cintura y muslo: los perímetros de la guía G1 § 6, para no decidir
  solo con la báscula), la semana de comida que salió de Comida el 2026-11-05 (media de 7 días, proteína por días; ahora
  frente al objetivo de cada día, por los hidratos según el día), tus entrenos (esta semana frente a tu plan, racha y
  sesiones de 8 semanas) y tu fuerza (los básicos de la consulta y las marcas del último mes).
- **Estilo**: las tarjetas grises de «Tu objetivo» (título pequeño en mayúsculas, cifra, nota corta y cajitas blancas) y la
  cabecera en fila de Hoy y Entreno. Sin datos, cada tarjeta dice dónde empezar («Ir a Hoy», «Ir a Nutrición», «Ir a Entreno»).
- **Un dato, una fuente**: Progreso no calcula nada de otra área; Comida y Entreno lo dan por su `index.ts`
  (`comidaParaProgreso`, `entrenoParaProgreso`, en diferido). La gráfica del peso (`TrendChart`) y las barras (`Barras`)
  pasan a `shared/ui`, y `letraDia` a `shared/lib/format.ts`.
- **Una marca** cuenta si el mejor 1RM estimado de un ejercicio en los últimos 28 días supera al mejor de antes (sin RIR,
  como al comparar con la vez anterior); la primera vez no es marca.
- **Las medidas** van en `bodyLog` con el tipo `perimetros` (sin migración); la cintura suma la de la consulta y, el mismo día,
  manda la medida. Entre 15 y 250 cm.
- Fuera, por no estar en los documentos o ser de Hoy: el check diario (va en la propuesta de Hoy), fotos de progreso y
  series por músculo (ya están en Tu plan). _Sustituido el 2026-11-10: las fotos y las series por músculo entran (abajo)._

## 2026-11-10 · Progreso con todo lo del prototipo anterior

El usuario pide «las mismas funcionalidades que `Desktop/prueba` (el prototipo anterior) con el diseño de ahora», y
programarlo **directamente, sin propuesta** (otra excepción a la regla 9). Se hace con lo que dicen los documentos
(`docs/conocimiento/02-reglas.md` § 9 y `01-contenido.md` § 9) y el código del prototipo:

- **Tres pestañas** (Cuerpo · Comida · Entreno, con `ChoiceSegmented`): en una sola lista no cabía todo.
- **Cuerpo**: las siete medidas de «Medidas del mes» (se suman gemelo, cadera y cuello) con su mini-gráfica, su historial y
  cómo se toma cada una; «Medidas y fotos» cada 28 días (checklist mensual); **composición** con la fórmula de la Marina,
  calibración (±2 calibrada, ±3,5 sin calibrar, mínimo 3 %), masa magra, FFMI corregido a 1,80 m, objetivo de grasa
  (hombre 8·10·12·15 %, mujer 18·20·22·25 %: el prototipo los tenía cambiados; mandan los documentos) con el peso que
  tendrías y las semanas a tu ritmo, y su evolución; **fotos** (frente, perfil y espalda, en el almacén `photos`, reducidas
  a 1200 px y solo en el móvil; antes y ahora lado a lado o deslizando); **recuperación** con lo que ya apuntas en la
  consulta de Nutrición (sueño, energía, fatiga y ganas): no se pregunta dos veces, así que la «Revisión semanal» del
  prototipo no se repite aquí.
- **Entreno**: **mesociclos** como en el prototipo, guardados por Entreno en el almacén `mesocycles`. El primero se crea
  solo con tu rutina (desde tu primer entreno con ella); al cambiar de rutina (catálogo, CSV o «Volver a usar»), el que
  estaba en curso se cierra el día antes y empieza otro: no hace falta tocar `chooseRoutine`. Su objetivo es tu fase de
  Nutrición (no se elige aparte: un dato, una fuente). Detalle con Constancia, Músculos (con el rango de la ficha de cada
  músculo), Intensidad (solo el RIR apuntado; el fallo cuenta 0) y Rutina; renombrar, «Empezar otro mesociclo» con su
  balance y «Volver a usar esta rutina» (repone su `plans/current` tal cual). **Comparar** dos por semana. **Calendario**
  con la sigla de cada entreno y «Ver qué hice». **Récords** del básico de cada grupo (el que más repites, los compuestos
  primero, o el que elijas entre los que has hecho).
- Los textos que aconsejan van como «Se recomienda…» (regla de `docs/rediseno.md`); el balance del prototipo decía «semana de
  descarga» para los estancados: aquí, revisar la técnica y probar otra variante (la guía solo descarga si al final del
  mesociclo rindes peor).
- **Semanas de un mesociclo**: de lunes a domingo, de la de su inicio a la de hoy (así «Semana 5 de 5» y la tira coinciden).
- **Mandan los documentos** sobre el prototipo en el balance: el peso va acorde con definición entre −1,2 y −0,25 %/sem,
  volumen entre 0,1 y 0,8 %/mes y mantener ±0,3 %/sem (02-reglas § 8). **El progreso no se mide por cuántos ejercicios
  suben** (usuario, 2026-11-10; guía § 5: subir en el 100 % indica volumen bajo, mejor 10 series manteniendo 8–9 y
  mejorando 1–2 que 5 mejorando 4): fuera «buen bloque / poco progreso» (70 y 40 % del prototipo) y la lista de
  estancados. Ahora: 2+ ejercicios bajan → revisar sueño, estrés y comida antes de recortar (02-reglas § 5); suben casi
  todos (≥ 80 %, sugerido, el corte de «Tu entrenador») → subir el volumen si recuperas; suben algunos → punto dulce, no
  tocar; ninguno → revisar el RIR, el sueño y la comida. Al comparar dos mesociclos, «Ejercicios que suben» se cambia por
  «Series por semana» (crece quien acumula más volumen). Lo que solo dice el prototipo se marca en pantalla como
  **sugerido** (pendiente n.º 2 de TAREAS): los cortes de la constancia (85 y 60 %).
- **Progreso: lo que quedaba (usuario, 2026-11-11):** no se recupera elegir el básico de cada grupo (se borra
  `elegirBasico`); la caja de sesiones del mes lleva el % de constancia de ese mes (misma regla que la de la etapa; cada
  semana, en el mes de su jueves); las fotos del mes se pueden hacer con la cámara y la foto del mes pasado encima como guía
  (`getUserMedia`; una cámara del sistema no deja poner nada encima); lo estimado lo dice («Grasa estimada», tendencia, 1RM
  estimado).
- **Progreso: calendario y gráficas de Entreno (usuario, 2026-11-11):** fuera la lista de entrenos bajo el calendario; el
  calendario, una tarjeta como «Tu semana» (un círculo por día, el entrenado en negro con su sigla) que lleva a cada día; todas
  las gráficas de Progreso son la de Entreno (`SessionProgress` pasa a `shared/ui`; fuera las bandas de las etapas).
- **Progreso como el resto de MUTA (usuario, 2026-11-11; `Desktop/MUTA-Progreso-cohesion.png`):** fuera las tarjetas grises
  dentro de tarjetas, las etiquetas en mayúsculas y las cajas sueltas. El mes, como el día de Nutrición (`DayNav` pasa a
  `shared/ui`); títulos de sección como «Comidas»; listas planas como los ejercicios de Ver sesión, con la flecha naranja si
  sube; un día de entreno con la cabecera de Ver sesión y el color de su sesión (`SessionHero` y `sessionTone` pasan a
  `shared/ui`; Entreno da el `tono` de cada entreno); las medidas, otra vez lista (antes → ahora y el cambio); un
  ejercicio de Fuerza abre su hoja en vez de desplegarse.
- **Progreso: retoques (usuario, 2026-11-11; `Desktop/MUTA-Progreso-retoques.png`):** las cajas del mes, centradas; un día
  de entreno en su pantalla (`/progreso/dia/:fecha`) con cada serie frente a la vez anterior, en vez de debajo del calendario
  (puede ser largo); tus medidas en una tabla; «Ver tu cambio» del ancho de un móvil, parado al abrir, con la línea de tus
  meses y lo que cambiaste desde el primero; en Fuerza, tu **mejor serie** (kg × reps) frente a la de antes y cada día del
  mes con sus series (el 1RM, como dato pequeño). Entreno da con cada 1RM del día la serie que lo dio.
- **Progreso mes a mes (usuario, 2026-11-11; propuesta `Desktop/MUTA-Progreso-por-meses-2.png`; sustituye el carrusel de
  etapas y la página de cada mes):** un cliente mira su progreso por meses. Arriba, «‹ Noviembre 2026 ›» (cambia el mes de toda
  la pantalla, `?mes=`), «Etapa: … ›» (abre la hoja de la etapa: constancia, músculos, rutina con fotos, su comida, lo que te
  dio desde que empezó, renombrar, empezar otra o volver a usarla y comparar) y tres cajas frente al mes anterior (cuerpo,
  fuerza y sesiones). Debajo, **Días** (el calendario y, debajo, lo que hiciste el día elegido con cada ejercicio frente a la
  vez anterior), **Cuerpo** (frente, perfil y espalda: una foto partida por una línea que se desliza, la tira de meses para
  elegir con cuál comparar y «Ver tu cambio» a pantalla completa mes a mes con tu peso y tu cintura; tus medidas frente al mes
  anterior, cada una con su gráfica) y **Fuerza** (solo por grupos, cada ejercicio con su mejor 1RM del mes frente al
  anterior y «Récord»). Fuera «Tus récords» (cambiar el básico de un grupo): los récords salen en Fuerza.
- **El mes, desde el calendario (usuario, 2026-11-11; sustituido arriba):** las fotos y todas las medidas salen de Progreso y van a la página de
  cada mes (tocando el mes en el calendario), con tu fuerza por grupo de ese mes y tu comida. Tu fuerza va **solo por grupos
  musculares**: al abrir uno, sus ejercicios con sus básicos primero (en Pecho, el press inclinado). Progreso: carrusel, tu
  cuerpo (peso, cintura y grasa), tu fuerza por grupo, el calendario a la vista y tu comida.
- **Progreso más corto y por ejercicio (usuario, 2026-11-10):** cada sección es una tarjeta con lo principal a la vista y el
  detalle en filas «›» (fotos, composición, tus entrenos con constancia y calendario, músculos, rutina, récords). En tu
  entreno, la gráfica de cualquier ejercicio, buscándolo por grupo muscular, con tus básicos los primeros.
- **Progreso en una sola pantalla (usuario, 2026-11-10: «le falta cohesión»; sustituye la propuesta 4 de abajo):** un
  carrusel de etapas arriba (como las sesiones de Entreno: de la primera a la de ahora y, al final, «Desde que empezaste»)
  y, de la que se ve, siempre las mismas tres secciones: tu cuerpo (la lista al empezar → ahora elige la gráfica; fotos de
  antes y de ahora; la composición al mirar la grasa), tu entreno (fuerza, constancia, el calendario a la vista, músculos y
  rutina con sus fotos en hojas; récords en todo) y tu comida. Fuera la página aparte de una etapa y la de «Desde que
  empezaste»: eran lo mismo con otro marco. La etapa va en la ruta (`?etapa=`).
- **Progreso por etapas (usuario, 2026-11-10; propuesta 4, `Desktop/MUTA-Progreso-propuesta-4.png`; sustituye lo de abajo
  de Cuerpo, Tus meses y las pestañas):** una etapa es tu mesociclo (rutina, alimentación y objetivo). Progreso: la tarjeta
  negra con tu etapa (abre su página: tu cuerpo al empezar y ahora con sus fotos, tu entreno con tus básicos, entrenos,
  músculos y rutina, y tu comida de media), «Desde que empezaste» (abre peso, fuerza, grasa y medidas con el tiempo, con las
  etapas marcadas, y tus récords) y las etapas anteriores. Cada cosa sale una vez; sin pestañas ni tarjetas sueltas (tu
  fuerza, tus entrenos, tu semana de comida, tus medidas, tus meses y recuperación salen de Progreso). Cifras pequeñas, con
  la escala de `docs/rediseno.md`. La fuerza de una etapa: el 1RM de tus 3 básicos de su primera semana a la última. La
  comida de una etapa: la media de lo que apuntaste (la app no guarda el objetivo que tenías en cada etapa pasada).
- **Cuerpo, segunda vuelta (usuario, 2026-11-10, con capturas del prototipo):** lo que toca («Cada semana · Revisión» y «Cada
  mes · Medidas y fotos») pasa a **Hoy** (`HoyDeProgreso`, por el `index.ts` de Progreso); la gráfica de tu peso o una medida
  va **por etapas** (cada mesociclo, con su volumen o su definición, o todo) en lugar de 1 mes / 3 meses, siempre como
  gráfica y con sus cifras guardadas para siempre; Tus medidas, en una tabla plegable (última, cambio y total); la
  composición, en un círculo; fuera el **peso objetivo** (ya está el peso de tu objetivo de grasa); las medidas y las fotos
  se apuntan juntas una vez al mes y se ven en **Tus meses** y en la página de cada mes (`/progreso/mes/:mes`), con tu
  peso y tus mejores marcas en los compuestos del mes. El brazo se mide **contraído** (cambiado también en
  `docs/conocimiento/01-contenido.md`). «Medallas del cuerpo» no se hace: no está en el prototipo de `Desktop/prueba`.
- **Tu objetivo con una dieta** (usuario, 2026-11-10: «he cambiado las calorías y el plan no se actualiza»): con dieta, tu día y
  tus menús van con sus kcal. Al guardar tu objetivo se propone ajustarla («Ajustar mi dieta» / «Ahora no», con «Deshacer»;
  regla 10): un ajuste desde hoy como los de la consulta. Sin hidratos según el día se mueve igual toda la dieta (conserva el
  reparto de tu nutricionista) hasta que su media semanal llega a la tuya; con ellos, cada tipo de día a lo suyo.
- **Cambios del usuario (2026-11-10, tras verlo):** el calendario va solo dentro del mesociclo (con sus entrenos), fuera
  la pestaña Intensidad (y su cálculo), Rutina con cada sesión plegada y su foto a la izquierda, y la cabecera de Progreso
  como la de Entreno y Nutrición (barra fija al bajar). El calendario copia `pvCal` del prototipo.
- Comunes: `Sparkline` en `shared/ui`, `reducirImagen` en `shared/platform` (la usaban ya las fotos de sesión) y
  `useSheet().showWith()` para abrir una hoja con datos (`?hoja=medida&m=brazo`).
- No se lleva del prototipo: la ficha del músculo con medidor (ya está en Entreno), editar la rutina desde Progreso (ya está
  en Entreno), la «Revisión semanal» (está en la consulta de Nutrición) y las tarjetas para compartir un entreno (ya están en
  el resumen).
- **Tarjetas que flotan y una sola escala de letra (usuario, 2026-11-12, propuesta «tarjetas» aprobada con capturas de
  otra app):** se queda la forma, no sus colores ni su letra. Fondo gris muy claro (`--bg`) y tarjetas blancas
  (`--surface`) con sombra suave y radio 24: al cambiar los dos valores, lo que iba dentro de una tarjeta (cajitas,
  barras, controles) sale gris sobre blanco en toda la app. Escala cerrada de letra en `tokens.css` (ver
  [rediseno](rediseno.md)); los tokens antiguos son alias. Nutrición: el día con su fecha encima de la tarjeta, el anillo
  abierto por abajo con «kcal por comer», cada macro en una línea con su barra, «Llevas X de Y kcal.» y, dentro, «+ Añadir»
  (la comida que toca: la primera que queda o la de la hora) y «Cuadrar con recetas». Progreso: el mes fuera de la tarjeta
  y sus cifras en cajitas.
- **La sesión en curso, propuesta 6 (usuario, 2026-11-12, tras seis versiones en PNG):** un solo negro fuerte («Terminar»);
  arriba, ‹ y el tiempo a la izquierda, sin raya de progreso; la pauta en texto gris, sin píldoras; las series en casillas
  suaves con la vez anterior en gris claro que se cambia al escribir (`--label-3`), las cifras en letra de fila (no
  condensada: «menos agresivas»); la hecha, con ✓ o ★ negra en un círculo gris suave; el descanso, una tarjeta negra que
  flota con un anillo que se vacía. En el resumen, solo el fuego en naranja.
- **El descanso no se cambia en la ficha del ejercicio (usuario, 2026-11-13):** era el mismo dato que en Editar rutina y en
  la sesión (`descansosElegidos`), en tres sitios. La ficha solo lo enseña en su cabecera; se cambia en Editar rutina y,
  durante el entreno, en la sesión. Sustituye a la tarjeta «Descanso» del 2026-11-02.

## 2026-11-13 · Hoy: solo lo que te queda por hacer hoy

Propuesta 2 aprobada por el usuario (`Desktop/MUTA-Hoy-propuesta.png`; la 1 repetía Entreno y Nutrición): «la función debe
ser saber qué hacer hoy, que no sea repetitiva con las demás pantallas». Arriba, tu día en una tarjeta negra con un anillo
partido en tantas piezas como cosas, lo que queda en una frase y tu racha (fuego naranja); debajo, «Te queda» y «Hecho»
(tachado). Cada cosa lleva a su pantalla o abre su hoja y se tacha sola cuando la haces: pésate, ¿Cómo estás hoy?, el
entreno (con su foto y «Empezar»; si descansas, no sale), come (lo que te queda en una línea; hecha con todas las comidas
apuntadas), pasos (hecha al llegar a tu objetivo: el de tu dieta o 10.000, la regla), la compra y cocinar (con hora, de tu
menú; se marcan a mano), la consulta y las medidas del mes (solo el día que tocan; si no, «Próximo: …»). Se quitan las
tarjetas «Cada semana» y «Cada mes» y la del peso. ¿Cómo estás hoy? (sueño, energía, hambre, digestiones y estrés, tres
opciones cada una: los indicadores de la guía) se guarda y se ve en el día de Progreso; que el entrenador lo use será otro
paso, con su cuestionario de reglas. Cada área da sus cosas por un `paraHoy.ts` aparte de su `index.ts`: si fuera por el
`index.ts`, Comida (que importa el de Entreno) cargaría Entreno entero.

## 2026-11-13 · Hoy, segunda vuelta (usuario)

- La tarjeta: «Faltan N tareas» y el anillo **continuo** (se llena con lo hecho, sin piezas). «Come» pasa a «Nutrición».
  La cabecera, como las otras pestañas (`CompactBar` al bajar).
- **Volver a Hoy:** los enlaces de Hoy llevan `?de=hoy` (`desdeHoy`, `shared/lib/paths.ts`); con esa marca, la cabecera de
  la pestaña enseña «‹ Hoy», la barra de las pantallas de Nutrición vuelve a Hoy y salir de la sesión también. Si entras
  por otro sitio, no sale.
- **Medidas y fotos:** una vez al mes, el día que elige el cliente (1–28, en la hoja del mes; `diaMedidas`). Sin día, a las
  4 semanas de la última vez, como antes.
- **¿Cómo estás?:** cada pregunta como pregunta («¿Cuánto dormiste?») con respuestas que pegan con ella, del mismo ancho.
  Se guarda el número de la respuesta (0–2): cambiar las palabras no cambia lo guardado.
- Pasos: solo «Tu objetivo: N pasos» (el que eligió el cliente).

## 2026-11-13 · Tu semana, resuelta (piloto automático de compra y cocina)

Propuesta `Desktop/MUTA-Piloto-automatico-propuesta.png`, aprobada con cambios del usuario: la compra, el día que decida el
cliente; cocinar, en sus días de descanso, que cambian con cada rutina (o los días que elija); el modo cocina, una receta
cada vez; y todo lo demás como se propuso.

- **Dónde vive:** dentro de tu menú (`menu.piloto`), porque las tandas salen de sus platos; la despensa, aparte
  (`userContent/despensa`). Sustituye a «Recordatorios» como sitio del día de la compra (la hoja de avisos queda para qué
  avisar) y a ir plato a plato («Cuándo cocinarlo» sigue para cocinar algo aparte).
- **Qué días cocinas en tus descansos (sugerido):** lo mínimo que cuesta con una tanda = 1, cocinar un día de entreno = 0,8
  y cada día al congelador = 0,5 (lo cocinado aguanta 3 días en la nevera, decisión del 2026-11-09); si empatan, menos
  tandas. Con un solo descanso, una tanda a la semana y lo demás al congelador.
- **Lo pasado no cambia:** las tandas que ya pasaron quedan fijas al abrir la app; las que vienen siguen a tu regla, así
  se adaptan si cambias de rutina o te saltas un entreno.
- **Cada tanda cubre** las comidas en táper desde su hora hasta la siguiente tanda (horas de las comidas, las sugeridas del
  calendario). La compra pide lo de las tandas de esa semana y lo que se prepara al momento, menos tu despensa.
- **Todo es propuesta:** la semana se aplica con «Aplicar» (y se deshace); si no hiciste una tanda, Hoy propone pasarla a
  hoy («Aplicar» / «Ahora no»). La despensa es una estimación y se corrige a mano.
- **El modo cocina** sigue los pasos y los minutos de cada receta, una cada vez; no combina recetas a la vez (los
  documentos no lo dicen).

- **Cada comida, a su manera (usuario, 2026-11-13):** táper, táper con la proteína al momento (la tanda hace la base y la
  carne o el pescado se hace ese día, recién hecho) o al momento (cocinar varias veces al día), con excepción por plato.
  La proteína es el ingrediente que la receta da como macro principal proteína: no se inventa. De serie (sugerido):
  desayuno y merienda al momento; comida y cena en táper. La compra no cambia; la despensa gasta cada parte al cocinarla.
- **Cocinar aparte, de varios platos a la vez (usuario, 2026-11-13):** la hoja deja elegir cualquier comida de la semana
  (desayuno, comida, merienda o cena) de cualquier plato; lo que ya cocinas otra vez sale tachado. Se guarda un cocinado por
  plato a la misma hora y en Hoy salen juntos («Cocina salmón y pollo»).
- **Lo que cocinas, el día que lo cocinas (usuario, 2026-11-13):** «Cocinar aparte» enseña solo lo que has decidido
  cocinar ese día (la semana entera, al añadir); tu día de Nutrición, con ‹ ›, dice «Hoy cocinas» (tu tanda y lo de
  aparte) solo ese día.
- **Un solo «hecho» para cada cosa:** lo que completas en otra pantalla se tacha solo en Hoy y al revés. Hoy ya lo
  calculaba de su área (comer, tápers, tanda, compra, peso, pasos, entreno, medidas, consulta); cocinar aparte pasa a tener
  su «hecho» (`marcarCocinados`: en su hoja, en tu día de Nutrición o con el círculo de Hoy). Solo se marcan a mano en Hoy
  lo que no tiene otra pantalla («Saca del congelador»).
- **Cocinar, con la receta delante (usuario, 2026-11-13):** «Hoy cocinas» (tu día de Nutrición) lista tu tanda, lo de
  aparte y lo que cocinas al momento, cada plato con los días que comes de él; cada fila lleva a cocinarlo con sus pasos y su
  temporizador (lo de aparte usa el modo cocina de la tanda: `/comida/tanda/:fecha?aparte=HH:MM`); una comida de tu día
  tiene «Cocinar ahora». En «Cocinar aparte», el día viene puesto («Cambiar día» para otro).
- **Qué parte se hace ese día, en cada plato (usuario, 2026-11-13):** «Parte al momento» ya no es solo la carne: en cada
  plato de tu menú eliges qué ingredientes se hacen el mismo día (la verdura, el arroz, la carne…: `frescos`); sin elegir,
  la proteína. Tu menú dice cómo va cada plato («Comida · brócoli al momento»). Cualquier comida puede ir para varios
  días (tanda o cocinar aparte). El perfil de prueba cocina cada dos días con el desayuno al momento, el brócoli del pollo
  y el salmón de la cena recién hechos.
- **En Hoy, lo de la comida en una sola tarjeta (usuario, 2026-11-13):** cada comida, la compra, la tanda, cocinar aparte y
  «Saca del congelador» van dentro de la tarjeta de Nutrición (`TareaDeHoy.partes`), cada una con su círculo y tachada al
  hacerla; Nutrición queda hecha cuando lo están ella y todas sus partes. El anillo cuenta cada parte. Peso, pasos y la
  consulta siguen aparte.
- **Modo cocina sin temporizador y con los pasos justificados, como en un documento (usuario, 2026-11-13).**
- **En la receta, toda la letra del mismo tamaño** (los pasos, como los ingredientes). En Hoy, lo hecho en gris con su ✓, sin tachar.
- **Modo cocina sin «Pesa en crudo» (usuario, 2026-11-13):** empieza en la primera receta; cada una con su foto grande, sus ingredientes (en crudo lo que se cuece; lo que va al gusto, en una línea) y sus pasos numerados. La misma pieza en «Al momento».
- **Hoy y la receta, más bonitos (usuario, 2026-11-13):** la tarjeta de tu día en Hoy pasa a blanca, como tu día en Nutrición;
  la receta del modo cocina lleva su detalle en píldoras, los ingredientes en baldosas centradas (los gramos en negrita y su nombre, sin emoticonos) y los pasos
  como línea de tiempo; «Al momento» y el modo cocina ya no llevan tarjeta negra arriba (el modo cocina, una línea con la receta en la que vas y sus rayas); la foto, de borde a borde arriba de la receta, más cerca de la barra.
- **Sin «Hoy cocinas» en Nutrición (usuario, 2026-11-13):** lo que cocinas ya está en Hoy (dentro de Nutrición): tu día de
  Nutrición no lo repite.
- **Hoy, más limpio (usuario, 2026-11-14):** el entreno sale como las demás filas (su icono y «Empezar», sin foto de fondo); con el día completo, la tarjeta sigue igual con el anillo lleno, su ✓ en el centro y «Todo hecho por hoy».
- **Hoy y tus comidas, más sencillos (usuario, 2026-11-14):** en Hoy las filas no llevan botones (toda la fila lleva a su
  sitio) y Nutrición sale plegada (al tocarla, sus partes); tus comidas van en una sola fila, «Tus comidas de hoy», que abre
  una pantalla con un carrusel como el de tu rutina en Entreno: cada comida, su receta entera con su foto y «Hecho y
  apuntado» justo debajo; lo apuntado deja de salir y, con todas, la fila queda en gris. El modo cocina pasa sus recetas
  y tus tápers deslizando igual (sin «Siguiente receta»).
- **El arroz, siempre en crudo (usuario, 2026-11-14):** lo que se cuece sale en crudo, lo que va a la olla, con «≈ X g cocido» debajo. Si la base no tiene su pareja exacta en crudo (arroz basmati, jazmín…), se usa la de su familia (el arroz blanco crudo): por kcal da casi lo mismo (sugerido; `parejasEnCrudo`).
- **La despensa, sin pantalla (usuario, 2026-11-14):** «Tu despensa» y «Ya lo tienes en casa» sobraban: basta con tachar en
  la compra. La despensa sigue por dentro (entra lo que tachas, sale lo que cocinas) para que la compra siguiente no pida
  lo que te sobró.
- **La compra en Excel (usuario, 2026-11-14):** «Compartir la lista» da un .xlsx (título, secciones en franja oscura, casilla,
  cantidad y «≈ X g en crudo»), hecho sin librerías (shared/lib/excel.ts, un ZIP sin comprimir). Se comparte con el menú
  del móvil (WhatsApp, correo…); si el navegador no deja compartir ese archivo (Chrome en Android no comparte .xlsx), se
  descarga, y si falla, el texto de siempre. Sus secciones se pliegan al tocar su título.
- **Hoy abre la sesión (usuario, 2026-11-14):** el entreno de Hoy abre Ver sesión; su flecha y salir de la sesión vuelven a Hoy.
- **Editar rutina: tu semana con tu orden y sesiones tuyas (usuario, 2026-11-14):** Editar rutina pasa a tres hojas con el mismo patrón (lista en tarjeta, asa para mover, deslizar para quitar con «Deshacer», «‹» arriba). Tu semana es una sola lista de sesiones y descansos: el orden se guarda en `plans/current.ordenSemana` y la rotación lo sigue (al mover, la sesión que toca sigue tocando). El «+» añade un día de entrenamiento (una sesión tuya, vacía, en `plans/current.propias`; sus ejercicios, en `ediciones` como en cualquier otra) o de descanso. **Motivo:** el usuario pidió mover descansos y sesiones con el dedo y añadir días, y que las pantallas fueran más sencillas y cohesionadas. La duda de la propuesta (¿la sesión nueva vacía o copia de otra?) se resolvió con la propuesta tal cual: vacía. Solo se quitan las sesiones tuyas; las de la rutina se mueven y vuelven con «Volver a la rutina original».
- **Calentamiento (usuario, 2026-11-14, con cuestionario):** cambia la regla del prototipo. Un músculo que solo trabajó como secundario se calienta con la rampa normal cuando llega su ejercicio; todo básico (compuesto) lleva su rampa completa aunque su músculo ya calentara; un aislamiento de un músculo ya calentado, nada. Ver `02-reglas.md` § Calentamiento.
- **Nutrición en tres sitios (usuario, 2026-11-15):** fuera el «···» con seis baldosas. Tu día y, a la derecha del título, dos botones pequeños: «Semana» (menús, la compra, cocinar, pesar y repartir, recordatorios y el recetario) y «Objetivo» (cuánto comer, la revisión y Tu dieta). «Semana» va en negro el día que toca comprar o cocinar. **Motivo:** el usuario pidió menos tarjetas y las cosas unas dentro de otras; cada cosa vive donde se busca y lo urgente se ve sin entrar.
- **Tu semana, un menú cada vez (usuario, 2026-11-15):** fuera «Tu semana, resuelta», la fila de días y la hoja «Tus menús». Arriba, una barra blanca con lo que toca (la compra o cocinar) y «Cambiar»; en medio, un menú cada vez (A · B · C · +) con sus comidas en lista (foto, plato y kcal; deslizar quita, como antes), sus kcal y sus días L–D: tocar un día le pone ese menú, y tocar uno suyo lo pasa al siguiente menú, porque cada día lleva siempre uno. Abajo, Pesar, Recetario y Avisos. **Motivo:** el usuario pidió un diseño sencillo, intuitivo y bonito que hiciera lo mismo con menos piezas.
- **«Compra y cocina» en vez de «Tu semana, resuelta» (usuario, 2026-11-15):** la hoja del piloto pasa a cuatro tarjetas cortas. La hora va junto al título de cada una. En lugar de tres opciones por comida (táper, parte al momento, al momento) hay un interruptor «En táper» y, si está encendido, otro para «Lo fresco, al momento», que hace lo mismo con menos que leer. Las tandas sin tápers salen juntas en una línea, y las letras de los días son L M X J V S D (`LETRA_DIA`, una sola constante). **Motivo:** el usuario pidió un rediseño más intuitivo y sencillo de entender.
- **Compra y cocina, día a día (usuario, 2026-11-15; primera parte del rediseño):** la barra de Tu semana lleva a una pantalla con los siete días. Cada día dice qué pasa: compras, cocinas o comes lo que cocinaste otro día. Con «+» añades cocinar (abre «cocinar aparte» con ese día) o comprar (ese día de la semana, con «Deshacer»). Arriba, la propuesta de MUTA (Aplicar / Ahora no); abajo, «Cómo te organizas cada semana». Por debajo, los días de cocina automáticos y lo que cocinas aparte siguen siendo dos cosas, aunque ya se ven igual. Unirlos del todo (que cada día de cocina sea una lista de comidas que marcas) cambia el modelo y queda para la siguiente parte. La palabra «táper» se quita de los textos (ver la memoria de lenguaje).
- **Sin la pantalla «Compra y cocina, día a día» (usuario, 2026-11-16):** se quita el mismo día que se hizo, porque repetía lo que ya sale en Hoy («Te queda») y en Tu semana (la barra). La barra de Tu semana lleva a lo próximo y tiene «Organizar», que abre la hoja. En la hoja, «Cocinar algo aparte» deja a la vista lo de cocinar un plato para varios días. Sin nada organizado, la barra dice lo que propone MUTA, y se aplica desde la hoja. La sección de la hoja pasa a llamarse «¿Qué dejas hecho?» hasta que cada día de cocina sea su propia lista.
- **Cocinar, como las apps típicas (usuario, 2026-11-16):** en «¿Cuándo cocinas?» los siete días están siempre a la vista y se tocan, más un interruptor «Mis días de descanso» (cambian con la rutina). Sin ningún día marcado, no cocinas por adelantado. «Cocinar aparte» pasa a ser una hoja con el día en círculos (con su número), la hora junto al título, las comidas con su foto y un círculo para marcar, el total y, plegadas, las cantidades.
- **La verdura fresca, el mismo día (usuario, 2026-11-16):** «sobre todo aguacates y hortalizas». Sin elegir nada en el plato, lo que se hace el día que comes es la proteína y además la verdura que va cruda en el recetario (`VERDURA_FRESCA`: aguacate, tomate cherry, pepino, lechuga, hoja de roble, rúcula, rábanos, cebolleta y apio). Es sugerido: el tomate, la cebolla o el pimiento no entran porque en la mayoría de recetas van cocinados, y en cada plato se cambia.
- **Tus días de cocina, una sola idea (usuario, 2026-11-16):** fuera «Cocinar algo aparte» y «¿Qué dejas hecho?» de la hoja. La primera vez, una pregunta: «¿Cocinas para varios días?». Si respondes «No», no hay más que configurar. Después, los días de cocina y de compra, y en «Así queda» cada día de cocina se abre con «Cambiar» para marcar lo que dejas hecho. Por dentro, `Piloto.marcadas` guarda cada comida (`fecha|comida`) que marcas o desmarcas y manda sobre lo de serie. Las tandas siguen calculándose igual, así que el modo cocina, la compra y Hoy no cambian. Cada tanda trae ahora sus `candidatos`, las comidas que podrías dejar hechas. De serie, al responder «Sí», la comida y la cena llevan la carne, el pescado y la verdura fresca el mismo día; se cambia con la etiqueta de cada plato. Lo que se cocinaba aparte desde la hoja de un plato sigue guardándose, pero ya no hay entrada en la hoja de compra y cocina.
- **El naranja, solo para logros (usuario, 2026-11-16):** la app sigue en blanco y negro, y el negro es el color de las acciones (botones principales, «+», «Hecho», lo elegido). El naranja ya tiene su sitio, las rachas y las mejoras, y se usa solo para logros: día completado, récord y racha. **Motivo:** cuando aparece, significa «lo has conseguido», y eso tiene más fuerza que pintar todos los botones. Además, así Nutrición no se separa del resto de la app.
- **Bienvenida unida, entreno y nutrición (usuario, 2026-11-17):** son 4 pasos con la estética del rediseño de Nutrición: barras de progreso arriba (`shared/ui/Pasos`), título grande y tarjetas. Los pasos 1 y 2 son los de siempre (objetivo; nivel y días). Los pasos 3 y 4 los pone Nutrición: tus datos y «Tu objetivo, listo», con las kcal, el reparto y, si es definición, el ritmo. «Ahora no, solo entreno» salta a elegir rutina y la comida se calcula luego desde su pestaña, como antes. La bienvenida mantiene la foto y su lema, ahora centrado. Los pasos de comida viven en Nutrición, con su propia ruta (`/bienvenida/comida/:paso`), y no se tocan las tripas de Perfil.
- **«Elige tu rutina» con el estilo de la bienvenida (usuario, 2026-11-17):** la recomendada va en una tarjeta blanca, con su tarjeta de foto, sus datos debajo y un botón negro «Ver esta rutina». Los rótulos («Para ti», «O elige otro tipo») van pequeños, en mayúsculas y en gris, como en los pasos.
- **Hoy de Nutrición (usuario, 2026-11-17):** se queda el carrusel de días, con un «+» y un tick en cada comida; lo que tomas de más, como un café, se apunta con el «+» de esa comida. Fuera «Ahora toca», el agua y el «+» flotante. El día que cocinas sale encima de tus comidas la tarjeta «Hoy cocinas», con las fotos, la hora, las raciones y «Cocinar», porque no es lo mismo lo que apuntas que lo que cocinas. Arriba van «Semana · Compra · Objetivo», sin el perfil, porque no cabe. El día completado lleva el anillo en negro y solo el tick en naranja (pendiente de programar).

## 2026-11-17 · Nutrición, como el Word del rediseño

El usuario pide todas las pantallas de Nutrición como el Word (`Desktop/MUTA-Nutricion-Rediseno/word`), menos el agua, con el naranja solo para logros. Se mantienen sus elecciones: las pastillas Semana · Compra · Objetivo (con el aspecto del botón «Objetivo» del Word) en vez de pestañas, y el carrusel de días en Hoy. La despensa pasa a tener pantalla («En casa», sustituye a la decisión del 2026-11-14). Foto y voz al apuntar no se hacen: necesitan IA.

- **2026-11-17 · Algo más en el menú y cómo comes.** Cada comida de un menú lleva, además de su plato, lo que quieras (otro plato, una fruta, un café…) y el plato se ajusta a lo que queda; en vez de más comidas o porcentajes, una pregunta: «¿Cómo sueles comer?» (repartido 25/35/15/25; desayuno fuerte 35/30/10/25; comida fuerte 20/45/10/25; cena fuerte 20/30/15/35 %: sugerido, ningún documento lo fija). Motivo: el usuario lo pidió «mucho más sencillo».

- **2026-11-17 · Organizar la semana como una dieta.** Para seguir planes como «Días 1 y 2: menú A; cocinar el día 1» sin pensar: cada menú dura 1–3 días seguidos, se puede cocinar «al empezar cada menú» (cada tanda cubre los días de su menú; con hora de tarde, la víspera; nunca más de 3 días sin cocinar) y comprar «el día que cocino» (cada compra llega hasta la siguiente). Todo con desplegables en una sola tarjeta y una vista previa antes de aplicar. Motivo: el usuario pidió el sistema más sencillo para cumplir su dieta (PDF «Plan de dieta · Fase 1»).

- **2026-11-17 · Cualquier dieta, exacta, y cocinar «cuántas veces a la semana».** Los menús dejan de ir por semanas de lunes a domingo: van en un ciclo de cualquier largo (A A B B C C se repite sin descuadrarse). El CSV de una dieta lo dice todo (días de cada menú, días de cocinar, lo de todos los días, solo entreno o descanso, gramos de entreno y de descanso, totales o por 100 g, pasos) y pasa a tus menús con los gramos de la receta. Organizar pregunta una sola cosa: «¿Cuántas veces a la semana cocinas?» (o «Como dice tu dieta»), coloca los días (pesos sugeridos en `diasDeCocina.ts`) y se corrige tocando el calendario. Motivo: el usuario pidió «un diseño que se adapte a todas las posibilidades y sea sencillo».

- **2026-11-18 · Sin congelador.** Decisión del usuario («lo del congelador quítalo, decisión mía»): MUTA no congela ni descongela nada. Lo cocinado aguanta 3 días en la nevera (`DIAS_NEVERA`); lo que caería más tarde no entra en la tanda y se hace al momento ese día (`pasanDeLaNevera`). Fuera `Tanda.congelar`, «Saca del congelador» en Hoy, sus avisos y su icono; al colocar los días de cocina, cada día que pasa de 3 cuesta lo mismo que antes, pero ahora como «al momento». Sustituye a lo del congelador de las decisiones del 2026-11-09 y 2026-11-13.

- **2026-11-18 · Plan, una pantalla con dos miradas, y un solo botón arriba.** Tu semana pasa a ser **Plan** («Qué comes» y «Cuándo cocinas»); arriba de Nutrición solo queda «Plan» (cocinar y la compra salen cuando tocan; tu objetivo, desde tu día). Para crear cualquier dieta a mano: el ciclo dura lo que quieras (hasta 28 días) o va según el entreno, cada comida lleva nombre, hora y qué días va, y puede ir igual en todos los menús; un día puede llevar otro menú, otro tipo o ser libre. Para decidir qué cocinas de cada plato: con antelación o al momento, ingrediente a ingrediente. Las comidas siguen siendo cuatro huecos (desayuno, comida, merienda y cena) con el nombre y la hora que quieras, y dentro de cada una todo lo que quieras. Motivo: el usuario pidió «el diseño más sencillo, inteligente y estético» para crear cualquier dieta y personalizar cuándo y qué cocina (diseño aprobado: «vale, programa todo»).

- **2026-11-19 · Tu gasto se aprende de tus datos, y tu actividad incluye trabajo y otros deportes.** Lo que ya decía 02-reglas («Gasto = basal × factor, hasta aprender el real»; «nuevo gasto = 0,6 × anterior + 0,4 × observado») se aplica: una vez por semana, con 8 pesajes y 8 días de comida en 14, MUTA guarda lo aprendido (`aprenderDeTusDatos`, `Ajustes.gastoAprendido`) y desde entonces manda sobre la fórmula; sigue al metabolismo cuando cambia. No cambia lo que comes: tu objetivo cambia cuando lo aplicas (revisión semanal o nueva fase). Para la primera estimación, como otras apps (vida diaria aparte del ejercicio), «Tu actividad» va lo primero en Cambiar objetivo: trabajo (sentado, de pie +0,05, físico +0,15 al factor: **sugerido**, ningún documento lo fija) y otros deportes (MET × kg × horas ÷ 7, de 02-reglas «Cardio»; MET 4 · 6 · 8 por intensidad: **sugerido**). Motivo: el usuario pidió que la app aprenda de cada cliente y que la actividad no se quede en los pasos.

- **2026-11-20 · Mejora en verde, récord en naranja.** Decisión del usuario. Lo que mejora frente a la vez anterior va en verde (`--improve`) en toda la app, y solo la cifra lleva color, no la frase. El naranja (`--streak`) queda para tres logros: la racha, el día completado y un **récord** (tu mejor 1RM estimado de siempre en un ejercicio; sin peso, tus repeticiones; más de un 1 % por encima, como «Récord» en Progreso). Un récord solo va en naranja el día que se consigue: en la serie de la sesión, con el aviso «Récord en …», en el resumen («N récords hoy») y en Hoy. En la ficha del ejercicio («Tu récord») y en Progreso queda en negro. Hay un solo naranja por pantalla: el día con récord, la racha va sin color. La primera vez que haces un ejercicio no hay récord, porque no hay con qué compararlo (`domain/records.ts`). Quitados los naranjas que no eran logros: las propuestas de Hoy, el calentamiento y el punto de tu plan en la ficha del músculo.

- **2026-11-21 · Sin despensa.** Decisión del usuario («la despensa bórrala para siempre»). La app ya no estima lo que tienes en casa: la compra es todo lo de tus menús y lo que ya tengas lo tachas. Fuera `domain/pantry.ts`, `use-cases/pantry.ts`, el filtro «Con lo que tengo» de las recetas y «Lo tienes todo en casa» al cambiar un plato; al cargar se borra `userContent/despensa`. Sustituye a lo que decían de la despensa las notas del 2026-11-13 y 2026-11-14.

- **2026-11-21 · Una sola forma de decidir qué dejas hecho.** Decisión del usuario: había tres capas que decidían lo mismo (la comida en «Cómo cocinas», cada plato en «Cómo se cocina» y cada día de cocina con «Cambiar»), y la de más abajo pisaba a la otra sin que se viera. Queda solo «Cómo cocinas» → «¿Qué dejas hecho?», por comida. Fuera la pestaña de la receta (`plato/ComoSeCocina`) y las marcas por día (`Piloto.marcadas`: lo guardado de antes se ignora). `porPlato` solo lo pone una dieta cargada (su columna «Preparar»).

- **2026-11-22 · La recarga de hidratos, solo los días que entrenas.** Decisión del usuario. La recarga dura una vuelta de tu rutina contada con las sesiones que haces de verdad (`Recarga.sesiones`, `recargaEfectiva`; como mucho 14 días). Los días de entreno: mantenimiento (lo que gastas de verdad o, sin aprenderlo, la fórmula) con todo lo de más en hidratos; los de descanso, y los que no entrenas, tus kcal de definición. Se propone por rendimiento o por cómo estás (2 semanas con señales) y se puede empezar a mano en «Cambiar objetivo» (solo en definición). «Empezar / Ahora no», «Terminar» y «Deshacer». Al acabar, la definición sigue igual: la revisión semanal no propone nada durante la recarga ni las 2 semanas siguientes, y lo que gastas no se aprende con esos días (el agua de los hidratos lo falsearía; sugerido, los documentos no dan cifra). En Progreso, una «R» en los días de recarga.

- **2026-11-22 · La revisión semanal, como un entrenador.** Decisión del usuario (cuestionario 1–16 y 19, todo «A»; sin fotos ni analíticas: «no es capaz de analizar fotos»; con tus perímetros). Además del peso: una semana sola fuera no basta (regla 7); en definición, lento pero con la cintura −0,5 cm o más, nada (regla 5); con 2 señales de cómo estás (sueño, energía, hambre, estrés, de ¿Cómo estás hoy?), no se aprieta y da consejos (§ 5 y regla 8); fines de semana de más, no se baja; comer menos del 75 % de lo que gastas, no se baja más (§ 5); más del 1,2 % por semana, +150 (§ 5; entre tu margen y eso, vas bien); fuerza −3 % en tus básicos, +150 en hidratos (regla 4); fase final en la semana 9 o a 3 puntos de tu grasa objetivo (regla 6); al llegar a tu objetivo, propone salir de la definición; 3 semanas con señales y lento, una pausa en mantenimiento (la guía, § 7; las 3 semanas, sugerido); te dice cuántas semanas te quedan; y al empezar otra definición, cómo fue la anterior. Consejos: proteína bajo 1,4 g/kg, digestiones, brazos y muslos. Lo de tu cuerpo lo da Progreso (`cuerpoParaComida`); las reglas, en `domain/senales.ts` y `domain/review.ts`; lo calculado, en `state/entrenador.ts`.

- **2026-11-23 · Comida rápida de cadenas, aproximada.** Decisión del usuario («para el día libre… con los nombres reales»; fuentes por orden: Open Food Facts, BEDCA/USDA para lo genérico y, si no, FatSecret España marcado «aproximado»). Lo genérico (kebab, pizza, hamburguesas…) ya estaba en `foods.json` («Comida rápida»). Los productos de cada cadena (McDonald's, Burger King, KFC, Telepizza, Domino's, Taco Bell, Five Guys) van en `foods-rapida.json`, generado por `scripts/foods-rapida.cjs` desde `private/rapida/fatsecret.json` (fuera de git): con su peso, por 100 g; sin él, por ración (`porRacion`: solo se apunta en raciones). Al apuntarlos se dice «Cifras aproximadas (FatSecret España)». Las webs oficiales de las cadenas no dejaron leer sus tablas.

- **2026-11-23 · El entrenador de Entreno, igual de potente que el nutricionista y en equipo con él.** Decisión del usuario
  (cuestionario de 13 puntos, «libre elección», todo «A»; propuesta `MUTA-Entrenador-propuesta.png`; «que hagan equipo»).
  Antes de mirar músculo a músculo, manda la semana, en este orden (`domain/coach/semana.ts`): vuelves de un parón (14
  días o más sin entrenar, sugerido) → una serie menos por músculo, con «Deshacer», y Nutrición propone mantenimiento con
  sus dos mesetas (guía § 10); sin el RIR apuntado en la mitad de las series (sugerido) no se lee la semana; RIR 2 o más
  por encima de la pauta → acércate antes de cambiar series; durante la recarga y la semana siguiente no se lee el
  rendimiento; al final de la definición con la fuerza bajando, la recarga y no quitar series; con señales de cómo estás
  (las mismas reglas que el nutricionista), esa semana no se sube. Por músculo (`revision.ts`): por debajo de tu rango →
  +1 sin esperar 3 semanas; por encima y yendo peor → −1 a la primera; en definición solo se sube en Prioridad; con tus kcal
  recién cambiadas, una semana sin quitar series; «revisa la comida» pasa a decir qué falla, con su cifra
  (`comidaParaEntreno`: proteína, ritmo o déficit). Además: «no toques lo que funciona», las sesiones que faltan, comprobar
  tu RIR cada 4 vueltas y el aviso de técnicas de intensidad en definición. Nutrición, a su vez, no sube kcal en volumen
  los 10 días después de que el entrenador te suba series, y su revisión enseña tu fuerza («bajas de peso y mantienes tus
  marcas: vas bien»). La constancia no para las propuestas (quien entrena menos días también progresa): se dice.
  Los dos informes usan el mismo componente (`shared/ui/Informe`).

- **2026-11-23 · Lo que quedaba de los documentos para los dos entrenadores.** Pedido del usuario («indistinguible de dos
  expertos reales, sin inventar nada»). Volumen: antes de subir kcal, los hidratos alrededor del entreno y, sin
  «Hidratos según el día», más hidratos los días de entreno (guía § 6 y § 13). Vuelta de un parón: actividad
  moderada-alta, más los días de descanso (guía § 10). Entreno: con el RIR de media 1,5 o más por debajo de la pauta,
  «vas más al fallo de lo que toca» (guía § 3; 02-reglas § 5). Las señales de dolor articular y motivación de 02-reglas
  § 5 no se usan: «¿Cómo estás hoy?» no las pregunta (añadirlas sería una pregunta nueva, a decidir). Todos los casos y
  sus respuestas, en `Desktop/MUTA-Entrenadores-casos.docx`.

- **2026-11-23 · Problemas con el tiempo de uso (MUTA para años).** Revisión pedida por el usuario («cómo funcionarían las
  pantallas durante mucho tiempo»), con un perfil de prueba de 3 años: todo en
  [problemas-con-el-tiempo.md](problemas-con-el-tiempo.md), con opciones para cada uno. Hechos: guardar un día no leído
  conserva lo que tenía; al volver a la app otro día, Nutrición se recarga con hoy; Progreso lee toda tu comida; la racha
  de días redondos no tiene tope; más de 30 min sin apuntar ninguna serie (sugerido) no cuenta como entreno y una sesión
  de otro día pregunta al entrar; un ejercicio se reconoce por su ejercicio de la biblioteca (la vez anterior y el motor,
  primero por su nombre exacto: una serie top no toma la de descarga) y la gráfica de una sesión va por rutina.
- **2026-11-23 · Terminar la rutina y comparar tus vueltas.** Decisión del usuario (opción A; PNG
  `Desktop/MUTA-Fin-de-rutina-propuesta.png`, sin pantalla nueva). Las rutinas con semanas contadas (las del catálogo)
  dicen «Terminaste tu rutina» al hacer la última sesión de su última semana, en el resumen y en Tu plan, con «Repetirla»
  (una etapa nueva, «… · vuelta 2»), «Cambiar de rutina» y «Ahora no». Las de una semana que se repite (MUTA y CSV) no
  terminan nunca. Solo se comparan etapas de la misma rutina («no tiene sentido comparar dos rutinas distintas»), a la
  misma semana (semana 4 con semana 4), sesión con sesión y ejercicio con ejercicio; de serie, con la última de la misma
  rutina y el mismo objetivo (volumen con volumen). Se llega desde la hoja de la etapa («Frente a «…» ›»). Un CSV que se
  llama igual o lleva los mismos ejercicios que una rutina tuya pregunta «¿Es tu rutina de antes?» («preguntar en la
  duda»). No se propone descarga al acabar: solo si la rutina la pauta (decisión 2026-11-02).

- **2026-11-24 · Copia de seguridad en un archivo, recordada cada mes; fuera «Tu material».** Decisión del usuario (opción
  A del problema 10; PNG `Desktop/MUTA-Copia-de-seguridad-propuesta.png`, simplificado: «¿qué es lo realmente útil?»).
  Perfil es tu copia: «Guardar copia» (un `.json` con todo, también las fotos, por el menú de compartir: iCloud, Drive,
  WhatsApp…) y «Recuperar una copia» (enseña qué trae; lo de ahora se guarda aparte y se sustituye). El recordatorio es un cuadro al
  abrir la app, una vez al mes («que al iniciar la aplicación te salga un cuadro»; sin ninguna, a la semana de empezar;
  «Ahora no», un mes; ni en la bienvenida ni en una sesión). Si una pantalla no carga, la app se recarga sola una vez y,
  si sigue, lo dice con el detalle (antes se quedaba quieta: «no se abre el perfil»). «Recuperar una copia» también en la pantalla de
  error, «por si falla la aplicación». Sin servidor ni cuentas: la copia automática en Google Drive, cuando la app esté
  publicada. «Tu material» se quita (usuario: «borrarlo»): poco útil en un gimnasio completo; los discos del gimnasio
  siguen en la calculadora de discos.

- **2026-11-24 · Tu logro y tu premio, para Instagram.** Decisión del usuario («que esté muy chulo y que te den ganas de
  subirlo a Instagram»; «las dos cosas sí»; PNG `Desktop/MUTA-Logro-Instagram-propuesta.png` y
  `Desktop/MUTA-Premio-objetivo-propuesta.png`). El **logro**, al acabar una etapa y cada 6 meses de la que llevas, con la foto de
  una de tus sesiones; el **premio**, solo al cumplir tu objetivo («como premio»): en definición, tu grasa objetivo; en volumen,
  un peso objetivo nuevo en «Tu composición» (02-reglas § 8 ya usa un peso objetivo). Cifras de lo que la app mide (02-reglas § 9:
  grasa de la Marina, masa magra, FFMI; perímetros), distintas en definición y volumen; lo estimado lo dice. Tus fotos del cuerpo
  solo salen si las eliges. Imagen 1080 × 1920 en la letra de MUTA (sin la estrecha), cifras centradas; naranja solo en lo que es
  logro. Sale solo, uno cada vez; lo de antes de la función no se celebra de golpe. «6 meses» y el «ejercicio estrella» (3 veces o
  más), sugeridos.
