import Ionicons from '@expo/vector-icons/Ionicons';
import {
  exerciseById, planFromProgram, PROGRAMS_SOURCE, weekdayLabels, type Plan, type PlanChange, type PlanInput, type Program,
} from '@strongerfit/training-engine';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen } from '../../components/Screen';
import { AppButton } from '../../components/ui/AppButton';
import { AppDialog } from '../../components/ui/AppDialog';
import { AppText } from '../../components/ui/AppText';
import { Card } from '../../components/ui/Card';
import { colors, layout, radius, spacing } from '../../theme';
import { labels } from '../onboarding/domain/onboarding';
import { MovementPictogram } from './components/MovementPictogram';
import { focusLabels, signature } from './ProgramsScreen';

type Props = { program: Program; input: PlanInput; hasPlan: boolean; active: boolean; onApply: (plan: Plan) => void };

const name = (id: string) => exerciseById(id)?.name ?? id;
function changeText(change: PlanChange) {
  if (change.action === 'substituted') return `${name(change.exerciseId)} → ${name(change.replacementId!)} (falta equipo)`;
  return `${name(change.exerciseId)} se quita (${change.reason === 'injury' ? 'zona con lesión declarada' : 'falta equipo'})`;
}
const reps = (min: number, max: number) => min === max ? `${min}` : `${min}–${max}`;

export function ProgramDetailScreen({ program, input, hasPlan, active, onApply }: Props) {
  const [confirming, setConfirming] = useState(false);
  const fit = planFromProgram(program, input);
  const apply = () => { if (fit.ok) onApply(fit.plan); };

  return <View style={styles.screen}>
    <Screen>
      <View style={styles.hero}>
        <View style={styles.strip}>
          {signature(program).map((pattern, index) => <MovementPictogram key={index} pattern={pattern} size={56} tone="inverse" />)}
        </View>
        <View style={styles.heading}>
          <AppText variant="title" accessibilityRole="header">{program.name}</AppText>
          <AppText tone="muted">
            {[program.author, `${program.perWeek} días por semana`, focusLabels[program.focus], labels.level[program.level]].filter(Boolean).join(' · ')}
          </AppText>
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="header" accessibilityRole="header">Cómo se entrena</AppText>
        <AppText>{program.howTo}</AppText>
        {program.perWeek > program.days.length && <AppText variant="caption" tone="muted">
          Tiene {program.days.length} sesiones que se alternan: una semana A-B-A, la siguiente B-A-B.
        </AppText>}
      </View>

      {!fit.ok && <View style={[styles.notice, styles.noticeLocked]}>
        <Ionicons name="lock-closed-outline" size={20} color={colors.muted} />
        <View style={styles.flex}>
          <AppText variant="strong">No calza con tu equipo</AppText>
          <AppText variant="caption">Faltaría el equipo de: {fit.missing.map(name).join(', ')}. Agrégalo en tu perfil si lo tienes.</AppText>
        </View>
      </View>}
      {fit.ok && fit.plan.changes.length > 0 && <View style={styles.notice}>
        <Ionicons name="swap-horizontal-outline" size={20} color={colors.gold} />
        <View style={styles.flex}>
          <AppText variant="strong">Lo adaptamos a ti</AppText>
          {fit.plan.changes.map((change) => <AppText key={`${change.day}-${change.exerciseId}-${change.action}`} variant="caption">
            {weekdayLabels[program.days[change.day]!.weekday]}: {changeText(change)}
          </AppText>)}
        </View>
      </View>}

      {program.days.map((day) => <Card key={day.name} tone="low" style={styles.day}>
        <View>
          <AppText variant="label" tone="brand">{weekdayLabels[day.weekday]}</AppText>
          <AppText variant="heading">{day.name}</AppText>
        </View>
        {day.exercises.map((item, index) => {
          const exercise = exerciseById(item.exerciseId)!;
          return <View key={`${item.exerciseId}-${index}`} style={styles.exercise}>
            <MovementPictogram pattern={exercise.pattern} size={40} />
            <View style={styles.flex}>
              <AppText variant="strong">{exercise.name}</AppText>
              <AppText variant="caption" tone="muted">{item.sets} × {reps(item.repsMin, item.repsMax)} reps · RIR {item.rir} · {item.restSeconds} s de descanso</AppText>
              {item.note && <AppText variant="caption" style={styles.note}>{item.note}</AppText>}
            </View>
          </View>;
        })}
      </Card>)}

      <AppText variant="caption" tone="muted">
        Transcripción no oficial; el nombre identifica el programa de su autor y no implica respaldo. Estructura adaptada de {PROGRAMS_SOURCE.source}
        {' '}({PROGRAMS_SOURCE.url}), {PROGRAMS_SOURCE.copyright}, licencia {PROGRAMS_SOURCE.license}. Series y cargas son de referencia y requieren revisión profesional.
      </AppText>
    </Screen>

    {fit.ok && <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.footer}>
      <View style={styles.footerContent}>
        {active
          ? <AppText variant="strong" tone="brand" style={styles.center}>Este es tu programa actual</AppText>
          : <AppButton label="Usar este programa" icon="checkmark-circle-outline" style={styles.confirm}
            onPress={() => hasPlan ? setConfirming(true) : apply()} />}
      </View>
    </SafeAreaView>}

    <AppDialog title="¿Reemplazar tu rutina?" visible={confirming} onClose={() => setConfirming(false)}>
      <AppText tone="muted">Tu plan actual y sus ediciones se reemplazan por {program.name}. El historial de entrenamientos no cambia.</AppText>
      <AppButton label="Usar este programa" icon="checkmark-circle-outline" onPress={() => { setConfirming(false); apply(); }} />
      <AppButton label="Mantener mi rutina" variant="secondary" onPress={() => setConfirming(false)} />
    </AppDialog>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  hero: { gap: spacing.lg },
  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.brand, alignSelf: 'flex-start' },
  heading: { gap: spacing.xs },
  section: { gap: spacing.sm },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.sand },
  noticeLocked: { backgroundColor: colors.surfaceHigh },
  flex: { flex: 1, gap: 2 },
  day: { padding: spacing.lg, gap: spacing.md },
  exercise: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  note: { color: colors.brandText },
  footer: { backgroundColor: colors.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.surfaceHigh },
  footerContent: { width: '100%', maxWidth: layout.contentWidth, alignSelf: 'center', padding: spacing.lg, gap: spacing.xs },
  confirm: { backgroundColor: colors.brandStrong },
  center: { textAlign: 'center' },
});
