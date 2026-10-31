import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { AppPressable } from '../../../components/ui/AppPressable';
import { AppText } from '../../../components/ui/AppText';
import { colors, radius, spacing } from '../../../theme';

type Props = { name: string; photo: ImageSourcePropType | null; summary: string; onPhoto: () => void };

export function ProfileHero({ name, photo, summary, onPhoto }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.avatarWrap}>
        {photo
          ? <Image source={photo} style={styles.avatar} accessibilityLabel={name ? `Foto de perfil de ${name}` : 'Foto de perfil'} />
          : <View style={[styles.avatar, styles.placeholder]} accessibilityLabel="Sin foto de perfil">
            <Ionicons name="person" size={34} color={colors.brand} />
          </View>}
        <AppPressable accessibilityRole="button" accessibilityLabel={photo ? 'Cambiar o quitar foto de perfil' : 'Elegir foto de perfil'}
          onPress={onPhoto} hitSlop={11} style={styles.cameraBtn}>
          <Ionicons name="camera" size={14} color={colors.white} />
        </AppPressable>
      </View>

      <View style={styles.info}>
        <AppText variant="heading">{name || 'Tu perfil'}</AppText>
        <AppText variant="caption" tone="muted">Perfil local · Sin cuenta conectada</AppText>
        <View style={styles.planChip}>
          <Ionicons name="barbell-outline" size={13} color={colors.brand} />
          <AppText variant="caption" tone="muted" style={styles.planText}>{summary}</AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.lg,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl,
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 72, height: 72, borderRadius: radius.pill, borderWidth: 3, borderColor: colors.canvas },
  placeholder: { backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  cameraBtn: {
    position: 'absolute', bottom: -2, right: -2,
    width: 26, height: 26, borderRadius: radius.pill,
    backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 160, gap: spacing.xs },
  planChip: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, marginTop: spacing.xs },
  planText: { flexShrink: 1 },
});

