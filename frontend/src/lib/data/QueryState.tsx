import type { PropsWithChildren } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppButton } from '../../components/ui/AppButton';
import { AppText } from '../../components/ui/AppText';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme';
import { dataErrorMessage, toDataError } from './errors';

type Props = PropsWithChildren<{
  isPending: boolean;
  error: unknown;
  onRetry: () => void;
  // Etiqueta para lector de pantalla mientras carga.
  loadingLabel?: string;
  // Si ya hay datos (por ejemplo, desde la caché), el error se muestra como aviso sobre ellos.
  hasData?: boolean;
}>;

// Estados de carga, error y sin conexión con un mismo estilo en todas las pantallas (SY-01).
export function QueryState({ isPending, error, onRetry, loadingLabel = 'Cargando', hasData = false, children }: Props) {
  if (isPending && !hasData) {
    return <View style={{ paddingVertical: 32, alignItems: 'center' }}>
      <ActivityIndicator color={colors.brand} accessibilityLabel={loadingLabel} />
    </View>;
  }
  if (error) {
    const message = dataErrorMessage(toDataError(error));
    const notice = <Card tone="low" accessibilityRole="alert" style={{ gap: 12 }}>
      <AppText>{message}</AppText>
      <AppButton label="Reintentar" icon="refresh" variant="secondary" onPress={onRetry} />
    </Card>;
    return hasData ? <View style={{ gap: 16 }}>{notice}{children}</View> : notice;
  }
  return <>{children}</>;
}
