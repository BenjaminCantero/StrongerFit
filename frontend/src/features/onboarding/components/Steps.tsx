import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { FormField } from '../../../components/ui/FormField';
import { colors, radius, spacing } from '../../../theme';
import { formatProgressDate } from '../../progress/presentation';
import { shiftDate } from '../../../shared/calendar';
import { athleteDays, hasHealthRisk, labels, paceSummary, toggle, type Draft, type DraftField, type Equipment, type HealthFlag } from '../domain/onboarding';
import { ChoiceChips } from '../../../components/ui/ChoiceChips';
import { CheckRow } from './CheckRow';

export type StepProps = {
  draft: Draft;
  errors: Partial<Record<DraftField, string>>;
  set: <K extends DraftField>(field: K, value: Draft[K]) => void;
};

const decimal = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format;

function Note({ icon, children, tone = 'neutral' }: { icon: 'information-circle-outline' | 'warning-outline' | 'medkit-outline'; children: string; tone?: 'neutral' | 'warning' }) {
  return <View style={[styles.note, tone === 'warning' && styles.warning]}>
    <Ionicons name={icon} size={20} color={tone === 'warning' ? colors.gold : colors.brand} />
    <AppText variant="caption" tone="muted" style={styles.noteText}>{children}</AppText>
  </View>;
}

const row = (children: ReactNode) => <View style={styles.row}>{children}</View>;

export function BasicsStep({ draft, errors, set }: StepProps) {
  return <>
    <FormField label="¿Cómo quieres que te llamemos?" value={draft.name} onChange={(v) => set('name', v)} error={errors.name} autoComplete="given-name" maxLength={60} />
    {row(<>
      <View style={styles.cell}><FormField label="Edad" unit="años" value={draft.age} onChange={(v) => set('age', v)} error={errors.age} keyboardType="number-pad" maxLength={3} /></View>
      <View style={styles.cell}><FormField label="Altura" unit="cm" value={draft.height} onChange={(v) => set('height', v)} error={errors.height} keyboardType="number-pad" maxLength={3} /></View>
    </>)}
    <FormField label="Peso actual" unit="kg" value={draft.weight} onChange={(v) => set('weight', v)} error={errors.weight} keyboardType="decimal-pad" maxLength={5} placeholder="Ej: 71,4" />
    <ChoiceChips label="Sexo para la fórmula de energía" options={labels.sex} value={draft.sex} onChange={(v) => set('sex', v)} error={errors.sex} />
    <ChoiceChips label="Actividad diaria fuera del entrenamiento" options={labels.activity} value={draft.activity} onChange={(v) => set('activity', v)} error={errors.activity} />
    <Note icon="information-circle-outline">Usamos estos datos para estimar tu gasto energético con la ecuación de Mifflin-St Jeor. Es una referencia, no una medición clínica.</Note>
  </>;
}

export function TrainingStep({ draft, errors, set }: StepProps) {
  const range = athleteDays[draft.athleteProfile];
  return <>
    <ChoiceChips label="Objetivo principal" options={labels.goal} value={draft.goal} onChange={(v) => set('goal', v)} error={errors.goal} />
    <ChoiceChips label="Nivel de experiencia" options={labels.level} value={draft.level} onChange={(v) => set('level', v)} error={errors.level} />
    <ChoiceChips label="Perfil de deportista" options={labels.athleteProfile} value={draft.athleteProfile} onChange={(v) => set('athleteProfile', v)} />
    <AppText variant="caption" tone="muted">
      {draft.athleteProfile === 'general'
        ? 'General: 2 a 5 días, 2 a 4 series de 8 a 12 repeticiones y sesiones de 30 a 60 min.'
        : 'Fuerza e hipertrofia: 3 a 6 días, 3 a 4 series y bloques de 4 semanas con una de descarga.'}
    </AppText>
    {row(<>
      <View style={styles.cell}><FormField label="Días por semana" value={draft.days} onChange={(v) => set('days', v)} error={errors.days}
        keyboardType="number-pad" maxLength={1} placeholder={`${range.min} a ${range.max}`} /></View>
      <View style={styles.cell}><FormField label="Por sesión" unit="min" value={draft.minutes} onChange={(v) => set('minutes', v)} error={errors.minutes}
        keyboardType="number-pad" maxLength={3} /></View>
    </>)}
    <ChoiceChips<Equipment> multiple label="Equipamiento disponible" options={labels.equipment} value={draft.equipment}
      onChange={(v) => set('equipment', toggle(draft.equipment, v))} error={errors.equipment} />
  </>;
}

export function WeightStep({ draft, errors, set, today }: StepProps & { today: string }) {
  const summary = paceSummary(draft);
  return <>
    <CheckRow title="Prefiero no definir un objetivo de peso ahora" description="Podrás crearlo más adelante desde Progreso."
      checked={!draft.setWeightGoal} onToggle={() => set('setWeightGoal', !draft.setWeightGoal)} />
    {draft.setWeightGoal && <>
      <AppText tone="muted">Peso inicial: {draft.weight ? `${draft.weight} kg` : 'indícalo en el paso 1'}</AppText>
      {row(<>
        <View style={styles.cell}><FormField label="Peso meta" unit="kg" value={draft.targetWeight} onChange={(v) => { set('targetWeight', v); set('paceConfirmed', false); }}
          error={errors.targetWeight} keyboardType="decimal-pad" maxLength={5} /></View>
        <View style={styles.cell}><FormField label="Plazo" unit="semanas" value={draft.weeks} onChange={(v) => { set('weeks', v); set('paceConfirmed', false); }}
          error={errors.weeks} keyboardType="number-pad" maxLength={3} /></View>
      </>)}
      {summary && <View style={styles.summary} accessibilityLiveRegion="polite">
        <AppText variant="strong">Ritmo de {decimal(Math.abs(summary.pace.kgPerWeek))} kg por semana</AppText>
        <AppText variant="caption" tone="muted">
          {decimal(summary.pace.percentPerWeek)} % de tu peso inicial por semana · Término el {formatProgressDate(shiftDate(today, summary.weeks * 7))}
        </AppText>
      </View>}
      {summary?.pace.exceeds && <CheckRow title="Revisé el ritmo y quiero mantenerlo"
        description="Supera el 1 % de tu peso por semana. No haremos recomendaciones automáticas para este ritmo; te sugerimos revisarlo con un profesional."
        checked={draft.paceConfirmed} onToggle={() => set('paceConfirmed', !draft.paceConfirmed)} />}
      {!!errors.paceConfirmed && <AppText accessibilityRole="alert" variant="caption" style={styles.error}>{errors.paceConfirmed}</AppText>}
      <Note icon="information-circle-outline">El gráfico mostrará tus pesajes, la tendencia y la línea ideal. Con menos de 3 pesajes no sacaremos conclusiones.</Note>
    </>}
  </>;
}

export function NutritionStep({ draft, errors, set }: StepProps) {
  return <>
    <FormField label="Alergias o alimentos excluidos" value={draft.exclusions} onChange={(v) => set('exclusions', v)} error={errors.exclusions}
      multiline placeholder="Ej: gluten, maní" hint="Separa cada exclusión con una coma." />
    <Note icon="warning-outline" tone="warning">Las exclusiones se aplican como restricción obligatoria. Revisa siempre el etiquetado: puede haber errores o contaminación cruzada.</Note>
    <FormField label="Enfoque dietario (opcional)" value={draft.dietFocus} onChange={(v) => set('dietFocus', v)} error={errors.dietFocus} maxLength={120} placeholder="Ej: mediterránea" />
    <AppText variant="caption" tone="muted">Unidades: kilogramos, centímetros, gramos y kcal.</AppText>
  </>;
}

const healthOptions: { id: HealthFlag; title: string; description: string }[] = [
  { id: 'injury', title: 'Lesiones articulares o musculares activas', description: 'Por ejemplo, en columna, hombros, rodillas o tobillos.' },
  { id: 'cardiovascular', title: 'Condiciones cardiovasculares o hipertensión', description: 'Incluye indicaciones médicas de limitar el esfuerzo.' },
  { id: 'pregnancy', title: 'Embarazo o posparto reciente', description: 'Hasta un año después del parto.' },
  { id: 'eating-disorder', title: 'Antecedentes de trastornos de la conducta alimentaria', description: 'Actuales o pasados.' },
];

export function HealthStep({ draft, errors, set, summary }: StepProps & { summary: { label: string; value: string }[] }) {
  const risk = hasHealthRisk(draft.healthFlags);
  return <>
    <CheckRow title="Leí el aviso de salud" checked={draft.disclaimerRead} onToggle={() => set('disclaimerRead', !draft.disclaimerRead)}
      description="Las recomendaciones y cálculos son estimaciones de referencia. No reemplazan la orientación de un profesional de la salud." />
    {!!errors.disclaimerRead && <AppText accessibilityRole="alert" variant="caption" style={styles.error}>{errors.disclaimerRead}</AppText>}

    <View style={styles.group}>
      <AppText variant="header" accessibilityRole="header">Cuestionario de aptitud</AppText>
      <AppText variant="caption" tone="muted">Marca lo que aplique a tu situación actual.</AppText>
      {healthOptions.map((option) => <CheckRow key={option.id} title={option.title} description={option.description}
        checked={draft.healthFlags.includes(option.id)}
        onToggle={() => { set('healthFlags', toggle(draft.healthFlags, option.id)); set('noHealthFlags', false); }} />)}
      <CheckRow title="Ninguna aplica" checked={draft.noHealthFlags}
        onToggle={() => { set('noHealthFlags', !draft.noHealthFlags); set('healthFlags', []); }} />
      {!!errors.healthFlags && <AppText accessibilityRole="alert" variant="caption" style={styles.error}>{errors.healthFlags}</AppText>}
      {risk && <Note icon="medkit-outline" tone="warning">Te recomendamos consultar con un profesional de la salud antes de comenzar. Mientras tanto, la app no te propondrá déficit calórico ni minutas restrictivas.</Note>}
    </View>

    <View style={styles.group}>
      <AppText variant="header" accessibilityRole="header">Tus elecciones</AppText>
      <View style={styles.summary}>
        {summary.map((item) => <View key={item.label} style={styles.summaryItem}>
          <AppText variant="caption" tone="muted">{item.label}</AppText>
          <AppText variant="strong">{item.value}</AppText>
        </View>)}
      </View>
    </View>

    <CheckRow title="Autorizo el tratamiento de mis datos de salud" checked={draft.consent} onToggle={() => set('consent', !draft.consent)}
      description="Peso, medidas, alimentación y condiciones declaradas se usan solo para estimar tu plan, según la Ley 19.628 y la Ley 21.719. Puedes exportar o eliminar tus datos desde Perfil." />
    {!!errors.consent && <AppText accessibilityRole="alert" variant="caption" style={styles.error}>{errors.consent}</AppText>}
  </>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: { flex: 1, minWidth: 130 },
  group: { gap: spacing.md },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceLow },
  warning: { backgroundColor: colors.sand },
  noteText: { flex: 1 },
  summary: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surface },
  summaryItem: { gap: 2 },
  error: { color: colors.error },
});
