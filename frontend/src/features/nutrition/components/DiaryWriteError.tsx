import { useMutationState, useQueryClient, type Mutation } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { dataErrorMessage, toDataError } from '../../../lib/data/errors';
import { spacing } from '../../../theme';
import type { DiaryWrite } from '../data/nutrition.repository';
import { diaryWriteKey, useDiaryWrite } from '../useNutrition';

// Las pantallas de registro vuelven al diario sin esperar al servidor; si la escritura falla,
// el diario lo avisa aquí con Reintentar.
export function DiaryWriteError() {
  const client = useQueryClient();
  const retry = useDiaryWrite();
  const failed = useMutationState({ filters: { mutationKey: diaryWriteKey, status: 'error' }, select: (mutation) => mutation as Mutation<void, Error, DiaryWrite> });
  const latest = failed.at(-1);
  if (!latest) return null;
  const dismiss = () => { for (const mutation of failed) client.getMutationCache().remove(mutation); };
  return <Card tone="low" style={styles.card}>
    <AppText accessibilityRole="alert">No pudimos guardar el último cambio del diario. {dataErrorMessage(toDataError(latest.state.error))}</AppText>
    <View style={styles.actions}>
      <AppButton label="Reintentar" icon="refresh-outline" disabled={retry.isPending}
        onPress={() => { const write = latest.state.variables; dismiss(); if (write) retry.mutate(write); }} />
      <AppButton label="Descartar" variant="secondary" onPress={dismiss} />
    </View>
  </Card>;
}

const styles = StyleSheet.create({ card: { gap: spacing.sm }, actions: { gap: spacing.sm } });
