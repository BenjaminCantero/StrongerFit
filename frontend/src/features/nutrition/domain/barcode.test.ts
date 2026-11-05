import { describe, expect, it } from 'vitest';
import { barcodeReducer, isValidBarcode, parseGrams, parseProductResponse, productEntry, type BarcodeState, type ScannedProduct } from './barcode';
import { createEmptyDiary, diaryReducer } from './diary';

// Respuesta real (recortada) de /api/v2/product/3017620422003, consultada el 2026-11-04.
const nutella = {
  code: '3017620422003', status: 1, status_verbose: 'product found',
  product: {
    code: '3017620422003', product_name: 'Nutella', product_name_es: 'Nutella', brands: 'Nutella, Ferrero', serving_quantity: null,
    image_front_small_url: 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.879.200.jpg',
    nutriments: { 'energy-kcal_100g': 539, 'energy-kj_100g': 2252, proteins_100g: 6.3, carbohydrates_100g: 57.5, fat_100g: 30.9 },
  },
};

describe('código de barras', () => {
  it('valida longitud y dígito verificador GTIN', () => {
    expect(isValidBarcode('3017620422003')).toBe(true);
    expect(isValidBarcode('3017620422004')).toBe(false);
    expect(isValidBarcode('96385074')).toBe(true);
    expect(isValidBarcode('036000291452')).toBe(true);
    expect(isValidBarcode('12345')).toBe(false);
    expect(isValidBarcode('abc')).toBe(false);
  });

  it('interpreta un producto completo de Open Food Facts', () => {
    const lookup = parseProductResponse(nutella);
    expect(lookup.status).toBe('found');
    if (lookup.status !== 'found') return;
    expect(lookup.product).toMatchObject({ code: '3017620422003', name: 'Nutella', brand: 'Nutella', servingGrams: null,
      per100g: { kcal: 539, protein: 6.3, carbs: 57.5, fat: 30.9 } });
  });

  it('calcula kcal desde kJ y rechaza datos incompletos o implausibles', () => {
    const kjOnly = structuredClone(nutella);
    delete (kjOnly.product.nutriments as Record<string, unknown>)['energy-kcal_100g'];
    const lookup = parseProductResponse(kjOnly);
    expect(lookup.status === 'found' && lookup.product.per100g.kcal).toBeCloseTo(538.2, 1);

    const noFat = structuredClone(nutella);
    delete (noFat.product.nutriments as Record<string, unknown>).fat_100g;
    expect(parseProductResponse(noFat)).toEqual({ status: 'incomplete', name: 'Nutella' });

    const absurd = structuredClone(nutella);
    absurd.product.nutriments.proteins_100g = 300;
    expect(parseProductResponse(absurd).status).toBe('incomplete');

    expect(parseProductResponse({ code: '0', status: 0, status_verbose: 'product not found' })).toEqual({ status: 'not-found' });
    expect(parseProductResponse(null)).toEqual({ status: 'not-found' });
  });

  it('ignora lecturas inválidas, repetidas o de un código anterior', () => {
    let state: BarcodeState = { phase: 'scanning' };
    expect(barcodeReducer(state, { type: 'scanned', code: '123' })).toBe(state);
    state = barcodeReducer(state, { type: 'scanned', code: '3017620422003' });
    expect(state).toEqual({ phase: 'looking-up', code: '3017620422003' });
    expect(barcodeReducer(state, { type: 'scanned', code: '96385074' })).toBe(state);
    expect(barcodeReducer(state, { type: 'resolved', code: '96385074', lookup: { status: 'not-found' } })).toBe(state);
    const rescanned = barcodeReducer(state, { type: 'rescan' });
    expect(barcodeReducer(rescanned, { type: 'resolved', code: '3017620422003', lookup: { status: 'not-found' } })).toBe(rescanned);
  });

  it('usa la porción como cantidad inicial y ajusta gramos dentro de límites', () => {
    const lookup = parseProductResponse({ ...nutella, product: { ...nutella.product, serving_quantity: '15' } });
    let state = barcodeReducer({ phase: 'looking-up', code: '3017620422003' }, { type: 'resolved', code: '3017620422003', lookup });
    expect(state.phase === 'found' && state.grams).toBe('15');
    state = barcodeReducer(state, { type: 'adjust-grams', delta: -50 });
    expect(state.phase === 'found' && state.grams).toBe('1');
    state = barcodeReducer(state, { type: 'set-grams', value: '30,5g' });
    expect(state.phase === 'found' && parseGrams(state.grams)).toBe(30.5);
    expect(parseGrams('0')).toBeNull();
    expect(parseGrams('2001')).toBeNull();
  });

  it('genera un registro válido para el diario', () => {
    const lookup = parseProductResponse(nutella);
    const product = (lookup as { product: ScannedProduct }).product;
    const entry = productEntry(product, 15, 'breakfast');
    expect(entry.items[0]).toMatchObject({ foodId: 'off:3017620422003', name: 'Nutella', grams: 15 });
    expect(entry.nutrients.kcal).toBeCloseTo(80.85);
    expect(productEntry({ ...product, name: 'Crema de avellanas', brand: 'Ferrero' }, 15, 'breakfast').items[0]!.name).toBe('Crema de avellanas (Ferrero)');
    const diary = diaryReducer(createEmptyDiary('2026-11-04'), { type: 'add', date: '2026-11-04', entry });
    expect(diary.entries).toHaveLength(1);
  });
});
