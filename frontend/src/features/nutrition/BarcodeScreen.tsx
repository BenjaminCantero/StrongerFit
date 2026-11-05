import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useReducer, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen } from '../../components/Screen';
import { AppButton } from '../../components/ui/AppButton';
import { AppText } from '../../components/ui/AppText';
import { Card } from '../../components/ui/Card';
import { FormField } from '../../components/ui/FormField';
import { colors, layout, radius, spacing } from '../../theme';
import { MealSelector } from './components/MealSelector';
import {
  barcodeReducer, isValidBarcode, normalizeBarcode, parseGrams, productEntry, productNutrients, type BarcodeState, type ProductLookup,
} from './domain/barcode';
import type { FoodEntry, MealId } from './domain/food-entry';
import { formatKcal, formatMacro, mealLabels } from './presentation';

type Props = {
  lookup: (code: string, signal?: AbortSignal) => Promise<ProductLookup>;
  initialMeal: MealId;
  onSave: (entry: FoodEntry) => void;
  onManual: (meal: MealId) => void;
  onExit: () => void;
};

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'] as const;

export function BarcodeScreen({ lookup, initialMeal, onSave, onManual, onExit }: Props) {
  const [state, send] = useReducer(barcodeReducer, { phase: 'scanning' } as BarcodeState);
  const [meal, setMeal] = useState<MealId>(initialMeal);
  const [manual, setManual] = useState('');
  const [manualError, setManualError] = useState('');
  const saved = useRef(false);

  // TanStack Query: un producto ya consultado queda en caché durante la sesión (no se
  // vuelve a pedir al escanearlo de nuevo) y un error de red se reintenta una vez.
  const code = state.phase === 'looking-up' ? state.code : null;
  const product = useQuery({
    queryKey: ['open-food-facts', 'product', code],
    queryFn: ({ signal }) => lookup(code!, signal),
    enabled: code !== null,
    staleTime: 24 * 60 * 60 * 1000,
  });
  useEffect(() => {
    if (!code || product.isFetching) return;
    if (product.isSuccess) send({ type: 'resolved', code, lookup: product.data });
    else if (product.isError) send({ type: 'failed', code });
  }, [code, product.isFetching, product.isSuccess, product.isError, product.data]);

  function submitManual() {
    const value = normalizeBarcode(manual);
    if (!isValidBarcode(value)) { setManualError('Revisa el número: debe tener 8, 12, 13 o 14 dígitos y ser un código válido.'); return; }
    setManualError('');
    send({ type: 'scanned', code: value });
  }

  function register() {
    if (state.phase !== 'found' || saved.current) return;
    const grams = parseGrams(state.grams);
    if (grams === null) return;
    saved.current = true;
    onSave(productEntry(state.product, grams, meal));
  }

  const found = state.phase === 'found';
  const grams = found ? parseGrams(state.grams) : null;

  return <View style={styles.screen}>
    <Screen>
      {(state.phase === 'scanning' || state.phase === 'error') && <>
        <Scanner active={state.phase === 'scanning'} onScanned={(result) => send({ type: 'scanned', code: result.data })} />
        {state.phase === 'error' && <Card tone="low">
          <View style={styles.row}>
            <Ionicons name="cloud-offline-outline" size={22} color={colors.error} />
            <AppText style={styles.flex}>No pudimos consultar el código {state.code}. Revisa tu conexión.</AppText>
          </View>
          <AppButton label="Reintentar" icon="refresh-outline" onPress={() => send({ type: 'scanned', code: state.code })} />
          <AppButton label="Escanear otro" variant="secondary" onPress={() => send({ type: 'rescan' })} />
        </Card>}
        <Card tone="low" style={styles.manual}>
          <FormField label="¿No se lee? Escribe el número" value={manual} onChange={(value) => { setManual(value); setManualError(''); }}
            keyboardType="number-pad" inputMode="numeric" placeholder="7801234567890" error={manualError} onSubmitEditing={submitManual} returnKeyType="search" />
          <AppButton label="Buscar producto" icon="search-outline" variant="secondary" onPress={submitManual} />
        </Card>
      </>}

      {state.phase === 'looking-up' && <Card style={styles.center}>
        <ActivityIndicator color={colors.brand} accessibilityLabel="Buscando producto" />
        <AppText accessibilityLiveRegion="polite">Buscando el código {state.code}…</AppText>
      </Card>}

      {(state.phase === 'not-found' || state.phase === 'incomplete') && <Card>
        <Ionicons name={state.phase === 'not-found' ? 'help-circle-outline' : 'alert-circle-outline'} size={32} color={colors.gold} />
        <AppText variant="heading">{state.phase === 'not-found' ? 'Producto no encontrado' : `${state.name ?? 'Este producto'} no tiene la información completa`}</AppText>
        <AppText tone="muted">
          {state.phase === 'not-found'
            ? `El código ${state.code} no está en Open Food Facts. Puedes registrarlo manualmente.`
            : 'Faltan las calorías o algún macronutriente por 100 g. Para no registrar valores inventados, regístralo manualmente con los datos de la etiqueta.'}
        </AppText>
        <AppButton label="Registrar manualmente" icon="create-outline" onPress={() => onManual(meal)} />
        <AppButton label="Escanear otro" variant="secondary" onPress={() => send({ type: 'rescan' })} />
      </Card>}

      {found && <>
        <Card style={styles.product}>
          <View style={styles.row}>
            {state.product.imageUrl
              ? <Image source={{ uri: state.product.imageUrl }} style={styles.image} accessibilityIgnoresInvertColors accessibilityLabel={`Envase de ${state.product.name}`} />
              : <View style={[styles.image, styles.placeholder]}><Ionicons name="cube-outline" size={28} color={colors.muted} /></View>}
            <View style={styles.flex}>
              <AppText variant="heading">{state.product.name}</AppText>
              {state.product.brand && !state.product.name.toLowerCase().includes(state.product.brand.toLowerCase()) && <AppText variant="caption" tone="muted">{state.product.brand}</AppText>}
              <AppText variant="caption" tone="muted">Código {state.product.code}</AppText>
            </View>
          </View>
          <AppText variant="caption" tone="muted">
            Por 100 g: {formatKcal(state.product.per100g.kcal)} kcal · P {formatMacro(state.product.per100g.protein)} g · C {formatMacro(state.product.per100g.carbs)} g · G {formatMacro(state.product.per100g.fat)} g
          </AppText>
        </Card>

        <Card tone="low">
          <FormField label="Cantidad" unit="g" value={state.grams} onChange={(value) => send({ type: 'set-grams', value })}
            keyboardType="decimal-pad" inputMode="decimal" error={grams === null ? 'Usa una cantidad entre 1 y 2000 g.' : undefined} />
          <View style={styles.chips}>
            <AppButton label="−10 g" variant="secondary" onPress={() => send({ type: 'adjust-grams', delta: -10 })} style={styles.flex} />
            <AppButton label="+10 g" variant="secondary" onPress={() => send({ type: 'adjust-grams', delta: 10 })} style={styles.flex} />
          </View>
          {state.product.servingGrams && <AppButton label={`1 porción (${formatMacro(state.product.servingGrams).replace(/,0$/, '')} g)`} variant="ghost"
            onPress={() => send({ type: 'set-grams', value: String(state.product.servingGrams) })} />}
        </Card>

        {grams !== null && <Totals nutrients={productNutrients(state.product, grams)} />}

        <View style={styles.section}>
          <AppText variant="header">Registrar en</AppText>
          <MealSelector selected={meal} onSelect={setMeal} />
        </View>
      </>}

      <AppText variant="caption" tone="muted">
        Datos de Open Food Facts (openfoodfacts.org), base colaborativa bajo licencia ODbL. Revisa que coincidan con la etiqueta del envase.
      </AppText>
    </Screen>

    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.footer}>
      <View style={styles.footerContent}>
        {found && <AppButton label={`Registrar en ${mealLabels[meal]}`} icon="checkmark-circle-outline" disabled={grams === null}
          onPress={register} style={styles.confirm} />}
        {found
          ? <AppButton label="Escanear otro producto" variant="ghost" onPress={() => send({ type: 'rescan' })} />
          : <AppButton label="Volver a Alimentación" variant="ghost" onPress={onExit} />}
      </View>
    </SafeAreaView>
  </View>;
}

function Scanner({ active, onScanned }: { active: boolean; onScanned: (result: BarcodeScanningResult) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  if (!permission) return <Card style={styles.center}><ActivityIndicator color={colors.brand} accessibilityLabel="Preparando cámara" /></Card>;
  if (!permission.granted) return <Card>
    <Ionicons name="barcode-outline" size={32} color={colors.brand} />
    <AppText variant="heading">Escanea el código de barras</AppText>
    <AppText tone="muted">
      {permission.canAskAgain
        ? 'Necesitamos la cámara para leer el código del envase. La imagen no se guarda ni se envía.'
        : 'El permiso de cámara está bloqueado. Habilítalo en los ajustes del teléfono o escribe el número abajo.'}
    </AppText>
    {permission.canAskAgain && <AppButton label="Permitir cámara" icon="camera-outline" onPress={requestPermission} />}
  </Card>;

  return <View style={styles.camera}>
    <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
      onBarcodeScanned={active ? onScanned : undefined} />
    <View pointerEvents="none" style={styles.frameWrap}>
      <View style={styles.frame} />
      <AppText variant="label" tone="white" style={styles.hint}>Centra el código de barras en el recuadro</AppText>
    </View>
  </View>;
}

function Totals({ nutrients }: { nutrients: ReturnType<typeof productNutrients> }) {
  return <Card style={styles.totals}>
    <AppText variant="label" tone="muted">Esta cantidad aporta</AppText>
    <AppText variant="metric" accessibilityLiveRegion="polite">{formatKcal(nutrients.kcal)} kcal</AppText>
    <View style={styles.chips}>
      {[['Proteínas', nutrients.protein], ['Carbohidratos', nutrients.carbs], ['Grasas', nutrients.fat]].map(([label, value]) =>
        <View key={label as string} style={styles.macro}>
          <AppText variant="strong">{formatMacro(value as number)} g</AppText>
          <AppText variant="caption" tone="muted">{label as string}</AppText>
        </View>)}
    </View>
  </Card>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  footer: { backgroundColor: colors.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.surfaceHigh },
  footerContent: { width: '100%', maxWidth: layout.contentWidth, alignSelf: 'center', padding: spacing.lg, gap: spacing.xs },
  confirm: { backgroundColor: colors.brandStrong },
  camera: { width: '100%', aspectRatio: 3 / 4, maxHeight: 460, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.ink },
  frameWrap: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  frame: { width: '78%', aspectRatio: 2.2, borderWidth: 3, borderColor: colors.white, borderRadius: radius.md },
  hint: { textAlign: 'center', paddingHorizontal: spacing.lg },
  manual: { gap: spacing.md },
  center: { alignItems: 'center', gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  product: { gap: spacing.md },
  image: { width: 72, height: 72, borderRadius: radius.sm, backgroundColor: colors.white },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceHigh },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  totals: { gap: spacing.xs },
  macro: { gap: 2, marginRight: spacing.lg },
  section: { gap: spacing.sm },
});
