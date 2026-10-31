import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { colors, radius, spacing } from '../../../theme';
import type { HomeOverview } from '../home.types';

const kg = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 });
const shortDate = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', timeZone: 'UTC' });

function Point({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return <View style={styles.point}>
    <AppText variant="caption" tone="muted">{label}</AppText>
    <AppText variant={strong ? 'heading' : 'strong'} tone={strong ? 'brand' : undefined}>{kg.format(value)} kg</AppText>
  </View>;
}

export function WeightGoal({ weight, onPress }: { weight: NonNullable<HomeOverview['weight']>; onPress: () => void }) {
  const difference = Math.round((weight.targetKg - weight.currentKg) * 10) / 10;
  const reached = weight.progress >= 1;
  return (
    <Card tone="low">
      <View style={styles.top}>
        <View style={styles.title}>
          <Ionicons name="trending-up-outline" size={19} color={colors.brand} />
          <AppText variant="header" accessibilityRole="header">Objetivo de peso</AppText>
        </View>
        <AppText variant="label" tone="muted">
          {weight.weeksLeft > 0 ? `${weight.weeksLeft} sem · ${shortDate.format(new Date(`${weight.endDate}T12:00:00Z`)).replace('.', '')}` : 'Plazo cumplido'}
        </AppText>
      </View>
      <View style={styles.panel}>
        <View style={styles.points}>
          <Point label="Inicio" value={weight.startKg} />
          <Point label="Actual" value={weight.currentKg} strong />
          <Point label="Meta" value={weight.targetKg} />
        </View>
        <ProgressBar value={Math.round(weight.progress * 100)} target={100} label="Avance hacia la meta de peso, en porcentaje" />
        <AppText variant="caption" tone="muted">
          {reached ? 'Llegaste a tu meta. Puedes definir una nueva desde tu perfil.'
            : `Faltan ${kg.format(Math.abs(difference))} kg. Los cambios semana a semana fluctúan; mira la tendencia.`}
        </AppText>
      </View>
      <AppButton label="Registrar peso" icon="scale-outline" variant="secondary" onPress={onPress} />
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  title: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  panel: { padding: spacing.lg, gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.lg },
  points: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: spacing.sm },
  point: { gap: 2, minWidth: 70 },
});
