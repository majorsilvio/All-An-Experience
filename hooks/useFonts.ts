import * as Font from 'expo-font';
import { useEffect, useState } from 'react';

export const useFonts = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          'Orbitron-Regular': require('../assets/fonts/Orbitron-Regular.ttf'),
          'Orbitron-Bold': require('../assets/fonts/Orbitron-Bold.ttf'),
          'PressStart2P-Regular': require('../assets/fonts/PressStart2P-Regular.ttf'),
          'SpaceMono-Regular': require('../assets/fonts/SpaceMono-Regular.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.warn('Error loading fonts:', error);
        setFontsLoaded(true); // Continue without custom fonts
      }
    };

    loadFonts();
  }, []);

  return fontsLoaded;
};

// Font utility functions - Agora usando as fontes reais
export const FONTS = {
  // Títulos Principais (como "Biblioteca de Jogos")
  primary: 'Orbitron-Bold',
  // Títulos de Jogos (nos modais, tela de vitória)
  gaming: 'PressStart2P-Regular', 
  // Textos de Descrição, Botões, Recordes
  regular: 'Orbitron-Regular',
  // Fallback
  mono: 'SpaceMono-Regular',
};
