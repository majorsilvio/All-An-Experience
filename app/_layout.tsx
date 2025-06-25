import { Stack } from 'expo-router';
import { FavoritesProvider } from './context/FavoritesContext';

export default function RootLayout() {
  return (
    // Envolvemos toda a aplicação com o nosso provedor de favoritos
    <FavoritesProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </FavoritesProvider>
  );
}