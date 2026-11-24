import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { AppButton } from '../../components/ui/AppButton';
import { AppPressable } from '../../components/ui/AppPressable';
import { AppText } from '../../components/ui/AppText';
import { FormField } from '../../components/ui/FormField';
import { colors, layout, radius, spacing } from '../../theme';
import { MIN_PASSWORD, validateAuthForm, type AuthField, type AuthForm, type AuthMode, type AuthResult } from './domain';

const copy: Record<AuthMode, { title: string; lead: string; action: string }> = {
  signin: { title: 'Iniciar sesión', lead: 'Entra con el correo y la contraseña de tu cuenta.', action: 'Iniciar sesión' },
  signup: { title: 'Crear cuenta', lead: 'Tu cuenta guarda tu perfil, entrenamientos y comidas para que no los pierdas al cambiar de teléfono.', action: 'Crear cuenta' },
  reset: { title: 'Recuperar acceso', lead: 'Te enviaremos un enlace para crear una nueva contraseña.', action: 'Enviar enlace' },
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
      else if (!result.signedIn) setMessage({ tone: 'info', text: result.message ?? '' });
    } finally {
      setBusy(false);
    }
  }

  return <Screen safeBottom>
    <View style={styles.heading}>
      <AppText variant="title" accessibilityRole="header">{text.title}</AppText>
      <AppText tone="muted">{text.lead}</AppText>
    </View>

    {mode !== 'reset' && <View role="tablist" style={styles.tabs}>
      {(['signin', 'signup'] as const).map((item) => <AppPressable key={item} role="tab" accessibilityState={{ selected: mode === item }}
        aria-selected={mode === item} onPress={() => switchTo(item)} style={[styles.tab, mode === item && styles.tabSelected]}>
        <AppText variant="label" tone={mode === item ? 'white' : 'muted'}>{copy[item].title}</AppText>
      </AppPressable>)}
    </View>}

    <View style={styles.form}>
      <FormField label="Correo" {...field('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" autoCorrect={false} maxLength={254} />
      {mode !== 'reset' && <FormField label="Contraseña" {...field('password')} secureTextEntry autoCapitalize="none"
        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} maxLength={72}
        hint={mode === 'signup' ? `Al menos ${MIN_PASSWORD} caracteres.` : undefined} />}
      {mode === 'signup' && <FormField label="Repite la contraseña" {...field('confirm')} secureTextEntry autoCapitalize="none" autoComplete="new-password" maxLength={72} />}
    </View>

    {message && <View style={[styles.note, message.tone === 'error' && styles.error]} accessibilityLiveRegion="polite">
      <Ionicons name={message.tone === 'error' ? 'alert-circle-outline' : 'mail-outline'} size={20} color={message.tone === 'error' ? colors.error : colors.brand} />
      <AppText variant="caption" style={styles.flex}>{message.text}</AppText>
    </View>}

    <AppButton label={busy ? 'Un momento…' : text.action} icon="arrow-forward-outline" disabled={busy} onPress={submit} />
    {mode === 'signin' && <AppButton label="Olvidé mi contraseña" variant="ghost" onPress={() => switchTo('reset')} />}
    {mode === 'reset' && <AppButton label="Volver a iniciar sesión" variant="secondary" onPress={() => switchTo('signin')} />}
  </Screen>;
}

const styles = StyleSheet.create({
  heading: { gap: spacing.xs },
  tabs: { flexDirection: 'row', gap: spacing.sm, padding: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface },
  tab: { flex: 1, minHeight: layout.touchTarget, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  tabSelected: { backgroundColor: colors.brand },
  form: { gap: spacing.lg },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.sand },
  error: { backgroundColor: '#FFDAD8' },
  flex: { flex: 1 },
});
