import { describe, expect, it } from 'vitest';
import { bmr, nutritionTargets, tdee, type TargetInput } from './index';

const maintenance = { direction: 'maintenance', adjustment: 0, proteinPerKg: 1.6, fatShare: 0.25, healthRisk: false } as const;

describe('metas nutricionales (SRS 8.5)', () => {
  it('reproduce los vectores de CA-14', () => {
    const man = { sex: 'male', ageYears: 30, weightKg: 80, heightCm: 180, activity: 'moderate' } as const;
    const woman = { sex: 'female', ageYears: 28, weightKg: 65, heightCm: 165, activity: 'light' } as const;
    expect(bmr(man)).toBe(1780);
    expect(Math.round(tdee(man))).toBe(2759);
    expect(bmr(woman)).toBe(1380.25);
    expect(Math.round(tdee(woman))).toBe(1898);
    expect(nutritionTargets({ ...man, ...maintenance })).toMatchObject({ bmr: 1780, tdee: 2759, kcal: 2759 });
  });

  it('aplica el piso de 1 200 kcal con advertencia en el vector de CA-19', () => {
    const result = nutritionTargets({ sex: 'female', ageYears: 50, weightKg: 50, heightCm: 155, activity: 'sedentary',
      ...maintenance, direction: 'deficit', adjustment: 0.2 });
    expect(result.calculatedKcal).toBe(1015);
    expect(result.kcal).toBe(1200);
    expect(result.warnings).toContain('floor-applied');
  });

  it('no propone déficit con riesgo declarado (BR-19) y limita el ajuste (BR-17)', () => {
    const base: TargetInput = { sex: 'male', ageYears: 30, weightKg: 80, heightCm: 180, activity: 'moderate', ...maintenance };
    const risk = nutritionTargets({ ...base, direction: 'deficit', adjustment: 0.15, healthRisk: true });
    expect(risk).toMatchObject({ direction: 'maintenance', kcal: 2759 });
    expect(risk.warnings).toContain('risk-no-deficit');
    const capped = nutritionTargets({ ...base, direction: 'surplus', adjustment: 0.3 });
    expect(capped).toMatchObject({ adjustment: 0.15, kcal: Math.round(2759.0 * 1.15) });
    expect(capped.warnings).toContain('adjustment-capped');
  });

  it('reparte macros 4/4/9 sin superar la energía y usa el piso mayor sin sexo declarado', () => {
    const result = nutritionTargets({ sex: 'male', ageYears: 30, weightKg: 80, heightCm: 180, activity: 'moderate', ...maintenance });
    expect(result).toMatchObject({ protein: 128, fat: 77 });
    expect(Math.abs(result.protein * 4 + result.carbs * 4 + result.fat * 9 - result.kcal)).toBeLessThanOrEqual(4);
    const unspecified = nutritionTargets({ sex: 'unspecified', ageYears: 50, weightKg: 50, heightCm: 155, activity: 'sedentary', ...maintenance });
    expect(unspecified.floor).toBe(1500);
    expect(unspecified.warnings).toEqual(expect.arrayContaining(['unspecified-sex', 'floor-applied']));
  });
});
