import Ionicons from '@expo/vector-icons/Ionicons';
import { exerciseById, planFromProgram, programs, type PlanInput, type Program, type ProgramFocus } from '@strongerfit/training-engine';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { AppButton } from '../../components/ui/AppButton';
import { AppPressable } from '../../components/ui/AppPressable';
import { AppText } from '../../components/ui/AppText';
import { Card } from '../../components/ui/Card';
import { colors, radius, spacing } from '../../theme';
import { labels } from '../onboarding/domain/onboarding';
import { MovementPictogram } from './components/MovementPictogram';

export const focusLabels: Record<ProgramFocus, string> = { strength: 'Fuerza', hypertrophy: 'Hipertrofia', general: 'General' };
type Filter = 'all' | ProgramFocus | 'beginner';
const filters: Record<Filter, string> = { all: 'Todos', strength: 'Fuerza', hypertrophy: 'Hipertrofia', general: 'General', beginner: 'Para empezar' };

// El movimiento principal de cada sesión (el primer ejercicio) resume el programa a simple vista.
export function signature(program: Program) {
  return program.days.map((day) => exerciseById(day.exercises[0]!.exerciseId)!.pattern);
}

type Props = { input: PlanInput | null; activeId: string | null; onOpen: (program: Program) => void; onProfile: () => void };

export function ProgramsScreen({ input, activeId, onOpen, onProfile }: Props) {
  const [filter, setFilter] = useState<Filter>('all');

  if (!input) return <Screen title="Programas clásicos" safeBottom>
    <Card>
      <AppText variant="heading">Primero completa tu perfil</AppText>
      <AppText tone="muted">Necesitamos tu equipamiento y tus zonas con lesión para adaptar cada programa.</AppText>
      <AppButton label="Completar perfil" onPress={onProfile} />
    </Card>
  </Screen>;

  const visible = programs.filter((program) => filter === 'all' || (filter === 'beginner' ? program.level === 'beginner' : program.focus === filter));
  const fits = visible.map((program) => ({ program, fit: planFromProgram(program, input) }));
  const ready = fits.filter((item) => item.fit.ok);
  const locked = fits.filter((item) => !item.fit.ok);

  return <Screen safeBottom>
    <View style={styles.heading}>
      <AppText variant="title" accessibilityRole="header">Programas clásicos</AppText>
      <AppText tone="muted">Rutinas conocidas de fuerza e hipertrofia, adaptadas a tu equipo y a tus lesiones.</AppText>
    </View>

    <View role="radiogroup" accessibilityLabel="Filtrar programas" style={styles.filters}>
      {(Object.keys(filters) as Filter[]).map((id) => <AppPressable key={id} accessibilityRole="radio" accessibilityState={{ checked: filter === id }}
        aria-checked={filter === id} onPress={() => setFilter(id)} style={({ pressed }) => [styles.chip, filter === id && styles.chipActive, pressed && styles.pressed]}>
        <AppText variant="label" tone={filter === id ? 'white' : 'muted'}>{filters[id]}</AppText>
      </AppPressable>)}
    </View>

    {ready.map(({ program, fit }) => <ProgramCard key={program.id} program={program} active={program.id === activeId}
      adjustments={fit.ok ? fit.plan.changes.length : 0} onPress={() => onOpen(program)} />)}
    {!ready.length && <AppText tone="muted">Ningún programa de este filtro calza con tu equipo.</AppText>}

    {locked.length > 0 && <View style={styles.locked}>
      <AppText variant="header" accessibilityRole="header">Necesitan más equipo</AppText>
      <AppText variant="caption" tone="muted">Tu perfil no incluye el equipo de demasiados ejercicios. Toca uno para ver qué falta.</AppText>
      {locked.map(({ program }) => <ProgramCard key={program.id} program={program} locked onPress={() => onOpen(program)} />)}
    </View>}
  </Screen>;
}

function ProgramCard({ program, active = false, locked = false, adjustments = 0, onPress }: {
  program: Program; active?: boolean; locked?: boolean; adjustments?: number; onPress: () => void;
}) {
  const label = `${program.name}${program.author ? `, de ${program.author}` : ''}. ${program.perWeek} días por semana.${locked ? ' Necesita más equipo.' : ''}${active ? ' Es tu programa actual.' : ''}`;
  return <AppPressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint="Ver días y ejercicios" onPress={onPress}
    style={({ pressed }) => [styles.card, locked && styles.cardLocked, active && styles.cardActive, pressed && styles.pressed]}>
    <View style={styles.strip}>
      {signature(program).map((pattern, index) => <MovementPictogram key={index} pattern={pattern} size={locked ? 34 : 42} tone={locked ? 'muted' : 'brand'} />)}
      <View style={styles.perWeek}>
        <AppText variant="metric" style={styles.perWeekNumber}>{program.perWeek}</AppText>
        <AppText variant="caption" tone="muted">días/sem</AppText>
      </View>
    </View>
    <View style={styles.text}>
      <AppText variant="heading">{program.name}</AppText>
      {program.author && <AppText variant="caption" tone="muted">{program.author}</AppText>}
      {!locked && <AppText tone="muted" numberOfLines={2}>{program.summary}</AppText>}
    </View>
    <View style={styles.footerRow}>
      <View style={styles.tags}>
        <Tag text={focusLabels[program.focus]} />
        <Tag text={labels.level[program.level]} />
        {active && <Tag text="Tu programa" strong />}
        {!locked && adjustments > 0 && <Tag text={`${adjustments} ${adjustments === 1 ? 'ajuste' : 'ajustes'}`} icon="swap-horizontal-outline" />}
        {locked && <Tag text="Falta equipo" icon="lock-closed-outline" />}
      </View>
      <Ionicons name="chevron-forward" size={20} color={locked ? colors.muted : colors.brand} />
    </View>
  </AppPressable>;
}

function Tag({ text, icon, strong = false }: { text: string; icon?: 'swap-horizontal-outline' | 'lock-closed-outline'; strong?: boolean }) {
  return <View style={[styles.tag, strong && styles.tagStrong]}>
    {icon && <Ionicons name={icon} size={13} color={strong ? colors.white : colors.muted} />}
    <AppText variant="caption" tone={strong ? 'white' : 'muted'}>{text}</AppText>
  </View>;
}

const styles = StyleSheet.create({
  heading: { gap: spacing.xs },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minHeight: 40, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surface, justifyContent: 'center' },
  chipActive: { backgroundColor: colors.brand },
  card: { backgroundColor: colors.surfaceLow, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, borderWidth: 1, borderColor: colors.surfaceHigh },
  cardActive: { borderColor: colors.brand, borderWidth: 2 },
  cardLocked: { backgroundColor: colors.canvas },
  strip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  perWeek: { marginLeft: 'auto', alignItems: 'flex-end' },
  perWeekNumber: { lineHeight: 30 },
  text: { gap: 2 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tags: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.surface },
  tagStrong: { backgroundColor: colors.brand },
  locked: { gap: spacing.md, marginTop: spacing.sm },
  pressed: { opacity: 0.75 },
});
