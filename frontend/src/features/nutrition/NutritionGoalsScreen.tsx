import Ionicons from '@expo/vector-icons/Ionicons';
import { activityFactors, limits, type Direction, type Warning } from '@strongerfit/nutrition-engine';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { AppButton } from '../../components/ui/AppButton';
import { AppText } from '../../components/ui/AppText';
import { Card } from '../../components/ui/Card';
import { ChoiceChips } from '../../components/ui/ChoiceChips';
import { colors, radius, spacing } from '../../theme';
import { labels } from '../onboarding/domain/onboarding';
import type { ProfileData } from '../profile/domain/profile';
import { calculateGoals, defaultSettings, goalPerson, type GoalSettings } from './domain/goals';
import { formatKcal } from './presentation';

const number = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 3 }).format;
const percent = (value: number) => `${Math.round(value * 100)} %`;
// Claves con decimales fijos: una clave entera («2») se ordenaría antes que el resto.
const key = (value: number) => value.toFixed(2);
const options = (values: readonly number[], format: (value: number) => string) =>
  Object.fromEntries(values.map((value) => [key(value), format(value)])) as Record<string, string>;

const directions: Record<Direction, string> = { deficit: 'Déficit', maintenance: 'Mantener', surplus: 'Superávit' };
const warningText: Record<Warning, string> = {
  'floor-applied': 'El cálculo quedó bajo el piso de seguridad, así que mostramos el piso. Una meta menor requiere evaluación profesional.',
  'risk-no-deficit': 'Por las condiciones que declaraste no proponemos déficit. Consulta con un profesional antes de reducir tu ingesta.',
  'adjustment-capped': 'El ajuste se limitó al máximo permitido.',
  'unspecified-sex': 'Sin sexo declarado usamos un promedio de la fórmula y el piso de seguridad más alto.',
};

type Props = { profile: ProfileData; onSave: (settings: GoalSettings, result: ReturnType<typeof calculateGoals>) => void; onEditProfile: () => void };

export function NutritionGoalsScreen({ profile, onSave, onEditProfile }: Props) {
  const [settings, setSettings] = useState(() => defaultSettings(profile));
  const person = goalPerson(profile);

  if (!person.ok) return <Screen safeBottom>
    <Card>
      <AppText variant="heading" accessibilityRole="header">Faltan datos para calcular tu meta</AppText>
      <AppText tone="muted">Necesitamos {person.missing.join(', ')}. No estimamos datos que no nos diste.</AppText>
      <AppButton label="Completar mi perfil" icon="person-outline" onPress={onEditProfile} />
    </Card>
  </Screen>;

  const risk = person.person.healthRisk;
  const result = calculateGoals(person.person, settings);
  const update = (patch: Partial<GoalSettings>) => setSettings((current) => ({ ...current, ...patch }));
  const chooseDirection = (direction: Direction) => update({ direction,
    adjustment: direction === 'deficit' ? limits.deficit.default : direction === 'surplus' ? limits.surplus.default : 0 });
  const available = risk ? { maintenance: directions.maintenance, surplus: directions.surplus } : directions;
  const adjustments = settings.direction === 'deficit' ? limits.deficit.options : limits.surplus.options;
  const activity = profile.onboarding!.activity;

  return <Screen safeBottom>
    <Card tone="low">
      <AppText variant="header" accessibilityRole="header">Tu gasto estimado</AppText>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <AppText variant="caption" tone="muted">Metabolismo basal</AppText>
          <AppText variant="heading">{formatKcal(result.bmr)} kcal</AppText>
        </View>
        <View style={styles.stat}>
          <AppText variant="caption" tone="muted">Gasto total diario</AppText>
          <AppText variant="heading">{formatKcal(result.tdee)} kcal</AppText>
        </View>
      </View>
      <AppText variant="caption" tone="muted">
        Estimación con Mifflin-St Jeor y actividad {labels.activity[activity].toLowerCase()} (×{number(activityFactors[activity])}). No es una medición clínica.
      </AppText>
    </Card>

    <ChoiceChips label="¿Qué quieres hacer con tu energía?" options={available as Record<Direction, string>} value={settings.direction} onChange={chooseDirection} />
    {risk && <AppText variant="caption" tone="muted">El déficit no está disponible porque declaraste condiciones de salud.</AppText>}
    {settings.direction !== 'maintenance' && <ChoiceChips label={settings.direction === 'deficit' ? 'Déficit sobre tu gasto' : 'Superávit sobre tu gasto'}
      options={options(adjustments, percent)} value={key(settings.adjustment)} onChange={(value) => update({ adjustment: Number(value) })} />}
    <ChoiceChips label="Proteína por kg de peso" options={options(limits.proteinPerKg.options, (v) => `${number(v)} g`)}
      value={key(settings.proteinPerKg)} onChange={(value) => update({ proteinPerKg: Number(value) })} />
    <ChoiceChips label="Grasa sobre la energía total" options={options(limits.fatShare.options, percent)}
      value={key(settings.fatShare)} onChange={(value) => update({ fatShare: Number(value) })} />

    <Card style={styles.result} accessibilityLiveRegion="polite">
      <AppText variant="label" tone="brand">Meta diaria propuesta</AppText>
      <AppText variant="metric">{formatKcal(result.kcal)} <AppText variant="body" tone="muted">kcal</AppText></AppText>
      <View style={styles.macros}>
        {([['Proteínas', result.protein], ['Carbos', result.carbs], ['Grasas', result.fat]] as const).map(([name, grams]) =>
          <View key={name} style={styles.macro}>
            <AppText variant="caption" tone="muted">{name}</AppText>
            <AppText variant="strong">{grams} g</AppText>
          </View>)}
      </View>
      {result.warnings.map((warning) => <View key={warning} style={styles.warning}>
        <Ionicons name="information-circle-outline" size={18} color={colors.gold} />
        <AppText variant="caption" style={styles.warningText}>{warningText[warning]}</AppText>
      </View>)}
    </Card>

    <AppText variant="caption" tone="muted">
      Las calorías de tus entrenamientos no se suman a esta meta. Proteína y carbohidratos aportan 4 kcal por gramo; la grasa, 9.
      Valores de referencia pendientes de revisión profesional.
    </AppText>
    <AppButton label="Guardar meta" icon="checkmark-outline" onPress={() => onSave(settings, result)} />
  </Screen>;
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  stat: { flex: 1, minWidth: 130, gap: 2 },
  result: { gap: spacing.md },
  macros: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  macro: { flex: 1, minWidth: 90, padding: spacing.md, borderRadius: radius.sm, backgroundColor: colors.canvas, gap: 2 },
  warning: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderRadius: radius.sm, backgroundColor: colors.sand },
  warningText: { flex: 1, color: colors.ink },
});
