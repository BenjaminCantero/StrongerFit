import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../components/ui/AppButton';
import { AppText } from '../../components/ui/AppText';
import { colors, layout, radius, spacing } from '../../theme';

const values = [
  { icon: 'barbell-outline', title: 'Tu rutina', text: 'Entrenamientos adaptados a tu nivel y a tus lesiones.' },
  { icon: 'restaurant-outline', title: 'Tus comidas', text: 'Registro de lo que comes y una minuta para guiarte.' },
  { icon: 'trending-up-outline', title: 'Tu progreso', text: 'Seguimiento de tu peso y de tus avances.' },
] as const;

const steps = [
  { title: 'Cuéntanos de ti', text: 'Perfil, objetivo, entrenamiento y salud. Toma unos 3 minutos.' },
  { title: 'Elige cómo usarla', text: 'Puedes empezar sin cuenta o crear una para sincronizar tus datos.' },
  { title: 'Recibe tu rutina y tus metas', text: 'Pensadas para ti, y tú decides si adoptarlas.' },
] as const;

export function WelcomeScreen({ onStart, onSignIn }: { onStart: () => void; onSignIn: () => void }) {
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
            <AppText variant="heading" accessibilityRole="header">Qué puedes hacer</AppText>
            {values.map((item) => <View key={item.title} style={styles.value}>
              <View style={styles.valueIcon}><Ionicons name={item.icon} size={20} color={colors.brand} /></View>
              <View style={styles.flex}>
                <AppText variant="header">{item.title}</AppText>
                <AppText variant="caption" tone="muted">{item.text}</AppText>
              </View>
            </View>)}
          </View>

          <View style={styles.values}>
            <AppText variant="heading" accessibilityRole="header">Cómo empezar</AppText>
            {steps.map((item, index) => <View key={item.title} style={styles.value} accessible accessibilityLabel={`Paso ${index + 1}. ${item.title}. ${item.text}`}>
              <View style={styles.valueIcon}><AppText variant="label" tone="brand">{index + 1}</AppText></View>
              <View style={styles.flex}>
                <AppText variant="header">{item.title}</AppText>
                <AppText variant="caption" tone="muted">{item.text}</AppText>
              </View>
            </View>)}
          </View>

          <AppButton label="Comenzar" icon="arrow-forward-outline" onPress={onStart} />
          <AppButton label="Ya tengo cuenta" variant="secondary" onPress={onSignIn} />
          <View style={styles.footer}>
            <AppText variant="caption" tone="muted" style={styles.center}>
              Puedes usar StrongerFit sin crear una cuenta. Una cuenta te permite guardar y sincronizar tus datos de forma privada.
            </AppText>
            <AppText variant="caption" tone="muted" style={styles.center}>
              Al final del cuestionario verás el aviso de salud y el consentimiento de datos.
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
  values: { gap: spacing.md },
  value: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surfaceLow },
  valueIcon: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: spacing.xs },
  footer: { gap: spacing.sm },
});
