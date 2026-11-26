import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { AppPressable } from './AppPressable';
import { AppText } from './AppText';
import { colors, fontFamily, layout, radius, spacing } from '../../theme';

type Props = Omit<TextInputProps, 'style' | 'onChange' | 'onChangeText'> & {
  label: string; value: string; onChange: (value: string) => void; error?: string; unit?: string; hint?: string;
};

export function FormField({ label, value, onChange, error, unit, hint, multiline, secureTextEntry, ...input }: Props) {
  // Los campos de contraseña traen un ojo para mostrar u ocultar lo escrito (oculto por defecto).
  const [revealed, setRevealed] = useState(false);
  return <View style={styles.field}>
    <AppText variant="label">{label}</AppText>
    <View style={styles.row}>
      <TextInput {...input} accessibilityLabel={unit ? `${label} en ${unit}` : label} accessibilityHint={hint}
        value={value} onChangeText={onChange} multiline={multiline} secureTextEntry={secureTextEntry && !revealed} placeholderTextColor={colors.muted}
        selectionColor={colors.brandSoft} underlineColorAndroid="transparent"
        style={[styles.input, multiline && styles.multiline, !!error && styles.invalid]} />
      {secureTextEntry && <AppPressable accessibilityRole="button" accessibilityLabel={revealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        onPress={() => setRevealed((current) => !current)} style={styles.eye}>
        <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.muted} />
      </AppPressable>}
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
  eye: { width: layout.touchTarget, height: layout.touchTarget, alignItems: 'center', justifyContent: 'center' },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  invalid: { borderColor: colors.error },
  error: { color: colors.error },
});
