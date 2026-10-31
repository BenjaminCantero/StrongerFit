import { AppPressable } from '../../../components/ui/AppPressable';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { colors, radius, spacing } from '../../../theme';
import { foodImages } from '../data/food-images';
import { nutrientsForGrams, type Food } from '../domain/food-entry';
import { formatGrams, formatKcal } from '../presentation';

export function FoodSuggestions({ foods, selectedIds, onToggle }: { foods: Food[]; selectedIds: string[]; onToggle: (id: string) => void }) {
  if (!foods.length) return null;
  return (
    <View style={styles.section}>
      <AppText variant="header" accessibilityRole="header">Acompañamientos</AppText>
      <AppText variant="caption" tone="muted">Toca para incluir o quitar del mismo registro.</AppText>
      <View style={styles.foods}>
        {foods.map((food) => {
          const selected = selectedIds.includes(food.id);
          return (
            <AppPressable key={food.id} accessibilityRole="checkbox" accessibilityLabel={`Añadir ${food.name}`} accessibilityState={{ checked: selected }} aria-checked={selected}
              onPress={() => onToggle(food.id)} style={({ pressed }) => [styles.food, selected && styles.selected, pressed && styles.pressed]}>
              <View style={styles.image}>
                <Ionicons name="nutrition-outline" size={25} color={colors.brand} />
                {foodImages[food.id] && <Image source={foodImages[food.id]} style={styles.photo} />}
              </View>
              <View style={styles.name}>
                <AppText variant="label">{food.name}</AppText>
                <AppText variant="caption" tone="muted">{formatGrams(food.servingGrams)} g · {formatKcal(nutrientsForGrams(food, food.servingGrams).kcal)} kcal</AppText>
              </View>
              <Ionicons name={selected ? 'checkmark-circle' : 'add-circle-outline'} size={21} color={colors.brand} />
            </AppPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  foods: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  food: { flexGrow: 1, flexBasis: 260, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surfaceLow,
    borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: 'transparent' },
  selected: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  image: { width: 40, height: 40, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1 },
  photo: { ...StyleSheet.absoluteFill, width: '100%', height: '100%', resizeMode: 'cover' },
  pressed: { opacity: 0.65 },
});
