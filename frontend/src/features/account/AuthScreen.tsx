import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { AppButton } from '../../components/ui/AppButton';
import { AppPressable } from '../../components/ui/AppPressable';
import { AppText } from '../../components/ui/AppText';
import { FormField } from '../../components/ui/FormField';
import { colors, layout, radius, spacing } from '../../theme';
import { useHasPendingOnboarding } from './pendingOnboarding';
import { MIN_PASSWORD, validateAuthForm, type AuthField, type AuthForm, type AuthMode, type AuthResult } from './domain';

const copy: Record<AuthMode, { title: string; lead: string; action: string; icon: 'log-in-outline' | 'person-add-outline' | 'key-outline' }> = {
  signin: {
    title: 'Iniciar sesión',
    lead: 'Retoma tu rutina, tus comidas y tu progreso donde los dejaste.',
    action: 'Entrar a mi cuenta',
    icon: 'log-in-outline',
  },
  signup: {
    title: 'Crear cuenta',
    lead: 'Guarda tu perfil, entrenamientos y comidas de forma privada en la nube.',
    action: 'Crear mi cuenta',
    icon: 'person-add-outline',
  },
  reset: {
    title: 'Recuperar acceso',
    lead: 'Te enviaremos un enlace seguro para crear una nueva contraseña.',
    action: 'Enviar enlace',
    icon: 'key-outline',
  },
};

type Props = {
  initialMode: AuthMode;
  onSubmit: (mode: AuthMode, form: AuthForm) => Promise<AuthResult>;
};

// RF-01, CU-01: registro, inicio de sesión y recuperación con Supabase Auth. Al iniciar
// sesión las guardas de ruta llevan al onboarding o a Inicio (AU-01).
export function AuthScreen({ initialMode, onSubmit }: Props) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [form, setForm] = useState<AuthForm>({ email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Partial<Record<AuthField, string>>>({});
  const [message, setMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const text = copy[mode];
  const hasPending = useHasPendingOnboarding();

  const field = (name: AuthField) => ({
    value: form[name], error: errors[name],
    onChange: (value: string) => { setForm((current) => ({ ...current, [name]: value })); setErrors((current) => ({ ...current, [name]: undefined })); },
  });
  const switchTo = (next: AuthMode) => { setMode(next); setErrors({}); setMessage(null); };

  async function submit() {
    const found = validateAuthForm(mode, form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await onSubmit(mode, form);
      if (!result.ok) setMessage({ tone: 'error', text: result.message });
      else if (!result.signedIn) setMessage({ tone: 'info', text: `${result.message ?? ''}${mode === 'signup' && hasPending ? ' Al iniciar sesión guardaremos tu perfil.' : ''}` });
    } finally {
      setBusy(false);
    }
  }

  return <Screen safeBottom>
    <View style={styles.heroHeader}>
      <View style={styles.heroIcon}>
        <Ionicons name={text.icon} size={24} color={colors.white} />
      </View>
      <View style={styles.heading}>
        <AppText variant="label" tone="brand">StrongerFit</AppText>
        <AppText variant="title" accessibilityRole="header">{text.title}</AppText>
        <AppText tone="muted">{text.lead}</AppText>
      </View>
    </View>

    {mode === 'signup' && hasPending && <View style={styles.pendingBanner} accessibilityLiveRegion="polite">
      <Ionicons name="checkmark-circle" size={20} color={colors.brandText} />
      <AppText variant="caption" style={styles.flex}>
        Tu cuestionario está listo. Crea tu cuenta para guardar tu perfil y generar tus rutinas.
      </AppText>
    </View>}

    {mode !== 'reset' && <View role="tablist" style={styles.tabs}>
      {(['signin', 'signup'] as const).map((item) => (
        <AppPressable
          key={item}
          role="tab"
          accessibilityState={{ selected: mode === item }}
          aria-selected={mode === item}
          onPress={() => switchTo(item)}
          style={({ pressed }) => [styles.tab, mode === item && styles.tabSelected, pressed && styles.pressed]}
        >
          <AppText variant="label" tone={mode === item ? 'white' : 'muted'}>{copy[item].title}</AppText>
        </AppPressable>
      ))}
    </View>}

    <View style={styles.formCard}>
      <View style={styles.form}>
        <FormField label="Correo electrónico" {...field('email')} placeholder="tu@correo.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" autoCorrect={false} maxLength={254} />
        {mode !== 'reset' && <FormField label="Contraseña" {...field('password')} placeholder="••••••••" secureTextEntry autoCapitalize="none"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} maxLength={72}
          hint={mode === 'signup' ? `Al menos ${MIN_PASSWORD} caracteres.` : undefined} />}
        {mode === 'signup' && <FormField label="Confirma tu contraseña" {...field('confirm')} placeholder="••••••••" secureTextEntry autoCapitalize="none" autoComplete="new-password" maxLength={72} />}
      </View>

      {message && <View style={[styles.note, message.tone === 'error' && styles.error]} accessibilityLiveRegion="polite">
        <Ionicons name={message.tone === 'error' ? 'alert-circle-outline' : 'mail-outline'} size={20} color={message.tone === 'error' ? colors.error : colors.brandText} />
        <AppText variant="caption" style={styles.flex}>{message.text}</AppText>
      </View>}

      <AppButton label={busy ? 'Un momento…' : text.action} icon="arrow-forward-outline" disabled={busy} onPress={submit} />
      {mode === 'signin' && <AppButton label="Olvidé mi contraseña" variant="ghost" onPress={() => switchTo('reset')} />}
      {mode === 'reset' && <AppButton label="Volver a iniciar sesión" variant="secondary" onPress={() => switchTo('signin')} />}
    </View>

    <View style={styles.trustNote}>
      <Ionicons name="lock-closed-outline" size={16} color={colors.muted} />
      <AppText variant="caption" tone="muted" style={styles.flex}>
        Tu sesión y datos de salud se protegen de forma privada y puedes exportarlos o eliminarlos cuando quieras.
      </AppText>
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.brandStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  heading: { flex: 1, gap: spacing.xs },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: colors.brandMedium,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceHigh,
  },
  tab: { flex: 1, minHeight: layout.touchTarget, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  tabSelected: { backgroundColor: colors.brand },
  pressed: { opacity: 0.75 },
  formCard: {
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.surfaceHigh,
  },
  form: { gap: spacing.lg },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.sand },
  error: { backgroundColor: '#FFDAD8' },
  trustNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  flex: { flex: 1 },
});
