import { View } from 'react-native';
import { Screen } from './Screen';
import { AppText } from './ui/AppText';

export function PlannedFeature({ title, description }: { title: string; description: string }) {
  return (
    <Screen title={title}>
      <AppText>{description}</AppText>
      <View className="mt-8 border-t border-line pt-5">
        <AppText tone="muted">Esta sección estará disponible en una próxima etapa de desarrollo.</AppText>
      </View>
    </Screen>
  );
}
