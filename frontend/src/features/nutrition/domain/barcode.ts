import type { FoodEntry, MealId, Nutrients } from './food-entry';

// Producto envasado leído por código de barras. Valores por 100 g según la etiqueta
// declarada en Open Food Facts; pueden tener errores de quien los cargó.
export type ScannedProduct = {
  code: string;
  name: string;
  brand: string | null;
  per100g: Nutrients;
  servingGrams: number | null;
  imageUrl: string | null;
};
export type ProductLookup =
  | { status: 'found'; product: ScannedProduct }
  | { status: 'not-found' }
  | { status: 'incomplete'; name: string | null };

const GTIN_LENGTHS = [8, 12, 13, 14];

export function normalizeBarcode(raw: string): string {
  return raw.replace(/\D/g, '');
}

// EAN-8, UPC-A, EAN-13 y GTIN-14 con dígito verificador.
export function isValidBarcode(code: string): boolean {
  if (!/^\d+$/.test(code) || !GTIN_LENGTHS.includes(code.length)) return false;
  const digits = [...code].map(Number);
  const check = digits.pop()!;
  const sum = digits.reverse().reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

const number = (value: unknown): number | null => {
  const parsed = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};
const text = (value: unknown): string | null => typeof value === 'string' && value.trim() ? value.trim() : null;

// Interpreta la respuesta de GET /api/v2/product/{code}. Sin los cuatro valores por 100 g
// no se registra: preferimos pedir el registro manual antes que inventar ceros.
export function parseProductResponse(json: unknown): ProductLookup {
  const body = (json ?? {}) as { status?: unknown; code?: unknown; product?: Record<string, unknown> };
  if (body.status !== 1 || !body.product) return { status: 'not-found' };
  const product = body.product;
  const nutriments = (product.nutriments ?? {}) as Record<string, unknown>;
  const name = text(product.product_name_es) ?? text(product.product_name);
  const kj = number(nutriments['energy-kj_100g']);
  const kcal = number(nutriments['energy-kcal_100g']) ?? (kj === null ? null : kj / 4.184);
  const protein = number(nutriments.proteins_100g);
  const carbs = number(nutriments.carbohydrates_100g);
  const fat = number(nutriments.fat_100g);
  const plausible = kcal !== null && kcal <= 950 && [protein, carbs, fat].every((value) => value !== null && value <= 100);
  if (!name || !plausible) return { status: 'incomplete', name };
  const serving = number(product.serving_quantity);
  return { status: 'found', product: {
    code: text(product.code) ?? text(body.code) ?? '', name,
    brand: text(product.brands)?.split(',')[0]?.trim() ?? null,
    per100g: { kcal: kcal!, protein: protein!, carbs: carbs!, fat: fat! },
    servingGrams: serving && serving <= 2000 ? serving : null,
    imageUrl: text(product.image_front_small_url),
  } };
}

export function parseGrams(value: string): number | null {
  const grams = Number(value.trim().replace(',', '.'));
  return Number.isFinite(grams) && grams > 0 && grams <= 2000 ? grams : null;
}

export function productNutrients(product: ScannedProduct, grams: number): Nutrients {
  const factor = grams / 100;
  return { kcal: product.per100g.kcal * factor, protein: product.per100g.protein * factor,
    carbs: product.per100g.carbs * factor, fat: product.per100g.fat * factor };
}

export function productEntry(product: ScannedProduct, grams: number, meal: MealId): FoodEntry {
  const nutrients = productNutrients(product, grams);
  const name = product.brand && !product.name.toLowerCase().includes(product.brand.toLowerCase()) ? `${product.name} (${product.brand})` : product.name;
  return { id: 0, meal, items: [{ foodId: `off:${product.code}`, name, grams, nutrients }], nutrients };
}

// Estado de la pantalla: un solo código en vuelo; los resultados de un código anterior se ignoran.
export type BarcodeState =
  | { phase: 'scanning' }
  | { phase: 'looking-up'; code: string }
  | { phase: 'found'; code: string; product: ScannedProduct; grams: string }
  | { phase: 'not-found'; code: string }
  | { phase: 'incomplete'; code: string; name: string | null }
  | { phase: 'error'; code: string };
export type BarcodeAction =
  | { type: 'scanned'; code: string }
  | { type: 'resolved'; code: string; lookup: ProductLookup }
  | { type: 'failed'; code: string }
  | { type: 'set-grams'; value: string }
  | { type: 'adjust-grams'; delta: number }
  | { type: 'rescan' };

export function barcodeReducer(state: BarcodeState, action: BarcodeAction): BarcodeState {
  switch (action.type) {
    case 'scanned': {
      const code = normalizeBarcode(action.code);
      return (state.phase === 'scanning' || state.phase === 'error') && isValidBarcode(code) ? { phase: 'looking-up', code } : state;
    }
    case 'resolved': {
      if (state.phase !== 'looking-up' || state.code !== action.code) return state;
      const { lookup } = action;
      if (lookup.status === 'found') {
        const grams = lookup.product.servingGrams ?? 100;
        return { phase: 'found', code: state.code, product: { ...lookup.product, code: lookup.product.code || state.code }, grams: String(grams).replace('.', ',') };
      }
      return lookup.status === 'not-found' ? { phase: 'not-found', code: state.code } : { phase: 'incomplete', code: state.code, name: lookup.name };
    }
    case 'failed':
      return state.phase === 'looking-up' && state.code === action.code ? { phase: 'error', code: state.code } : state;
    case 'set-grams':
      return state.phase === 'found' ? { ...state, grams: action.value.replace(/[^\d.,]/g, '').slice(0, 7) } : state;
    case 'adjust-grams': {
      if (state.phase !== 'found') return state;
      const next = Math.min(2000, Math.max(1, Math.round((parseGrams(state.grams) ?? 0) + action.delta)));
      return { ...state, grams: String(next) };
    }
    case 'rescan':
      return { phase: 'scanning' };
  }
}
