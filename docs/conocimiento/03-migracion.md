# Parte III · Cómo llevarlo a la app nueva

## Método
1. **Extraer automáticamente, no copiar a mano**: script que lee la app actual (`C:\Users\alexa\Desktop\prueba`) y genera `src/shared/content/*.json`.
2. **Renombrar campos** a inglés una sola vez (tabla abajo).
3. **Validar con pruebas**: músculo válido, rangos coherentes, consejos con fuente, ids únicos, referencias que existen.
4. **Pasar las reglas una a una** a `domain/`, con casos reales de la app actual: mismas entradas, mismos resultados.
5. **Separar contenido de usuario** (rangos propios, consejos editados, notas, saltos propios).
6. **Versionar el contenido** (`content/version.json`).

## Equivalencia de campos
| Hoy | Nueva | Notas |
|---|---|---|
| `n` | `name` | + `aliases` |
| `g` | `primary` | Músculo principal |
| `c` | `contributes` | 1 directa, 0,5 indirecta |
| `t` (C/A) | `kind` (compound/isolation) | |
| `m` | `equipment` | barbell, dumbbell, machine, cable, bodyweight, other |
| `p` | `pattern` | 11 patrones |
| `eq` | `gyms` | gym, basic, home |
| `rep` / `rir` / `rest` / `inc` | `reps` / `rir` / `restSec` / `stepKg` | |
| `heavy` / `stable` | `heavy` / `stable` | |
| `tip` / `ref` | `key` / `source` | |
| `YG.ex[id].fam` | `families` | Dentro del ejercicio |
| `T(t, w, s)` | `{ text, why, source }` | + `id`, `scope`, `target`, `when`, `priority` |
| sexo `'h'` / `'m'` | `'male'` / `'female'` | Hoy `'m'` es mujer: cuidado |

## Destino y prueba de cada bloque
| Bloque | Archivo | Prueba |
|---|---|---|
| Ejercicios | `content/exercises.json` | Músculo válido, reps mín ≤ máx, id único, familias existen |
| Músculos y volumen | `content/muscles.json` | Tres rangos, mín ≤ máx; guía con fuente |
| Consejos | `content/tips/*.json` | Texto y porqué, fuente válida, destino existe |
| Plantillas | `content/templates.json` | Cada opción existe y es del músculo del hueco |
| Reglas | `domain/*.ts` | Casos reales: mismas entradas, mismas salidas |
| Alimentos | `content/foods.json` | kcal ≈ 4P + 4H + 9G (±15 %) |

## Contradicciones que hay que resolver antes
| Tema | Un sitio | Otro | Propuesta |
|---|---|---|---|
| Descanso tras caída de reps | `RULES.rest80`: +30–60 s | Sesión +60 s; tras sesión +45 s | Una regla: +45 s en sesión y plan |
| Tamaño de la descarga | 20–40 % menos series | Se aplica 30 % | Dejar 30 % y decirlo |
| Ritmo de pérdida | 0,5–1 %/sem | Por defecto 0,75 %; aviso desde 1,2 % | Mantener y explicar los dos umbrales |
| Sesiones de esta semana | Plan: días distintos | Resumen y racha: sesiones guardadas | Una función: días distintos (`weekDaysTrained()`) |
| Récord | +1 % de 1RM sobre todo lo anterior | ★: cualquier mejora sobre la misma serie anterior | Dos nombres: «récord» y «mejor que la última vez» |
| Fuentes de cardio y nutrición | Etiquetadas «evidencia, no de la guía» | Mezcladas con V1–V21 | Separar guía (V) y evidencia general (E) |
