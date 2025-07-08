import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemePalette } from '../../hooks/useThemePalette';

export const FloatingBackButton = () => {
  // Hook para garantir que o botão não fique atrás da notch ou status bar
  const insets = useSafeAreaInsets();
  const palette = useThemePalette();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Proteção contra paleta não inicializada
  if (!palette) {
    return null;
  }

  // Animação de fade-in para o botão aparecer suavemente
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: 200, // Um pequeno delay para não aparecer instantaneamente
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const styles = createStyles(palette);

  return (
    <Animated.View style={[styles.container, { top: insets.top + 10, opacity: fadeAnim }]}>
      <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.button, { opacity: pressed ? 0.7 : 1 }]}>
        <Text style={styles.icon}>‹</Text>
      </Pressable>
    </Animated.View>
  );
};

const createStyles = (palette: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    left: 10,
    zIndex: 10, // Garante que o botão fique sobre o conteúdo do jogo
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  icon: {
    color: palette.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 32,
    textAlign: 'center',
  },
});