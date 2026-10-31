import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { AppButton } from '../../components/ui/AppButton';
import { AppDialog } from '../../components/ui/AppDialog';
import { AppPressable } from '../../components/ui/AppPressable';
import { AppText } from '../../components/ui/AppText';
import { Card } from '../../components/ui/Card';
import { ChoiceChips } from '../../components/ui/ChoiceChips';
import { FormField } from '../../components/ui/FormField';
import { PreviewNotice } from '../../components/ui/PreviewNotice';
import { colors, layout, radius, spacing } from '../../theme';
import { shiftDate } from '../../shared/calendar';
import { SleepWeek } from './components/SleepWeek';
import {
  CYCLE, cycles, formatSleep, latestSleep, localNow, manualRange, sleepMinutes, sleepWeek, timeOf, validateSleep,
  type SleepAction, type SleepError, type SleepState,
} from './domain/sleep';

type Props = { state: SleepState; dispatch: (action: SleepAction) => void; today: string; now: string; isPreview: boolean };

const errors: Record<SleepError, string> = {
  invalid: 'Ingresa las horas como HH:MM, por ejemplo 23:30.',
  'wake-before-bed': 'La hora de despertar es anterior a la de dormir. Corrígela.',
  'too-short': 'Pasó menos de un minuto desde que te acostaste. Si no dormiste, cancela el registro.',
  'too-long': 'El registro supera 16 horas. Revisa las horas.',
  overlap: 'Se superpone con otro registro. Revisa las horas o elimina el anterior.',
};
const cycleOptions = { 70: '70', 80: '80', 90: '90', 100: '100', 110: '110', 120: '120' } as Record<string, string>;
const shortDate = (date: string) => new Intl.DateTimeFormat('es-CL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
  .format(new Date(`${date}T12:00:00Z`)).replace(/\./g, '');
const cycleText = (minutes: number, cycleMinutes: number) => {
  const { complete, remainder } = cycles(minutes, cycleMinutes);
  return `${complete} ${complete === 1 ? 'ciclo' : 'ciclos'} de ${cycleMinutes} min${remainder ? ` y ${remainder} min` : ''}`;
};

export function SleepScreen({ state, dispatch, today, now, isPreview }: Props) {
  const [manual, setManual] = useState(false);
  const [night, setNight] = useState(shiftDate(today, -1));
  const [bed, setBed] = useState('23:00');
  const [wake, setWake] = useState('07:00');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const week = sleepWeek(state.records, today);
  const last = latestSleep(state.records);
  const pendingMinutes = state.pendingBed ? Math.max(0, sleepMinutes(state.pendingBed, now)) : 0;
  const nights = Object.fromEntries(Array.from({ length: 7 }, (_, index) => {
    const date = shiftDate(today, -index);
    return [date, index === 0 ? 'Hoy' : index === 1 ? 'Anoche' : shortDate(date)];
  }));

  // Las acciones usan la hora exacta; `now` solo refresca la vista cada minuto.
  function wakeUp() {
    const at = localNow();
    const problem = validateSleep(state.pendingBed!, at, state.records);
    if (problem) { setNotice(errors[problem]); return; }
    dispatch({ type: 'wake-up', at });
    setNotice(`Registrado: ${formatSleep(sleepMinutes(state.pendingBed!, at))}.`);
  }

  function saveManual() {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(bed) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(wake)) { setError(errors.invalid); return; }
    const range = manualRange(night, bed, wake);
    const problem = validateSleep(range.bed, range.wake, state.records);
    if (problem) { setError(errors[problem]); return; }
    dispatch({ type: 'add', ...range });
    setManual(false);
    setNotice(`Registrado: ${formatSleep(sleepMinutes(range.bed, range.wake))}.`);
  }

  return <Screen>
    {isPreview && <PreviewNotice>Vista previa · Noches de ejemplo y cambios solo en memoria</PreviewNotice>}
    <View style={styles.hero}>
      <View style={styles.heroTop}>
        <Ionicons name={state.pendingBed ? 'moon' : 'moon-outline'} size={26} color={colors.brandMedium} />
        <View style={styles.heroText}>
          <AppText variant="label" style={styles.soft}>{state.pendingBed ? 'Durmiendo desde' : 'Última noche'}</AppText>
          <AppText variant="metric" tone="white">
            {state.pendingBed ? timeOf(state.pendingBed) : last ? formatSleep(sleepMinutes(last.bed, last.wake)) : 'Sin registros'}
          </AppText>
          <AppText variant="caption" style={styles.soft}>
            {state.pendingBed ? `${formatSleep(pendingMinutes)} hasta ahora`
              : last ? `${timeOf(last.bed)} – ${timeOf(last.wake)} · ${cycleText(sleepMinutes(last.bed, last.wake), state.cycleMinutes)}`
                : 'Pulsa al acostarte y al despertar, o ingrésalo después.'}
          </AppText>
        </View>
      </View>
      {state.pendingBed ? <>
        <AppButton label="Desperté" icon="sunny-outline" onPress={wakeUp} />
        <AppPressable accessibilityRole="button" onPress={() => { dispatch({ type: 'cancel-pending' }); setNotice('Registro cancelado.'); }} style={styles.link}>
          <AppText variant="label" style={styles.soft}>Cancelar, no me dormí</AppText>
        </AppPressable>
      </> : <AppButton label="Me voy a dormir" icon="moon-outline" onPress={() => { dispatch({ type: 'go-to-bed', at: localNow() }); setNotice(''); }} />}
      <AppText variant="caption" style={styles.soft}>Estimación según las horas que registras. No mide ni evalúa la calidad del sueño.</AppText>
    </View>
    {!!notice && <AppText accessibilityLiveRegion="polite" variant="label" tone="brand">{notice}</AppText>}

    <Card tone="low">
      <View style={styles.rowBetween}>
        <AppText variant="header" accessibilityRole="header">Últimos 7 días</AppText>
        <AppText variant="label" tone="brand">{week.averageMinutes === null ? 'Sin datos' : `Promedio ${formatSleep(week.averageMinutes)}`}</AppText>
      </View>
      <SleepWeek nights={week.nights} today={today} />
      <AppText variant="caption" tone="muted">{week.logged} de 7 días con registro. Cada barra suma lo dormido hasta esa mañana.</AppText>
      <AppButton label="Registrar manualmente" icon="create-outline" variant="secondary" onPress={() => { setError(''); setManual(true); }} />
    </Card>

    <Card tone="low">
      <AppText variant="header" accessibilityRole="header">Registros</AppText>
      {!state.records.length && <AppText tone="muted">Aún no hay registros de sueño.</AppText>}
      {[...state.records].reverse().slice(0, 7).map((record, index) => {
        const minutes = sleepMinutes(record.bed, record.wake);
        return <View key={record.id} style={[styles.record, index > 0 && styles.separated]}>
          <View style={styles.recordText}>
            <AppText variant="label">{shortDate(record.wake.slice(0, 10))} · {formatSleep(minutes)}</AppText>
            <AppText variant="caption" tone="muted">{timeOf(record.bed)} – {timeOf(record.wake)} · {cycleText(minutes, state.cycleMinutes)}</AppText>
          </View>
          <AppPressable accessibilityRole="button" accessibilityLabel={`Eliminar registro del ${shortDate(record.wake.slice(0, 10))}`}
            onPress={() => { dispatch({ type: 'delete', id: record.id }); setNotice('Registro eliminado.'); }} style={styles.delete}>
            <Ionicons name="trash-outline" size={19} color={colors.muted} />
          </AppPressable>
        </View>;
      })}
    </Card>

    <Card tone="low">
      <ChoiceChips label="Duración de un ciclo (minutos)" options={cycleOptions} value={String(state.cycleMinutes)}
        onChange={(value) => dispatch({ type: 'set-cycle', minutes: Number(value) })} />
      <AppText variant="caption" tone="muted">Por defecto 90 min, entre {CYCLE.min} y {CYCLE.max}. Solo cambia cómo se cuentan los ciclos estimados.</AppText>
    </Card>

    <AppDialog title="Registrar sueño" visible={manual} onClose={() => setManual(false)}>
      <ChoiceChips label="Noche en que te acostaste" options={nights} value={night} onChange={(value) => { setNight(value); setError(''); }} />
      <View style={styles.times}>
        <View style={styles.time}><FormField label="Me acosté" value={bed} onChange={(value) => { setBed(value); setError(''); }} placeholder="23:30" maxLength={5} keyboardType="numbers-and-punctuation" /></View>
        <View style={styles.time}><FormField label="Desperté" value={wake} onChange={(value) => { setWake(value); setError(''); }} placeholder="07:00" maxLength={5} keyboardType="numbers-and-punctuation" /></View>
      </View>
      <AppText variant="caption" tone="muted">Si la hora de despertar es menor, se cuenta al día siguiente.</AppText>
      {!!error && <AppText accessibilityRole="alert" variant="caption" style={styles.error}>{error}</AppText>}
      <AppButton label="Guardar registro" icon="checkmark-outline" onPress={saveManual} />
      <AppButton label="Cancelar" variant="secondary" onPress={() => setManual(false)} />
    </AppDialog>
  </Screen>;
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.brandStrong, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.lg },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  heroText: { flex: 1, gap: 2 },
  soft: { color: colors.brandMedium },
  link: { minHeight: layout.touchTarget, alignItems: 'center', justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  record: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  separated: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingTop: spacing.sm },
  recordText: { flex: 1, gap: 2 },
  delete: { width: layout.touchTarget, height: layout.touchTarget, alignItems: 'center', justifyContent: 'center' },
  times: { flexDirection: 'row', gap: spacing.md },
  time: { flex: 1 },
  error: { color: colors.error },
});
