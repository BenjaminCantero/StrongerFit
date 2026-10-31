import { View } from 'react-native';

export type ChartPoint = { x: number; y: number };

// Segmento recto como vista rotada: dibuja líneas de gráficos sin una librería nativa.
export function ChartSegment({ from, to, color, thickness }: { from: ChartPoint; to: ChartPoint; color: string; thickness: number }) {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  if (length < 0.5) return null;
  return <View pointerEvents="none" style={{
    position: 'absolute', width: length, height: thickness, backgroundColor: color, borderRadius: thickness,
    left: (from.x + to.x) / 2 - length / 2, top: (from.y + to.y) / 2 - thickness / 2,
    transform: [{ rotate: `${Math.atan2(to.y - from.y, to.x - from.x)}rad` }],
  }} />;
}
