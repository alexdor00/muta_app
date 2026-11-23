// Las instrucciones para que una IA pase cualquier dieta (Word, PDF, foto…) al CSV que lee MUTA (usuario, 2026-11-19).
// Siguen el formato de `dietCsv.ts` (docs/datos.md · «Tu dieta desde un CSV»); el ejemplo es la plantilla.
import { PLANTILLA_DIETA } from './dietCsv.ts'

export const INSTRUCCIONES_IA_DIETA = `Convierte la dieta que te paso (al final o en el archivo adjunto) en un CSV para la app MUTA. Devuélvelo listo para guardar como .csv.

FORMATO
- Separador: punto y coma (;). Decimales con coma (1,5). Sin comillas salvo que un texto lleve «;».
- Primera fila, exactamente estos títulos:
Menú;Días;Cocinar;Comida;Nombre;Receta;Ingrediente;Gramos entreno;Gramos descanso;Cantidad;kcal;Proteína;Hidratos;Grasa;Solo;Paso;Nota;Ajusta;Preparar;Al momento
- Una fila por ingrediente. Las filas de una misma receta, seguidas.

MENÚS Y DÍAS (lo que se repite, una sola vez)
- Cada menú distinto de la dieta es una letra: A, B, C…
- Días: los días del ciclo en que va ese menú: «1-2» (dos días seguidos), «1-3» (tres), «1 4» (el 1 y el 4). Solo en la primera fila de cada menú. Si un menú se repite varios días, escríbelo UNA vez con todos sus días; nunca lo copies.
- Si la dieta es igual cada semana, el ciclo son 7 días (lunes = 1). Si va por días sin semana («Día 1, 2, 3» y vuelta a empezar), el ciclo dura lo que diga el último día.
- Una comida igual todos los días (el desayuno, el batido): Menú = «Todos» y sin Días.

CUÁNDO SE COCINA
- Cocinar: el día del ciclo en que se cocina ese menú para todos sus días (si va los días 1-3 y se cocina el 1, pon 1). Solo en la primera fila de cada menú. Si la dieta no dice cuándo se cocina, déjalo vacío.
- Preparar: en la primera fila de cada receta, «Antelación» si se cocina antes (el día de Cocinar) o «Al momento» si se hace el mismo día. Si la dieta no lo dice, vacío.
- Al momento: «sí» en el ingrediente que se hace el mismo día aunque el resto de la receta se cocine antes (el pescado, la verdura fresca, el huevo). Si no, vacío.

COLUMNAS
- Comida: solo Desayuno, Comida, Merienda o Cena (almuerzo = Comida; un preentreno o una comida extra, en la más cercana por la hora).
- Nombre: cómo llama la dieta a esa comida («Comida 1», «Preentreno», «Batido»).
- Receta: el nombre del plato. Si la dieta no le da nombre, júntale los ingredientes principales («Arroz con pollo»).
- Ingrediente: el alimento tal cual; si la dieta dice crudo o cocido, entre paréntesis: «Arroz (en crudo)».
- Gramos entreno / Gramos descanso: los gramos de cada tipo de día. Si la dieta no distingue, el mismo número en las dos.
- Cantidad: solo si viene en unidades y no en gramos («2 huevos», «1 plátano», «al gusto»).
- kcal, Proteína, Hidratos, Grasa: POR 100 g del ingrediente, solo si la dieta los da. Si da el total de la ración, divídelo entre los gramos y multiplica por 100. Si no los da, vacíos (la app los busca en su base).
- Solo: «Entreno» si esa receta va solo los días de entreno (el preentreno), «Descanso» si solo los de descanso; si no, vacío. Si en una comida la dieta pone un plato distinto los días de descanso, escribe las dos recetas en esa comida: una con «Entreno» y otra con «Descanso».
- Ajusta: «sí» en el ingrediente que la dieta dice que se sube o se baja para ajustar las kcal (el arroz, la pasta); si no lo dice, vacío.
- Paso: cada paso de la receta, en una fila aparte con solo la columna Receta y la columna Paso.
- Nota: cualquier aclaración de la dieta sobre ese ingrediente.

REGLAS
- No inventes nada: ni alimentos, ni gramos, ni valores, ni días. Si algo no está, deja la celda vacía.
- No resumas ni juntes comidas: cada ingrediente de la dieta, su fila.
- Devuelve SOLO el CSV dentro de un bloque de código. Debajo, en una línea, las dudas que hayas tenido.

EJEMPLO
${PLANTILLA_DIETA}

MI DIETA:
`
