import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { AppButton } from '../../components/ui/AppButton';
import { AppText } from '../../components/ui/AppText';
import { spacing } from '../../theme';
import { CheckRow } from '../onboarding/components/CheckRow';

// Sin claves de Supabase la app no puede funcionar: la cuenta es obligatoria (AU-01).
export function MissingConfigScreen() {
  return <Screen safeBottom>
    <AppText variant="title" accessibilityRole="header">Falta configurar la conexión</AppText>
    <AppText tone="muted">
      Esta compilación no tiene las claves públicas de Supabase. Completa EXPO_PUBLIC_SUPABASE_URL y
      EXPO_PUBLIC_SUPABASE_ANON_KEY en frontend/.env y vuelve a iniciar la app.
    </AppText>
  </Screen>;
}

export function AccountStatusErrorScreen({ message, onRetry, onSignOut }: { message: string; onRetry: () => void; onSignOut: () => void }) {
  return <Screen safeBottom>
    <AppText variant="title" accessibilityRole="header">No pudimos abrir tu cuenta</AppText>
    <AppText accessibilityRole="alert">{message}</AppText>
    <View style={styles.actions}>
      <AppButton label="Reintentar" icon="refresh" onPress={onRetry} />
      <AppButton label="Cerrar sesión" variant="secondary" onPress={onSignOut} />
    </View>
  </Screen>;
}

// AU-01: el perfil hecho antes de crear la cuenta no se pudo guardar. Se puede reintentar o rehacer.
export function PendingOnboardingErrorScreen({ onRetry, onRedo }: { onRetry: () => void; onRedo: () => void }) {
  return <Screen safeBottom>
    <AppText variant="title" accessibilityRole="header">No pudimos guardar tu perfil</AppText>
    <AppText accessibilityRole="alert">
      Tu cuenta ya está lista, pero el perfil que completaste no se guardó. Revisa tu conexión y reintenta,
      o complétalo de nuevo.
    </AppText>
    <View style={styles.actions}>
      <AppButton label="Reintentar" icon="refresh" onPress={onRetry} />
      <AppButton label="Completar de nuevo" variant="secondary" onPress={onRedo} />
    </View>
  </Screen>;
}

// CA-11: con el consentimiento retirado no se tratan datos nuevos hasta volver a otorgarlo.
export function ConsentScreen({ onAccept, onSignOut }: { onAccept: () => Promise<string | null>; onSignOut: () => void }) {
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    if (!checked) { setError('Marca la casilla para continuar.'); return; }
    setBusy(true);
    try { setError(await onAccept()); } finally { setBusy(false); }
  }

  return <Screen safeBottom>
    <AppText variant="title" accessibilityRole="header">Tu consentimiento</AppText>
    <AppText tone="muted">
      Retiraste tu consentimiento para tratar datos de salud. Tus datos anteriores siguen guardados, pero no
      podemos registrar ni calcular nada nuevo hasta que lo vuelvas a otorgar.
    </AppText>
    <CheckRow title="Autorizo el tratamiento de mis datos de salud" checked={checked} onToggle={() => { setChecked(!checked); setError(null); }}
      description="Peso, medidas, alimentación y condiciones declaradas se usan solo para estimar tu plan, según la Ley 19.628 y la Ley 21.719. Puedes exportar o eliminar tus datos desde Perfil." />
    {error && <AppText accessibilityRole="alert" variant="caption">{error}</AppText>}
    <View style={styles.actions}>
      <AppButton label={busy ? 'Guardando…' : 'Otorgar y continuar'} icon="checkmark-outline" disabled={busy} onPress={accept} />
      <AppButton label="Cerrar sesión" variant="secondary" onPress={onSignOut} />
    </View>
  </Screen>;
}

const styles = StyleSheet.create({ actions: { gap: spacing.md } });
