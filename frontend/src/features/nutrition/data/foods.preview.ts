import type { Food } from '../domain/food-entry';

// Catálogo ilustrativo. Los valores no se atribuyen a una fuente verificada.
export const foodsPreview: Food[] = [
  {
    id: 'chicken', name: 'Pechuga de pollo cocida a la plancha',
    per100g: { kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
    servingGrams: 120, defaultGrams: 150, pairingIds: ['avocado', 'bread', 'quinoa'],
  },
  {
    id: 'avocado', name: 'Palta Hass molida',
    per100g: { kcal: 160, protein: 2, carbs: 8.5, fat: 14.7 },
    servingGrams: 50, defaultGrams: 50, pairingIds: ['bread'],
  },
  {
    id: 'bread', name: 'Marraqueta',
    per100g: { kcal: 270, protein: 9, carbs: 56, fat: 1.5 },
    servingGrams: 50, defaultGrams: 50, pairingIds: ['avocado'],
  },
  {
    id: 'oats', name: 'Avena con leche sin lactosa',
    per100g: { kcal: 290 / 1.8, protein: 6.1, carbs: 23.3, fat: 4.4 },
    servingGrams: 180, defaultGrams: 180, pairingIds: ['walnuts'],
  },
  {
    id: 'walnuts', name: 'Nueces picadas',
    per100g: { kcal: 650, protein: 15, carbs: 14, fat: 65 },
    servingGrams: 20, defaultGrams: 20, pairingIds: ['oats'],
  },
  {
    id: 'quinoa', name: 'Quinoa cocida',
    per100g: { kcal: 120, protein: 4.4, carbs: 21.3, fat: 1.9 },
    servingGrams: 120, defaultGrams: 120, pairingIds: ['avocado', 'chicken'],
  },
];
