import { describe, expect, it } from 'vitest';
import { foodCatalog } from './foods';
import { generateMealPlan, swapOptions } from './meal-plan';
import original from '../data/usda-release.json';
import local from '../data/unverified-foods.json';

const targets = { kcal: 2100, protein: 130, carbs: 230, fat: 65 };

describe('catálogo USDA', () => {
  it('conserva los 53 IDs, sin duplicados y con cobertura equilibrada', () => {
    const ids = foodCatalog.map((food) => food.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(original.originalIds).toHaveLength(53);
    expect(ids).toEqual(expect.arrayContaining(original.originalIds));
    expect(ids.length).toBeGreaterThanOrEqual(200);
    expect(ids.length).toBeLessThanOrEqual(300);
    for (const role of ['protein', 'dairy', 'carb', 'veg', 'fruit', 'fat']) {
      expect(foodCatalog.filter((food) => food.role === role).length).toBeGreaterThanOrEqual(30);
    }
    for (const food of foodCatalog) expect(ids).toEqual(expect.arrayContaining(food.pairingIds));
  });

  it('exige procedencia completa y mantiene los valores propios no verificados', () => {
    for (const food of foodCatalog) {
      const source = food.provenance;
      expect(source.source).toBeTruthy();
      expect(source.dataset).toBeTruthy();
      expect(source.version).toBeTruthy();
      expect(source.license).toBeTruthy();
      expect(source.importedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (food.verified) {
        expect(source.source).toBe('USDA FoodData Central');
        if (source.source !== 'USDA FoodData Central') throw new Error('missing USDA source');
        expect(source.fdcId).toBeGreaterThan(0);
        expect(source.license).toBe('CC0-1.0');
      } else {
        expect(source.source).toBe('StrongerFit');
        expect(food).toEqual(local.find((entry) => entry.id === food.id));
      }
    }
  });

  it('mantiene rangos plausibles y coherencia energética 4/4/9', () => {
    for (const food of foodCatalog) {
      const n = food.per100g;
      for (const value of Object.values(n)) expect(Number.isFinite(value) && value >= 0, food.id).toBe(true);
      expect(n.kcal, food.id).toBeLessThanOrEqual(950);
      for (const macro of [n.protein, n.carbs, n.fat]) expect(macro, food.id).toBeLessThanOrEqual(100);
      expect(n.protein + n.carbs + n.fat, food.id).toBeLessThanOrEqual(101);
      // USDA uses specific Atwater factors and carbohydrate by difference includes fiber.
      // Absolute allowance handles low-energy vegetables; relative allowance handles seeds/nuts.
      expect(Math.abs(n.kcal - (n.protein * 4 + n.carbs * 4 + n.fat * 9)), food.id)
        .toBeLessThanOrEqual(Math.max(20, n.kcal * 0.2));
    }
    expect(foodCatalog.find((food) => food.id === 'chicken')?.per100g)
      .toEqual({ kcal: 151, protein: 30.54, carbs: 0, fat: 3.17 });
  });

  it('mantiene etiquetas animales y lácteas coherentes, incluso sin lactosa', () => {
    for (const food of foodCatalog) {
      if (food.tags.includes('lactosa')) expect(food.tags).toContain('lacteo');
      if (food.tags.some((tag) => ['lacteo', 'huevo', 'carne', 'pescado', 'mariscos'].includes(tag))) expect(food.tags).toContain('animal');
    }
    expect(foodCatalog.find((food) => food.id === 'lactose-free-milk')?.tags).toEqual(['lacteo', 'animal']);
  });

  it('excluye no verificados de todas las minutas e intercambios, incluso con catálogo inyectado', () => {
    for (const dietFocus of ['', 'vegana', 'vegetariana']) {
      const result = generateMealPlan({ targets, exclusions: [], dietFocus });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('no plan');
      for (const day of result.plan.days) for (const meal of day.meals) for (const [index, item] of meal.items.entries()) {
        expect(foodCatalog.find((food) => food.id === item.foodId)?.verified).toBe(true);
        for (const option of swapOptions(result.plan, day.index, meal.meal, index)) {
          expect(foodCatalog.find((food) => food.id === option.item.foodId)?.verified).toBe(true);
        }
      }
    }
    const foods = foodCatalog.map((food) => ({ ...food, verified: false }));
    expect(generateMealPlan({ targets, exclusions: [], dietFocus: '', foods }).ok).toBe(false);
    const valid = generateMealPlan({ targets, exclusions: [], dietFocus: '' });
    if (!valid.ok) throw new Error('no plan');
    expect(swapOptions(valid.plan, 0, 'lunch', 0, foods)).toEqual([]);
  });
});
