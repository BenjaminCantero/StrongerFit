import { useImperativeHandle, useRef, type Ref } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, type ScrollViewInstance, type ScrollViewProps } from 'react-native';

// Usar KeyboardAvoider como padre de KeyboardAwareScrollView (o de un diálogo).
// Android 15+ (edge-to-edge obligatorio en SDK 58) ya no redimensiona la ventana con
// `adjustResize`, así que el teclado tapa el contenido. RN emite el alto del teclado y
// KeyboardAvoidingView lo convierte en padding inferior, lo que encoge el ScrollView y
// Android desplaza el campo enfocado a la vista. En iOS se usa
// `automaticallyAdjustKeyboardInsets` del ScrollView (no se duplica con el KAV) y en web
// el navegador ya se encarga, por lo que el KAV se desactiva.
const avoidsWithView = Platform.OS === 'android';

export function KeyboardAvoider({ children, style }: Pick<ScrollViewProps, 'children'> & { style?: ScrollViewProps['style'] }) {
  return <KeyboardAvoidingView enabled={avoidsWithView} behavior="padding" style={[styles.fill, style]}>{children}</KeyboardAvoidingView>;
}

export function KeyboardAwareScrollView({ ref, ...props }: ScrollViewProps & { ref?: Ref<ScrollViewInstance> }) {
  const scroll = useRef<ScrollViewInstance>(null);
  useImperativeHandle(ref, () => scroll.current!, []);
  const { onFocus, ...rest } = props;

  return <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
    automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'} onFocus={(event) => {
      onFocus?.(event);
      const target = event.target;
      // En Android el ajuste de la ventana no desplaza siempre el campo activo.
      // Esperamos a que el teclado y KeyboardAvoidingView terminen de acomodarse
      // antes de llevar el control por encima de él.
      if (Platform.OS === 'android' && target !== undefined) setTimeout(() => {
        scroll.current?.scrollResponderScrollNativeHandleToKeyboard(target, 24, true);
      }, 250);
    }} {...rest} />;
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
