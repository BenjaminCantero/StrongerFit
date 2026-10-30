import type { ComponentProps } from 'react';
import { Pressable } from 'react-native';

// These controls use native StyleSheet styles, including pressed-state callbacks.
// NativeWind's native interop treats callbacks as style objects and drops them.
// Bypass that conversion while preserving Pressable events, accessibility and refs.
export function AppPressable(props: Omit<ComponentProps<typeof Pressable>, 'className'>) {
  return <Pressable {...props} cssInterop={false} />;
}
