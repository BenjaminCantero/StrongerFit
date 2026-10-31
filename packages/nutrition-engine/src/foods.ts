// Catálogo inicial de alimentos genéricos para registro y minuta. Valores por 100 g
// aproximados de tablas de composición de uso común; pendientes de reemplazar por una
// fuente importada con procedencia y licencia (RF-18). No incluye marcas.
export const FOOD_CATALOG_VERSION = 'alimentos-referencia-0.1';

export type Nutrients = { kcal: number; protein: number; carbs: number; fat: number };
export type FoodRole = 'protein' | 'dairy' | 'carb' | 'veg' | 'fruit' | 'fat';
export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner';
// Etiquetas de restricción: alérgenos y grupos que una exclusión o dieta puede bloquear.
// 'lacteo' marca todo derivado de leche (incluso sin lactosa); 'lactosa' solo lo que la contiene.
export type FoodTag = 'gluten' | 'lactosa' | 'lacteo' | 'frutos-secos' | 'mani' | 'huevo' | 'pescado' | 'mariscos' | 'soya' | 'carne' | 'animal';

export type CatalogFood = {
  id: string; name: string; per100g: Nutrients; servingGrams: number; defaultGrams: number; pairingIds: string[];
  role: FoodRole; meals: MealSlot[]; tags: FoodTag[];
};

const f = (id: string, name: string, [kcal, protein, carbs, fat]: [number, number, number, number], servingGrams: number,
  role: FoodRole, meals: MealSlot[], tags: FoodTag[] = [], pairingIds: string[] = []): CatalogFood =>
  ({ id, name, per100g: { kcal, protein, carbs, fat }, servingGrams, defaultGrams: servingGrams, pairingIds, role, meals, tags });

const main: MealSlot[] = ['lunch', 'dinner'];
const day: MealSlot[] = ['breakfast', 'snack'];
const all: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export const foodCatalog: CatalogFood[] = [
  { ...f('chicken', 'Pechuga de pollo cocida a la plancha', [165, 31, 0, 3.6], 120, 'protein', main, ['carne', 'animal'], ['avocado', 'bread', 'quinoa']), defaultGrams: 150 },
  f('avocado', 'Palta Hass molida', [160, 2, 8.5, 14.7], 50, 'fat', all, [], ['bread']),
  f('bread', 'Marraqueta', [270, 9, 56, 1.5], 50, 'carb', ['breakfast', 'snack'], ['gluten'], ['avocado']),
  f('oats', 'Avena con leche sin lactosa', [290 / 1.8, 6.1, 23.3, 4.4], 180, 'carb', ['breakfast'], ['gluten', 'lacteo', 'animal'], ['walnuts']),
  f('walnuts', 'Nueces picadas', [650, 15, 14, 65], 20, 'fat', day, ['frutos-secos'], ['oats']),
  f('quinoa', 'Quinoa cocida', [120, 4.4, 21.3, 1.9], 120, 'carb', main, [], ['avocado', 'chicken']),
  f('turkey', 'Pechuga de pavo cocida', [135, 30, 0, 1], 120, 'protein', main, ['carne', 'animal']),
  f('beef', 'Posta negra de vacuno cocida', [190, 29, 0, 8], 120, 'protein', main, ['carne', 'animal']),
  f('salmon', 'Salmón al horno', [206, 22, 0, 12], 120, 'protein', main, ['pescado', 'animal']),
  f('hake', 'Merluza al vapor', [90, 19, 0, 1.3], 150, 'protein', main, ['pescado', 'animal']),
  f('tuna', 'Atún en agua escurrido', [116, 26, 0, 1], 100, 'protein', main, ['pescado', 'animal']),
  f('shrimp', 'Camarones salteados', [99, 24, 0.2, 0.3], 120, 'protein', main, ['mariscos', 'animal']),
  f('eggs', 'Huevo cocido', [155, 13, 1.1, 11], 100, 'protein', ['breakfast', 'lunch', 'dinner'], ['huevo', 'animal']),
  f('lentils', 'Lentejas cocidas', [116, 9, 20, 0.4], 200, 'protein', main),
  f('chickpeas', 'Garbanzos cocidos', [164, 8.9, 27, 2.6], 150, 'protein', main),
  f('tofu', 'Tofu firme salteado', [144, 15, 3, 9], 150, 'protein', main, ['soya']),
  f('yogurt', 'Yogur natural descremado', [56, 5.7, 7.7, 0.2], 170, 'dairy', day, ['lactosa', 'lacteo', 'animal']),
  f('greek-yogurt', 'Yogur griego natural', [97, 9, 3.9, 5], 150, 'dairy', day, ['lactosa', 'lacteo', 'animal']),
  f('milk', 'Leche semidescremada', [46, 3.3, 4.8, 1.5], 200, 'dairy', day, ['lactosa', 'lacteo', 'animal']),
  f('fresh-cheese', 'Quesillo', [98, 12, 3, 4.3], 60, 'dairy', day, ['lactosa', 'lacteo', 'animal']),
  f('lactose-free-milk', 'Leche sin lactosa semidescremada', [46, 3.3, 4.8, 1.5], 200, 'dairy', day, ['lacteo', 'animal']),
  f('lactose-free-yogurt', 'Yogur sin lactosa natural', [60, 4, 8, 1.5], 170, 'dairy', day, ['lacteo', 'animal']),
  f('soy-drink', 'Bebida de soya sin azúcar', [33, 3.3, 0.6, 1.8], 200, 'dairy', day, ['soya']),
  f('soy-yogurt', 'Yogur de soya natural', [66, 4, 5, 3.5], 150, 'dairy', day, ['soya']),
  f('almond-drink', 'Bebida de almendras sin azúcar', [15, 0.5, 0.3, 1.2], 250, 'dairy', day, ['frutos-secos']),
  f('whole-bread', 'Pan integral', [247, 13, 41, 3.4], 50, 'carb', ['breakfast', 'snack'], ['gluten']),
  f('oat-flakes', 'Avena en hojuelas', [379, 13, 68, 6.5], 40, 'carb', ['breakfast'], ['gluten']),
  f('corn-tortilla', 'Tortilla de maíz', [218, 5.7, 45, 2.9], 50, 'carb', ['breakfast', 'snack'], []),
  f('rice-cakes', 'Galletas de arroz inflado', [387, 8, 81, 3], 25, 'carb', ['breakfast', 'snack']),
  f('quinoa-flakes', 'Hojuelas de quinoa', [370, 14, 64, 6], 40, 'carb', ['breakfast']),
  f('rice', 'Arroz blanco cocido', [130, 2.7, 28, 0.3], 150, 'carb', main),
  f('brown-rice', 'Arroz integral cocido', [123, 2.7, 26, 1], 150, 'carb', main),
  f('pasta', 'Fideos cocidos', [158, 5.8, 31, 0.9], 150, 'carb', main, ['gluten']),
  f('potato', 'Papa cocida', [87, 1.9, 20, 0.1], 200, 'carb', main),
  f('sweet-potato', 'Camote al horno', [90, 2, 21, 0.2], 180, 'carb', main),
  f('salad', 'Ensalada de lechuga y tomate', [18, 1, 3.5, 0.2], 150, 'veg', main),
  f('broccoli', 'Brócoli al vapor', [35, 2.4, 7, 0.4], 150, 'veg', main),
  f('zucchini', 'Zapallo italiano salteado', [17, 1.2, 3.1, 0.3], 150, 'veg', main),
  f('green-beans', 'Porotos verdes cocidos', [35, 1.9, 7.9, 0.3], 150, 'veg', main),
  f('carrot', 'Zanahoria rallada', [41, 0.9, 9.6, 0.2], 100, 'veg', main),
  f('spinach', 'Espinaca salteada', [23, 2.9, 3.6, 0.4], 120, 'veg', main),
  f('banana', 'Plátano', [89, 1.1, 23, 0.3], 120, 'fruit', day),
  f('apple', 'Manzana', [52, 0.3, 14, 0.2], 150, 'fruit', day),
  f('orange', 'Naranja', [47, 0.9, 12, 0.1], 150, 'fruit', day),
  f('strawberries', 'Frutillas', [32, 0.7, 7.7, 0.3], 150, 'fruit', day),
  f('kiwi', 'Kiwi', [61, 1.1, 15, 0.5], 100, 'fruit', day),
  f('almonds', 'Almendras', [579, 21, 22, 50], 20, 'fat', day, ['frutos-secos']),
  f('peanuts', 'Maní tostado sin sal', [567, 26, 16, 49], 20, 'fat', day, ['mani']),
  f('peanut-butter', 'Mantequilla de maní', [588, 25, 20, 50], 16, 'fat', ['breakfast', 'snack'], ['mani']),
  f('olive-oil', 'Aceite de oliva', [884, 0, 0, 100], 10, 'fat', main),
  f('olives', 'Aceitunas', [115, 0.8, 6, 10.7], 30, 'fat', main),
  f('pumpkin-seeds', 'Semillas de zapallo', [559, 30, 11, 49], 15, 'fat', all),
  f('chia', 'Semillas de chía', [486, 17, 42, 31], 15, 'fat', day),
];
