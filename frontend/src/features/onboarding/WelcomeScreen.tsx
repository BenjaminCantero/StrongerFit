import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../components/ui/AppButton';
import { AppText } from '../../components/ui/AppText';
import { colors, layout, radius, spacing } from '../../theme';

const values = [
  { icon: 'heart-outline', title: 'Salud primero', text: 'Metas conservadoras, sin dietas extremas ni culpas.' },
  { icon: 'trending-up-outline', title: 'Progreso real', text: 'Registros simples y estimaciones rotuladas como tales.' },
] as const;

export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <View style={styles.hero}>
            <View style={styles.photo}>
              <Image source={require('../../../assets/images/preview-progress-recovery.jpg')} style={StyleSheet.absoluteFill}
                resizeMode="cover" accessibilityIgnoresInvertColors accessible={false} />
              <View style={styles.badge}>
                <Ionicons name="leaf" size={14} color={colors.brand} />
                <AppText variant="label" tone="brand">Bienestar a tu propio ritmo</AppText>
              </View>
            </View>
            <AppText variant="title" accessibilityRole="header" style={styles.center}>Entrenamiento y alimentación en un mismo lugar</AppText>
            <AppText tone="muted" style={styles.center}>Tu rutina, tus comidas y tu progreso, con recomendaciones claras que tú decides si adoptar.</AppText>
          </View>

          <View style={styles.values}>
            {values.map((item) => <View key={item.title} style={styles.value}>
              <View style={styles.valueIcon}><Ionicons name={item.icon} size={20} color={colors.brand} /></View>
              <AppText variant="header">{item.title}</AppText>
              <AppText variant="caption" tone="muted">{item.text}</AppText>
            </View>)}
          </View>

          <AppButton label="Crear mi perfil" icon="arrow-forward-outline" onPress={onStart} />
          <View style={styles.footer}>
            <AppText variant="caption" tone="muted" style={styles.center}>
              Por ahora tu perfil se guarda solo en este dispositivo. La cuenta en la nube y el inicio de sesión llegarán en una próxima etapa.
            </AppText>
            <AppText variant="caption" tone="muted" style={styles.center}>
              Antes de crearlo verás el aviso de salud y el consentimiento de datos.
            </AppText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  content: { width: '100%', maxWidth: layout.contentWidth, alignSelf: 'center', padding: spacing.lg, paddingVertical: spacing.xl, gap: spacing.xl },
  hero: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface },
  photo: { height: 200, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.brandStrong, justifyContent: 'flex-end', padding: spacing.md },
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.pill, backgroundColor: colors.canvas },
  center: { textAlign: 'center' },
  values: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  value: { flex: 1, minWidth: 140, gap: spacing.xs, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surfaceLow },
  valueIcon: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  footer: { gap: spacing.sm },
});
