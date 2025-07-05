import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Image,
    Modal,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { PALETTE } from '../(tabs)';
import { loadPuzzleRecords, savePuzzleRecord } from '../../services/database'; // Integrado com o DB

// --- BANCO DE DADOS DE IMAGENS LOCAIS (MODO CORRIGIDO) ---
// A forma correta de importar para evitar erros de empacotamento.
import PuzzleImage1 from '../../assets/images/puzzle_image_1.jpg';
import PuzzleImage2 from '../../assets/images/puzzle_image_2.jpg';
import PuzzleImage3 from '../../assets/images/puzzle_image_3.jpg';
import PuzzleImage4 from '../../assets/images/puzzle_image_4.jpg';
import PuzzleImage5 from '../../assets/images/puzzle_image_5.jpg';
import PuzzleImage6 from '../../assets/images/puzzle_image_6.jpg';
import PuzzleImage7 from '../../assets/images/puzzle_image_7.jpg';
import PuzzleImage8 from '../../assets/images/puzzle_image_8.jpg';
import PuzzleImage9 from '../../assets/images/puzzle_image_9.jpg';

const IMAGE_DATABASE = [PuzzleImage1, PuzzleImage2, PuzzleImage3,PuzzleImage4, PuzzleImage5, PuzzleImage6, PuzzleImage7, PuzzleImage8, PuzzleImage9];

// --- TIPOS E CONSTANTES ---
type Difficulty = 3 | 5 | 8;
type GameState = 'menu' | 'playing' | 'won';
type Piece = { id: number; originalIndex: number };
type Records = { [key in Difficulty]: { time: number; moves: number } | null };

const DIFFICULTIES: { label: string; value: Difficulty }[] = [
  { label: 'Fácil', value: 3 },
  { label: 'Médio', value: 5 },
  { label: 'Difícil', value: 8 },
];

const SCREEN_WIDTH = Dimensions.get('window').width;
const PUZZLE_CONTAINER_SIZE = SCREEN_WIDTH * 0.9;
const PIECE_MARGIN = 2;

// --- COMPONENTE PRINCIPAL ---
export default function PuzzleScreen() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(3);
  const [image, setImage] = useState<number | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [time, setTime] = useState(0);
  const [moves, setMoves] = useState(0);
  const [records, setRecords] = useState<Records>({ 3: null, 5: null, 8: null });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null);
  const [usedImageIndexes, setUsedImageIndexes] = useState<number[]>([]);
  const [showReferenceImage, setShowReferenceImage] = useState(false);

  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // --- EFEITOS ---
  useEffect(() => {
    // Carrega os recordes do banco de dados ao iniciar
    const loadRecords = async () => {
      try {
        const recordsFromDB = loadPuzzleRecords();
        // Converte para o formato esperado pelo componente
        const formattedRecords: Records = {
          3: recordsFromDB[3] || null,
          5: recordsFromDB[5] || null,
          8: recordsFromDB[8] || null,
        };
        setRecords(formattedRecords);
      } catch (error) {
        console.error('Erro ao carregar recordes:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadRecords();
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      timerInterval.current = setInterval(() => setTime(prev => prev + 1), 1000);
    } else if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (selectedPieceIndex !== null) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 300, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [selectedPieceIndex]);

  // --- LÓGICA DO JOGO ---
  const startGame = (level: Difficulty) => {
    setIsLoading(true);
    setDifficulty(level);
    setTime(0);
    setMoves(0);
    setSelectedPieceIndex(null);

    let imageIndex;
    if (usedImageIndexes.length >= IMAGE_DATABASE.length) {
      setUsedImageIndexes([]);
      imageIndex = 0;
    } else {
      do {
        imageIndex = Math.floor(Math.random() * IMAGE_DATABASE.length);
      } while (usedImageIndexes.includes(imageIndex));
    }
    setUsedImageIndexes(prev => [...prev, imageIndex]);
    setImage(IMAGE_DATABASE[imageIndex]);

    const totalPieces = level * level;
    const initialPieces = Array.from({ length: totalPieces }, (_, i) => ({ id: i, originalIndex: i }));
    setPieces(shuffle(initialPieces));

    setTimeout(() => {
      setGameState('playing');
      setIsLoading(false);
    }, 300);
  };

  const handlePiecePress = (pressedPieceIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedPieceIndex === null) {
      setSelectedPieceIndex(pressedPieceIndex);
    } else {
      if (selectedPieceIndex === pressedPieceIndex) {
        setSelectedPieceIndex(null);
        return;
      }
      const newPieces = [...pieces];
      [newPieces[selectedPieceIndex], newPieces[pressedPieceIndex]] = [newPieces[pressedPieceIndex], newPieces[selectedPieceIndex]];
      setPieces(newPieces);
      setMoves(prev => prev + 1);
      setSelectedPieceIndex(null);
      checkWinCondition(newPieces);
    }
  };

  const checkWinCondition = (currentPieces: Piece[]) => {
    const isSolved = currentPieces.every((p, index) => p.originalIndex === index);
    if (isSolved) {
      if (timerInterval.current) clearInterval(timerInterval.current);
      updateRecord();
      setGameState('won');
    }
  };

  const updateRecord = () => {
    const currentRecord = records[difficulty];
    // Verifica se não há recorde atual ou se o novo recorde é melhor
    const isNewRecord = currentRecord === null || 
                       time < currentRecord.time || 
                       (time === currentRecord.time && moves < currentRecord.moves);
    
    if (isNewRecord) {
      const newRecord = { time, moves };
      setRecords(prev => ({ ...prev, [difficulty]: newRecord }));
      try {
        savePuzzleRecord(difficulty, time, moves);
      } catch (error) {
        console.error('Erro ao salvar recorde:', error);
      }
    }
  };

  // --- FUNÇÕES AUXILIARES ---
  const shuffle = (array: Piece[]): Piece[] => {
    let shuffledArray;
    let isSolved;
    do {
      shuffledArray = [...array].sort(() => 0.5 - Math.random());
      isSolved = shuffledArray.every((p, index) => p.originalIndex === index);
    } while (isSolved && array.length > 1);
    return shuffledArray;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // --- RENDERIZAÇÃO ---
  const pieceSize = useMemo(() => (PUZZLE_CONTAINER_SIZE - (difficulty - 1) * PIECE_MARGIN * 2) / difficulty, [difficulty]);

  const renderPiece = (item: Piece, index: number) => {
    const row = Math.floor(item.originalIndex / difficulty);
    const col = item.originalIndex % difficulty;
    const isSelected = selectedPieceIndex === index;

    return (
      <Pressable onPress={() => handlePiecePress(index)}>
        <Animated.View style={[styles.pieceContainer, { width: pieceSize, height: pieceSize, margin: PIECE_MARGIN / 2 }, isSelected && { transform: [{ scale: pulseAnim }], borderColor: PALETTE.primary }]}>
          {image && <Image source={image} style={{ width: PUZZLE_CONTAINER_SIZE, height: PUZZLE_CONTAINER_SIZE, position: 'absolute', left: -col * pieceSize - col * PIECE_MARGIN, top: -row * pieceSize - row * PIECE_MARGIN }} />}
        </Animated.View>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <LinearGradient colors={[PALETTE.background, PALETTE.background_darker]} style={styles.container}>
        <ActivityIndicator size="large" color={PALETTE.primary} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[PALETTE.background, PALETTE.background_darker]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {gameState === 'menu' && (
          <View style={styles.menuContainer}>
            <Text style={styles.title}>Quebra-Cabeça</Text>
            {DIFFICULTIES.map(({ label, value }) => (
              <View key={value} style={styles.menuItem}>
                <Pressable style={({ pressed }) => [styles.button, { transform: [{ scale: pressed ? 0.98 : 1 }] }]} onPress={() => startGame(value)}>
                  <Text style={styles.buttonText}>{`${label} (${value}x${value})`}</Text>
                </Pressable>
                <Text style={styles.recordText}>Recorde: {records[value] ? `${formatTime(records[value]!.time)} / ${records[value]!.moves} mov.` : 'Nenhum'}</Text>
              </View>
            ))}
          </View>
        )}

        {gameState === 'playing' && (
          <View style={styles.gameContainer}>
            <View style={styles.header}>
              <Pressable onPress={() => setGameState('menu')}><Text style={styles.headerButton}>Menu</Text></Pressable>
              <View style={styles.statsContainer}>
                <Text style={styles.statsText}>{formatTime(time)}</Text>
                <Text style={styles.statsText}>{moves} mov.</Text>
              </View>
              {image && (
                <Pressable onPress={() => setShowReferenceImage(true)}>
                  <Image source={image} style={styles.previewImage} />
                </Pressable>
              )}
            </View>
            <View style={[styles.puzzleContainer, { width: PUZZLE_CONTAINER_SIZE, height: PUZZLE_CONTAINER_SIZE }]}>
              {pieces.map((item, index) => <View key={item.id}>{renderPiece(item, index)}</View>)}
            </View>
          </View>
        )}

        <Modal transparent={true} visible={gameState === 'won'} animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.winTitle}>Vitória!</Text>
              <Text style={styles.winText}>Seu tempo: {formatTime(time)}</Text>
              <Text style={styles.winText}>Movimentos: {moves}</Text>
              <Pressable style={({ pressed }) => [styles.button, { marginTop: 20, transform: [{ scale: pressed ? 0.98 : 1 }] }]} onPress={() => setGameState('menu')}>
                <Text style={styles.buttonText}>Voltar ao Menu</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Modal da Imagem de Referência */}
        <Modal transparent={true} visible={showReferenceImage} animationType="fade">
          <View style={styles.referenceModalContainer}>
            <Pressable 
              style={styles.referenceModalOverlay}
              onPress={() => setShowReferenceImage(false)}
            />
            <View style={styles.referenceModalContent}>
              <View style={styles.referenceHeader}>
                <Text style={styles.referenceTitle}>Imagem de Referência</Text>
                <Pressable 
                  onPress={() => setShowReferenceImage(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </Pressable>
              </View>
              {image && (
                <View style={styles.imageContainer}>
                  <Image 
                    source={image} 
                    style={styles.referenceImageLarge}
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  menuContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  gameContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 48, color: PALETTE.textPrimary, fontFamily: 'Orbitron-Bold', marginBottom: 60, textAlign: 'center' },
  menuItem: { alignItems: 'center', marginBottom: 30, width: '100%' },
  button: { backgroundColor: PALETTE.cardBackground, paddingVertical: 18, paddingHorizontal: 40, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', width: '80%' },
  buttonText: { color: PALETTE.primary, fontSize: 20, fontFamily: 'Orbitron-Bold', textAlign: 'center' },
  recordText: { color: PALETTE.textSecondary, marginTop: 10, fontSize: 14, fontFamily: 'Orbitron-Regular' },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, position: 'absolute', top: 20 },
  headerButton: { color: PALETTE.primary, fontSize: 16, fontFamily: 'Orbitron-Bold' },
  statsContainer: { alignItems: 'center' },
  statsText: { color: PALETTE.textPrimary, fontSize: 20, fontFamily: 'Orbitron-Bold' },
  previewImage: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: PALETTE.primary },
  puzzleContainer: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: PALETTE.background_darker, borderRadius: 10, padding: PIECE_MARGIN / 2 },
  pieceContainer: { backgroundColor: '#000', overflow: 'hidden', borderRadius: 6, borderWidth: 2, borderColor: 'transparent' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: PALETTE.cardBackground, padding: 30, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: PALETTE.primary, width: '85%' },
  winTitle: { fontSize: 40, fontFamily: 'Orbitron-Bold', color: PALETTE.primary, marginBottom: 15 },
  winText: { fontSize: 18, color: PALETTE.textSecondary, fontFamily: 'Orbitron-Regular', marginBottom: 8 },
  // Estilos para o modal da imagem de referência
  referenceModalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  referenceModalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.9)' },
  referenceModalContent: { backgroundColor: PALETTE.cardBackground, borderRadius: 20, padding: 20, width: '90%', maxWidth: 400, borderWidth: 1, borderColor: PALETTE.primary, zIndex: 1 },
  referenceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  referenceTitle: { fontSize: 18, fontFamily: 'Orbitron-Bold', color: PALETTE.primary, flex: 1 },
  closeButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: PALETTE.primary, justifyContent: 'center', alignItems: 'center' },
  closeButtonText: { fontSize: 16, fontWeight: 'bold', color: PALETTE.background },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
    maxHeight: 300,
  },
  referenceImageLarge: { 
    width: '100%', 
    height: '100%',
    borderRadius: 10,
  },
});
