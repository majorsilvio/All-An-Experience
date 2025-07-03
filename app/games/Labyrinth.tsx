import { PALETTE as AppPalette } from '@/constants/Colors';
import { LEVELS, LevelData } from '@/constants/LabyrinthLevels';
import { loadLabyrinthLevels, unlockLabyrinthLevel, updateLabyrinthLevelStars } from '@/services/database';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Accelerometer } from 'expo-sensors';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

// --- CONSTANTES E TIPOS ---
const PALETTE = { ...AppPalette, danger: '#FF4757', wall: '#4B4B4B', secondary: '#00FFFF', star: '#FFD700' };
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BALL_SIZE = 24;
const HOLE_SIZE = 40;
const STAR_SIZE = 25;
const SENSITIVITY = 15;
const INITIAL_LIVES = 5;

// Safety margins to keep elements visible and playable
const SAFETY_MARGIN = 20;
const HUD_HEIGHT = 100; // Space reserved for HUD at top
const SAFE_AREA = {
  minX: SAFETY_MARGIN,
  maxX: SCREEN_WIDTH - SAFETY_MARGIN,
  minY: HUD_HEIGHT + SAFETY_MARGIN,
  maxY: SCREEN_HEIGHT - SAFETY_MARGIN
};

type GameState = 'loading' | 'level_selection' | 'playing' | 'levelComplete' | 'gameOver';
type LevelProgress = { level_index: number; is_unlocked: 1 | 0; stars_collected: number; };
type Subscription = { remove: () => void };

// Helper function to check if a position is safe (within bounds and not overlapping walls)
const isPositionSafe = (x: number, y: number, width: number, height: number, walls: any[]) => {
  // Check bounds
  if (x < SAFE_AREA.minX || y < SAFE_AREA.minY || 
      x + width > SAFE_AREA.maxX || y + height > SAFE_AREA.maxY) {
    return false;
  }
  
  // Check wall collisions
  for (const wall of walls) {
    if (x + width > wall.x && x < wall.x + wall.width && 
        y + height > wall.y && y < wall.y + wall.height) {
      return false;
    }
  }
  
  return true;
};

// --- COMPONENTES DE UI ---
const LevelCard = ({ level, progress, onPress }: { level: LevelData, progress: LevelProgress, onPress: () => void }) => (
  <Pressable onPress={progress.is_unlocked ? onPress : undefined} style={[styles.levelCard, !progress.is_unlocked && styles.levelCardLocked]}>
    <Text style={styles.levelCardNumber}>{progress.level_index + 1}</Text>
    {!progress.is_unlocked ? (<Text style={styles.lockedIcon}>🔒</Text>) : (
      <View style={styles.starContainer}>
        {Array(3).fill(0).map((_, i) => <Text key={i} style={[styles.starIcon, i < progress.stars_collected && styles.starIconCollected]}>★</Text>)}
      </View>
    )}
  </Pressable>
);

// --- COMPONENTE PRINCIPAL DO JOGO ---

export default function LabyrinthScreen() {
  const [gameState, setGameState] = useState<GameState>('loading');
  const [levelProgress, setLevelProgress] = useState<LevelProgress[]>([]);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [collectedStars, setCollectedStars] = useState<Set<string>>(new Set());

  const ballPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const currentBallPosition = useRef({ x: 0, y: 0 });
  const isColliding = useRef(false);

  useEffect(() => {
    const initializeLevels = async () => {
      try {
        const levels = loadLabyrinthLevels();
        setLevelProgress(levels);
        setGameState('level_selection');
      } catch (error) {
        console.error('Error loading levels:', error);
        setGameState('level_selection');
      }
    };
    
    initializeLevels();
  }, []);

  useEffect(() => {
    const listenerId = ballPosition.addListener(pos => { currentBallPosition.current = pos; });
    return () => ballPosition.removeListener(listenerId);
  }, [ballPosition]);

  const handleLevelSelect = (levelIndex: number) => {
    setCurrentLevel(levelIndex);
    setLives(INITIAL_LIVES);
    setCollectedStars(new Set());
    isColliding.current = false; // Reset collision state
    
    const level = LEVELS[levelIndex];
    // Ensure ball starts in safe area
    const startX = Math.max(SAFE_AREA.minX, Math.min(level.start.x, SAFE_AREA.maxX - BALL_SIZE));
    const startY = Math.max(SAFE_AREA.minY, Math.min(level.start.y, SAFE_AREA.maxY - BALL_SIZE));
    
    ballPosition.setValue({ x: startX, y: startY });
    setGameState('playing');
  };

  const handleCollision = useCallback(() => {
    if (isColliding.current) return;
    isColliding.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    const newLives = lives - 1;
    setLives(newLives);
    if (newLives > 0) {
      const level = LEVELS[currentLevel];
      // Ensure ball resets to safe area
      const startX = Math.max(SAFE_AREA.minX, Math.min(level.start.x, SAFE_AREA.maxX - BALL_SIZE));
      const startY = Math.max(SAFE_AREA.minY, Math.min(level.start.y, SAFE_AREA.maxY - BALL_SIZE));
      
      Animated.timing(ballPosition, { 
        toValue: { x: startX, y: startY }, 
        duration: 300, 
        useNativeDriver: false 
      }).start(() => {
        // Reset collision state after animation completes
        setTimeout(() => { 
          isColliding.current = false; 
        }, 200);
      });
    } else {
      setGameState('gameOver');
      isColliding.current = false;
    }
  }, [lives, currentLevel, ballPosition]);

  const handleWin = useCallback(() => {
    if (isColliding.current) return;
    isColliding.current = true;
    setGameState('levelComplete');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateLabyrinthLevelStars(currentLevel, collectedStars.size);
    if (currentLevel + 1 < LEVELS.length) {
      unlockLabyrinthLevel(currentLevel + 1);
    }
    // Reset collision state after a short delay
    setTimeout(() => { 
      isColliding.current = false; 
    }, 300);
  }, [currentLevel, collectedStars]);

  useEffect(() => {
    let subscription: Subscription | null = null;
    if (gameState === 'playing') {
      subscription = Accelerometer.addListener(({ x, y }) => {
        if (isColliding.current) return;
        const currentPos = currentBallPosition.current;
        // Fixed inverted controls: x movement should be normal, y movement should be inverted
        let newX = currentPos.x + x * SENSITIVITY;
        let newY = currentPos.y - y * SENSITIVITY;

        // Ensure ball stays within safe area bounds
        newX = Math.max(SAFE_AREA.minX, Math.min(newX, SAFE_AREA.maxX - BALL_SIZE));
        newY = Math.max(SAFE_AREA.minY, Math.min(newY, SAFE_AREA.maxY - BALL_SIZE));

        ballPosition.setValue({ x: newX, y: newY });

        const currentLevelData = LEVELS[currentLevel];

        for (const wall of currentLevelData.walls) {
          if (newX + BALL_SIZE > wall.x && newX < wall.x + wall.width && newY + BALL_SIZE > wall.y && newY < wall.y + wall.height) {
            handleCollision(); return;
          }
        }

        for (const star of currentLevelData.stars) {
          if (!collectedStars.has(star.id)) {
            // Use safe positioning for star collision detection
            const safeStarX = Math.max(SAFE_AREA.minX, Math.min(star.x, SAFE_AREA.maxX - STAR_SIZE));
            const safeStarY = Math.max(SAFE_AREA.minY, Math.min(star.y, SAFE_AREA.maxY - STAR_SIZE));
            
            // Only check collision if star is in a safe position (not inside walls)
            if (isPositionSafe(safeStarX, safeStarY, STAR_SIZE, STAR_SIZE, currentLevelData.walls)) {
              const dist = Math.sqrt(
                Math.pow(newX + BALL_SIZE / 2 - (safeStarX + STAR_SIZE / 2), 2) + 
                Math.pow(newY + BALL_SIZE / 2 - (safeStarY + STAR_SIZE / 2), 2)
              );
              if (dist < (STAR_SIZE / 2) + (BALL_SIZE / 2)) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setCollectedStars(prev => new Set(prev).add(star.id));
              }
            }
          }
        }

        const hole = currentLevelData.hole;
        // Use safe positioning for hole collision detection
        const safeHoleX = Math.max(SAFE_AREA.minX, Math.min(hole.x, SAFE_AREA.maxX - HOLE_SIZE));
        const safeHoleY = Math.max(SAFE_AREA.minY, Math.min(hole.y, SAFE_AREA.maxY - HOLE_SIZE));
        
        const distanceToHole = Math.sqrt(
          Math.pow(newX + BALL_SIZE / 2 - (safeHoleX + HOLE_SIZE / 2), 2) + 
          Math.pow(newY + BALL_SIZE / 2 - (safeHoleY + HOLE_SIZE / 2), 2)
        );
        if (distanceToHole < HOLE_SIZE / 2) {
          handleWin();
        }
      });
      Accelerometer.setUpdateInterval(16);
    }
    return () => subscription?.remove();
  }, [gameState, currentLevel, ballPosition, handleCollision, handleWin, collectedStars]);

  const currentLevelData = LEVELS[currentLevel];

  const renderContent = () => {
    switch (gameState) {
      case 'loading': return <ActivityIndicator size="large" color={PALETTE.primary} />;
      case 'level_selection':
        return (
          <>
            <Text style={styles.menuTitle}>SELECIONE O NÍVEL</Text>
            <FlatList
              data={levelProgress}
              renderItem={({ item }) => <LevelCard level={LEVELS[item.level_index]} progress={item} onPress={() => handleLevelSelect(item.level_index)} />}
              keyExtractor={item => item.level_index.toString()}
              numColumns={3}
              contentContainerStyle={styles.levelSelectionContainer}
            />
          </>
        );
      case 'playing':
      case 'levelComplete':
      case 'gameOver':
        if (!currentLevelData) {
          return <ActivityIndicator size="large" color={PALETTE.primary} />;
        }
        return (
          <>
            <View style={styles.hud}>
              <Text style={styles.hudText}>NÍVEL: {currentLevel + 1}</Text>
              <View style={styles.starHudContainer}>
                {Array(3).fill(0).map((_, i) => <Text key={i} style={[styles.starIcon, i < collectedStars.size && styles.starIconCollected]}>★</Text>)}
              </View>
              <View style={styles.livesContainer}>{Array(lives).fill(0).map((_, i) => <Text key={i} style={styles.lifeIcon}>❤️</Text>)}</View>
            </View>
            <View style={styles.gameBoard}>
              {currentLevelData.walls.map((wall, index) => <View key={index} style={[styles.wall, { left: wall.x, top: wall.y, width: wall.width, height: wall.height }]} />)}
              {currentLevelData.stars.map(star => {
                // Only render stars that are not collected and in safe positions
                if (collectedStars.has(star.id)) return null;
                
                // Ensure star is in safe area and not overlapping walls
                const safeX = Math.max(SAFE_AREA.minX, Math.min(star.x, SAFE_AREA.maxX - STAR_SIZE));
                const safeY = Math.max(SAFE_AREA.minY, Math.min(star.y, SAFE_AREA.maxY - STAR_SIZE));
                
                // Check if star would overlap with walls
                const isStarSafe = isPositionSafe(safeX, safeY, STAR_SIZE, STAR_SIZE, currentLevelData.walls);
                if (!isStarSafe) return null; // Don't render stars that would be inside walls
                
                return (
                  <Text key={star.id} style={[styles.star, { left: safeX, top: safeY }]}>★</Text>
                );
              })}
              
              {/* Ensure hole is positioned safely */}
              <View style={[styles.hole, { 
                left: Math.max(SAFE_AREA.minX, Math.min(currentLevelData.hole.x, SAFE_AREA.maxX - HOLE_SIZE)), 
                top: Math.max(SAFE_AREA.minY, Math.min(currentLevelData.hole.y, SAFE_AREA.maxY - HOLE_SIZE)) 
              }]} />
              
              <Animated.View style={[styles.ball, ballPosition.getLayout()]} />
            </View>

            {(gameState === 'levelComplete' || gameState === 'gameOver') && (
              <View style={styles.menuOverlay}>
                <Text style={styles.menuTitle}>{gameState === 'levelComplete' ? `NÍVEL ${currentLevel + 1} COMPLETO!` : 'FIM DE JOGO'}</Text>
                <View style={styles.starContainer}>
                  {Array(3).fill(0).map((_, i) => <Text key={i} style={[styles.starIcon, i < collectedStars.size && styles.starIconCollected, { fontSize: 40 }]}>★</Text>)}
                </View>
                {gameState === 'levelComplete' && currentLevel + 1 < LEVELS.length &&
                  <Pressable onPress={() => handleLevelSelect(currentLevel + 1)} style={styles.menuButton}><Text style={styles.menuButtonText}>PRÓXIMO NÍVEL</Text></Pressable>}
                <Pressable onPress={() => {
                  setLevelProgress(loadLabyrinthLevels()); // Refresh level progress
                  setGameState('level_selection');
                }} style={[styles.menuButton, { marginTop: 10, backgroundColor: PALETTE.cardBackground }]}><Text style={[styles.menuButtonText, { color: 'white' }]}>MENU DE NÍVEIS</Text></Pressable>
              </View>
            )}
          </>
        );
    }
  };

  return (
    <LinearGradient colors={[PALETTE.background_darker, PALETTE.background]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {renderContent()}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  levelCard: {
    backgroundColor: PALETTE.cardBackground,
    borderRadius: 15,
    padding: 20,
    margin: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    minWidth: 100,
    borderWidth: 2,
    borderColor: PALETTE.primary,
  },
  levelCardLocked: {
    backgroundColor: PALETTE.background_darker,
    borderColor: '#666',
    opacity: 0.6,
  },
  levelCardNumber: {
    fontWeight: 'bold',
    fontSize: 24,
    color: PALETTE.textPrimary,
    marginBottom: 10,
  },
  lockedIcon: {
    fontSize: 30,
    color: '#666',
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starIcon: {
    fontSize: 20,
    color: '#666',
    textShadowColor: 'black',
    textShadowRadius: 2,
  },
  starIconCollected: {
    color: PALETTE.star,
    textShadowColor: 'orange',
    textShadowRadius: 5,
  },
  levelSelectionContainer: {
    padding: 20,
    alignItems: 'center',
  },
  starHudContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    position: 'absolute',
    fontSize: STAR_SIZE,
    color: PALETTE.star,
    textShadowColor: 'orange',
    textShadowRadius: 5,
  },
  hud: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 20, 
    position: 'absolute', 
    top: 40, 
    left: 0, 
    right: 0, 
    zIndex: 10,
    height: HUD_HEIGHT - 40, // Ensure HUD fits in reserved space
  },
  hudText: { fontWeight: 'bold', fontSize: 18, color: PALETTE.textPrimary },
  livesContainer: { flexDirection: 'row' },
  lifeIcon: { fontSize: 24, marginLeft: 5, textShadowColor: 'red', textShadowRadius: 5 },
  gameBoard: { 
    flex: 1, 
    width: '100%', 
    height: '100%',
    marginTop: HUD_HEIGHT, // Account for HUD space
  },
  ball: { position: 'absolute', width: BALL_SIZE, height: BALL_SIZE, borderRadius: BALL_SIZE / 2, backgroundColor: PALETTE.primary, shadowColor: PALETTE.primary, shadowRadius: 10, shadowOpacity: 1, elevation: 10 },
  hole: { position: 'absolute', width: HOLE_SIZE, height: HOLE_SIZE, borderRadius: HOLE_SIZE / 2, backgroundColor: 'black', borderWidth: 3, borderColor: PALETTE.secondary },
  wall: { position: 'absolute', backgroundColor: PALETTE.wall, borderRadius: 5, borderWidth: 1, borderColor: '#333' },
  menuOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', alignItems: 'center' },
  menuTitle: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 40, textAlign: 'center', paddingHorizontal: 20 },
  menuButton: { backgroundColor: PALETTE.primary, paddingVertical: 15, paddingHorizontal: 50, borderRadius: 10 },
  menuButtonText: { color: PALETTE.background_darker, fontSize: 20, fontWeight: 'bold' },
});
