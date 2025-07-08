import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FONTS } from '../../hooks/useFonts';
import { useThemePalette } from '../../hooks/useThemePalette';

// --- HOOK PERSONALIZADO PARA GERIR OS SONS ---
const useTicTacToeSounds = () => {
  const sounds = useRef<{ [key: string]: Audio.Sound | null }>({}).current;

  const loadSounds = useCallback(async () => {
    try {
      const { sound: soundX } = await Audio.Sound.createAsync(require('@/assets/sounds/place_x.wav'));
      const { sound: soundO } = await Audio.Sound.createAsync(require('@/assets/sounds/place_o.wav'));
      const { sound: soundWin } = await Audio.Sound.createAsync(require('@/assets/sounds/winner.wav'));
      
      sounds['x'] = soundX;
      sounds['o'] = soundO;
      sounds['win'] = soundWin;
    } catch (error) {
      console.error("Erro ao carregar os sons. Verifique se os ficheiros (place_x.wav, place_o.wav, winner.wav) existem na pasta 'assets/sounds'.", error);
    }
  }, [sounds]);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    loadSounds();
    return () => { Object.values(sounds).forEach(sound => sound?.unloadAsync()); };
  }, [loadSounds]);

  const playSound = useCallback(async (soundName: 'x' | 'o' | 'win') => {
    try { await sounds[soundName]?.replayAsync(); } catch (error) {}
  }, [sounds]);

  return { playSound };
};

// --- COMPONENTE DO QUADRADO DO JOGO (COM ESTILO CORRIGIDO) ---
const Square = ({ value, onPress, isWinnerSquare, palette }: { value: 'X' | 'O' | null, onPress: () => void, isWinnerSquare: boolean, palette: any }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (value) {
      animValue.setValue(0.5);
      Animated.spring(animValue, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    } else {
      animValue.setValue(0);
    }
  }, [value, animValue]);

  const animatedStyle = { opacity: animValue, transform: [{ scale: animValue }] };

  // AJUSTE: Usa palette.neonAccent para a cor do 'O'
  const markerColor = value === 'X' ? palette.primary : palette.neonAccent;

  const styles = createSquareStyles(palette);

  return (
    <TouchableOpacity style={styles.square} onPress={onPress} disabled={!!value}>
      {value && (
        <Animated.View style={[styles.markerContainer, animatedStyle, isWinnerSquare && styles.winnerMarkerContainer]}>
          <Text style={[styles.squareText, { color: markerColor, textShadowColor: markerColor }]}>
            {value}
          </Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

// --- COMPONENTE PRINCIPAL DO JOGO DA VELHA ---
export default function TicTacToeScreen() {
  const palette = useThemePalette();
  const initialBoard = Array(9).fill(null);
  const [board, setBoard] = useState<( 'X' | 'O' | null)[]>(initialBoard);
  const [isXNext, setIsXNext] = useState(true);
  const [winnerInfo, setWinnerInfo] = useState<{ winner: 'X' | 'O' | 'Empate', line: number[] } | null>(null);
  const [gameState, setGameState] = useState<'initial' | 'playing' | 'gameOver'>('initial');
  const { playSound } = useTicTacToeSounds();

  // Proteção contra paleta não inicializada
  if (!palette) {
    return (
      <LinearGradient colors={['#1A1A1A', '#0D0D0D']} style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{color: '#BFFF00', fontSize: 16}}>Carregando...</Text>
      </LinearGradient>
    );
  }

  // Criar estilos dinâmicos
  const styles = createStyles(palette);

  const handleStart = async () => {
    try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHardware || !isEnrolled) {
            Alert.alert("Autenticação não disponível", "O seu dispositivo não suporta ou não tem biometria configurada. A iniciar o jogo...");
            resetGame(true);
            return;
        }
        const authResult = await LocalAuthentication.authenticateAsync({ promptMessage: "Autentique para iniciar a partida" });
        if (authResult.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            resetGame(true);
        } else {
            Alert.alert("Autenticação Falhou", "Não foi possível verificar a sua identidade.");
        }
    } catch (error) {
        console.error(error);
        Alert.alert("Erro", "Ocorreu um erro durante a autenticação.");
    }
  };

  const handleSquarePress = (index: number) => {
    if (board[index] || winnerInfo) return;
    const currentPlayer = isXNext ? 'X' : 'O';
    playSound(currentPlayer === 'X' ? 'x' : 'o');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  const resetGame = (isStarting: boolean = false) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBoard(initialBoard);
    setIsXNext(true);
    setWinnerInfo(null);
    setGameState(isStarting ? 'playing' : 'initial');
  };

  useEffect(() => {
    const result = calculateWinner(board);
    if (result) {
      setGameState('gameOver');
      setWinnerInfo(result);
      if(result.winner !== 'Empate') {
        playSound('win');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    }
  }, [board, playSound]);

  const renderContent = () => {
    if (gameState === 'initial') {
      return (
        <View style={styles.centeredView}>
          <Pressable onPress={handleStart} style={({pressed}) => [styles.startButton, pressed && {opacity: 0.8}]}>
            <Text style={styles.startButtonText}>INICIAR PARTIDA</Text>
          </Pressable>
        </View>
      );
    }
    let status;
    if (winnerInfo) {
      status = winnerInfo.winner === 'Empate' ? 'EMPATE' : `VENCEDOR: ${winnerInfo.winner}`;
    } else {
      status = `VEZ DE: ${isXNext ? 'X' : 'O'}`;
    }
  
    return (
      <>
        <View style={styles.statusContainer}>
          {/* AJUSTE: Usa palette.textSecondary para a cor do status */}
          <Text style={[styles.statusText, { color: winnerInfo && winnerInfo.winner !== 'Empate' ? (winnerInfo.winner === 'X' ? palette.primary : palette.neonAccent) : palette.textSecondary }]}>
            {status}
          </Text>
        </View>
        <View style={styles.boardContainer}>
          <View style={styles.board}>
            {board.map((val, i) => (
              <Square key={i} value={val} onPress={() => handleSquarePress(i)} isWinnerSquare={winnerInfo?.line.includes(i) ?? false} palette={palette} />
            ))}
          </View>
        </View>
        <View style={styles.resetButtonContainer}>
          {gameState === 'gameOver' && (
            <TouchableOpacity onPress={() => resetGame(true)} style={styles.resetButton}>
              <Text style={styles.resetButtonText}>JOGAR NOVAMENTE</Text>
            </TouchableOpacity>
          )}
        </View>
      </>
    );
  };

  return (
    <LinearGradient colors={[palette.background, palette.background_darker]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        {renderContent()}
      </SafeAreaView>
    </LinearGradient>
  );
}

function calculateWinner(squares: ('X' | 'O' | null)[]): { winner: 'X' | 'O' | 'Empate', line: number[] } | null {
    const lines = [ [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6] ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a] as 'X' | 'O', line: lines[i] };
      }
    }
    if (squares.every(square => square !== null)) { return { winner: 'Empate', line: [] }; }
    return null;
};

// --- ESTILOS PROFISSIONAIS ---
const { width } = Dimensions.get('window');
const boardSize = width * 0.8;
const squareSize = boardSize / 3;

const createSquareStyles = (palette: any) => StyleSheet.create({
  square: {
    width: '33.333%',
    height: '33.333%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(170, 170, 170, 0.2)',
  },
  markerContainer: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  winnerMarkerContainer: { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 12 },
  squareText: { fontSize: squareSize * 0.6, fontFamily: FONTS.primary, textShadowRadius: 15, textShadowOffset: { width: 0, height: 0 } },
});

const createStyles = (palette: any) => StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, alignItems: 'center', justifyContent: 'space-between' },
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  startButton: { backgroundColor: palette.primary, paddingVertical: 20, paddingHorizontal: 50, borderRadius: 15, shadowColor: palette.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 8 },
  startButtonText: { color: palette.background_darker, fontSize: 20, fontFamily: FONTS.primary, letterSpacing: 2 },
  statusContainer: { flex: 1, justifyContent: 'center' },
  statusText: { fontFamily: FONTS.primary, fontSize: 24, letterSpacing: 2, textAlign: 'center' },
  // AJUSTE: Efeito neon no container do tabuleiro
  boardContainer: {
    width: boardSize,
    height: boardSize,
    borderRadius: 16,
    padding: 5,
    shadowColor: palette.neonAccent, // Cor do brilho neon
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 15,
  },
  board: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(0,0,0,0.2)', // Fundo interno um pouco visível
    borderRadius: 12, // Borda interna arredondada
  },
  resetButtonContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  resetButton: { backgroundColor: palette.cardBackground, paddingVertical: 15, paddingHorizontal: 40, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  resetButtonText: { color: palette.textPrimary, fontFamily: FONTS.primary, fontSize: 16, letterSpacing: 1 },
});