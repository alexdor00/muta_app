// Solo para probar (`perfilDemo.ts`): tu menú de prueba, con tres platos tuyos hechos a mano, y tu semana resuelta: la
// compra hoy a las 18:00, cocinar cada dos días (hecha la de hace 2 días; hoy, a las 20:30), el desayuno al momento, del
// pollo con arroz el brócoli recién hecho y de la cena el salmón. Así Hoy y Tu plan enseñan todo lo que puede salir.
import { diaSemana } from '../../features/nutrition/domain/menu.ts'
import { platoTuyo, type IngredientePlato } from '../../features/nutrition/domain/recipes.ts'

/**
 * Los documentos de `userContent` de tu menú de prueba (`platos-tuyos` y `menu`); `fecha(n)`: hace n
 * días.
 */
export function menuDemo(fecha: (n: number) => string, conRecetario = false): object[] {
  // Con el recetario de la app, sus recetas: tostada de higos (desayuno, al momento), bowl de pollo al chipotle (comida: el
  // arroz, la cebolla, los pimientos y la salsa en táper; el pollo, ese día), parfait de yogur (merienda, al momento) y bowl
  // de salmón con pico de gallo (cena: el arroz y el mango en táper; el salmón, el tomate, el pepino y el aguacate, ese día)
  const r = conRecetario
    ? { desayuno: 'rec-09', comida: 'rec-65', merienda: 'rec-88', cena: 'rec-51' }
    : { desayuno: 'demo-avena', comida: 'demo-pollo', cena: 'demo-salmon' }
  const frescos = conRecetario
    ? { 'rec-51': ['Salmón', 'Tomate', 'Pepino', 'Aguacate'] }
    : { 'demo-pollo': ['Brócoli'], 'demo-salmon': ['Salmón'] }
  const ing = (
    nombre: string,
    categoria: string,
    gramos: number,
    por100: [number, number, number, number],
    macro: IngredientePlato['macro'],
  ): IngredientePlato => ({
    texto: `${gramos} g de ${nombre.toLowerCase()}`,
    nombre,
    categoria,
    por100: { kcal: por100[0], protein: por100[1], carbs: por100[2], fat: por100[3] },
    alimentoId: null,
    cuenta: true,
    gramos,
    sugerido: false,
    macro,
  })
  // Los pasos y los minutos de los platos de prueba (para ver el modo cocina con su temporizador): inventados
  const conPasos = (p: ReturnType<typeof platoTuyo>, minutos: number, pasos: string[]) => ({
    ...p,
    minutos,
    pasos,
  })
  const platos = [
    platoTuyo('demo-avena', 'Yogur con avena y plátano', [
      ing('Yogur natural', 'Lácteos', 250, [61, 3.5, 4.7, 3.3], 'protein'),
      ing('Copos de avena', 'Cereales', 60, [372, 13.5, 58.7, 7], 'carbs'),
      ing('Plátano', 'Fruta', 120, [89, 1.1, 22.8, 0.3], null),
    ]),
    conPasos(
      platoTuyo('demo-pollo', 'Pollo con arroz y verduras', [
        ing('Pechuga de pollo', 'Carne', 180, [113, 23, 0, 2], 'protein'),
        ing('Arroz blanco cocido', 'Cereales', 220, [130, 2.7, 28, 0.3], 'carbs'),
        ing('Aceite de oliva', 'Aceites', 10, [899, 0, 0, 99.9], 'fat'),
        ing('Brócoli', 'Verduras', 100, [34, 2.8, 7, 0.4], null),
      ]),
      25,
      [
        'Corta la pechuga en tiras.',
        'Dórala en la sartén con el aceite.',
        'Calienta el arroz cocido y júntalo con el pollo.',
      ],
    ),
    conPasos(
      platoTuyo('demo-salmon', 'Salmón con patata asada', [
        ing('Salmón', 'Pescado y marisco', 150, [208, 20, 0, 13], 'protein'),
        ing('Patata', 'Verduras', 300, [77, 2, 17, 0.1], 'carbs'),
      ]),
      40,
      ['Corta la patata en rodajas y ásala 25 min.', 'Pon el salmón encima y ásalo 15 min más.'],
    ),
  ]
  return [
    { id: 'platos-tuyos', target: 'nutricion', platos },
    {
      id: 'menu',
      target: 'nutricion',
      menus: [
        {
          id: 'A',
          nombre: 'Menú A',
          platos: r,
        },
      ],
      semana: Array(7).fill('A'),
      reparto: 'seguidos',
      cocinados: [],
      compraEl: null,
      avisos: { cocinar: true, compra: true, comidas: false, antesMin: 30 },
      descartadas: [],
      hechos: [],
      sinPlato: [],
      // Cocina cada dos días (para dos días); el desayuno, al momento; del pollo con arroz se hace ese día el brócoli y de
      // la cena, el salmón (lo demás, en táper). La tanda de hace 2 días ya está hecha: de ella sale la comida de hoy
      piloto: {
        compra: { dia: diaSemana(fecha(0)), hora: '18:00' },
        cocina: {
          modo: 'dias',
          dias: [fecha(0), fecha(-2), fecha(-4), fecha(2)].map(diaSemana).sort(),
          hora: '20:30',
        },
        preparar: { desayuno: 'momento', comida: 'mixto', merienda: 'momento', cena: 'mixto' },
        porPlato: {},
        frescos,
        tandas: [fecha(2)],
        saltadas: [],
        hechas: [fecha(2)],
        descartadas: [],
        desde: fecha(2),
      },
    },
  ]
}
