import { PALETTE } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Accelerometer, Subscription } from 'expo-sensors';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

// --- CONFIGURAÇÕES E CONSTANTES DO JOGO ---
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PLAYER_SIZE = 50;
const ASTEROID_SIZE_MIN = 40;
const ASTEROID_SIZE_MAX = 60;
const PLAYER_SENSITIVITY = 170;

// Parâmetros para cada nível de dificuldade
const DIFFICULTY_SETTINGS = {
  'Noob Master':        { initialSpeed: 2.5, maxSpeed: 5.0, spawnRate: 140, scoreMultiplier: 0.8 },
  'Noob': { initialSpeed: 3.0, maxSpeed: 8.0, spawnRate: 120, scoreMultiplier: 1.0 },
  'Regular':     { initialSpeed: 3.5, maxSpeed: 9.0, spawnRate: 100, scoreMultiplier: 1.2 },
  'Pro':         { initialSpeed: 4.0, maxSpeed: 10.0, spawnRate: 80, scoreMultiplier: 1.5 },
  'Pro Master':  { initialSpeed: 4.5, maxSpeed: 12.0, spawnRate: 60, scoreMultiplier: 2.0 },
};

// AJUSTE 1: Array com a ordem correta dos níveis para exibição
const DIFFICULTY_ORDER: Difficulty[] = ['Noob', 'Noob Master', 'Regular', 'Pro', 'Pro Master'];

type Difficulty = keyof typeof DIFFICULTY_SETTINGS;
type GameObject = { id: number; x: number; y: number; width: number; height: number; rotation: number; };

// --- COMPONENTE PRINCIPAL DO JOGO ---
export default function CosmicCorridorScreen() {
  const [gameState, setGameState] = useState<'initial' | 'difficulty_selection' | 'playing' | 'gameOver'>('initial');
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('Regular');
  
  const playerX = useRef(new Animated.Value(SCREEN_WIDTH / 2 - PLAYER_SIZE / 2)).current;
  const [asteroids, setAsteroids] = useState<GameObject[]>([]);
  const [stars, setStars] = useState<{ id: number, x: number, y: number, size: number }[]>([]);
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const obstacleCounterRef = useRef(0);
  const gameSpeedRef = useRef(DIFFICULTY_SETTINGS.Regular.initialSpeed);

  useEffect(() => {
    const generatedStars = Array.from({ length: 100 }, (_, i) => ({ id: i, x: Math.random() * SCREEN_WIDTH, y: Math.random() * SCREEN_HEIGHT, size: Math.random() * 2 + 1, }));
    setStars(generatedStars);
  }, []);

  useEffect(() => {
    let subscription: Subscription | null = null;
    if (gameState === 'playing') {
      subscription = Accelerometer.addListener(({ x }) => {
        let newX = playerX._value + x * PLAYER_SENSITIVITY;
        if (newX < 0) newX = 0;
        if (newX > SCREEN_WIDTH - PLAYER_SIZE) newX = SCREEN_WIDTH - PLAYER_SIZE;
        Animated.timing(playerX, { toValue: newX, duration: 100, useNativeDriver: false }).start();
      });
      Accelerometer.setUpdateInterval(16);
    }
    return () => subscription?.remove();
  }, [gameState, playerX]);

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(() => {
        let isGameOver = false;
        obstacleCounterRef.current += 1;

        const difficultySettings = DIFFICULTY_SETTINGS[difficulty];
        const speedIncrease = (score / 2000) * (difficultySettings.maxSpeed - difficultySettings.initialSpeed);
        gameSpeedRef.current = Math.min(difficultySettings.maxSpeed, difficultySettings.initialSpeed + speedIncrease);

        const currentSpawnRate = Math.max(30, difficultySettings.spawnRate - Math.floor(score / 500));

        setStars(prevStars => prevStars.map(star => ({ ...star, y: (star.y > SCREEN_HEIGHT) ? 0 : star.y + gameSpeedRef.current / 2 })));

        let newAsteroids = asteroids
          .map(obs => ({ ...obs, y: obs.y + gameSpeedRef.current }))
          .filter(obs => obs.y < SCREEN_HEIGHT);

        if (obstacleCounterRef.current >= currentSpawnRate) {
          obstacleCounterRef.current = 0;
          const size = Math.random() * (ASTEROID_SIZE_MAX - ASTEROID_SIZE_MIN) + ASTEROID_SIZE_MIN;
          newAsteroids.push({ id: Date.now(), y: -ASTEROID_SIZE_MAX, x: Math.random() * (SCREEN_WIDTH - size), width: size, height: size, rotation: Math.random() * 360 });
        }
        
        const playerCenterX = playerX._value + PLAYER_SIZE / 2;
        const playerCenterY = SCREEN_HEIGHT - 100 + PLAYER_SIZE / 2;
        
        for (const ast of newAsteroids) {
          const astCenterX = ast.x + ast.width / 2;
          const astCenterY = ast.y + ast.height / 2;
          const distance = Math.sqrt(Math.pow(playerCenterX - astCenterX, 2) + Math.pow(playerCenterY - astCenterY, 2));
          const collisionThreshold = (PLAYER_SIZE / 3.5) + (ast.width / 3.5);
          if (distance < collisionThreshold) {
            isGameOver = true;
            break;
          }
        }

        if (isGameOver) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setGameState('gameOver');
        } else {
          setScore(s => s + Math.round(difficultySettings.scoreMultiplier));
          setAsteroids(newAsteroids);
        }
      }, 16);
    }

    return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
  }, [gameState, asteroids, playerX, score, difficulty]);
  
  const startGame = (selectedDifficulty: Difficulty) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDifficulty(selectedDifficulty);
    gameSpeedRef.current = DIFFICULTY_SETTINGS[selectedDifficulty].initialSpeed;
    setScore(0);
    setAsteroids([]);
    playerX.setValue(SCREEN_WIDTH / 2 - PLAYER_SIZE / 2);
    setGameState('playing');
  };

  const renderMenu = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.title}>{gameState === 'gameOver' ? 'FIM DE JOGO' : 'CORREDOR CÓSMICO'}</Text>
      {gameState === 'gameOver' && <Text style={styles.finalScore}>PONTUAÇÃO FINAL: {score}</Text>}
      <Pressable onPress={() => setGameState('difficulty_selection')} style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.8 }]}>
        <Text style={styles.startButtonText}>{gameState === 'initial' ? 'INICIAR' : 'JOGAR NOVAMENTE'}</Text>
      </Pressable>
    </View>
  );

  const renderDifficultySelection = () => (
    <View style={styles.menuContainer}>
        <Text style={styles.title}>DIFICULDADE</Text>
        {DIFFICULTY_ORDER.map(level => (
            <Pressable key={level} onPress={() => startGame(level)} style={({ pressed }) => [styles.difficultyButton, pressed && { opacity: 0.8 }]}>
              {/* AJUSTE 2: Usando um estilo de texto claro para os botões de dificuldade */}
              <Text style={styles.difficultyButtonText}>{level}</Text>
            </Pressable>
        ))}
    </View>
  );

  return (
    <LinearGradient colors={[PALETTE.background, PALETTE.background_darker]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {stars.map(star => <View key={star.id} style={[styles.star, { left: star.x, top: star.y, width: star.size, height: star.size }]} />)}
        
        {gameState === 'playing' && <Text style={styles.scoreText}>PONTOS: {score}</Text>}

        <View style={styles.gameArea}>
          {gameState === 'playing' && (
            <Animated.View style={[styles.player, { left: playerX }]} >
                <Text style={styles.playerEmoji}>🚀</Text>
            </Animated.View>
          )}
          {asteroids.map(obs => (
            <View key={obs.id} style={[styles.asteroid, { top: obs.y, left: obs.x, width: obs.width, height: obs.height, transform: [{rotate: `${obs.rotation}deg`}] }]}>
              <Text style={{fontSize: obs.width * 0.8}}>☄️</Text>
            </View>
          ))}
        </View>

        {gameState === 'initial' && renderMenu()}
        {gameState === 'difficulty_selection' && renderDifficultySelection()}
        {gameState === 'gameOver' && renderMenu()}
      </SafeAreaView>
    </LinearGradient>
  );
}

// --- ESTILOS DO JOGO ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, alignItems: 'center', overflow: 'hidden' },
  scoreText: { color: PALETTE.textPrimary, fontSize: 24, fontFamily: 'Orbitron-Bold', position: 'absolute', top: 60, zIndex: 10, textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 3 },
  gameArea: { flex: 1, width: '100%', height: '100%', position: 'relative' },
  player: { width: PLAYER_SIZE, height: PLAYER_SIZE, position: 'absolute', bottom: 80, justifyContent: 'center', alignItems: 'center' },
  playerEmoji: { fontSize: 40, transform: [{ rotate: '-45deg' }] },
  asteroid: { position: 'absolute', justifyContent: 'center', alignItems: 'center', opacity: 0.9 },
  star: { position: 'absolute', backgroundColor: 'white', borderRadius: 2, opacity: 0.7 },
  menuContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  title: { fontSize: 36, fontFamily: 'Orbitron-Bold', color: PALETTE.textPrimary, textAlign: 'center', marginBottom: 40, textShadowColor: '#000', textShadowRadius: 5 },
  finalScore: { fontSize: 22, fontFamily: 'Orbitron-Regular', color: PALETTE.primary, marginBottom: 40 },
  startButton: { backgroundColor: PALETTE.primary, paddingVertical: 15, paddingHorizontal: 40, borderRadius: 10 },
  startButtonText: { color: PALETTE.background_darker, fontSize: 20, fontFamily: 'Orbitron-Bold' },
  difficultyButton: { backgroundColor: PALETTE.secondary, paddingVertical: 15, borderRadius: 10, width: '80%', alignItems: 'center', marginBottom: 15 },
  // AJUSTE 3: Estilo dedicado para o texto dos botões de dificuldade
  difficultyButtonText: {
    color: PALETTE.textPrimary, // Cor clara para garantir a visibilidade
    fontSize: 18,
    fontFamily: 'Orbitron-Bold',
  },
});