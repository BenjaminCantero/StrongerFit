import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppPressable } from '../../../components/ui/AppPressable';
import { AppText } from '../../../components/ui/AppText';
import { colors, layout, radius, spacing } from '../../../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function StatusRow({ icon, title, description, done }: { icon: IconName; title: string; description: string; done: boolean }) {
  const status = done ? 'Vigente' : 'Pendiente';
  return <View style={styles.row} accessible accessibilityLabel={`${title}. ${status}. ${description}`}>
    <View style={styles.rowIcon}><Ionicons name={icon} size={20} color={done ? colors.brand : colors.gold} /></View>
    <View style={styles.rowText}>
      <AppText variant="strong">{title}</AppText>
      <AppText variant="caption" tone="muted">{description}</AppText>
      <View style={[styles.badge, done && styles.badgeDone]}>
        <Ionicons name={done ? 'checkmark' : 'time-outline'} size={12} color={done ? colors.brandStrong : colors.gold} />
        <AppText variant="label" style={done ? styles.badgeDoneText : styles.badgeText}>{status}</AppText>
      </View>
    </View>
  </View>;
}

type Props = { exporting: boolean; consentDate: string | null; healthDate: string | null; healthRisk: boolean; onExport: () => void; onDelete: () => void };

export function PrivacyCard({ exporting, consentDate, healthDate, healthRisk, onExport, onDelete }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitle}>
        <Ionicons name="shield-checkmark-outline" size={20} color={colors.brand} />
        <AppText variant="header" accessibilityRole="header" style={styles.titleText}>Privacidad, salud y datos</AppText>
      </View>

      <View style={styles.card}>
        <StatusRow icon="shield-checkmark-outline" title="Consentimiento de datos de salud" done={!!consentDate}
          description={consentDate ? `Aceptado el ${consentDate}, conforme a la Ley 19.628 y la Ley 21.719.`
            : 'Se solicita al crear tu perfil, conforme a la Ley 19.628 y la Ley 21.719.'} />
        <StatusRow icon="document-text-outline" title="Aviso de salud y cuestionario de aptitud" done={!!healthDate}
          description={!healthDate ? 'Se completa antes de generar planes automáticos.'
            : healthRisk ? `Completado el ${healthDate}. Declaraste condiciones que conviene revisar con un profesional.`
              : `Completado el ${healthDate}. Sin condiciones declaradas.`} />

        <AppPressable accessibilityRole="button" accessibilityState={{ busy: exporting, disabled: exporting }} disabled={exporting}
          accessibilityHint="Comparte un archivo JSON con los datos guardados en este dispositivo." onPress={onExport}
          style={({ pressed }) => [styles.row, (pressed || exporting) && styles.dimmed]}>
          <View style={styles.rowIcon}><Ionicons name="cloud-download-outline" size={20} color={colors.brand} /></View>
          <View style={styles.rowText}>
            <AppText variant="strong">{exporting ? 'Preparando exportación…' : 'Exportar mis datos'}</AppText>
            <AppText variant="caption" tone="muted">Archivo JSON con el perfil, el diario y el progreso de este dispositivo</AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </AppPressable>

        <View style={styles.divider} />

        <View style={styles.actionRow} accessible accessibilityLabel="Cambiar contraseña. Disponible al crear tu cuenta.">
          <Ionicons name="lock-closed-outline" size={16} color={colors.muted} />
          <AppText variant="label" tone="muted" style={styles.actionText}>Cambiar contraseña · Disponible al crear tu cuenta</AppText>
        </View>

        <AppPressable accessibilityRole="button" accessibilityLabel="Eliminar datos de este dispositivo" onPress={onDelete}
          style={({ pressed }) => [styles.actionRow, pressed && styles.dimmed]}>
          <Ionicons name="trash-outline" size={16} color={colors.error} />
          <AppText variant="label" style={[styles.actionText, styles.dangerText]}>Eliminar datos de este dispositivo</AppText>
          <Ionicons name="warning-outline" size={16} color={colors.error} />
        </AppPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  titleText: { flexShrink: 1 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.canvas, borderRadius: radius.sm, padding: spacing.md, minHeight: layout.touchTarget,
  },
  rowIcon: {
    width: 34, height: 34, borderRadius: radius.sm,
    backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  badge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 3, marginTop: spacing.xs,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    backgroundColor: colors.goldSoft, borderRadius: radius.pill,
  },
  badgeText: { color: colors.gold },
  badgeDone: { backgroundColor: colors.brandSoft },
  badgeDoneText: { color: colors.brandStrong },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, minHeight: layout.touchTarget,
  },
  actionText: { flex: 1 },
  dangerText: { color: colors.error },
  dimmed: { opacity: 0.65 },
});
