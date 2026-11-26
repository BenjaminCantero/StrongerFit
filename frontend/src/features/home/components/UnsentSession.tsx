import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { colors, radius, spacing } from '../../../theme';

export type UnsentSessionInfo = { title: string; completedSets: number; submitting: boolean; error: string | null };

// Sesión terminada que el servidor aún no confirmó. Sigue guardada en el teléfono.
export function UnsentSession({ session, onRetry }: { session: UnsentSessionInfo; onRetry: () => void }) {
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={styles.icon}><Ionicons name="cloud-upload-outline" size={18} color={colors.white} /></View>
        <View style={styles.text}>
          <AppText variant="header" accessibilityRole="header">{session.submitting ? 'Guardando tu sesión' : 'Sesión sin guardar'}</AppText>
          <AppText variant="caption" tone="muted">{session.title} · {session.completedSets} series. Está a salvo en este teléfono.</AppText>
        </View>
      </View>
      {!!session.error && !session.submitting && <AppText accessibilityRole="alert" variant="caption">{session.error}</AppText>}
      <AppButton label={session.submitting ? 'Guardando…' : 'Reintentar'} icon="refresh-outline" disabled={session.submitting} onPress={onRetry} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.brandMedium },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
});
