import type { PhotoAnalysis } from './domain/photo-analysis';

export type FoodPhoto = { uri: string };

// Contrato del análisis. La implementación real debe vivir en el backend
// (POST /nutrition/photo-analysis): recibe la imagen, la envía a un modelo de
// visión y devuelve alimentos con gramos estimados y valores por 100 g.
// La clave del proveedor nunca debe empaquetarse en la app.
export type FoodPhotoAnalyzer = (photo: FoodPhoto, signal?: AbortSignal) => Promise<PhotoAnalysis>;

const previewResult: PhotoAnalysis = {
  source: 'vista-previa',
  items: [
    { id: 'rice', name: 'Arroz blanco cocido', grams: 150, confidence: 0.92, per100g: { kcal: 130, protein: 2.7, carbs: 28.2, fat: 0.3 } },
    { id: 'chicken', name: 'Pechuga de pollo a la plancha', grams: 120, confidence: 0.85, per100g: { kcal: 165, protein: 31, carbs: 0, fat: 3.6 } },
    { id: 'salad', name: 'Ensalada de tomate y lechuga', grams: 80, confidence: 0.71, per100g: { kcal: 18, protein: 0.9, carbs: 3.5, fat: 0.2 } },
    { id: 'avocado', name: 'Palta', grams: 40, confidence: 0.48, per100g: { kcal: 160, protein: 2, carbs: 8.5, fat: 14.7 } },
  ],
};

// Simulación para desarrollo: ignora la imagen y responde siempre el mismo plato.
export const previewFoodPhotoAnalyzer: FoodPhotoAnalyzer = (_photo, signal) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => resolve(structuredClone(previewResult)), 1800);
  signal?.addEventListener('abort', () => { clearTimeout(timer); reject(new Error('aborted')); });
});
