import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { AppButton } from '../../components/ui/AppButton';
import { AppDialog } from '../../components/ui/AppDialog';
import { AppText } from '../../components/ui/AppText';
import { PreviewNotice } from '../../components/ui/PreviewNotice';
import { colors, radius, spacing } from '../../theme';
import { AppInfoCard } from './components/AppInfoCard';
import { NutritionCard } from './components/NutritionCard';
import { PersonalDataCard } from './components/PersonalDataCard';
import { PrivacyCard } from './components/PrivacyCard';
import { NutritionEditor, PersonalEditor, TrainingSetupEditor } from './components/ProfileEditors';
import { FormField } from '../../components/ui/FormField';
import { hasHealthRisk, labels } from '../onboarding/domain/onboarding';
import { ProfileHero } from './components/ProfileHero';
import { profileAvatar } from './presentation';
import type { ExportResult } from './device';
import type { PersonalValues, ProfileAction, ProfileData } from './domain/profile';
import type { NutritionValues } from './components/ProfileEditors';
import type { Environment, Equipment, Goal, Zone } from '../onboarding/domain/onboarding';

type Dialog = 'personal' | 'nutrition' | 'training' | 'photo' | 'delete' | 'consent' | null;

// Guardados en Supabase (SY-02). Cada uno devuelve un mensaje de error o null.
export type ProfileSaves = {
  personal: (input: { values: PersonalValues; goal: Goal }) => Promise<string | null>;
  nutrition: (values: NutritionValues) => Promise<string | null>;
  training: (setup: { environment: Environment; equipment: Equipment[]; zones: Zone[] }) => Promise<string | null>;
  withdrawConsent: () => Promise<string | null>;
};

export type AccountState = { configured: boolean; email: string | null };

type Props = {
  profile: ProfileData;
  dispatch: (action: ProfileAction) => void;
  save: ProfileSaves;
  isPreview: boolean;
  onPickPhoto: () => Promise<string | null>;
  onExport: () => Promise<ExportResult>;
  onDeleteLocalData: () => void;
  onGoals: () => void;
  account: AccountState;
  onSignIn: () => void;
  onSignUp: () => void;
  onSignOut: () => Promise<void>;
  onDeleteAccount: (password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
};

const exportNotice: Record<ExportResult, string> = {
  shared: 'Archivo preparado. Elige dónde guardarlo o compartirlo.',
  downloaded: 'Archivo JSON descargado.',
  unavailable: 'Este dispositivo no permite compartir archivos.',
};

const formatDay = (iso?: string) => iso
  ? new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Santiago' }).format(new Date(iso)) : null;

function heroSummary(profile: ProfileData): string {
  const parts = [profile.goal, profile.daysPerWeek && `${profile.daysPerWeek} días por semana`].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Completa tu ficha para preparar tu plan';
}

export function ProfileScreen({ profile, dispatch, save, isPreview, onPickPhoto, onExport, onDeleteLocalData, onGoals, account, onSignIn, onSignUp, onSignOut, onDeleteAccount }: Props) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [notice, setNotice] = useState('');
  const [exporting, setExporting] = useState(false);
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const close = () => { setDialog(null); setPassword(''); setDeleteError(''); setSaveError(''); };
  const record = profile.onboarding;
  const done = (message: string) => { close(); setNotice(message); };

  const photo = profileAvatar(profile.photo);

  // Si falla, el diálogo queda abierto con el error y lo escrito no se pierde.
  async function persist(task: () => Promise<string | null>, message: string) {
    if (saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const error = await task();
      if (error) setSaveError(error);
      else done(message);
    } finally {
      setSaving(false);
    }
  }
  const errorText = !!saveError && <AppText accessibilityRole="alert" variant="caption" style={styles.saveError}>{saveError}</AppText>;

  async function pickPhoto() {
    close();
    try {
      const uri = await onPickPhoto();
      if (uri) { dispatch({ type: 'set-photo', photo: { uri } }); setNotice('Foto actualizada. Solo se guarda en este teléfono.'); }
    } catch {
      setNotice('No se pudo abrir la galería. Inténtalo de nuevo.');
    }
  }

  async function exportData() {
    setExporting(true);
    setNotice('');
    try { setNotice(exportNotice[await onExport()]); }
    catch { setNotice('No se pudo preparar la exportación. Inténtalo de nuevo.'); }
    finally { setExporting(false); }
  }

  // CU-08: con cuenta, se reautentica y se elimina en el servidor antes de borrar el dispositivo.
  async function deleteData() {
    if (account.email) {
      if (!password) { setDeleteError('Ingresa tu contraseña para confirmar.'); return; }
      setDeleting(true);
      const result = await onDeleteAccount(password);
      setDeleting(false);
      if (!result.ok) { setDeleteError(result.message); return; }
    }
    onDeleteLocalData();
    done(account.email ? 'Cuenta y datos de este dispositivo eliminados.' : 'Datos de este dispositivo eliminados.');
  }

  return (
    <Screen>
      <PreviewNotice local={!isPreview}>
        {isPreview ? 'Vista previa · Algunas secciones muestran datos de ejemplo' : 'Tu perfil se guarda en tu cuenta'}
      </PreviewNotice>

      <ProfileHero name={profile.name} photo={photo} summary={heroSummary(profile)}
        onPhoto={() => profile.photo ? setDialog('photo') : pickPhoto()} />

      {!!notice && <AppText accessibilityLiveRegion="polite" variant="caption" tone="brand">{notice}</AppText>}

      <PersonalDataCard profile={profile} onEdit={() => { setNotice(''); setDialog('personal'); }} />
      {record && <View style={styles.account}>
        <Ionicons name="barbell-outline" size={22} color={colors.brand} />
        <View style={styles.accountText}>
          <AppText variant="strong">Entrenamiento y lesiones</AppText>
          <AppText variant="caption" tone="muted">
            {labels.environment[record.environment]} · {record.equipment.map((item) => labels.equipment[item]).join(', ')}
          </AppText>
          <AppText variant="caption" tone="muted">
            Zonas con lesión: {record.zones.length ? record.zones.map((zone) => labels.zones[zone]).join(', ') : 'ninguna'}
          </AppText>
          <AppButton label="Editar entorno y lesiones" icon="create-outline" variant="secondary" onPress={() => { setNotice(''); setDialog('training'); }} />
        </View>
      </View>}
      <NutritionCard exclusions={profile.exclusions} dietFocus={profile.dietFocus} preferences={profile.mealPreferences}
        trainingDayTargets={profile.trainingDayTargets} target={profile.nutritionPlan?.result ?? null} onGoals={onGoals} onAdjust={() => { setNotice(''); setDialog('nutrition'); }} />
      <PrivacyCard exporting={exporting} consentDate={formatDay(profile.onboarding?.consent.acceptedAt)}
        healthDate={formatDay(profile.onboarding?.completedAt)} healthRisk={hasHealthRisk(profile.onboarding?.healthFlags ?? [])} onExport={exportData} onDelete={() => { setNotice(''); setDialog('delete'); }}
        onWithdrawConsent={() => { setNotice(''); setDialog('consent'); }} />
      <AppInfoCard />

      <View style={styles.account}>
        <Ionicons name="person-circle-outline" size={22} color={colors.muted} />
        <View style={styles.accountText}>
          <AppText variant="strong">Cuenta</AppText>
          {!account.configured ? <AppText variant="caption" tone="muted">
            La cuenta en la nube no está disponible en esta versión. Tus datos se guardan solo en este dispositivo.
          </AppText> : account.email ? <>
            <AppText variant="caption" tone="muted">Sesión iniciada como {account.email}.</AppText>
            <AppButton label="Cerrar sesión" icon="log-out-outline" variant="secondary"
              onPress={() => { onSignOut().catch(() => undefined); }} />
          </> : <>
            <AppText variant="caption" tone="muted">Crea una cuenta para recuperar tu acceso. Tus datos siguen guardados en este dispositivo.</AppText>
            <AppButton label="Iniciar sesión" icon="log-in-outline" variant="secondary" onPress={onSignIn} />
            <AppButton label="Crear cuenta" variant="ghost" onPress={onSignUp} />
          </>}
        </View>
      </View>

      <AppDialog title="Editar ficha personal" visible={dialog === 'personal'} onClose={close}>
        {errorText}
        {dialog === 'personal' && <PersonalEditor profile={profile} onCancel={close}
          onSave={(input) => persist(() => save.personal(input), 'Ficha actualizada.')} />}
      </AppDialog>

      <AppDialog title="Nutrición y restricciones" visible={dialog === 'nutrition'} onClose={close}>
        {errorText}
        {dialog === 'nutrition' && <NutritionEditor profile={profile} onCancel={close}
          onSave={(values) => persist(() => save.nutrition(values), 'Preferencias actualizadas.')} />}
      </AppDialog>

      <AppDialog title="Entorno y lesiones" visible={dialog === 'training'} onClose={close}>
        {errorText}
        {dialog === 'training' && <TrainingSetupEditor profile={profile} onCancel={close}
          onSave={(values) => persist(() => save.training(values), 'Guardado. Regenera tu rutina en Entrenar para aplicar los cambios.')} />}
      </AppDialog>

      <AppDialog title="¿Retirar tu consentimiento?" visible={dialog === 'consent'} onClose={close}>
        <AppText tone="muted">
          Dejaremos de registrar y calcular datos de salud nuevos. Lo ya guardado se conserva y puedes exportarlo o eliminarlo.
          Para volver a usar la app tendrás que otorgarlo de nuevo.
        </AppText>
        {errorText}
        <AppButton label={saving ? 'Guardando…' : 'Retirar consentimiento'} icon="hand-left-outline" variant="danger" disabled={saving}
          onPress={() => persist(save.withdrawConsent, 'Consentimiento retirado.')} />
        <AppButton label="Cancelar" variant="secondary" onPress={close} />
      </AppDialog>

      <AppDialog title="Foto de perfil" visible={dialog === 'photo'} onClose={close}>
        <AppText tone="muted">La foto solo se muestra en este dispositivo y no se incluye en la exportación.</AppText>
        <AppButton label="Elegir otra foto" icon="images-outline" onPress={pickPhoto} />
        <AppButton label="Quitar foto" icon="trash-outline" variant="danger"
          onPress={() => { dispatch({ type: 'set-photo', photo: null }); done('Foto quitada.'); }} />
        <AppButton label="Cancelar" variant="secondary" onPress={close} />
      </AppDialog>

      <AppDialog title={account.email ? '¿Eliminar tu cuenta y tus datos?' : '¿Eliminar los datos de este dispositivo?'} visible={dialog === 'delete'} onClose={close}>
        <View style={styles.dangerIcon}>
          <Ionicons name="warning-outline" size={28} color={colors.error} />
        </View>
        <AppText tone="muted">
          Se borrarán el perfil, la foto elegida, el diario de alimentación y el historial de Progreso de esta app.
          Esta acción <AppText variant="strong">no se puede deshacer</AppText>. Si quieres conservar una copia, expórtala antes.
        </AppText>
        {account.email ? <>
          <AppText variant="caption" tone="muted">También se eliminará tu cuenta {account.email}. Confirma tu identidad con tu contraseña.</AppText>
          <FormField label="Contraseña" value={password} onChange={(value) => { setPassword(value); setDeleteError(''); }} error={deleteError}
            secureTextEntry autoCapitalize="none" autoComplete="current-password" maxLength={72} />
        </> : <AppText variant="caption" tone="muted">No tienes una sesión iniciada, así que no hay una cuenta que eliminar.</AppText>}
        <AppButton label={deleting ? 'Eliminando…' : account.email ? 'Sí, eliminar mi cuenta y datos' : 'Sí, eliminar mis datos'} variant="danger" icon="trash-outline"
          disabled={deleting} onPress={deleteData} />
        <AppButton label="Mantener mis datos" variant="secondary" onPress={close} />
      </AppDialog>
    </Screen>
  );
}

const styles = StyleSheet.create({
  account: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surfaceLow },
  accountText: { flex: 1, gap: spacing.xs },
  saveError: { color: colors.error },
  dangerIcon: {
    width: 52, height: 52, borderRadius: 999,
    backgroundColor: '#FFDAD8', alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
});
