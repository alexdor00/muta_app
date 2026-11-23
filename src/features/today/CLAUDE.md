# Hoy (`src/features/today`)

La pestaña de inicio responde a una sola pregunta: **¿qué me queda por hacer hoy?** (propuesta 2, aprobada el
2026-11-13, `Desktop/MUTA-Hoy-propuesta.png`; ver [decisiones](../../../docs/decisiones.md)). No repite Entreno ni Nutrición:
cada cosa es una fila que lleva a su pantalla o abre su hoja.

- `screens/hoy/HoyScreen.tsx` — junta lo que dan las áreas por su `paraHoy.ts` (su API para Hoy, aparte del `index.ts`) (`useHoyDeEntreno`, `useHoyDeComida`,
  `useHoyDeProgreso`: cada uno sus `TareaDeHoy` y sus hojas) y pinta `TuDia` (tarjeta blanca, como tu día en Nutrición: el anillo continuo que se
  llena con lo hecho, «Faltan N tareas», lo que queda en una frase y la racha), «Te queda», «Mañana» (con el día completo), «Hecho» y «Próximo: …» (abre la hoja del mes). La cabecera, como las demás
  pestañas: el título grande y, al bajar, `CompactBar`. Sus enlaces llevan `?de=hoy` (`desdeHoy`): la pantalla a la que
  llegas enseña «‹ Hoy» (`ScreenHeader`, la `Barra` de Nutrición y salir de la sesión).
- `components/` — `Tareas`: filas sin botones (toda la fila lleva a su sitio); una con `partes` (Nutrición) sale plegada y se despliega al tocarla; una hecha con `alTerminar` (tus comidas de hoy, cocinar) no abre su pantalla: despliega su frase. `Propuestas` (lo que te propone un área para hoy, con «Aplicar» / «Ahora no»: pasar a hoy la tanda que
  no hiciste), `RecordsHoy` (el día de un récord, «N récords hoy» con el trofeo naranja, que lleva a ese día en Progreso; la racha de `TuDia` va entonces sin color, un solo naranja por pantalla; usuario, 2026-11-20), `TuDia` y `Tareas` (una lista; el entreno, con su foto; lo que se marca a mano, con el círculo como botón).
- `domain/dia.ts` — `repartir` (ordenar por el día y separar lo hecho, con lo marcado a mano; una tarjeta con `partes` —Nutrición: cada comida, la compra, cocinar…— queda hasta que todas están hechas), `cuenta` (el anillo, con las partes) y `fraseQueda`.
- `state/marcadas.ts` y `use-cases/marcadas.ts` — lo que solo se marca en Hoy (lo que no tiene otra pantalla); lo demás lo da hecho su área, así que completarlo en cualquier pantalla lo tacha aquí, en `userContent/hoy-marcadas`
  (los últimos 7 días). Es lo único que guarda Hoy.

El tipo `TareaDeHoy` (con `alMarcar`: el círculo hace algo de su área, como apuntar tu táper), `PropuestaDeHoy` y su orden (`ORDEN_TAREA`, `ordenDeHora`) viven en `shared/lib/tareaDeHoy.ts`: lo usan las áreas que
dan cosas a Hoy. Hoy no calcula nada de ellas. Capas y límites, los de [Entreno](../training/CLAUDE.md).
