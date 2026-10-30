import { AppPressable } from '../../../components/ui/AppPressable';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, type ComponentProps } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { colors, layout, radius, spacing } from '../../../theme';
import type { MealId } from '../domain/food-entry';
import { mealLabels } from '../presentation';

const meals: { id: MealId; icon: ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'breakfast', icon: 'sunny-outline' }, { id: 'lunch', icon: 'restaurant-outline' },
  { id: 'snack', icon: 'cafe-outline' }, { id: 'dinner', icon: 'moon-outline' },
];

export function MealSelector({ selected, onSelect }: { selected: MealId; onSelect: (meal: MealId) => void }) {
  const scroll = useRef<ScrollView>(null);
  const positions = useRef<Partial<Record<MealId, { x: number; width: number }>>>({});
  const viewport = useRef(0);
  const offset = useRef(0);

  function reveal(meal: MealId, animated = true) {
    const box = positions.current[meal];
    if (!box || !viewport.current) return;
    if (box.x < offset.current) scroll.current?.scrollTo({ x: box.x, animated });
    else if (box.x + box.width > offset.current + viewport.current) {
      scroll.current?.scrollTo({ x: box.x + box.width - viewport.current, animated });
    }
  }

  return (
    <View role="radiogroup" accessibilityLabel="Momento de comida">
      <ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}
        onLayout={(event) => { viewport.current = event.nativeEvent.layout.width; reveal(selected, false); }}
        onScroll={(event) => { offset.current = event.nativeEvent.contentOffset.x; }} scrollEventThrottle={16}>
        {meals.map(({ id, icon }) => (
          <AppPressable key={id} accessibilityRole="radio" accessibilityLabel={mealLabels[id]} accessibilityState={{ checked: selected === id }} aria-checked={selected === id}
            onLayout={(event) => { positions.current[id] = event.nativeEvent.layout; if (id === selected) reveal(id, false); }}
            onPress={() => { onSelect(id); reveal(id); }} style={({ pressed }) => [styles.chip, selected === id && styles.selected, pressed && styles.pressed]}>
            <Ionicons name={icon} size={16} color={selected === id ? colors.white : colors.muted} />
            <AppText variant="label" tone={selected === id ? 'white' : 'muted'}>{mealLabels[id]}</AppText>
          </AppPressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm },
  chip: { minHeight: layout.touchTarget, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surfaceLow },
  selected: { backgroundColor: colors.brand },
  pressed: { opacity: 0.65 },
});
