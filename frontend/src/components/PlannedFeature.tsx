import { Text, View } from 'react-native';
import { Screen } from './Screen';

export function PlannedFeature({ title, description }: { title: string; description: string }) {
  return (
    <Screen title={title}>
      <Text className="text-lg leading-7 text-ink">{description}</Text>
      <View className="mt-8 border-t border-line pt-5">
        <Text className="text-base leading-6 text-muted">Esta sección estará disponible en una próxima etapa de desarrollo.</Text>
      </View>
    </Screen>
  );
}
