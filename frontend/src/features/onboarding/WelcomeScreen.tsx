import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { AppButton } from '../../components/ui/AppButton';
import { AppText } from '../../components/ui/AppText';
import { colors, layout, radius, spacing } from '../../theme';

const values = [
  {
    icon: 'barbell-outline' as const,
    title: 'Rutinas a tu medida',
    text: 'Planes según tu equipo, días, enfoque muscular y lesiones.',
  },
  {
    icon: 'restaurant-outline' as const,
    title: 'Nutrición clara',
    text: 'Registro diario, metas de macros y minuta semanal adaptable.',
  },
  {
    icon: 'trending-up-outline' as const,
    title: 'Progreso real',
    text: 'Peso, cargas, consistencia semanal y estimación de descanso.',
  },
] as const;

const steps = [
  { title: 'Cuéntanos cómo entrenas', text: 'Perfil, equipamiento, preferencias de rutina y salud en 3 minutos.' },
  { title: 'Explora tus sugerencias', text: 'Recibe rutinas recomendadas y metas energéticas que tú decides adoptar.' },
  { title: 'Entrena y registra a tu ritmo', text: 'Úsala sin cuenta en tu dispositivo o sincroniza en la nube.' },
] as const;

export function WelcomeScreen({ onStart, onSignIn }: { onStart: () => void; onSignIn: () => void }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <View style={styles.topBar}>
            <View style={styles.brandMark}>
              <View style={styles.brandDot}>
                <Ionicons name="leaf" size={16} color={colors.white} />
              </View>
              <AppText variant="header" style={styles.brandName}>StrongerFit</AppText>
            </View>
            <View style={styles.pillTag}>
              <AppText variant="caption" tone="brand">Bienestar integral</AppText>
            </View>
          </View>

          <View style={styles.hero}>
            <View style={styles.photo} accessible={false}>
              <Svg viewBox="0 0 360 180" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={styles.svgBg}>
                <Defs>
                  <LinearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#1E4735" />
                    <Stop offset="1" stopColor="#356247" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="360" height="180" fill="url(#heroGrad)" />
                <Circle cx="300" cy="36" r="78" fill="#4A7C59" opacity="0.38" />
                <Circle cx="62" cy="156" r="68" fill="#4A7C59" opacity="0.28" />
                <Circle cx="268" cy="142" r="36" fill="#B99A56" opacity="0.2" />
                <Path d="M 36 124 Q 112 76 184 96 T 328 54" stroke="#F8E0A8" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8" />
                <Circle cx="184" cy="96" r="5" fill="#F8E0A8" />
                <Circle cx="328" cy="54" r="6" fill="#FAF6F0" />
                <Circle cx="180" cy="86" r="46" stroke="#DDEADD" strokeWidth="1.5" fill="none" opacity="0.25" />
              </Svg>
              <View style={styles.emblemRow}>
                <View style={styles.emblemPill}>
                  <Ionicons name="barbell-outline" size={18} color={colors.white} />
                </View>
                <View style={[styles.emblemPill, styles.emblemGold]}>
                  <Ionicons name="leaf-outline" size={18} color={colors.brandStrong} />
                </View>
                <View style={styles.emblemPill}>
                  <Ionicons name="trending-up-outline" size={18} color={colors.white} />
                </View>
              </View>
              <View style={styles.badge}>
                <Ionicons name="sparkles-outline" size={14} color={colors.brandText} />
                <AppText variant="label" tone="brand">A tu ritmo, con criterio</AppText>
              </View>
            </View>
            <View style={styles.heroCopy}>
              <AppText variant="title" accessibilityRole="header" style={styles.center}>
                Entrenamiento y alimentación en un mismo lugar
              </AppText>
              <AppText tone="muted" style={styles.center}>
                Tu rutina, tus comidas y tu progreso en una experiencia serena, con recomendaciones claras que tú decides si adoptar.
              </AppText>
              <View style={styles.highlights}>
                <View style={styles.highlightChip}>
                  <Ionicons name="shield-checkmark-outline" size={14} color={colors.brandText} />
                  <AppText variant="caption" tone="brand">Adaptado a lesiones</AppText>
                </View>
                <View style={styles.highlightChip}>
                  <Ionicons name="cloud-offline-outline" size={14} color={colors.brandText} />
                  <AppText variant="caption" tone="brand">Funciona sin cuenta</AppText>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <AppText variant="heading" accessibilityRole="header">Qué puedes hacer</AppText>
            <View style={styles.cardList}>
              {values.map((item) => (
                <View key={item.title} style={styles.valueCard}>
                  <View style={styles.valueIcon}>
                    <Ionicons name={item.icon} size={20} color={colors.brandText} />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="header">{item.title}</AppText>
                    <AppText variant="caption" tone="muted">{item.text}</AppText>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <AppText variant="heading" accessibilityRole="header">Tu camino en 3 pasos</AppText>
            <View style={styles.timeline}>
              {steps.map((item, index) => (
                <View
                  key={item.title}
                  style={styles.stepRow}
                  accessible
                  accessibilityLabel={`Paso ${index + 1}. ${item.title}. ${item.text}`}
                >
                  <View style={styles.stepIndex}>
                    <AppText variant="label" tone="white">{index + 1}</AppText>
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="strong">{item.title}</AppText>
                    <AppText variant="caption" tone="muted">{item.text}</AppText>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.ctaCard}>
            <AppButton label="Comenzar mi plan" icon="arrow-forward-outline" onPress={onStart} />
            <AppButton label="Ya tengo cuenta" variant="secondary" icon="person-outline" onPress={onSignIn} />
            <View style={styles.footer}>
              <AppText variant="caption" tone="muted" style={styles.center}>
                Puedes usar StrongerFit sin crear cuenta o registrarte al final para sincronizar tus datos de forma privada.
              </AppText>
              <AppText variant="caption" tone="muted" style={styles.center}>
                Al terminar el cuestionario revisaremos el aviso de salud y consentimiento de datos.
              </AppText>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  scroll: { flexGrow: 1 },
  content: {
    width: '100%',
    maxWidth: layout.contentWidth,
    alignSelf: 'center',
    padding: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  brandMark: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandDot: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.brandStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { color: colors.brandStrong },
  pillTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
  },
  hero: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.surfaceHigh,
  },
  photo: {
    height: 184,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.brandStrong,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  svgBg: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  emblemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  emblemPill: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemGold: {
    backgroundColor: colors.goldSoft,
    borderColor: colors.goldSoft,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
  },
  heroCopy: { gap: spacing.sm },
  highlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  highlightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
  },
  center: { textAlign: 'center' },
  section: { gap: spacing.md },
  cardList: { gap: spacing.sm },
  valueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: colors.surfaceHigh,
  },
  valueIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeline: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepIndex: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, gap: 2 },
  ctaCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: colors.surfaceHigh,
  },
  footer: { gap: spacing.xs, marginTop: spacing.xs },
});
