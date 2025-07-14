import { Stack, router } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { FONTS } from '../../hooks/useFonts';
import { useThemePalette } from '../../hooks/useThemePalette';

export default function GameLayout() {
  const palette = useThemePalette();

  return (
    <Stack
      // Opções de estilo globais aplicadas a todos os jogos
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: palette.background_darker,
        },
        headerTintColor: palette.textPrimary,
        headerTitleStyle: {
          fontFamily: FONTS.primary,
          fontSize: 18,
        },
        headerShadowVisible: false,
        headerTitleAlign: 'center',
        headerLeft: () => (
          <Pressable 
            onPress={() => router.back()} 
            style={({ pressed }) => ({ 
              marginLeft: 10, 
              opacity: pressed ? 0.7 : 1,
              transform: [{ scale: pressed ? 0.95 : 1 }],
              backgroundColor: pressed ? palette.cardBackground : 'transparent',
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
            })}
          >
            <Text style={{ 
              color: palette.primary, 
              fontSize: 24, 
              fontWeight: 'bold',
              fontFamily: FONTS.gaming,
            }}>‹</Text>
          </Pressable>
        ),
      }}
    >
      {/* Configuração de título individual para cada tela.
          O 'name' DEVE ser exatamente o nome do arquivo.
      */}
      <Stack.Screen name="Chess" options={{ title: 'Xadrez' }} />
      <Stack.Screen name="LogicLed" options={{ title: 'Led Lógico' }} />
      <Stack.Screen name="MemoryGame" options={{ title: 'Genius' }} />
      <Stack.Screen name="TicTacToe" options={{ title: 'Jogo da Velha' }} />
      <Stack.Screen name="Strength" options={{ title: 'Forca' }} />
      <Stack.Screen name="Minesweeper" options={{ title: 'Campo Minado' }} />

    </Stack>
  );
}