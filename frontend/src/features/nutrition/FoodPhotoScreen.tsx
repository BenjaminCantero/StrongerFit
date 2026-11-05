import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useReducer, useRef, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen } from '../../components/Screen';
import { AppButton } from '../../components/ui/AppButton';
import { AppPressable } from '../../components/ui/AppPressable';
import { AppText } from '../../components/ui/AppText';
import { Card } from '../../components/ui/Card';
import { PreviewNotice } from '../../components/ui/PreviewNotice';
import { colors, layout, radius, spacing } from '../../theme';
import { MealSelector } from './components/MealSelector';
import type { FoodEntry, MealId } from './domain/food-entry';
import {
  canRegisterPhotoMeal, createPhotoMeal, detectedNutrients, LOW_CONFIDENCE, MAX_ITEM_GRAMS, photoMealReducer,
  photoMealToEntry, photoMealTotals, type DetectedFood,
} from './domain/photo-analysis';
import type { FoodPhotoAnalyzer } from './photo-analyzer';
import type { PhotoSource, PickResult } from './photo-picker';
import { formatGrams, formatKcal, formatMacro, mealLabels } from './presentation';

type Props = {
  analyzer: FoodPhotoAnalyzer | null;
  pickPhoto: (source: PhotoSource) => Promise<PickResult>;
  initialMeal?: MealId;
  isPreview: boolean;
  onExit: () => void;
  onSave: (entry: FoodEntry) => void;
};

export function FoodPhotoScreen({ analyzer, ...props }: Props) {
  if (!analyzer) return (
    <Screen title="Foto de comida" safeBottom>
      <Card>
        <Ionicons name="camera-outline" size={32} color={colors.muted} />
        <AppText variant="heading">El análisis por foto aún no está disponible</AppText>
        <AppText tone="muted">Pronto podrás fotografiar tu plato y obtener una estimación de calorías y macros para revisarla antes de registrar.</AppText>
        <AppButton label="Volver a Alimentación" onPress={props.onExit} />
      </Card>
    </Screen>
  );
  return <FoodPhotoPanel analyzer={analyzer} {...props} />;
}

function FoodPhotoPanel({ analyzer, pickPhoto, initialMeal, isPreview, onExit, onSave }: Props & { analyzer: FoodPhotoAnalyzer }) {
  const [state, send] = useReducer(photoMealReducer, initialMeal, createPhotoMeal);
  const [notice, setNotice] = useState('');
  const abort = useRef<AbortController | null>(null);
  const saved = useRef(false);
  useEffect(() => () => abort.current?.abort(), []);

  async function choose(source: PhotoSource) {
    setNotice('');
    abort.current?.abort();
    const result = await pickPhoto(source);
    if (result.status === 'picked') send({ type: 'photo-selected', uri: result.uri });
    else if (result.status === 'denied') setNotice('Sin permiso de cámara. Puedes habilitarlo en los ajustes del teléfono o elegir una foto de la galería.');
  }

  async function analyze() {
    if (!state.photoUri) return;
    const requestId = state.requestId + 1;
    const controller = new AbortController();
    abort.current = controller;
    send({ type: 'analysis-started' });
    try {
      const analysis = await analyzer({ uri: state.photoUri }, controller.signal);
      send({ type: 'analysis-succeeded', requestId, analysis });
    } catch {
      if (!controller.signal.aborted) send({ type: 'analysis-failed', requestId, message: 'No pudimos analizar la foto. Revisa tu conexión e inténtalo de nuevo.' });
    }
  }

  function cancel() {
    abort.current?.abort();
    send({ type: 'reset' });
  }

  function register() {
    const entry = photoMealToEntry(state);
    if (!entry || saved.current) return;
    saved.current = true;
    onSave(entry);
  }

  const reviewing = state.phase === 'review';

  return (
    <View style={styles.screen}>
      <Screen>
        {isPreview && <PreviewNotice>Vista previa · Análisis simulado, siempre devuelve el mismo plato</PreviewNotice>}

        {state.photoUri
          ? <PhotoFrame uri={state.photoUri} analyzing={state.phase === 'analyzing'} compact={reviewing} />
          : <PhotoIntro onCamera={() => choose('camera')} onLibrary={() => choose('library')} />}

        {!!notice && <AppText accessibilityLiveRegion="polite" variant="label" tone="brand">{notice}</AppText>}

        {state.phase === 'ready' && <View style={styles.actions}>
          <AppButton label="Analizar foto" icon="sparkles-outline" onPress={analyze} style={styles.confirm} />
          <PhotoSourceRow onCamera={() => choose('camera')} onLibrary={() => choose('library')} label="Cambiar foto" />
        </View>}

        {state.phase === 'analyzing' && <View style={styles.actions}>
          <AppText accessibilityLiveRegion="polite" tone="muted" style={styles.center}>Identificando alimentos y estimando porciones…</AppText>
          <AppButton label="Cancelar análisis" variant="secondary" onPress={cancel} />
        </View>}

        {state.phase === 'error' && <Card tone="low">
          <View style={styles.row}>
            <Ionicons name="alert-circle-outline" size={22} color={colors.error} />
            <AppText accessibilityLiveRegion="polite" style={styles.flex}>{state.error}</AppText>
          </View>
          <AppButton label="Reintentar" icon="refresh-outline" onPress={analyze} />
          <PhotoSourceRow onCamera={() => choose('camera')} onLibrary={() => choose('library')} label="Usar otra foto" />
        </Card>}

        {reviewing && <>
          <AnalysisTotals state={state} />
          <View style={styles.section}>
            <AppText variant="heading" accessibilityRole="header">Alimentos detectados</AppText>
            <AppText variant="caption" tone="muted">Ajusta las porciones o quita lo que no corresponda. Los valores son estimaciones.</AppText>
          </View>
          {state.items.map((item) => <DetectedFoodRow key={item.id} item={item}
            onAdjust={(delta) => send({ type: 'adjust-grams', id: item.id, delta })}
            onRemove={() => send({ type: 'remove-item', id: item.id })} />)}
          {!state.items.length && <Card tone="low">
            <AppText tone="muted">Quitaste todos los alimentos. Analiza otra foto o vuelve para registrar manualmente.</AppText>
          </Card>}
          <View style={styles.section}>
            <AppText variant="header">Registrar en</AppText>
            <MealSelector selected={state.meal} onSelect={(meal) => send({ type: 'select-meal', meal })} />
          </View>
        </>}
      </Screen>

      {reviewing && <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.footer}>
        <View style={styles.footerContent}>
          <AppButton label={`Registrar en ${mealLabels[state.meal]}`} icon="checkmark-circle-outline"
            disabled={!canRegisterPhotoMeal(state)} onPress={register} style={styles.confirm} />
          <AppButton label="Descartar y tomar otra foto" variant="ghost" onPress={cancel} />
        </View>
      </SafeAreaView>}
      {state.phase === 'idle' && <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.footer}>
        <View style={styles.footerContent}>
          <AppButton label="Volver a Alimentación" variant="ghost" onPress={onExit} />
        </View>
      </SafeAreaView>}
    </View>
  );
}

const tips: { icon: ComponentProps<typeof Ionicons>['name']; text: string }[] = [
  { icon: 'sunny-outline', text: 'Buena luz, idealmente natural' },
  { icon: 'scan-outline', text: 'El plato completo dentro del cuadro' },
  { icon: 'arrow-down-outline', text: 'Toma la foto desde arriba' },
];

function PhotoIntro({ onCamera, onLibrary }: { onCamera: () => void; onLibrary: () => void }) {
  return <>
    <Card style={styles.intro}>
      <View style={styles.introIcon}><Ionicons name="camera-outline" size={32} color={colors.brand} /></View>
      <AppText variant="heading" style={styles.center}>Fotografía tu comida</AppText>
      <AppText tone="muted" style={styles.center}>Estimamos los alimentos, las porciones y las calorías. Después puedes corregir todo antes de registrar.</AppText>
      <View style={styles.actions}>
        <AppButton label="Tomar foto" icon="camera-outline" onPress={onCamera} style={styles.confirm} />
        <AppButton label="Elegir de la galería" icon="images-outline" variant="secondary" onPress={onLibrary} />
      </View>
    </Card>
    <View style={styles.section}>
      <AppText variant="header" accessibilityRole="header">Para un mejor resultado</AppText>
      {tips.map((tip) => <View key={tip.text} style={styles.row}>
        <Ionicons name={tip.icon} size={18} color={colors.brand} />
        <AppText tone="muted" style={styles.flex}>{tip.text}</AppText>
      </View>)}
    </View>
  </>;
}

function PhotoSourceRow({ onCamera, onLibrary, label }: { onCamera: () => void; onLibrary: () => void; label: string }) {
  return <View style={styles.sourceRow}>
    <AppButton label={`${label}: cámara`} icon="camera-outline" variant="secondary" onPress={onCamera} style={styles.flex} />
    <AppButton label="Galería" icon="images-outline" variant="secondary" onPress={onLibrary} style={styles.flex} />
  </View>;
}

function PhotoFrame({ uri, analyzing, compact }: { uri: string; analyzing: boolean; compact: boolean }) {
  return <View style={[styles.frame, compact && styles.frameCompact]}>
    <Image source={{ uri }} style={styles.image} accessibilityLabel="Foto de la comida" resizeMode="cover" />
    {analyzing && <View style={styles.overlay}>
      <ActivityIndicator size="large" color={colors.white} accessibilityLabel="Analizando foto" />
      <AppText variant="strong" tone="white">Analizando…</AppText>
    </View>}
  </View>;
}

function AnalysisTotals({ state }: { state: Parameters<typeof photoMealTotals>[0] }) {
  const totals = photoMealTotals(state);
  const macros = [
    { label: 'Proteínas', value: totals.protein }, { label: 'Carbohidratos', value: totals.carbs }, { label: 'Grasas', value: totals.fat },
  ];
  return <Card style={styles.totals}>
    <AppText variant="label" tone="muted">Total estimado</AppText>
    <AppText variant="metric" accessibilityLiveRegion="polite">{formatKcal(totals.kcal)} kcal</AppText>
    <View style={styles.macros}>
      {macros.map((macro) => <View key={macro.label} style={styles.macro}>
        <AppText variant="strong">{formatMacro(macro.value)} g</AppText>
        <AppText variant="caption" tone="muted">{macro.label}</AppText>
      </View>)}
    </View>
  </Card>;
}

function DetectedFoodRow({ item, onAdjust, onRemove }: { item: DetectedFood; onAdjust: (delta: number) => void; onRemove: () => void }) {
  const low = item.confidence < LOW_CONFIDENCE;
  return <Card tone="low" style={styles.item}>
    <View style={styles.row}>
      <View style={styles.flex}>
        <AppText variant="strong">{item.name}</AppText>
        <AppText variant="caption" tone="muted">{formatKcal(detectedNutrients(item).kcal)} kcal · {formatMacro(detectedNutrients(item).protein)} g proteína</AppText>
      </View>
      <AppPressable accessibilityRole="button" accessibilityLabel={`Quitar ${item.name}`} onPress={onRemove}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
        <Ionicons name="close" size={20} color={colors.muted} />
      </AppPressable>
    </View>
    <View style={styles.row}>
      <View style={[styles.badge, low && styles.badgeLow]}>
        <Ionicons name={low ? 'help-circle-outline' : 'checkmark-circle-outline'} size={14} color={low ? colors.gold : colors.brandText} />
        <AppText variant="caption" style={{ color: low ? colors.gold : colors.brandText }}>
          {low ? 'Poco seguro · revisa' : `Confianza ${Math.round(item.confidence * 100)} %`}
        </AppText>
      </View>
      <View style={styles.stepper}>
        <StepButton icon="remove" label={`Restar 10 g a ${item.name}`} disabled={item.grams <= 5} onPress={() => onAdjust(-10)} />
        <AppText variant="strong" style={styles.grams}>{formatGrams(item.grams)} g</AppText>
        <StepButton icon="add" label={`Sumar 10 g a ${item.name}`} disabled={item.grams >= MAX_ITEM_GRAMS} onPress={() => onAdjust(10)} />
      </View>
    </View>
  </Card>;
}

function StepButton({ icon, label, disabled, onPress }: { icon: 'add' | 'remove'; label: string; disabled: boolean; onPress: () => void }) {
  return <AppPressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.step, (pressed || disabled) && styles.pressed]}>
    <Ionicons name={icon} size={18} color={colors.brandStrong} />
  </AppPressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  footer: { backgroundColor: colors.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.surfaceHigh },
  footerContent: { width: '100%', maxWidth: layout.contentWidth, alignSelf: 'center', padding: spacing.lg, gap: spacing.xs },
  confirm: { backgroundColor: colors.brandStrong },
  actions: { gap: spacing.sm, alignSelf: 'stretch' },
  sourceRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  intro: { alignItems: 'center' },
  introIcon: { width: 64, height: 64, borderRadius: radius.pill, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  section: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  flex: { flex: 1, minWidth: 120 },
  frame: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceHigh },
  frameCompact: { aspectRatio: 16 / 9 },
  image: { width: '100%', height: '100%' },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  totals: { gap: spacing.xs },
  macros: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm, flexWrap: 'wrap' },
  macro: { gap: 2 },
  item: { padding: spacing.lg, gap: spacing.md },
  iconButton: { width: layout.touchTarget, height: layout.touchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  badge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: radius.pill, backgroundColor: colors.brandSoft, marginRight: 'auto' },
  badgeLow: { backgroundColor: colors.goldSoft },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  step: { width: layout.touchTarget, height: layout.touchTarget, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  grams: { minWidth: 64, textAlign: 'center', fontVariant: ['tabular-nums'] },
  pressed: { opacity: 0.6 },
});
