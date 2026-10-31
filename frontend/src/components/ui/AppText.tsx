import { StyleSheet, Text, type TextProps } from 'react-native';
import { colors, fontFamily } from '../../theme';

type TextVariant = 'title' | 'heading' | 'header' | 'metric' | 'body' | 'strong' | 'caption' | 'label';

type Props = TextProps & {
  variant?: TextVariant;
  tone?: 'default' | 'muted' | 'brand' | 'white';
};

export function AppText({ variant = 'body', tone = 'default', style, ...props }: Props) {
  return <Text {...props} style={[styles.base, styles[variant], tones[tone], style]} />;
}

const styles = StyleSheet.create({
  base: { color: colors.ink },
  title: { fontFamily: fontFamily.heading, fontSize: 25, lineHeight: 35 },
  heading: { fontFamily: fontFamily.heading, fontSize: 18, lineHeight: 27 },
  header: { fontFamily: fontFamily.heading, fontSize: 16, lineHeight: 24 },
  metric: { fontFamily: fontFamily.heading, fontSize: 28, lineHeight: 38, fontVariant: ['tabular-nums'] },
  body: { fontFamily: fontFamily.body, fontSize: 15, lineHeight: 23 },
  strong: { fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 23 },
  caption: { fontFamily: fontFamily.body, fontSize: 12, lineHeight: 18 },
  label: { fontFamily: fontFamily.bold, fontSize: 12, lineHeight: 18 },
});

const tones = StyleSheet.create({
  default: { color: colors.ink },
  muted: { color: colors.muted },
  brand: { color: colors.brandText },
  white: { color: colors.white },
});
