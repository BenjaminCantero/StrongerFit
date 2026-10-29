import type { PropsWithChildren } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="mx-auto w-full max-w-2xl px-6 pb-10 pt-10">
          <Text accessibilityRole="header" className="mb-8 text-3xl font-bold text-ink">{title}</Text>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
