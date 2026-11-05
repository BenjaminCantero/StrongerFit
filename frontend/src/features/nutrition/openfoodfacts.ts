import { Platform } from 'react-native';
import { parseProductResponse, type ProductLookup } from './domain/barcode';

// API pública de lectura de Open Food Facts (datos ODbL; atribución en la pantalla).
// Límite publicado: 100 consultas de producto por minuto y por IP.
const FIELDS = ['code', 'product_name', 'product_name_es', 'brands', 'serving_quantity', 'image_front_small_url', 'nutriments'].join(',');
const USER_AGENT = 'StrongerFit/0.1.0 (https://github.com/BenjaminCantero/StrongerFit)';
const TIMEOUT_MS = 10_000;

export async function lookupProduct(code: string, signal?: AbortSignal): Promise<ProductLookup> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  signal?.addEventListener('abort', () => controller.abort());
  try {
    // Los navegadores no permiten fijar User-Agent; en Android/iOS lo pide Open Food Facts.
    const headers: Record<string, string> = Platform.OS === 'web' ? {} : { 'User-Agent': USER_AGENT };
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}?fields=${FIELDS}`,
      { headers, signal: controller.signal });
    if (response.status === 404) return { status: 'not-found' };
    if (!response.ok) throw new Error(`Open Food Facts respondió ${response.status}`);
    return parseProductResponse(await response.json());
  } finally {
    clearTimeout(timer);
  }
}
