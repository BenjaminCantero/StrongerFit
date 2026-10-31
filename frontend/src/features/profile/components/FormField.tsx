import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { colors, fontFamily, layout, radius, spacing } from '../../../theme';

type Props = Omit<TextInputProps, 'style' | 'onChange' | 'onChangeText'> & {
  label: string; value: string; onChange: (value: string) => void; error?: string; unit?: string; hint?: string;
};

export function FormField({ label, value, onChange, error, unit, hint, multiline, ...input }: Props) {
  return <View style={styles.field}>
    <AppText variant="label">{label}</AppText>
    <View style={styles.row}>
      <TextInput {...input} accessibilityLabel={unit ? `${label} en ${unit}` : label} accessibilityHint={hint}
        value={value} onChangeText={onChange} multiline={multiline} placeholderTextColor={colors.muted}
        selectionColor={colors.brandSoft} underlineColorAndroid="transparent"
        style={[styles.input, multiline && styles.multiline, !!error && styles.invalid]} />
      {unit && <AppText variant="label" tone="muted">{unit}</AppText>}
    </View>
    {!!error && <AppText accessibilityRole="alert" variant="caption" style={styles.error}>{error}</AppText>}
  </View>;
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: { flex: 1, minWidth: 0, minHeight: layout.touchTarget, padding: spacing.md, borderRadius: radius.sm, borderWidth: 2,
    borderColor: 'transparent', fontFamily: fontFamily.body, fontSize: 16, color: colors.ink, backgroundColor: colors.surfaceLow },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  invalid: { borderColor: colors.error },
  error: { color: colors.error },
});
