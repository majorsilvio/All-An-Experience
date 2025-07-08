import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { PALETTE } from '../constants/Colors';
import { useFonts } from '../hooks/useFonts';
import { initDB } from '../services/database';
import { FavoritesProvider } from './context/FavoritesContext';

export default function RootLayout() {
  const fontsLoaded = useFonts();

  // Inicializa o banco de dados quando o app é carregado
  useEffect(() => {
    try {
      initDB();
    } catch (error) {
      console.error('Erro ao inicializar banco de dados:', error);
    }
  }, []);

  // Loading screen com design neo-brutalista
  if (!fontsLoaded) {
    return (
      <LinearGradient 
        colors={[PALETTE.background, PALETTE.background_darker]} 
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <Text style={{
          color: PALETTE.primary,
          fontSize: 14,
          fontFamily: 'PressStart2P-Regular',
          letterSpacing: 1.5,
          textAlign: 'center',
        }}>
          CARREGANDO...
        </Text>
        <View style={{
          width: 200,
          height: 4,
          backgroundColor: PALETTE.primary,
          marginTop: 24,
          shadowColor: PALETTE.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 8,
        }} />
      </LinearGradient>
    );
  }

  return (
    // Envolvemos toda a aplicação com o nosso provedor de favoritos
    <FavoritesProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </FavoritesProvider>
  );
}