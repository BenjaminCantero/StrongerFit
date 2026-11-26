import { useRef, useState } from 'react';
import { StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoider, KeyboardAwareScrollView } from '../../components/KeyboardAware';
import { AppButton } from '../../components/ui/AppButton';
import { AppText } from '../../components/ui/AppText';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { colors, layout, spacing } from '../../theme';
import { BasicsStep, HealthStep, NutritionStep, TrainingStep, WeightStep } from './components/Steps';
import { completeOnboarding, createDraft, labels, paceSummary, steps, validateStep, type Draft, type DraftField, type Step } from './domain/onboarding';

const titles: Record<Step, { title: string; lead: string }> = {
  basics: { title: 'Sobre ti', lead: 'Datos básicos para estimar tus metas de energía.' },
  training: { title: 'Tu entrenamiento', lead: 'Con esto preparamos una rutina que calce con tu semana.' },
  weight: { title: 'Objetivo de peso', lead: 'Opcional. Define una meta y un plazo realistas.' },
  nutrition: { title: 'Alimentación', lead: 'Lo que nunca debe aparecer en tus sugerencias.' },
  health: { title: 'Salud y confirmación', lead: 'Último paso antes de crear tu perfil.' },
};

export type CompletedOnboarding = Extract<ReturnType<typeof completeOnboarding>, { ok: true }>;

// onComplete guarda el perfil y devuelve un mensaje de error o null. onExit cierra la sesión.
type Props = { today: string; onComplete: (result: CompletedOnboarding) => Promise<string | null>; onExit: () => void };

export function OnboardingScreen({ today, onComplete, onExit }: Props) {
  const [draft, setDraft] = useState<Draft>(createDraft);
  const [index, setIndex] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<DraftField, string>>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const scroll = useRef<ScrollViewInstance>(null);
  const step = steps[index]!;
  const last = index === steps.length - 1;

  const set = <K extends DraftField>(field: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  const goTo = (next: number) => { setIndex(next); setErrors({}); scroll.current?.scrollTo({ y: 0, animated: false }); };

  async function next() {
    const found = validateStep(step, draft);
    if (Object.keys(found).length) { setErrors(found); return; }
    if (!last) { goTo(index + 1); return; }
    const result = completeOnboarding(draft, new Date(), today);
    if (!result.ok) { goTo(steps.indexOf(result.step)); return; }
    setSaving(true);
    setSaveError(null);
    try {
      setSaveError(await onComplete(result));
    } finally {
      setSaving(false);
    }
  }

  const pace = paceSummary(draft);
  const summary = [
    { label: 'Objetivo principal', value: draft.goal ? labels.goal[draft.goal] : '—' },
    { label: 'Disponibilidad', value: `${draft.days || '—'} días por semana · ${draft.minutes || '—'} min por sesión` },
    { label: 'Entorno', value: draft.environment ? labels.environment[draft.environment] : '—' },
    { label: 'Objetivo de peso', value: pace ? `${draft.weight} → ${draft.targetWeight} kg en ${pace.weeks} semanas` : 'Sin definir' },
    { label: 'Exclusiones', value: draft.exclusions.trim() || 'Ninguna' },
    { label: 'Comidas al día', value: String(draft.preferences.mealsPerDay) },
  ];
  const props = { draft, errors, set };
  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoider><KeyboardAwareScrollView ref={scroll} contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <View style={styles.progress}>
            <AppText variant="label" tone="brand">Paso {index + 1} de {steps.length}</AppText>
            <ProgressBar value={index + 1} target={steps.length} label={`Paso ${index + 1} de ${steps.length}`} />
          </View>
          <View style={styles.heading}>
            <AppText variant="title" accessibilityRole="header">{titles[step].title}</AppText>
            <AppText tone="muted">{titles[step].lead}</AppText>
          </View>
          {step === 'basics' && <BasicsStep {...props} />}
          {step === 'training' && <TrainingStep {...props} />}
          {step === 'weight' && <WeightStep {...props} today={today} />}
          {step === 'nutrition' && <NutritionStep {...props} />}
          {step === 'health' && <HealthStep {...props} summary={summary} />}
          {errorCount > 0 && <AppText accessibilityRole="alert" variant="caption" style={styles.error}>
            {errorCount === 1 ? 'Revisa el campo marcado.' : `Revisa los ${errorCount} campos marcados.`}
          </AppText>}
          <View style={styles.actions}>
            {saveError && <AppText accessibilityRole="alert" variant="caption" style={styles.error}>{saveError}</AppText>}
            <AppButton label={saving ? 'Guardando…' : last ? 'Crear mi perfil' : 'Continuar'} icon={last ? 'checkmark-outline' : 'arrow-forward-outline'}
              disabled={saving} onPress={next} />
            <AppButton label={index === 0 ? 'Cerrar sesión' : 'Paso anterior'} variant="secondary"
              onPress={() => index === 0 ? onExit() : goTo(index - 1)} />
          </View>
        </View>
      </KeyboardAwareScrollView></KeyboardAvoider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  scroll: { flexGrow: 1 },
  content: { width: '100%', maxWidth: layout.contentWidth, alignSelf: 'center', padding: spacing.lg, paddingBottom: spacing.section, gap: spacing.xl },
  progress: { gap: spacing.sm },
  heading: { gap: spacing.xs },
  actions: { gap: spacing.md, marginTop: spacing.sm },
  error: { color: colors.error },
});
