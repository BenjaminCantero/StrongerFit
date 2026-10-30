import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { colors, radius, spacing } from '../../../theme';
import { foodImages } from '../data/food-images';
import type { Food } from '../domain/food-entry';
import { formatKcal } from '../presentation';

export function FoodSummary({ food }: { food: Food }) {
  return (
    <Card tone="low" style={styles.card}>
      <View style={styles.top}>
        <View style={[styles.image, styles.placeholder]} accessible accessibilityLabel={food.name}>
          <Ionicons name="nutrition-outline" size={25} color={colors.brand} />
          {foodImages[food.id] && <Image source={foodImages[food.id]} style={styles.photo} />}
        </View>
        <View style={styles.description}>
          <AppText variant="label" tone="muted">Alimento de ejemplo</AppText>
          <AppText variant="header" accessibilityRole="header">{food.name}</AppText>
          <AppText variant="caption" tone="muted">Base: {formatKcal(food.per100g.kcal)} kcal / 100 g</AppText>
        </View>
      </View>
      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={16} color={colors.brand} />
        <AppText variant="caption" tone="muted" style={styles.noteText}>Datos ilustrativos. Alérgenos y procedencia pendientes de verificar.</AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  image: { width: 64, height: 64, borderRadius: radius.md, overflow: 'hidden' },
  photo: { ...StyleSheet.absoluteFill, width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  description: { flex: 1, gap: spacing.xs },
  note: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  noteText: { flex: 1 },
});
