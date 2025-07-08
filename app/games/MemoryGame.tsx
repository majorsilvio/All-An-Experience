import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Pressable, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// --- Importações Nativas ---
import * as LocalAuthentication from 'expo-local-authentication';
import * as SQLite from 'expo-sqlite';
import { Emoji } from '../../components/Emoji';
import { FONTS } from '../../hooks/useFonts';
import { useThemePalette } from '../../hooks/useThemePalette';

// --- HOOK PERSONALIZADO PARA GERIR OS SONS ---
const useSounds = () => {
  const soundObjects = useRef<{ [key: string]: Audio.Sound | null }>({});

  const loadSounds = useCallback(async () => {
    try {
      for (let i = 0; i < 4; i++) {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/tone.wav'), { shouldPlay: false }
        );
        await sound.setRateAsync(1.0 + i * 0.4, false);
        soundObjects.current[`note${i}`] = sound;
      }
      const { sound: gameOverSound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/game-over.wav'), { shouldPlay: false }
      );
      soundObjects.current['gameOver'] = gameOverSound;
    } catch (error) {
      console.error("Erro ao carregar os sons. Verifique se os ficheiros 'tone.wav' e 'game-over.wav' existem em 'assets/sounds'.", error);
    }
  }, []);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    loadSounds();
    return () => {
      Object.values(soundObjects.current).forEach(sound => sound?.unloadAsync());
    };
  }, [loadSounds]);

  const playSound = useCallback(async (index: number) => {
    try { await soundObjects.current[`note${index}`]?.replayAsync(); } catch (error) { console.error("Erro ao tocar o som da nota.", error); }
  }, []);

  const playGameOverSound = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    try { await soundObjects.current['gameOver']?.replayAsync(); } catch (error) { console.error("Erro ao tocar o som de game over.", error); }
  }, []);

  return { playSound, playGameOverSound };
};

// --- COMPONENTE PRINCIPAL DO JOGO ---
export default function MemoryGameScreen() {
  const palette = useThemePalette();
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [activeColorIndex, setActiveColorIndex] = useState<number | null>(null);
  const [playerPressedIndex, setPlayerPressedIndex] = useState<number | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [isGameOver, setIsGameOver] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { playSound, playGameOverSound } = useSounds();

  // Proteção contra paleta não inicializada
  if (!palette) {
    return (
      <LinearGradient colors={['#1A1A1A', '#0D0D0D']} style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#BFFF00" />
        <Text style={{color: '#BFFF00', fontSize: 16, marginTop: 10}}>Carregando...</Text>
      </LinearGradient>
    );
  }

  // Criar estilos dinâmicos
  const styles = createStyles(palette);

  // Cores dinâmicas dos botões do jogo, baseadas na paleta
  const getGameColors = () => [palette.warningAccent, palette.retroOrange, palette.neonAccent, palette.primary];
  
  // --- LÓGICA DO BANCO DE DADOS (REESTRUTURADA E ESTABILIZADA) ---
  const db = useMemo(() => SQLite.openDatabaseSync('geniusGame.db'), []);

  const setupDatabase = useCallback(() => {
      db.runSync('CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY, highScore INTEGER NOT NULL);');
      const result = db.getFirstSync<{ count: number }>('SELECT COUNT(id) as count FROM scores;');
      if (result && result.count === 0) {
          db.runSync('INSERT INTO scores (id, highScore) VALUES (1, 1);');
      }
  }, [db]);

  const getHighScore = useCallback((): number => {
      const result = db.getFirstSync<{ highScore: number }>('SELECT highScore FROM scores WHERE id = 1;');
      return result?.highScore ?? 1;
  }, [db]);

  const saveHighScore = useCallback((score: number) => {
      db.runSync('UPDATE scores SET highScore = ? WHERE id = 1;', score);
  }, [db]);
  
  // --- EFEITO DE INICIALIZAÇÃO CORRIGIDO ---
  useEffect(() => {
    async function initialize() {
      try {
        setIsLoading(true);
        setupDatabase();
        const scoreFromDb = getHighScore();
        setHighScore(scoreFromDb);
        const compatible = await LocalAuthentication.hasHardwareAsync();
        setIsBiometricSupported(compatible);
      } catch (error) {
        console.error("Falha na inicialização do jogo:", error);
        Alert.alert("Erro", "Não foi possível carregar os dados do jogo.");
      } finally {
        setIsLoading(false);
      }
    }
    initialize();
  }, [setupDatabase, getHighScore]);

  // --- LÓGICA DE AUTENTICAÇÃO REINTEGRADA ---
  const handleAuthentication = async () => {
    try {
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return Alert.alert('Biometria não configurada', 'Por favor, configure o Face ID ou a Impressão Digital.');
      }
      
      const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Autentique para ver o seu recorde',
          cancelLabel: 'Cancelar',
          disableDeviceFallback: false, 
      });
      
      if (authResult.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setIsAuthenticated(true);
      } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          const reason = authResult.error === 'user_cancel' ? 'Você cancelou a autenticação.' : 'Não foi possível verificar a sua identidade.';
          Alert.alert('Autenticação Falhou', reason);
      }
    } catch (error: any) {
        Alert.alert('Erro de Autenticação', `Ocorreu um erro: ${error.message}.`);
    }
  };
  
  // --- LÓGICA DO JOGO ---
  const startGame = () => {
    setIsGameOver(false);
    setIsAuthenticated(false);
    setLevel(1);
    setSequence([]);
    setPlayerSequence([]);
    setPlayerPressedIndex(null);
    setTimeout(nextLevel, 500);
  };

  const nextLevel = () => {
    setIsPlayerTurn(false);
    setPlayerSequence([]);
    const gameColors = getGameColors();
    const newSequence = [...sequence, Math.floor(Math.random() * gameColors.length)];
    setSequence(newSequence);
    setLevel(newSequence.length);
    playSequence(newSequence);
  };
  
  const playSequence = (seq: number[]) => {
    let i = 0;
    const interval = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      playSound(seq[i]);
      setActiveColorIndex(seq[i]);
      setTimeout(() => setActiveColorIndex(null), 400);
      i++;
      if (i >= seq.length) { clearInterval(interval); setIsPlayerTurn(true); }
    }, 800);
  };

  const handlePlayerPress = (colorIndex: number) => {
    if (!isPlayerTurn) return;
    
    // Feedback visual imediato ao clicar
    setPlayerPressedIndex(colorIndex);
    setTimeout(() => setPlayerPressedIndex(null), 200);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    playSound(colorIndex);
    const newPlayerSequence = [...playerSequence, colorIndex];
    setPlayerSequence(newPlayerSequence);
    if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
      handleGameOver();
      return;
    }
    if (newPlayerSequence.length === sequence.length) {
      setIsPlayerTurn(false);
      setTimeout(nextLevel, 1000);
    }
  };

  const handleGameOver = () => {
    playGameOverSound();
    Alert.alert('Fim de Jogo!', `Você alcançou o nível ${level}.`);
    const newHighScore = Math.max(level, highScore);
    if (newHighScore > highScore) {
      setHighScore(newHighScore);
      saveHighScore(newHighScore);
    }
    setIsGameOver(true);
    setSequence([]);
    setPlayerSequence([]);
    setPlayerPressedIndex(null);
    setIsAuthenticated(false);
  };

  const statusText = isPlayerTurn ? 'A sua vez!' : isGameOver ? 'Pressione Iniciar' : 'Observe...';

  return (
    <LinearGradient colors={[palette.background, palette.background_darker]} style={styles.container}>
      
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>NÍVEL</Text>
            <Text style={styles.scoreText}>{isGameOver ? '-' : level}</Text>
        </View>
        <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>RECORDE</Text>
            {isLoading ? <ActivityIndicator color={palette.textPrimary} /> : 
             isAuthenticated ? <Text style={styles.scoreText}>{highScore}</Text> : 
             isBiometricSupported ? <TouchableOpacity onPress={handleAuthentication}><Emoji name="lock" size={20} /></TouchableOpacity> : 
             <Text style={styles.scoreText}>{highScore}</Text>}
        </View>
      </View>
      
      <View style={styles.gameContainer}>
        {isGameOver ? (
          <Pressable onPress={startGame} style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.8 }]} disabled={isLoading}>
            <Text style={styles.startButtonText}>{isLoading ? 'A CARREGAR...' : 'INICIAR'}</Text>
          </Pressable>
        ) : (
          <View style={styles.gameBoard}>
            {getGameColors().map((color: string, index: number) => {
                const isActive = activeColorIndex === index;
                const isPlayerPressed = playerPressedIndex === index;
                const isHighlighted = isActive || isPlayerPressed;
                const glowColor = isHighlighted ? color : 'transparent';
                return (
                    <TouchableOpacity
                        key={index}
                        style={styles.gameButtonWrapper}
                        onPress={() => handlePlayerPress(index)}
                        disabled={!isPlayerTurn}
                        activeOpacity={1} // Permite controle total da opacidade via estilo
                    >
                        <Animated.View style={[
                            styles.gameButton,
                            { backgroundColor: color, shadowColor: glowColor },
                            isHighlighted && styles.activeButton,
                        ]}/>
                    </TouchableOpacity>
                );
            })}
          </View>
        )}
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.statusText}>{statusText}</Text>
      </View>
    </LinearGradient>
  );
}

// --- ESTILOS DINÂMICOS ---
const createStyles = (palette: any) => StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', alignItems: 'center', },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-around', paddingTop: 60, paddingBottom: 20, },
  scoreContainer: { alignItems: 'center', minHeight: 50, justifyContent: 'center' },
  scoreLabel: { color: palette.textSecondary, fontSize: 14, fontFamily: FONTS.regular, letterSpacing: 2, },
  scoreText: { color: palette.textPrimary, fontSize: 32, fontFamily: FONTS.primary, },
  gameContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', },
  footer: { height: 100, justifyContent: 'center', alignItems: 'center' },
  startButton: { 
    backgroundColor: palette.primary, 
    paddingVertical: 20, 
    paddingHorizontal: 50, 
    borderRadius: 15, 
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, 
    shadowRadius: 15,
    elevation: 8, 
  },
  startButtonText: { color: palette.background_darker, fontSize: 24, fontFamily: FONTS.primary, letterSpacing: 2 },
  gameBoard: { width: 320, height: 320, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', },
  gameButtonWrapper: { width: '50%', height: '50%', padding: 10, },
  gameButton: { 
    flex: 1, 
    borderRadius: 20, 
    elevation: 5, 
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.3)',
    opacity: 0.5, // Opacidade padrão de 50%
  },
  activeButton: { 
    transform: [{ scale: 1.05 }], 
    shadowOpacity: 1, 
    shadowRadius: 15, 
    elevation: 20,
    borderColor: 'rgba(255,255,255,0.5)',
    opacity: 1, // Opacidade de 100% quando ativo
  },
  statusText: { color: palette.textSecondary, fontSize: 18, fontFamily: FONTS.regular },
});
