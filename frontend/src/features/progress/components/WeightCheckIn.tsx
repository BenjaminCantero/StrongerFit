import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import { Keyboard, StyleSheet, TextInput, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppPressable } from '../../../components/ui/AppPressable';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { colors, fontFamily, layout, radius, spacing } from '../../../theme';
import { parseWeight, type WeightRecord } from '../domain/progress';
import { formatKg, formatProgressDate } from '../presentation';

export function WeightCheckIn({ record, today, onSave }: { record: WeightRecord | null; today: string; onSave: (value: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const input = useRef<TextInput>(null);

  function close() { setEditing(false); setError(''); Keyboard.dismiss(); }
  function save() {
    if (parseWeight(value) === null) { setError('Ingresa un peso mayor que 0, con hasta tres cifras enteras y dos decimales.'); input.current?.focus(); return; }
    onSave(value);
    close();
    setNotice('Peso anotado en esta vista. Se conserva solo mientras la app está abierta.');
  }

  return <Card tone="low">
    <View style={styles.top}>
      <View style={styles.heading}>
        <AppText variant="header" accessibilityRole="header">Registro corporal referencial</AppText>
        <AppText variant="heading">{record ? `${formatKg(record.kg)} kg` : 'Sin registros de peso'}</AppText>
        {record && <AppText variant="caption" tone="muted">Registrado el {formatProgressDate(record.date)}</AppText>}
      </View>
      <AppButton label={record?.date === today ? 'Editar peso de hoy' : 'Registrar peso hoy'} icon="add-outline" variant="secondary"
        onPress={() => { setValue(record?.date === today ? String(record.kg).replace('.', ',') : ''); setNotice(''); setEditing(true); }} />
    </View>
    <View style={styles.note}>
      <Ionicons name="leaf-outline" size={22} color={colors.gold} />
      <AppText variant="caption" tone="muted" style={styles.noteText}>El peso es una referencia más. No resume por sí solo tu fuerza, tu constancia ni tu bienestar.</AppText>
    </View>
    {editing && <View style={styles.editor}>
      <View style={styles.editorTop}>
        <AppText variant="label" style={styles.editorTitle}>Ingresa tu peso de hoy</AppText>
        <AppPressable accessibilityRole="button" accessibilityLabel="Cancelar registro de peso" onPress={close} style={styles.close}>
          <Ionicons name="close" size={22} color={colors.muted} />
        </AppPressable>
      </View>
      <View style={styles.row}>
        <TextInput ref={input} accessibilityLabel="Peso de hoy en kilogramos" accessibilityHint="Por ejemplo, 71 coma 4."
          value={value} onChangeText={(text) => { setValue(text); setError(''); }} keyboardType="decimal-pad" maxLength={6}
          placeholder="Ej: 71,4" placeholderTextColor={colors.muted} selectionColor={colors.brandSoft}
          underlineColorAndroid="transparent" onSubmitEditing={save} style={styles.input} />
        <AppText variant="label" tone="muted">kg</AppText>
      </View>
      {!!error && <AppText accessibilityRole="alert" variant="caption" style={styles.error}>{error}</AppText>}
      <AppButton label="Guardar peso en esta vista" icon="checkmark-outline" onPress={save} />
    </View>}
    {!!notice && <AppText accessibilityLiveRegion="polite" variant="caption" tone="brand">{notice}</AppText>}
  </Card>;
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md },
  heading: { flex: 1, minWidth: 160, gap: spacing.xs },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md },
  noteText: { flex: 1 },
  editor: { backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.md, gap: spacing.md },
  editorTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  editorTitle: { flex: 1 },
  close: { width: layout.touchTarget, height: layout.touchTarget, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: { flex: 1, minHeight: layout.touchTarget, padding: spacing.md, borderRadius: radius.sm, fontFamily: fontFamily.body,
    fontSize: 16, color: colors.ink, backgroundColor: colors.surfaceLow },
  error: { color: colors.error },
});
