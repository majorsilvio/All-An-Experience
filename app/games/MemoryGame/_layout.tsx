import { Stack } from 'expo-router';
import React from 'react';

export default function GameLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Jogo da Memória' }} />
    </Stack>
  );
}