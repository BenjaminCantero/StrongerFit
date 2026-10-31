import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { colors, radius, spacing } from '../../../theme';

export function AppInfoCard() {
  const version = Constants.expoConfig?.version ?? '—';
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitle}>
        <Ionicons name="information-circle-outline" size={20} color={colors.brand} />
        <AppText variant="header" accessibilityRole="header">Información de la app</AppText>
      </View>

      <View style={styles.card}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Ionicons name="barbell" size={24} color={colors.white} />
          </View>
          <View style={styles.brandText}>
            <AppText variant="header">StrongerFit</AppText>
            <AppText variant="caption" tone="muted">Versión {version}{__DEV__ ? ' · Desarrollo' : ''}</AppText>
          </View>
        </View>

        <View style={styles.philosophy}>
          <AppText variant="label" tone="brand">Nuestro enfoque</AppText>
          <AppText variant="caption" tone="muted">
            Entrenamiento guiado y nutrición responsable, a tu propio ritmo. Las estimaciones de la app no reemplazan
            la evaluación de un profesional de la salud.
          </AppText>
        </View>

        <View style={styles.documents}>
          <Ionicons name="document-text-outline" size={18} color={colors.muted} />
          <AppText variant="caption" tone="muted" style={styles.documentsText}>
            Preguntas frecuentes, soporte, términos de servicio, política de privacidad y licencias de las fuentes
            se publicarán antes de la beta.
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.lg },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  brandIcon: {
    width: 42, height: 42, borderRadius: radius.sm,
    backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center',
  },
  brandText: { flex: 1, gap: 2 },
  philosophy: {
    backgroundColor: colors.surfaceLow, borderRadius: radius.sm,
    padding: spacing.md, gap: spacing.sm,
  },
  documents: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  documentsText: { flex: 1 },
});
