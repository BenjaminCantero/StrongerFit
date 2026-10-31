import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { colors, spacing } from '../../../theme';
import { limits, nutritionForm, parseNutritionForm, parsePersonalForm, personalForm, type FormErrors, type NutritionField,
  type PersonalField, type PersonalValues, type ProfileData } from '../domain/profile';
import { FormField } from '../../../components/ui/FormField';

const personalLabels: Record<PersonalField, string> = {
  name: 'nombre', age: 'edad', height: 'altura', weight: 'peso', goal: 'objetivo', days: 'días por semana',
  minutes: 'minutos por sesión', equipment: 'equipamiento',
};

type EditorProps<Values> = { profile: ProfileData; onSave: (values: Values) => void; onCancel: () => void };

export function PersonalEditor({ profile, onSave, onCancel }: EditorProps<PersonalValues>) {
  const [form, setForm] = useState(() => personalForm(profile));
  const [errors, setErrors] = useState<FormErrors<PersonalField>>({});
  const field = (name: PersonalField) => ({
    value: form[name], error: errors[name],
    onChange: (value: string) => { setForm((current) => ({ ...current, [name]: value })); setErrors((current) => ({ ...current, [name]: undefined })); },
  });
  function save() {
    const result = parsePersonalForm(form);
    if (result.ok) onSave(result.values);
    else setErrors(result.errors);
  }
  return <>
    <AppText tone="muted">Los campos numéricos son opcionales. Puedes dejarlos vacíos si prefieres no indicarlos.</AppText>
    <FormField label="Nombre" {...field('name')} autoComplete="name" maxLength={60} />
    <View style={styles.row}>
      <View style={styles.cell}><FormField label="Edad" unit="años" {...field('age')} keyboardType="number-pad" maxLength={3}
        hint={`Entre ${limits.age.min} y ${limits.age.max}.`} /></View>
      <View style={styles.cell}><FormField label="Altura" unit="cm" {...field('height')} keyboardType="number-pad" maxLength={3} /></View>
    </View>
    <FormField label="Peso de referencia" unit="kg" {...field('weight')} keyboardType="decimal-pad" maxLength={5} placeholder="Ej: 71,4" />
    <FormField label="Objetivo principal" {...field('goal')} maxLength={120} placeholder="Ej: ganar fuerza" />
    <View style={styles.row}>
      <View style={styles.cell}><FormField label="Días por semana" {...field('days')} keyboardType="number-pad" maxLength={1} /></View>
      <View style={styles.cell}><FormField label="Por sesión" unit="min" {...field('minutes')} keyboardType="number-pad" maxLength={3} /></View>
    </View>
    <FormField label="Equipamiento disponible" {...field('equipment')} maxLength={120} multiline placeholder="Ej: mancuernas y banco plano" />
    {Object.values(errors).some(Boolean) && <AppText accessibilityRole="alert" variant="caption" style={styles.error}>
      Revisa: {(Object.keys(errors) as PersonalField[]).filter((key) => errors[key]).map((key) => personalLabels[key]).join(', ')}.
    </AppText>}
    <AppButton label="Guardar cambios" icon="checkmark-outline" onPress={save} />
    <AppButton label="Cancelar" variant="secondary" onPress={onCancel} />
  </>;
}

export function NutritionEditor({ profile, onSave, onCancel }: EditorProps<{ exclusions: string[]; dietFocus: string }>) {
  const [form, setForm] = useState(() => nutritionForm(profile));
  const [errors, setErrors] = useState<FormErrors<NutritionField>>({});
  const field = (name: NutritionField) => ({
    value: form[name], error: errors[name],
    onChange: (value: string) => { setForm((current) => ({ ...current, [name]: value })); setErrors((current) => ({ ...current, [name]: undefined })); },
  });
  function save() {
    const result = parseNutritionForm(form);
    if (result.ok) onSave({ exclusions: result.exclusions, dietFocus: result.dietFocus });
    else setErrors(result.errors);
  }
  return <>
    <FormField label="Alergias o alimentos excluidos" {...field('exclusions')} multiline placeholder="Ej: gluten, maní"
      hint="Separa cada exclusión con una coma." />
    <AppText variant="caption" tone="muted">Separa cada una con una coma. Revisa siempre el etiquetado: puede haber errores o contaminación cruzada.</AppText>
    <FormField label="Enfoque dietario" {...field('dietFocus')} maxLength={120} placeholder="Ej: mediterránea" />
    <AppButton label="Guardar cambios" icon="checkmark-outline" onPress={save} />
    <AppButton label="Cancelar" variant="secondary" onPress={onCancel} />
  </>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: { flex: 1, minWidth: 130 },
  error: { color: colors.error },
});
