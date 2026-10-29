# Decisiones técnicas

Registro corto con fecha y motivo. Las diez decisiones de arquitectura están en [docs/adr/](adr/README.md)
(plataforma, interfaz, estructura, lógica, estado, datos, contenido, diseño, calidad, actualizaciones).
Si una decisión cambia, se añade una línea nueva que la sustituye; no se borra la vieja.

| Fecha      | Decisión                                                                                                             | Motivo                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 2026-10-27 | Las rutinas de terceros viven solo en `private/` (fuera de git) y la app sale sin ellas en la CI                     | Son documentos con derechos de otras personas; el repositorio es público                          |
| 2026-10-28 | Los 10 tipos de entrenamiento son las carpetas del programa original, más MUTA                                       | Que la clasificación sea la del original, no una opinión                                          |
| 2026-10-28 | Las rutinas se enseñan y empiezan **tal cual**: sin «Adaptar a mí» ni selector de nivel                              | Fidelidad al diseño de cada programa; el ajuste de volumen queda para el coach (`adaptVolume.ts`) |
| 2026-10-28 | Esfuerzo en **RIR**, no RPE (RIR = 10 − RPE)                                                                         | Más fácil de entender entre series                                                                |
| 2026-10-28 | Los nombres de los ejercicios se muestran en español (traducción propia) y se guarda el original en `originalName`   | Interfaz en español sin perder la referencia al documento                                         |
| 2026-10-28 | Datos medidos (volumen, reparto, minutos, nivel) por cálculo, no escritos a mano                                     | Una sola función por dato; evita incoherencias                                                    |
| 2026-10-28 | Nada es obligatorio al elegir; lo opcional queda a elección del usuario                                              | Pedido explícito                                                                                  |
| 2026-10-28 | Regla de tiempo de MUTA (75 min): quitar el último opcional no prioritario y, si no, −1 serie; se puede quitar       | Del documento de conocimiento; opcional para el usuario                                           |
| 2026-10-28 | Las opciones se eligen en la propia fila, en gris más oscuro con flecha; la hoja «Antes de empezar» se elimina       | Más simple y visible; ver [ADR 11](adr/0011-opciones-dentro-de-la-rutina.md)                      |
| 2026-10-28 | Los ejercicios normales no se sustituyen; solo lo opcional de MUTA y los puntos débiles (con la lista del documento) | El documento dice que el generador elige solo la primera opción disponible                        |
| 2026-10-28 | Las indicaciones del documento (superserie, «entre series de…») salen como **texto**, sin reordenar ni enlazar       | Reglas de reordenado, para el editor de rutina                                                    |
| 2026-10-28 | El descanso entre series no se enseña en las filas                                                                   | Pedido explícito; los días de descanso sí                                                         |
| 2026-10-29 | Descanso en todas las rutinas: el del archivo; si no, `restRules`; si no hay, obligatorio tras la vuelta completa    | Pedido explícito; solo «sugerido»/«opcional» donde el documento lo dice                           |
| 2026-10-29 | Semanas distintas → plegables; iguales → etiquetas                                                                   | Menos ruido cuando todas las semanas son iguales                                                  |
| 2026-10-29 | Tipos de un programa en `domain/program.ts` (único sitio) y sin `as never`                                           | Evitar copias que se desincronizan; ver [ADR 11](adr/0011-opciones-dentro-de-la-rutina.md)        |
| 2026-10-29 | La pantalla de la rutina solo pinta: `slotPanel` y `startRoutine` son casos de uso                                   | Regla del documento de rediseño                                                                   |
| 2026-10-29 | Contenido (reglas de descanso, indicaciones) en el JSON del programa, no en el código                                | Decisión 7: contenido versionado y separado                                                       |
| 2026-10-29 | `.gitattributes` con LF fijo                                                                                         | Evitar avisos y diferencias LF/CRLF en Windows                                                    |
| 2026-10-29 | Axe en los e2e, `size-limit` (entrada ≤ 50 kB), Lighthouse CI (≥ 90) y `npm run guardas`                             | Calidad del documento de rediseño; valores de partida                                             |
| 2026-10-29 | Trabajo por ramas (`refactor/…`, `pantalla/…`)                                                                       | Documento de rediseño: una rama por cambio                                                        |
