import type { Period } from './domain/progress';

export const periods: { id: Period; label: string }[] = [
  { id: '4w', label: 'Últimas 4 semanas' }, { id: '3m', label: '3 meses' }, { id: '1y', label: 'Año' },
];
export const formatKg = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format;
export const formatPercent = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 }).format;
export function formatProgressDate(date: string): string {
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}
