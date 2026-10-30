import tokens from './tokens.json';

export const { colors, spacing, radius, layout } = tokens;

export const fontFamily = {
  body: 'NunitoSansRegular',
  medium: 'NunitoSansSemiBold',
  bold: 'NunitoSansBold',
  heading: 'LiterataBold',
} as const;
