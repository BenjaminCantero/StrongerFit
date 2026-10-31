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
import { NutritionEditor, PersonalEditor } from './components/ProfileEditors';
import { ProfileHero } from './components/ProfileHero';
import { profileAvatar } from './presentation';
import type { ExportResult } from './device';
import type { ProfileAction, ProfileData } from './domain/profile';

type Dialog = 'personal' | 'nutrition' | 'photo' | 'delete' | null;

type Props = {
  profile: ProfileData;
  dispatch: (action: ProfileAction) => void;
  isPreview: boolean;
  onPickPhoto: () => Promise<string | null>;
  onExport: () => Promise<ExportResult>;
  onDeleteLocalData: () => void;
  onGoals: () => void;
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

export function ProfileScreen({ profile, dispatch, isPreview, onPickPhoto, onExport, onDeleteLocalData, onGoals }: Props) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [notice, setNotice] = useState('');
  const [exporting, setExporting] = useState(false);
  const close = () => setDialog(null);
  const done = (message: string) => { close(); setNotice(message); };

  const photo = profileAvatar(profile.photo);

  async function pickPhoto() {
    close();
    try {
      const uri = await onPickPhoto();
      if (uri) { dispatch({ type: 'set-photo', photo: { uri } }); setNotice('Foto actualizada en este dispositivo.'); }
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

  return (
    <Screen>
      <PreviewNotice local={!isPreview}>
        {isPreview ? 'Vista previa · Datos de ejemplo y cambios solo en memoria' : 'Perfil local · Los cambios se borran al cerrar la app'}
      </PreviewNotice>

      <ProfileHero name={profile.name} photo={photo} summary={heroSummary(profile)}
        onPhoto={() => profile.photo ? setDialog('photo') : pickPhoto()} />

      {!!notice && <AppText accessibilityLiveRegion="polite" variant="caption" tone="brand">{notice}</AppText>}

      <PersonalDataCard profile={profile} onEdit={() => { setNotice(''); setDialog('personal'); }} />
      <NutritionCard exclusions={profile.exclusions} dietFocus={profile.dietFocus} target={profile.nutritionPlan?.result ?? null} onGoals={onGoals} onAdjust={() => { setNotice(''); setDialog('nutrition'); }} />
      <PrivacyCard exporting={exporting} consentDate={formatDay(profile.onboarding?.consent.acceptedAt)}
        healthDate={formatDay(profile.onboarding?.completedAt)} healthRisk={!!profile.onboarding?.healthFlags.length} onExport={exportData} onDelete={() => { setNotice(''); setDialog('delete'); }} />
      <AppInfoCard />

      <View style={styles.account}>
        <Ionicons name="person-circle-outline" size={22} color={colors.muted} />
        <View style={styles.accountText}>
          <AppText variant="strong">Cuenta</AppText>
          <AppText variant="caption" tone="muted">
            El registro y el inicio de sesión llegarán en una próxima etapa. Por ahora no hay una sesión que cerrar.
          </AppText>
        </View>
      </View>

      <AppDialog title="Editar ficha personal" visible={dialog === 'personal'} onClose={close}>
        {dialog === 'personal' && <PersonalEditor profile={profile} onCancel={close}
          onSave={(values) => { dispatch({ type: 'update-personal', values }); done('Ficha actualizada en este dispositivo.'); }} />}
      </AppDialog>

      <AppDialog title="Nutrición y restricciones" visible={dialog === 'nutrition'} onClose={close}>
        {dialog === 'nutrition' && <NutritionEditor profile={profile} onCancel={close}
          onSave={(values) => { dispatch({ type: 'update-nutrition', ...values }); done('Preferencias actualizadas en este dispositivo.'); }} />}
      </AppDialog>

      <AppDialog title="Foto de perfil" visible={dialog === 'photo'} onClose={close}>
        <AppText tone="muted">La foto solo se muestra en este dispositivo y no se incluye en la exportación.</AppText>
        <AppButton label="Elegir otra foto" icon="images-outline" onPress={pickPhoto} />
        <AppButton label="Quitar foto" icon="trash-outline" variant="danger"
          onPress={() => { dispatch({ type: 'set-photo', photo: null }); done('Foto quitada.'); }} />
        <AppButton label="Cancelar" variant="secondary" onPress={close} />
      </AppDialog>

      <AppDialog title="¿Eliminar los datos de este dispositivo?" visible={dialog === 'delete'} onClose={close}>
        <View style={styles.dangerIcon}>
          <Ionicons name="warning-outline" size={28} color={colors.error} />
        </View>
        <AppText tone="muted">
          Se borrarán el perfil, la foto elegida, el diario de alimentación y el historial de Progreso de esta app.
          Esta acción <AppText variant="strong">no se puede deshacer</AppText>. Si quieres conservar una copia, expórtala antes.
        </AppText>
        <AppText variant="caption" tone="muted">Aún no existe una cuenta en la nube, así que no hay datos remotos que eliminar.</AppText>
        <AppButton label="Sí, eliminar mis datos" variant="danger" icon="trash-outline"
          onPress={() => { onDeleteLocalData(); done('Datos de este dispositivo eliminados.'); }} />
        <AppButton label="Mantener mis datos" variant="secondary" onPress={close} />
      </AppDialog>
    </Screen>
  );
}

const styles = StyleSheet.create({
  account: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surfaceLow },
  accountText: { flex: 1, gap: spacing.xs },
  dangerIcon: {
    width: 52, height: 52, borderRadius: 999,
    backgroundColor: '#FFDAD8', alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
});
