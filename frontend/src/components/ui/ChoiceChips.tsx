import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { AppPressable } from './AppPressable';
import { AppText } from './AppText';
import { colors, layout, radius, spacing } from '../../theme';

type Props<T extends string> = {
  label: string; options: Record<T, string>; error?: string;
} & ({ multiple?: false; value: T | null; onChange: (value: T) => void } | { multiple: true; value: T[]; onChange: (value: T) => void });

export function ChoiceChips<T extends string>({ label, options, error, ...props }: Props<T>) {
  const selected = (id: T) => props.multiple ? props.value.includes(id) : props.value === id;
  return <View style={styles.field}>
    <AppText variant="label">{label}</AppText>
    <View role={props.multiple ? 'group' : 'radiogroup'} accessibilityLabel={label} style={styles.row}>
      {(Object.keys(options) as T[]).map((id) => <AppPressable key={id} accessibilityRole={props.multiple ? 'checkbox' : 'radio'}
        accessibilityState={{ checked: selected(id) }} aria-checked={selected(id)} onPress={() => props.onChange(id)}
        style={({ pressed }) => [styles.chip, selected(id) && styles.selected, pressed && styles.pressed]}>
        {selected(id) && <Ionicons name="checkmark" size={16} color={colors.white} />}
        <AppText variant="label" tone={selected(id) ? 'white' : 'default'}>{options[id]}</AppText>
      </AppPressable>)}
    </View>
    {!!error && <AppText accessibilityRole="alert" variant="caption" style={styles.error}>{error}</AppText>}
  </View>;
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minHeight: layout.touchTarget, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg,
    borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceHigh },
  selected: { backgroundColor: colors.brand, borderColor: colors.brand },
  pressed: { opacity: 0.7 },
  error: { color: colors.error },
});
