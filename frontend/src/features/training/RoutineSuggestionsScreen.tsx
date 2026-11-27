import Ionicons from '@expo/vector-icons/Ionicons';
import { exerciseById, weekdayLabels, type Plan, type PlanInput } from '@strongerfit/training-engine';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { AppButton } from '../../components/ui/AppButton';
import { AppPressable } from '../../components/ui/AppPressable';
import { AppText } from '../../components/ui/AppText';
import { Card } from '../../components/ui/Card';
import { ChoiceChips } from '../../components/ui/ChoiceChips';
import { FormField } from '../../components/ui/FormField';
import { colors, layout, radius, spacing } from '../../theme';
import {
  labels,
  MAX_FOCUS_MUSCLES,
  toggleFocusMuscle,
  type FocusMuscle,
  type Goal,
  type RoutinePreferences,
} from '../onboarding/domain/onboarding';
import { MovementPictogram } from './components/MovementPictogram';
import { suggestRoutines, type RoutineSuggestion } from './domain/suggestions';

const DAY_OPTIONS: Record<'2' | '3' | '4' | '5' | '6', string> = {
  '2': '2 días',
  '3': '3 días',
  '4': '4 días',
  '5': '5 días',
  '6': '6 días',
};

type Props = {
  input: PlanInput | null;
  goal: Goal;
  initialPreferences: RoutinePreferences;
  busy?: boolean;
  error?: string | null;
  onSavePreferences: (prefs: RoutinePreferences, days: number) => void;
  onSelectPlan: (plan: Plan, prefs: RoutinePreferences, days: number) => void;
  onProfile: () => void;
};

export function RoutineSuggestionsScreen({
  input,
  goal,
  initialPreferences,
  busy = false,
  error = null,
  onSavePreferences,
  onSelectPlan,
  onProfile,
}: Props) {
  const [prefs, setPrefs] = useState<RoutinePreferences>(initialPreferences);
  const [days, setDays] = useState<number>(input?.days ?? 3);
  const [showPrefs, setShowPrefs] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const effectiveInput = useMemo(
    () => (input ? { ...input, days } : null),
    [input, days],
  );

  const suggestions = useMemo(
    () => (effectiveInput ? suggestRoutines(effectiveInput, goal, prefs) : []),
    [effectiveInput, goal, prefs],
  );

  if (!effectiveInput) {
    return (
      <Screen safeBottom>
        <Card>
          <AppText variant="heading" accessibilityRole="header">Completa tu perfil primero</AppText>
          <AppText tone="muted">
            Necesitamos conocer tu nivel, equipamiento y zonas con lesión para recomendarte rutinas compatibles.
          </AppText>
          <AppButton label="Ir al cuestionario" icon="arrow-forward-outline" onPress={onProfile} />
        </Card>
      </Screen>
    );
  }

  const updatePrefs = (patch: Partial<RoutinePreferences>) => {
    setPrefs((current) => ({ ...current, ...patch }));
    setSavedNotice(false);
  };

  return (
    <Screen safeBottom>
      <View style={styles.heading}>
        <AppText variant="title" accessibilityRole="header">Sugerencias según tus preferencias</AppText>
        <AppText tone="muted">
          Ajusta cómo quieres entrenar y revisa al instante las rutinas que mejor calzan contigo.
        </AppText>
      </View>

      <View style={styles.prefsCard}>
        <AppPressable
          accessibilityRole="button"
          accessibilityState={{ expanded: showPrefs }}
          onPress={() => setShowPrefs((current) => !current)}
          style={styles.prefsHeader}
        >
          <View style={styles.prefsIcon}>
            <Ionicons name="options-outline" size={20} color={colors.white} />
          </View>
          <View style={styles.flex}>
            <AppText variant="header">Tus preferencias de rutina</AppText>
            <AppText variant="caption" tone="muted">
              {days} días · {labels.preferredSplit[prefs.preferredSplit]} · {labels.trainingStyle[prefs.trainingStyle].split(' (')[0]}
            </AppText>
          </View>
          <Ionicons name={showPrefs ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted} />
        </AppPressable>

        {showPrefs && (
          <View style={styles.prefsBody}>
            <ChoiceChips
              label="Días disponibles por semana"
              options={DAY_OPTIONS}
              value={String(Math.min(6, Math.max(2, days))) as '2' | '3' | '4' | '5' | '6'}
              onChange={(value) => { setDays(Number(value)); setSavedNotice(false); }}
            />
            <ChoiceChips
              label="División de rutina preferida"
              options={labels.preferredSplit}
              value={prefs.preferredSplit}
              onChange={(value) => updatePrefs({ preferredSplit: value })}
            />
            <ChoiceChips<FocusMuscle>
              multiple
              label={`Grupos musculares prioritarios (hasta ${MAX_FOCUS_MUSCLES})`}
              options={labels.focusMuscles}
              value={prefs.focusMuscles}
              onChange={(value) => updatePrefs({ focusMuscles: toggleFocusMuscle(prefs.focusMuscles, value) })}
            />
            <ChoiceChips
              label="Estilo e intensidad"
              options={labels.trainingStyle}
              value={prefs.trainingStyle}
              onChange={(value) => updatePrefs({ trainingStyle: value })}
            />
            <ChoiceChips
              label="Cardio y activación"
              options={labels.cardioPreference}
              value={prefs.cardioPreference}
              onChange={(value) => updatePrefs({ cardioPreference: value })}
            />
            <FormField
              label="Notas o preferencias (opcional)"
              value={prefs.trainingNotes}
              onChange={(value) => updatePrefs({ trainingNotes: value })}
              placeholder="Ej: evitar saltos, foco en postura"
              maxLength={160}
            />
            <AppButton
              label={savedNotice ? 'Preferencias guardadas' : 'Guardar preferencias'}
              icon={savedNotice ? 'checkmark-outline' : 'bookmark-outline'}
              variant="secondary"
              onPress={() => {
                onSavePreferences(prefs, days);
                setSavedNotice(true);
              }}
            />
          </View>
        )}
      </View>

      {!!error && (
        <AppText accessibilityRole="alert" variant="caption" style={styles.error}>
          {error}
        </AppText>
      )}

      <View style={styles.sectionHeader}>
        <AppText variant="heading" accessibilityRole="header">Rutinas recomendadas ({suggestions.length})</AppText>
        <AppText variant="caption" tone="muted">Ordenadas por compatibilidad con tu equipo, tiempo y preferencias.</AppText>
      </View>

      {suggestions.map((item, idx) => (
        <SuggestionCard
          key={item.id}
          suggestion={item}
          top={idx === 0}
          expanded={expandedId === item.id}
          busy={busy}
          onToggleExpand={() => setExpandedId((current) => (current === item.id ? null : item.id))}
          onSelect={() => onSelectPlan(item.plan, prefs, days)}
        />
      ))}
    </Screen>
  );
}

function SuggestionCard({
  suggestion,
  top,
  expanded,
  busy,
  onToggleExpand,
  onSelect,
}: {
  suggestion: RoutineSuggestion;
  top: boolean;
  expanded: boolean;
  busy: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
}) {
  return (
    <View style={[styles.card, top && styles.cardTop]}>
      <View style={styles.badgeRow}>
        <View style={[styles.matchBadge, top && styles.matchBadgeTop]}>
          <Ionicons name={top ? 'sparkles' : 'checkmark-circle-outline'} size={14} color={top ? colors.white : colors.brandText} />
          <AppText variant="label" tone={top ? 'white' : 'brand'}>
            {top ? `Mejor opción · ${suggestion.matchScore}%` : `${suggestion.matchScore}% compatible`}
          </AppText>
        </View>
        <View style={styles.sourcePill}>
          <AppText variant="caption" tone="muted">
            {suggestion.source === 'personalized' ? 'Personalizada' : 'Programa clásico'}
          </AppText>
        </View>
      </View>

      <View style={styles.titleBlock}>
        <AppText variant="heading">{suggestion.title}</AppText>
        <AppText variant="caption" tone="muted">
          {suggestion.daysCount} días/sem · ~{suggestion.estimatedMinutes} min/sesión · {suggestion.splitLabel}
        </AppText>
        <AppText tone="muted">{suggestion.subtitle}</AppText>
      </View>

      <View style={styles.reasons}>
        {suggestion.matchReasons.map((reason) => (
          <View key={reason} style={styles.reasonRow}>
            <Ionicons name="checkmark" size={15} color={colors.brandText} />
            <AppText variant="caption" style={styles.flex}>{reason}</AppText>
          </View>
        ))}
      </View>

      <AppPressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggleExpand}
        style={styles.previewToggle}
      >
        <AppText variant="label" tone="brand">
          {expanded ? 'Ocultar detalle de días' : `Ver ${suggestion.plan.days.length} días y ejercicios`}
        </AppText>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.brandText} />
      </AppPressable>

      {expanded && (
        <View style={styles.daysList}>
          {suggestion.plan.days.map((day, dayIdx) => (
            <View key={`${day.name}-${dayIdx}`} style={styles.dayBlock}>
              <AppText variant="strong">
                {weekdayLabels[day.weekday]} · {day.name}
              </AppText>
              {day.exercises.map((ex, exIdx) => {
                const info = exerciseById(ex.exerciseId);
                return (
                  <View key={`${ex.exerciseId}-${exIdx}`} style={styles.exerciseRow}>
                    {info && <MovementPictogram pattern={info.pattern} size={32} />}
                    <View style={styles.flex}>
                      <AppText variant="caption" style={styles.exerciseName}>{info?.name ?? ex.exerciseId}</AppText>
                      <AppText variant="caption" tone="muted">
                        {ex.sets}×{ex.repsMin === ex.repsMax ? ex.repsMin : `${ex.repsMin}–${ex.repsMax}`} · {ex.restSeconds}s descanso
                        {ex.note ? ` · ${ex.note}` : ''}
                      </AppText>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}

      <AppButton
        label={busy ? 'Aplicando rutina…' : 'Elegir esta rutina'}
        icon="checkmark-outline"
        disabled={busy}
        onPress={onSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { gap: spacing.xs },
  prefsCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.surfaceHigh,
    overflow: 'hidden',
  },
  prefsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    minHeight: layout.touchTarget,
  },
  prefsIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brandStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefsBody: {
    padding: spacing.lg,
    paddingTop: 0,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  sectionHeader: { gap: 2, marginTop: spacing.xs },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.surfaceHigh,
  },
  cardTop: {
    borderColor: colors.brand,
    borderWidth: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
  },
  matchBadgeTop: { backgroundColor: colors.brand },
  sourcePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceLow,
  },
  titleBlock: { gap: 4 },
  reasons: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceLow,
  },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  previewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: layout.touchTarget,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceLow,
    paddingHorizontal: spacing.md,
  },
  daysList: { gap: spacing.md },
  dayBlock: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceLow,
  },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  exerciseName: { color: colors.ink },
  flex: { flex: 1 },
  error: { color: colors.error },
});
