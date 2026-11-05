import type { Pattern } from '@strongerfit/training-engine';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { colors, radius } from '../../../theme';

// Pictogramas propios por patrón de movimiento (no son fotos ni técnica certificada).
// Lienzo 48×48, trazo redondeado; el suelo va más tenue para no competir con la figura.
type Stroke = { kind: 'line'; points: number[] } | { kind: 'circle'; cx: number; cy: number; r: number; fill?: boolean };
const head = (cx: number, cy: number, r = 3.5): Stroke => ({ kind: 'circle', cx, cy, r, fill: true });
const line = (...points: number[]): Stroke => ({ kind: 'line', points });
const plate = (cx: number, cy: number, r = 4.5): Stroke => ({ kind: 'circle', cx, cy, r });

const figures: Record<Pattern, { body: Stroke[]; floor?: number[] }> = {
  // Sentadilla con barra en la espalda.
  squat: { floor: [8, 42, 40, 42], body: [head(21, 9), line(9, 15, 33, 15), line(9, 11, 9, 19), line(33, 11, 33, 19),
    line(21, 14, 17, 27), line(17, 27, 28, 28, 25, 40, 31, 40), line(20, 17, 25, 20, 27, 15)] },
  // Bisagra de cadera: peso muerto de perfil.
  hinge: { floor: [8, 42, 40, 42], body: [head(33, 13), line(16, 22, 30, 17), line(16, 22, 18, 32, 16, 41),
    line(29, 18, 27, 30), plate(27, 35)] },
  // Zancada con mancuernas.
  lunge: { floor: [6, 42, 42, 42], body: [head(24, 8), line(24, 12, 24, 25), line(24, 25, 33, 30, 33, 41),
    line(24, 25, 17, 37, 10, 39), line(24, 14, 20, 25), line(17, 26, 23, 26)] },
  // Empuje horizontal: press de banca de perfil.
  'push-h': { floor: [6, 42, 42, 42], body: [line(8, 32, 34, 32), line(12, 32, 12, 41), line(30, 32, 30, 41), head(10, 27, 3),
    line(14, 29, 29, 29), line(29, 29, 36, 23, 39, 41), line(17, 28, 17, 17), plate(17, 13)] },
  // Empuje vertical: press militar con barra arriba.
  'push-v': { floor: [10, 43, 38, 43], body: [line(8, 6, 40, 6), line(10, 2, 10, 10), line(38, 2, 38, 10), head(24, 15),
    line(24, 19, 24, 30), line(24, 30, 20, 42), line(24, 30, 28, 42), line(21, 20, 16, 13, 16, 6), line(27, 20, 32, 13, 32, 6)] },
  // Tirón horizontal: remo con mancuerna inclinado.
  'pull-h': { floor: [8, 42, 40, 42], body: [head(33, 13), line(16, 22, 30, 17), line(16, 22, 18, 32, 16, 41),
    line(29, 18, 22, 23, 25, 31), line(21, 32, 29, 32)] },
  // Tirón vertical: colgado de una barra.
  'pull-v': { body: [line(6, 6, 42, 6), line(14, 6, 16, 17, 20, 21), line(34, 6, 32, 17, 28, 21), head(24, 16),
    line(24, 20, 24, 32), line(24, 32, 21, 43), line(24, 32, 27, 43)] },
  // Core: plancha sobre antebrazos.
  core: { floor: [4, 38, 44, 38], body: [head(38, 23, 3), line(34, 27, 20, 29, 7, 33), line(34, 27, 34, 35, 40, 35)] },
  // Brazos: curl con mancuerna.
  arms: { floor: [10, 43, 38, 43], body: [head(24, 9), line(24, 13, 24, 28), line(24, 28, 20, 42), line(24, 28, 28, 42),
    line(23, 15, 17, 27), line(14, 28, 20, 26), line(25, 15, 31, 23, 31, 15), line(28, 13, 34, 13)] },
  // Pantorrillas: elevación de talones sobre un escalón.
  calves: { body: [head(24, 8), line(24, 12, 24, 27), line(24, 27, 25, 37, 30, 40), line(24, 14, 21, 26),
    line(18, 40, 38, 40), line(18, 40, 18, 46), line(12, 30, 12, 20), line(9, 23, 12, 20, 15, 23)] },
};

type Props = { pattern: Pattern; size?: number; tone?: 'brand' | 'muted' | 'inverse'; style?: StyleProp<ViewStyle> };

const tones = {
  brand: { ink: colors.brandStrong, ground: colors.brandSoft, floor: colors.brandMedium },
  muted: { ink: colors.muted, ground: colors.surfaceHigh, floor: colors.line },
  inverse: { ink: colors.white, ground: colors.brand, floor: colors.brandMedium },
};

export function MovementPictogram({ pattern, size = 44, tone = 'brand', style }: Props) {
  const { ink, ground, floor } = tones[tone];
  const figure = figures[pattern];
  return <View accessible={false} importantForAccessibility="no-hide-descendants"
    style={[{ width: size, height: size, borderRadius: size >= 96 ? radius.lg : radius.sm, backgroundColor: ground, alignItems: 'center', justifyContent: 'center' }, style]}>
    <Svg width={size * 0.82} height={size * 0.82} viewBox="0 0 48 48">
      {figure.floor && <Line x1={figure.floor[0]} y1={figure.floor[1]} x2={figure.floor[2]} y2={figure.floor[3]} stroke={floor} strokeWidth={2} strokeLinecap="round" />}
      {figure.body.map((stroke, index) => stroke.kind === 'circle'
        ? <Circle key={index} cx={stroke.cx} cy={stroke.cy} r={stroke.r} stroke={ink} strokeWidth={2.6} fill={stroke.fill ? ink : 'none'} />
        : stroke.points.length === 4
          ? <Line key={index} x1={stroke.points[0]} y1={stroke.points[1]} x2={stroke.points[2]} y2={stroke.points[3]} stroke={ink} strokeWidth={2.6} strokeLinecap="round" />
          : <Polyline key={index} points={stroke.points.join(' ')} stroke={ink} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />)}
    </Svg>
  </View>;
}
