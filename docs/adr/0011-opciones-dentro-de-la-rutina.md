# 11. Opciones dentro de la rutina, descansos y una sola fuente para los tipos

Fecha: 2026-10-29 · Estado: aceptada

## Contexto

Algunas rutinas dejan elegir (ejercicios opcionales de MUTA, huecos de «punto débil»), el documento original dice
dónde caen los descansos, y el estudio de buenas prácticas del 2026-10-29 encontró que los tipos de un programa
estaban copiados en 7 archivos y que la pantalla de la rutina construía ella misma las elecciones.

## Decisión

1. **Las opciones se eligen en la propia fila**, no en una hoja previa: la fila que se puede cambiar sale en gris más
   oscuro con una flecha y se despliega. Solo salen los cambios que el documento permite (la lista de opcionales de
   MUTA, las tablas de punto débil); los ejercicios normales no se sustituyen (el generador elige solo).
2. **Nada es obligatorio** y las reglas del documento no se aplican solas salvo las que ya estaban (hombro anterior
   solo si es prioridad; límite de tiempo, que se puede quitar). Reordenar o enlazar superseries queda para el editor
   de rutina; ahora solo hay **indicaciones** (`tip`) con las palabras del documento.
3. **Descansos**: cada programa lleva `restRules` y `restInfo` en su JSON. Si el archivo trae descansos, se respetan;
   si no, se ponen donde diga la regla o, sin regla, al acabar la vuelta completa al cuerpo, como descanso obligatorio.
   Solo es «sugerido» u «opcional» donde el documento lo dice.
4. **Un dato, una fuente**: los tipos `Exercise`, `Day`, `Week`, `Block` y `ProgramData` están solo en
   `domain/program.ts`. Las pantallas no construyen modelos: los casos de uso `slotPanel` y `startRoutine` lo hacen.
5. **Comprobaciones nuevas**: axe en los e2e, `size-limit` (entrada ≤ 50 kB comprimida), Lighthouse CI (rendimiento y
   accesibilidad ≥ 90) y `npm run guardas` (duplicados de tipos, documentación, datos privados).

## Alternativas descartadas

- Hoja «Antes de empezar» con prioridades y minutos: se descartó por complicar el inicio; las elecciones van en la rutina.
- Reglas de reordenado automático: dependen de prioridades que ya no se piden; se aplazan al editor.
- Reglas de descanso en el código: el contenido va en JSON (decisión 7).

## Consecuencias

- Subir la `rev` de `private/programs/_meta.json` cada vez que cambie un programa local.
- Una rutina nueva con descansos propios solo necesita `restRules` en su JSON.
- Los valores de tamaño y Lighthouse son de partida: se ajustan con mediciones y siempre se anota el cambio.
