# Conocimiento de fitness de MUTA

Base de conocimiento de la app actual (`C:\Users\alexa\Desktop\prueba`), generada el 2026-10-27.
Es la referencia para las fases 2 (motor) y 3 (contenido) del rediseño.

| Archivo | Qué contiene |
|---|---|
| [01-contenido.md](01-contenido.md) | Parte I: fuentes, perfil, músculos y rangos, guías de volumen, consejos generales, reglas escritas, glosario, plantillas, cardio, material, cadencias |
| [02-reglas.md](02-reglas.md) | Parte II: cálculos y decisiones del motor y del coach, con cifras exactas |
| [03-migracion.md](03-migracion.md) | Parte III: método, equivalencia de campos, destino de cada bloque y contradicciones |

## Cifras

141 ejercicios · 16 músculos · 317 consejos · 72 familias · 19 reglas del coach · 2 plantillas · 27 fuentes · 1493 alimentos.

## Catálogos grandes

Los catálogos completos (141 ejercicios, 137 consejos por músculo, 72 familias, 1493 alimentos)
**no se copian a mano**: se extraen con un script desde la app actual a `src/shared/content/*.json`
(fase 3, ver `03-migracion.md`). Su origen en la app actual:

| Catálogo | Origen | Destino |
|---|---|---|
| Ejercicios | `conocimiento.js · EXERCISES` | `src/shared/content/exercises.json` |
| Músculos | `conocimiento.js · MUSCLES` + `consejos-pantalla.js · YG.vol` | `src/shared/content/muscles.json` |
| Consejos generales | `consejos.js · YG.pre, YG.post, YG.upDown` | `src/shared/content/tips/general.json` |
| Consejos por músculo | `consejos.js · YG.muscle, YG.where` | `src/shared/content/tips/muscles.json` |
| Familias | `consejos-ejercicio.js · YG.fam, YG.ex, PROF` | `src/shared/content/tips/families.json` |
| Zonas de énfasis | `volumen.js · REGIONS` | `src/shared/content/emphasis.json` |
| Plantillas | `motor.js · TEMPLATES` | `src/shared/content/templates.json` |
| Reglas escritas | `conocimiento.js · RULES` | `src/shared/content/rules.json` |
| Glosario | `ajustes.js · GLOSSARY` | `src/shared/content/glossary.json` |
| Cardio | `conocimiento.js · CARDIO_TYPES, INTENSITY` | `src/shared/content/cardio.json` |
| Medidas | `cuerpo.js · MEAS, MO_FIELDS, MEASURE_GUIDE` | `src/shared/content/measures.json` |
| Material y discos | `ajustes.js · MATERIALS`, `logros.js · PLATES` | `src/shared/content/equipment.json` |
| Cadencias | `temporizador.js · CADENCES` | `src/shared/content/cadences.json` |
| Alimentos | `conocimiento.js · FOOD_ROWS, foodsAdd` | `src/shared/content/foods.json` |
| Fuentes | `conocimiento.js · SOURCES` | `src/shared/content/sources.json` |
| Niveles, objetivos, material | `conocimiento.js · LEVELS, GOALS, EQUIP` | `src/shared/content/profile-options.json` |
