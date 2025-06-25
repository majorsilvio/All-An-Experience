import { Stack, router } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { PALETTE } from '../../constants/Colors';

export default function GameLayout() {
  return (
    <Stack
      // As opções de ESTILO aplicadas a todos os headers continuam aqui
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: PALETTE.background_darker,
        },
        headerTintColor: PALETTE.textPrimary, // Cor do título e do botão
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
      {/* AQUI definimos o título para cada tela específica.
        O 'name' deve ser IGUAL ao nome do arquivo (sem o .tsx).
      */}
      <Stack.Screen
        name="MemoryGame" // Para o arquivo MemoryGame.tsx
        options={{ title: 'Genius' }} // Este será o ÚNICO título exibido
      />
      <Stack.Screen
        name="Chess" // Para o arquivo Chess.tsx
        options={{ title: 'Xadrez' }} 
      />
      <Stack.Screen
        name="LogicLed" // Para o arquivo LogicLed.tsx
        options={{ title: 'Led Lógico' }} 
      />
      <Stack.Screen
        name="TicTacToe" // Para o arquivo TicTacToe.tsx
        options={{ title: 'Jogo da Velha' }} 
      />
      {/* Adicione uma nova linha <Stack.Screen> para cada novo jogo */}

    </Stack>
  );
}