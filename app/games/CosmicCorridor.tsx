import { PALETTE } from '@/constants/Colors';
import { getCosmicCorridorHighScore, initDB, saveCosmicCorridorHighScore } from '@/services/database';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { Accelerometer } from 'expo-sensors';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, Pressable, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


// --- CONSTANTES E TIPOS ---
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PLAYER_SIZE = 50;
const ASTEROID_SIZE_MIN = 40;
const ASTEROID_SIZE_MAX = 60;
const PLAYER_SENSITIVITY = 300;
const INITIAL_GAME_SPEED = 5.0;
const MAX_GAME_SPEED = 99.0;

const DIFFICULTY_SETTINGS = {
  'Noob Master':        { initialSpeed: 5.0, maxSpeed: 15.0, spawnRate: 140, scoreMultiplier: 0.8 },
  'Noob ': { initialSpeed: 10.0, maxSpeed: 8.0, spawnRate: 130.0, scoreMultiplier: 1.0 },
  'Regular':     { initialSpeed: 15.0, maxSpeed: 50.0, spawnRate: 100, scoreMultiplier: 1.2 },
  'Pro':         { initialSpeed: 20.0, maxSpeed: 70.0, spawnRate: 80, scoreMultiplier: 1.5 },
  'Pro Master':  { initialSpeed: 30.0, maxSpeed: 99.0, spawnRate: 50, scoreMultiplier: 2.0 },
};
const DIFFICULTY_ORDER: Difficulty[] = ['Noob Master', 'Noob ', 'Regular', 'Pro', 'Pro Master'];
type Difficulty = keyof typeof DIFFICULTY_SETTINGS;
type GameObject = { id: number; x: number; y: number; width: number; height: number; rotation: number; };

// --- HOOK PERSONALIZADO PARA MÚSICA DE FUNDO E EFEITOS SONOROS ---
const useCosmicMusic = () => {
    const musicRef = useRef<Audio.Sound | null>(null);
    const explosionSoundRef = useRef<Audio.Sound | null>(null);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);

    const loadMusic = useCallback(async () => {
        try {
            const { sound } = await Audio.Sound.createAsync(
                require('@/assets/sounds/cosmic-music.mp3'),
                { shouldPlay: false, isLooping: true, volume: 0.3 }
            );
            musicRef.current = sound;
        } catch (error) {
            console.error("Erro ao carregar música cósmica:", error);
        }
    }, []);

    const loadExplosionSound = useCallback(async () => {
        try {
            const { sound } = await Audio.Sound.createAsync(
                require('@/assets/sounds/explosion.wav'),
                { shouldPlay: false, isLooping: false, volume: 0.8 }
            );
            explosionSoundRef.current = sound;
        } catch (error) {
            console.error("Erro ao carregar som de explosão:", error);
        }
    }, []);

    useEffect(() => {
        Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        loadMusic();
        loadExplosionSound();
        return () => {
            musicRef.current?.unloadAsync();
            explosionSoundRef.current?.unloadAsync();
        };
    }, [loadMusic, loadExplosionSound]);

    const playMusic = useCallback(async () => {
        try {
            if (musicRef.current && !isMusicPlaying) {
                await musicRef.current.playAsync();
                setIsMusicPlaying(true);
            }
        } catch (error) {
            console.error("Erro ao tocar música:", error);
        }
    }, [isMusicPlaying]);

    const stopMusic = useCallback(async () => {
        try {
            if (musicRef.current && isMusicPlaying) {
                await musicRef.current.stopAsync();
                setIsMusicPlaying(false);
            }
        } catch (error) {
            console.error("Erro ao parar música:", error);
        }
    }, [isMusicPlaying]);

    const pauseMusic = useCallback(async () => {
        try {
            if (musicRef.current && isMusicPlaying) {
                await musicRef.current.pauseAsync();
                setIsMusicPlaying(false);
            }
        } catch (error) {
            console.error("Erro ao pausar música:", error);
        }
    }, [isMusicPlaying]);

    const playExplosionSound = useCallback(async () => {
        try {
            if (explosionSoundRef.current) {
                // Reset the sound to the beginning and play
                await explosionSoundRef.current.setPositionAsync(0);
                await explosionSoundRef.current.playAsync();
            }
        } catch (error) {
            console.error("Erro ao tocar som de explosão:", error);
        }
    }, []);

    return { playMusic, stopMusic, pauseMusic, playExplosionSound, isMusicPlaying };
};

// --- COMPONENTE PRINCIPAL DO JOGO ---
export default function CosmicCorridorScreen() {
    const [gameState, setGameState] = useState<'initial' | 'difficulty_selection' | 'playing' | 'gameOver'>('initial');
    const [score, setScore] = useState(0);
    const [difficulty, setDifficulty] = useState<Difficulty>('Regular');
    
    // Estados para recorde e autenticação
    const [highScore, setHighScore] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    // Hook para música de fundo
    const { playMusic, stopMusic, pauseMusic, playExplosionSound, isMusicPlaying } = useCosmicMusic();
    
    // Função para alternar música
    const toggleMusic = () => {
        if (isMusicPlaying) {
            pauseMusic();
        } else {
            playMusic();
        }
    };
    
    const playerX = useRef(new Animated.Value(SCREEN_WIDTH / 2 - PLAYER_SIZE / 2)).current;
    const [asteroids, setAsteroids] = useState<GameObject[]>([]);
    const [stars, setStars] = useState<{ id: number, x: number, y: number, size: number }[]>([]);
    
    const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
    const obstacleCounterRef = useRef(0);
    const gameSpeedRef = useRef(DIFFICULTY_SETTINGS.Regular.initialSpeed);

    // Efeito de inicialização com lógica de banco de dados
    useEffect(() => {
        const initialize = async () => {
            try {
                setIsLoading(true);
                initDB();
                setHighScore(getCosmicCorridorHighScore());
                const compatible = await LocalAuthentication.hasHardwareAsync();
                setIsBiometricSupported(compatible);
            } catch (error) {
                console.error("Falha na inicialização do jogo:", error);
                Alert.alert("Erro", "Não foi possível carregar os dados do jogo.");
            } finally {
                setIsLoading(false);
            }
        };
        initialize();
        
        const generatedStars = Array.from({ length: 100 }, (_, i) => ({ id: i, x: Math.random() * SCREEN_WIDTH, y: Math.random() * SCREEN_HEIGHT, size: Math.random() * 2 + 1, }));
        setStars(generatedStars);
    }, []);
    
    // Lógica de autenticação para ver o recorde
    const handleAuthentication = async () => {
        try {
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            if (!isEnrolled) return Alert.alert('Biometria não configurada', 'Por favor, configure a biometria no seu dispositivo.');
            
            const { success } = await LocalAuthentication.authenticateAsync({ promptMessage: 'Autentique para ver seu recorde' });
            
            if (success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error("Erro de Autenticação", error);
        }
    };
    
    // Lógica de fim de jogo com salvamento de recorde
    const handleGameOver = () => {
        if (gameState !== 'playing') return;
        
        // Tocar som de explosão quando o jogo terminar
        playExplosionSound();
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        if (score > highScore) {
            setHighScore(score);
            saveCosmicCorridorHighScore(score);
        }
        setGameState('gameOver');
        setIsAuthenticated(false);
        
        // Parar música quando o jogo terminar
        stopMusic();
    };

    // Game Loop e Controles do Acelerômetro (sem alterações lógicas, apenas contextuais)
    useEffect(() => {
        let subscription: any = null;
        if (gameState === 'playing') {
            subscription = Accelerometer.addListener(({ x }) => {
                let newX = (playerX as any)._value + x * PLAYER_SENSITIVITY;
                if (newX < 0) newX = 0;
                if (newX > SCREEN_WIDTH - PLAYER_SIZE) newX = SCREEN_WIDTH - PLAYER_SIZE;
                Animated.timing(playerX, { toValue: newX, duration: 100, useNativeDriver: false }).start();
            });
            Accelerometer.setUpdateInterval(16);
        }
        return () => { subscription?.remove() };
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
                let newAsteroids = asteroids.map(obs => ({ ...obs, y: obs.y + gameSpeedRef.current })).filter(obs => obs.y < SCREEN_HEIGHT);
                if (obstacleCounterRef.current >= currentSpawnRate) {
                    obstacleCounterRef.current = 0;
                    const size = Math.random() * (ASTEROID_SIZE_MAX - ASTEROID_SIZE_MIN) + ASTEROID_SIZE_MIN;
                    newAsteroids.push({ id: Date.now(), y: -ASTEROID_SIZE_MAX, x: Math.random() * (SCREEN_WIDTH - size), width: size, height: size, rotation: Math.random() * 360 });
                }
                const playerCenterX = (playerX as any)._value + PLAYER_SIZE / 2;
                const playerCenterY = SCREEN_HEIGHT - 100 + PLAYER_SIZE / 2;
                for (const ast of newAsteroids) {
                    const astCenterX = ast.x + ast.width / 2;
                    const astCenterY = ast.y + ast.height / 2;
                    const distance = Math.sqrt(Math.pow(playerCenterX - astCenterX, 2) + Math.pow(playerCenterY - astCenterY, 2));
                    if (distance < (PLAYER_SIZE / 3.5) + (ast.width / 3.5)) {
                        isGameOver = true;
                        break;
                    }
                }
                if (isGameOver) {
                    handleGameOver();
                } else {
                    setScore(s => s + Math.round(difficultySettings.scoreMultiplier));
                    setAsteroids(newAsteroids);
                }
            }, 16) as any;
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
        setIsAuthenticated(false);
        
        // Iniciar música quando o jogo começar
        playMusic();
    };

    const renderMenu = () => (
      <View style={styles.menuContainer}>
        <Text style={styles.title}>{gameState === 'gameOver' ? 'FIM DE JOGO' : 'CORREDOR CÓSMICO'}</Text>
        <View style={styles.highScoreContainer}>
          <Text style={styles.highScoreLabel}>RECORDE</Text>
          {isLoading ? <ActivityIndicator color={PALETTE.primary} /> : 
           isAuthenticated ? <Text style={styles.highScoreText}>{highScore}</Text> : 
           isBiometricSupported ? <TouchableOpacity onPress={handleAuthentication}><Text style={styles.authText}>🔒</Text></TouchableOpacity> : 
           <Text style={styles.highScoreText}>{highScore}</Text>}
        </View>
        {gameState === 'gameOver' && <Text style={styles.finalScore}>PONTUAÇÃO ATUAL: {score}</Text>}
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
                  <Text style={styles.difficultyButtonText}>{level}</Text>
                </Pressable>
            ))}
        </View>
    );

    return ( 
      <LinearGradient colors={[PALETTE.background, PALETTE.background_darker]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {stars.map(star => <View key={star.id} style={[styles.star, { left: star.x, top: star.y, width: star.size, height: star.size }]} />)}
          {gameState === 'playing' && (
            <>
              <Text style={styles.scoreText}>PONTOS: {score}</Text>
              <TouchableOpacity onPress={toggleMusic} style={styles.musicButton}>
                <Text style={styles.musicButtonText}>{isMusicPlaying ? '🔊' : '🔇'}</Text>
              </TouchableOpacity>
            </>
          )}
          <View style={styles.gameArea}>
            {gameState === 'playing' && (<Animated.View style={[styles.player, { left: playerX }]} ><Text style={styles.playerEmoji}>🚀</Text></Animated.View>)}
            {asteroids.map(obs => (<View key={obs.id} style={[styles.asteroid, { top: obs.y, left: obs.x, width: obs.width, height: obs.height, transform: [{rotate: `${obs.rotation}deg`}] }]}><Text style={{fontSize: obs.width * 0.8}}>☄️</Text></View>))}
          </View>
          {gameState !== 'playing' && (gameState === 'difficulty_selection' ? renderDifficultySelection() : renderMenu())}
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
  difficultyButton: { backgroundColor: PALETTE.primary, paddingVertical: 15, borderRadius: 10, width: '80%', alignItems: 'center', marginBottom: 15 },
  difficultyButtonText: { color: PALETTE.background_darker, fontSize: 18, fontFamily: 'Orbitron-Bold' },
  highScoreContainer: { alignItems: 'center', marginBottom: 30, backgroundColor: 'rgba(0,0,0,0.2)', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 15 },
  highScoreLabel: { color: PALETTE.textSecondary, fontSize: 16, fontFamily: 'Orbitron-Regular' },
  highScoreText: { color: PALETTE.primary, fontSize: 32, fontFamily: 'Orbitron-Bold' },
  authText: { fontSize: 32 },
  musicButton: { position: 'absolute', top: 60, right: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 25, width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
  musicButtonText: { fontSize: 24 },
});