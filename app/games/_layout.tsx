import { Stack, router } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { PALETTE } from '../../constants/Colors'; // Ajuste o caminho se necessário

export default function GameLayout() {
  return (
    <Stack
      // Opções de estilo globais aplicadas a todos os jogos
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: PALETTE.background_darker,
        },
        headerTintColor: PALETTE.textPrimary,
        headerTitleStyle: {
          fontFamily: 'Orbitron-Bold',
          fontSize: 18,
        },
        headerShadowVisible: false,
        headerTitleAlign: 'center',
        headerLeft: () => (
          <Pressable 
            onPress={() => router.back()} 
            style={({ pressed }) => ({ marginLeft: 10, opacity: pressed ? 0.5 : 1 })}
          >
            <Text style={{ color: PALETTE.textPrimary, fontSize: 28, fontWeight: 'bold' }}>‹</Text>
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
      
    </Stack>
  );
}