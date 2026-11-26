type PreviewData = typeof import('./previewData');

// El `require` va dentro de la rama `__DEV__` para que Metro lo descarte en producción.
export function devPreview(): PreviewData | null {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- import condicional para excluirlo del bundle
  return __DEV__ ? (require('./previewData') as PreviewData) : null;
}
