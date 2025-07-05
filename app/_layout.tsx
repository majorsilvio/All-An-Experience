import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { initDB } from '../services/database';
import { FavoritesProvider } from './context/FavoritesContext';

export default function RootLayout() {
  // Inicializa o banco de dados quando o app é carregado
  useEffect(() => {
    try {
      initDB();
    } catch (error) {
      console.error('Erro ao inicializar banco de dados:', error);
    }
  }, []);

  return (
    // Envolvemos toda a aplicação com o nosso provedor de favoritos
    <FavoritesProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </FavoritesProvider>
  );
}