import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Define a estrutura de um nível
export type LevelData = {
  start: { x: number; y: number };
  hole: { x: number; y: number };
  stars: { x: number; y: number; id: string }[];
  walls: { x: number; y: number; width: number; height: number }[];
};

// Define os 15 níveis (aqui estão alguns exemplos, você pode criar mais)
export const LEVELS: LevelData[] = Array.from({ length: 15 }, (_, i) => {
    const levelIndex = i + 1;
    // Lógica para aumentar a complexidade
    const wallCount = 2 + Math.floor(levelIndex / 3);
    const walls = Array.from({ length: wallCount }, () => ({
        x: Math.random() * SCREEN_WIDTH * 0.8,
        y: SCREEN_HEIGHT * 0.2 + Math.random() * SCREEN_HEIGHT * 0.6,
        width: Math.random() > 0.5 ? 10 : Math.random() * 100 + 50,
        height: Math.random() <= 0.5 ? 10 : Math.random() * 100 + 50,
    }));

    const stars = Array.from({ length: 3 }, (_, starIndex) => ({
        id: `level_${levelIndex}_star_${starIndex}`,
        x: SCREEN_WIDTH * 0.1 + Math.random() * SCREEN_WIDTH * 0.8,
        y: SCREEN_HEIGHT * 0.15 + Math.random() * SCREEN_HEIGHT * 0.7,
    }));

    return {
        start: { x: SCREEN_WIDTH / 2, y: 80 },
        hole: { x: SCREEN_WIDTH * 0.1 + Math.random() * SCREEN_WIDTH * 0.8, y: SCREEN_HEIGHT - 120 },
        walls,
        stars,
    };
});