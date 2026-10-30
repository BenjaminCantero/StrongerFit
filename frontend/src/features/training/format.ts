export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  return `${String(minutes).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export const formatWeight = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format;
