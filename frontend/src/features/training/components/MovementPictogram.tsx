import type { Pattern } from '@strongerfit/training-engine';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { colors, radius } from '../../../theme';

// Pictogramas propios por patrón de movimiento (no son fotos ni técnica certificada).
// Lienzo 48×48, trazo redondeado; cada patrón define postura inicial (from) y pico (to)
// con la misma cantidad de trazos y puntos para interpolar el movimiento suavemente.
export type Stroke =
  | { kind: 'line'; points: number[] }
  | { kind: 'circle'; cx: number; cy: number; r: number; fill?: boolean };

const head = (cx: number, cy: number, r = 3.5): Stroke => ({ kind: 'circle', cx, cy, r, fill: true });
const line = (...points: number[]): Stroke => ({ kind: 'line', points });
const plate = (cx: number, cy: number, r = 4.5): Stroke => ({ kind: 'circle', cx, cy, r });

export const figures: Record<Pattern, { floor?: number[]; from: Stroke[]; to: Stroke[] }> = {
  // Sentadilla con barra en la espalda: de pie a sentadilla profunda.
  squat: {
    floor: [8, 42, 40, 42],
    from: [
      head(22, 7),
      line(10, 12, 34, 12),
      line(10, 8, 10, 16),
      line(34, 8, 34, 16),
      line(22, 11, 21, 24),
      line(21, 24, 24, 33, 22, 41, 27, 41),
      line(21, 14, 26, 16, 28, 12),
    ],
    to: [
      head(20, 16),
      line(8, 21, 32, 21),
      line(8, 17, 8, 25),
      line(32, 17, 32, 25),
      line(20, 20, 15, 31),
      line(15, 31, 29, 31, 23, 41, 28, 41),
      line(19, 23, 24, 25, 26, 21),
    ],
  },
  // Bisagra de cadera / peso muerto: de inclinado abajo a extensión arriba.
  hinge: {
    floor: [8, 42, 40, 42],
    from: [
      head(33, 15),
      line(16, 23, 30, 18),
      line(16, 23, 18, 33, 16, 41),
      line(29, 19, 27, 31),
      plate(27, 36),
    ],
    to: [
      head(21, 9),
      line(20, 24, 21, 13),
      line(20, 24, 20, 33, 19, 41),
      line(21, 15, 24, 26),
      plate(24, 30),
    ],
  },
  // Zancada con mancuerna: de posición alta a descenso de rodilla.
  lunge: {
    floor: [6, 42, 42, 42],
    from: [
      head(23, 7),
      line(23, 11, 23, 23),
      line(23, 23, 28, 32, 28, 41),
      line(23, 23, 18, 33, 14, 41),
      line(23, 14, 20, 24),
      line(17, 25, 23, 25),
    ],
    to: [
      head(24, 13),
      line(24, 17, 24, 28),
      line(24, 28, 34, 30, 34, 41),
      line(24, 28, 16, 38, 10, 40),
      line(24, 19, 21, 29),
      line(18, 30, 24, 30),
    ],
  },
  // Empuje horizontal: press de banca de perfil (pecho a extensión).
  'push-h': {
    floor: [6, 42, 42, 42],
    from: [
      line(8, 32, 34, 32),
      line(12, 32, 12, 41),
      line(30, 32, 30, 41),
      head(10, 27, 3),
      line(14, 29, 29, 29),
      line(29, 29, 36, 23, 39, 41),
      line(17, 28, 17, 22),
      plate(17, 19),
    ],
    to: [
      line(8, 32, 34, 32),
      line(12, 32, 12, 41),
      line(30, 32, 30, 41),
      head(10, 27, 3),
      line(14, 29, 29, 29),
      line(29, 29, 36, 23, 39, 41),
      line(17, 28, 17, 14),
      plate(17, 10),
    ],
  },
  // Empuje vertical: press militar desde los hombros sobre la cabeza.
  'push-v': {
    floor: [10, 43, 38, 43],
    from: [
      line(10, 17, 38, 17),
      line(10, 13, 10, 21),
      line(38, 13, 38, 21),
      head(24, 12),
      line(24, 16, 24, 29),
      line(24, 29, 20, 42),
      line(24, 29, 28, 42),
      line(21, 18, 15, 22, 16, 17),
      line(27, 18, 33, 22, 32, 17),
    ],
    to: [
      line(8, 6, 40, 6),
      line(10, 2, 10, 10),
      line(38, 2, 38, 10),
      head(24, 15),
      line(24, 19, 24, 30),
      line(24, 30, 20, 42),
      line(24, 30, 28, 42),
      line(21, 20, 16, 13, 16, 6),
      line(27, 20, 32, 13, 32, 6),
    ],
  },
  // Tirón horizontal: remo inclinado con mancuerna.
  'pull-h': {
    floor: [8, 42, 40, 42],
    from: [
      head(33, 13),
      line(16, 22, 30, 17),
      line(16, 22, 18, 32, 16, 41),
      line(29, 18, 28, 27, 27, 35),
      line(23, 36, 31, 36),
    ],
    to: [
      head(33, 13),
      line(16, 22, 30, 17),
      line(16, 22, 18, 32, 16, 41),
      line(29, 18, 21, 19, 25, 27),
      line(21, 28, 29, 28),
    ],
  },
  // Tirón vertical: dominada / jalón desde extensión hasta arriba.
  'pull-v': {
    from: [
      line(6, 6, 42, 6),
      line(14, 6, 16, 14, 20, 21),
      line(34, 6, 32, 14, 28, 21),
      head(24, 17),
      line(24, 21, 24, 33),
      line(24, 33, 21, 43),
      line(24, 33, 27, 43),
    ],
    to: [
      line(6, 6, 42, 6),
      line(14, 6, 13, 15, 20, 13),
      line(34, 6, 35, 15, 28, 13),
      head(24, 9),
      line(24, 13, 24, 25),
      line(24, 25, 21, 36),
      line(24, 25, 27, 36),
    ],
  },
  // Core: plancha sobre antebrazos con activación abdominal.
  core: {
    floor: [4, 38, 44, 38],
    from: [
      head(38, 23, 3),
      line(34, 27, 20, 29, 7, 33),
      line(34, 27, 34, 35, 40, 35),
    ],
    to: [
      head(38, 21.5, 3),
      line(34, 25.5, 20, 26.5, 7, 33),
      line(34, 25.5, 34, 35, 40, 35),
    ],
  },
  // Brazos: curl de bíceps con mancuerna.
  arms: {
    floor: [10, 43, 38, 43],
    from: [
      head(24, 9),
      line(24, 13, 24, 28),
      line(24, 28, 20, 42),
      line(24, 28, 28, 42),
      line(23, 15, 17, 27),
      line(14, 28, 20, 26),
      line(25, 15, 29, 24, 31, 31),
      line(28, 32, 34, 32),
    ],
    to: [
      head(24, 9),
      line(24, 13, 24, 28),
      line(24, 28, 20, 42),
      line(24, 28, 28, 42),
      line(23, 15, 17, 27),
      line(14, 28, 20, 26),
      line(25, 15, 29, 23, 31, 14),
      line(28, 12, 34, 12),
    ],
  },
  // Pantorrillas: elevación de talones sobre un escalón.
  calves: {
    from: [
      head(24, 10),
      line(24, 14, 24, 29),
      line(24, 29, 25, 39, 30, 43),
      line(24, 16, 21, 28),
      line(18, 40, 38, 40),
      line(18, 40, 18, 46),
      line(12, 22, 12, 32),
      line(9, 29, 12, 32, 15, 29),
    ],
    to: [
      head(24, 6),
      line(24, 10, 24, 25),
      line(24, 25, 25, 35, 30, 39),
      line(24, 12, 21, 24),
      line(18, 40, 38, 40),
      line(18, 40, 18, 46),
      line(12, 30, 12, 20),
      line(9, 23, 12, 20, 15, 23),
    ],
  },
};

export function interpolateStrokes(from: Stroke[], to: Stroke[], progress: number): Stroke[] {
  const t = Math.max(0, Math.min(1, progress));
  return from.map((a, index) => {
    const b = to[index]!;
    if (a.kind === 'circle' && b.kind === 'circle') {
      return {
        kind: 'circle',
        cx: a.cx + (b.cx - a.cx) * t,
        cy: a.cy + (b.cy - a.cy) * t,
        r: a.r + (b.r - a.r) * t,
        fill: a.fill,
      };
    }
    if (a.kind === 'line' && b.kind === 'line') {
      return {
        kind: 'line',
        points: a.points.map((val, ptIdx) => val + (b.points[ptIdx]! - val) * t),
      };
    }
    return a;
  });
}

type Props = {
  pattern: Pattern;
  size?: number;
  tone?: 'brand' | 'muted' | 'inverse';
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
};

const tones = {
  brand: { ink: colors.brandStrong, ground: colors.brandSoft, floor: colors.brandMedium },
  muted: { ink: colors.muted, ground: colors.surfaceHigh, floor: colors.line },
  inverse: { ink: colors.white, ground: colors.brand, floor: colors.brandMedium },
};

const CYCLE_MS = 1800;
const FRAME_MS = 32;

export function MovementPictogram({ pattern, size = 44, tone = 'brand', animated = true, style }: Props) {
  const { ink, ground, floor } = tones[tone];
  const figure = figures[pattern];
  const shouldAnimate = animated && tone !== 'muted';
  const [reduceMotion, setReduceMotion] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((enabled) => { if (active) setReduceMotion(enabled); })
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (enabled) => {
      if (active) setReduceMotion(enabled);
    });
    return () => {
      active = false;
      sub?.remove?.();
    };
  }, []);

  useEffect(() => {
    if (!shouldAnimate || reduceMotion) return;
    let rafId = 0;
    let lastDraw = 0;
    const start = Date.now();
    const tick = () => {
      const now = Date.now();
      if (now - lastDraw >= FRAME_MS) {
        lastDraw = now;
        const phase = ((now - start) % CYCLE_MS) / CYCLE_MS;
        setProgress(0.5 - 0.5 * Math.cos(phase * Math.PI * 2));
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [shouldAnimate, reduceMotion, pattern]);

  const body = shouldAnimate && !reduceMotion
    ? interpolateStrokes(figure.from, figure.to, progress)
    : figure.to;

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width: size,
          height: size,
          borderRadius: size >= 96 ? radius.lg : radius.sm,
          backgroundColor: ground,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Svg width={size * 0.82} height={size * 0.82} viewBox="0 0 48 48">
        {figure.floor && (
          <Line
            x1={figure.floor[0]}
            y1={figure.floor[1]}
            x2={figure.floor[2]}
            y2={figure.floor[3]}
            stroke={floor}
            strokeWidth={2}
            strokeLinecap="round"
          />
        )}
        {body.map((stroke, index) => stroke.kind === 'circle'
          ? (
            <Circle
              key={index}
              cx={stroke.cx}
              cy={stroke.cy}
              r={stroke.r}
              stroke={ink}
              strokeWidth={2.6}
              fill={stroke.fill ? ink : 'none'}
            />
          )
          : stroke.points.length === 4
            ? (
              <Line
                key={index}
                x1={stroke.points[0]}
                y1={stroke.points[1]}
                x2={stroke.points[2]}
                y2={stroke.points[3]}
                stroke={ink}
                strokeWidth={2.6}
                strokeLinecap="round"
              />
            )
            : (
              <Polyline
                key={index}
                points={stroke.points.join(' ')}
                stroke={ink}
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
      </Svg>
    </View>
  );
}
