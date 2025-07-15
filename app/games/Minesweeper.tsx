import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FONTS } from '../../hooks/useFonts';
import { useThemePalette } from '../../hooks/useThemePalette';

const { width, height } = Dimensions.get('window');

// Types
interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

interface GameConfig {
  rows: number;
  cols: number;
  mines: number;
  name: string;
}

interface GameLevel {
  name: string;
  rows: number;
  cols: number;
  mines: number;
  description: string;
}

// Game levels configuration (optimized for mobile performance)
const GAME_LEVELS: GameLevel[] = [
  {
    name: 'Fácil',
    rows: 7,
    cols: 7,
    mines: 8,
    description: '7x7 com 8 minas'
  },
  {
    name: 'Médio',
    rows: 9,
    cols: 9,
    mines: 15,
    description: '9x9 com 15 minas'
  },
  {
    name: 'Difícil',
    rows: 11,
    cols: 11,
    mines: 25,
    description: '11x11 com 25 minas'
  }
];

// Custom hook for sounds
const useMinesweeperSounds = () => {
  const sounds = useRef<{ [key: string]: Audio.Sound | null }>({}).current;

  const loadSounds = useCallback(async () => {
    try {
      const { sound: clickSound } = await Audio.Sound.createAsync(require('@/assets/sounds/tone.wav'));
      const { sound: explosionSound } = await Audio.Sound.createAsync(require('@/assets/sounds/explosion.wav'));
      const { sound: winSound } = await Audio.Sound.createAsync(require('@/assets/sounds/winner.wav'));
      const { sound: gameOverSound } = await Audio.Sound.createAsync(require('@/assets/sounds/game-over.wav'));
      
      sounds['click'] = clickSound;
      sounds['explosion'] = explosionSound;
      sounds['win'] = winSound;
      sounds['gameOver'] = gameOverSound;
    } catch (error) {
      console.error("Erro ao carregar sons:", error);
    }
  }, [sounds]);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    loadSounds();
    return () => {
      Object.values(sounds).forEach(sound => sound?.unloadAsync());
    };
  }, [loadSounds]);

  const playSound = useCallback(async (soundName: 'click' | 'explosion' | 'win' | 'gameOver') => {
    try {
      await sounds[soundName]?.replayAsync();
    } catch (error) {
      console.error("Erro ao reproduzir som:", error);
    }
  }, [sounds]);

  return { playSound };
};

// Cell component - optimized with React.memo
const MineCell = React.memo(({ 
  cell, 
  onPress, 
  onLongPress, 
  size, 
  palette 
}: { 
  cell: Cell;
  onPress: () => void;
  onLongPress: () => void;
  size: number;
  palette: any;
}) => {
  const animValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (cell.isRevealed) {
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [cell.isRevealed, animValue]);

  const getCellContent = useCallback(() => {
    if (cell.isFlagged) return '🚩';
    if (!cell.isRevealed) return '';
    if (cell.isMine) return '💣';
    if (cell.neighborMines > 0) return cell.neighborMines.toString();
    return '';
  }, [cell.isFlagged, cell.isRevealed, cell.isMine, cell.neighborMines]);

  const getCellColor = useCallback(() => {
    if (cell.isFlagged) return palette.warningAccent;
    if (!cell.isRevealed) return palette.cardBackground;
    if (cell.isMine) return palette.error;
    return palette.background;
  }, [cell.isFlagged, cell.isRevealed, cell.isMine, palette]);

  const getTextColor = useCallback(() => {
    if (cell.neighborMines === 1) return '#1976D2';
    if (cell.neighborMines === 2) return '#388E3C';
    if (cell.neighborMines === 3) return '#D32F2F';
    if (cell.neighborMines === 4) return '#7B1FA2';
    if (cell.neighborMines === 5) return '#F57C00';
    if (cell.neighborMines === 6) return '#0288D1';
    if (cell.neighborMines === 7) return '#000';
    if (cell.neighborMines === 8) return '#424242';
    return palette.textPrimary;
  }, [cell.neighborMines, palette.textPrimary]);

  return (
    <Animated.View style={{ transform: [{ scale: animValue }] }}>
      <TouchableOpacity
        style={[
          styles.cell,
          {
            width: size,
            height: size,
            backgroundColor: getCellColor(),
            borderColor: palette.border,
          }
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={cell.isRevealed}
        activeOpacity={0.7}
      >
        <Text 
          style={[
            styles.cellText, 
            { 
              color: getTextColor(),
              fontSize: size * 0.4,
              fontFamily: FONTS.gaming
            }
          ]}
        >
          {getCellContent()}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

// Player name input modal
const PlayerNameModal = ({ 
  visible, 
  onSubmit, 
  palette 
}: { 
  visible: boolean;
  onSubmit: (name: string) => void;
  palette: any;
}) => {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name.trim());
      setName('');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: palette.cardBackground }]}>
          <Text style={[styles.modalTitle, { color: palette.textPrimary, fontFamily: FONTS.gaming }]}>
            🎮 CAMPO MINADO
          </Text>
          <Text style={[styles.modalSubtitle, { color: palette.textSecondary, fontFamily: FONTS.primary }]}>
            Digite seu nome para começar:
          </Text>
          <TextInput
            style={[
              styles.nameInput,
              {
                backgroundColor: palette.background,
                borderColor: palette.border,
                color: palette.textPrimary,
                fontFamily: FONTS.primary
              }
            ]}
            value={name}
            onChangeText={setName}
            placeholder="Seu nome aqui..."
            placeholderTextColor={palette.textSecondary}
            maxLength={20}
            autoFocus
            onSubmitEditing={handleSubmit}
          />
          <TouchableOpacity
            style={[
              styles.modalButton,
              {
                backgroundColor: name.trim() ? palette.primary : palette.border,
              }
            ]}
            onPress={handleSubmit}
            disabled={!name.trim()}
          >
            <Text style={[styles.modalButtonText, { fontFamily: FONTS.gaming }]}>
              COMEÇAR
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Level selection modal
const LevelSelectionModal = ({ 
  visible, 
  onSelectLevel, 
  playerName,
  palette 
}: { 
  visible: boolean;
  onSelectLevel: (level: GameLevel) => void;
  playerName: string;
  palette: any;
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: palette.cardBackground }]}>
          <Text style={[styles.modalTitle, { color: palette.textPrimary, fontFamily: FONTS.gaming }]}>
            Olá, {playerName}! 👋
          </Text>
          <Text style={[styles.modalSubtitle, { color: palette.textSecondary, fontFamily: FONTS.primary }]}>
            Escolha o nível de dificuldade:
          </Text>
          
          {GAME_LEVELS.map((level, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.levelButton, { backgroundColor: palette.background, borderColor: palette.border }]}
              onPress={() => onSelectLevel(level)}
            >
              <Text style={[styles.levelButtonName, { color: palette.textPrimary, fontFamily: FONTS.gaming }]}>
                {level.name}
              </Text>
              <Text style={[styles.levelDescription, { color: palette.textSecondary, fontFamily: FONTS.primary }]}>
                {level.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};

// Main Minesweeper component
export default function Minesweeper() {
  const palette = useThemePalette();
  const { playSound } = useMinesweeperSounds();
  
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'won' | 'lost'>('setup');
  const [flagCount, setFlagCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [showNameModal, setShowNameModal] = useState(true);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [firstClick, setFirstClick] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState]);

  // Initialize empty board
  const initializeBoard = (rows: number, cols: number): Cell[][] => {
    const newBoard: Cell[][] = [];
    for (let row = 0; row < rows; row++) {
      newBoard[row] = [];
      for (let col = 0; col < cols; col++) {
        newBoard[row][col] = {
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        };
      }
    }
    return newBoard;
  };

  // Place mines on the board
  const placeMines = (board: Cell[][], mines: number, firstClickRow: number, firstClickCol: number): Cell[][] => {
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    let minesPlaced = 0;

    while (minesPlaced < mines) {
      const row = Math.floor(Math.random() * newBoard.length);
      const col = Math.floor(Math.random() * newBoard[0].length);

      // Don't place mine on first click or if already has mine
      if (!newBoard[row][col].isMine && !(row === firstClickRow && col === firstClickCol)) {
        newBoard[row][col].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate neighbor mines
    for (let row = 0; row < newBoard.length; row++) {
      for (let col = 0; col < newBoard[0].length; col++) {
        if (!newBoard[row][col].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const newRow = row + dr;
              const newCol = col + dc;
              if (
                newRow >= 0 &&
                newRow < newBoard.length &&
                newCol >= 0 &&
                newCol < newBoard[0].length &&
                newBoard[newRow][newCol].isMine
              ) {
                count++;
              }
            }
          }
          newBoard[row][col].neighborMines = count;
        }
      }
    }

    return newBoard;
  };

  // Reveal cell and adjacent empty cells (iterative to avoid stack overflow)
  const revealCell = (board: Cell[][], startRow: number, startCol: number): Cell[][] => {
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    const queue: [number, number][] = [[startRow, startCol]];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const [row, col] = queue.shift()!;
      const key = `${row}-${col}`;

      if (
        row < 0 ||
        row >= newBoard.length ||
        col < 0 ||
        col >= newBoard[0].length ||
        visited.has(key) ||
        newBoard[row][col].isRevealed ||
        newBoard[row][col].isFlagged ||
        newBoard[row][col].isMine
      ) {
        continue;
      }

      visited.add(key);
      newBoard[row][col].isRevealed = true;

      // If cell has no neighboring mines, add adjacent cells to queue
      if (newBoard[row][col].neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const newRow = row + dr;
            const newCol = col + dc;
            const adjacentKey = `${newRow}-${newCol}`;
            
            if (!visited.has(adjacentKey)) {
              queue.push([newRow, newCol]);
            }
          }
        }
      }
    }

    return newBoard;
  };

  // Handle cell press (optimized)
  const handleCellPress = useCallback((row: number, col: number) => {
    if (gameState !== 'playing' && gameState !== 'setup') return;
    if (board[row][col].isRevealed || board[row][col].isFlagged) return;

    playSound('click');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setBoard(prevBoard => {
      let newBoard = prevBoard.map(row => row.map(cell => ({ ...cell })));

      // Handle first click
      if (firstClick) {
        newBoard = placeMines(newBoard, gameConfig!.mines, row, col);
        setFirstClick(false);
        setGameState('playing');
      }

      // Reveal cell
      newBoard = revealCell(newBoard, row, col);

      // Check if hit mine
      if (newBoard[row][col].isMine) {
        // Reveal all mines
        for (let r = 0; r < newBoard.length; r++) {
          for (let c = 0; c < newBoard[0].length; c++) {
            if (newBoard[r][c].isMine) {
              newBoard[r][c].isRevealed = true;
            }
          }
        }
        setGameState('lost');
        playSound('explosion');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        // Use setTimeout to prevent blocking
        setTimeout(() => {
          Alert.alert(
            '💥 Game Over!',
            `${playerName}, você pisou em uma mina!\n\nTempo: ${formatTime(timer)}`,
            [
              { text: 'Tentar Novamente', onPress: startNewGame },
              { text: 'Mudar Nível', onPress: () => setShowLevelModal(true) }
            ]
          );
        }, 500);
      } else {
        // Check if won (optimized)
        const totalCells = gameConfig!.rows * gameConfig!.cols;
        let revealedCount = 0;
        
        for (let r = 0; r < newBoard.length; r++) {
          for (let c = 0; c < newBoard[0].length; c++) {
            if (newBoard[r][c].isRevealed) {
              revealedCount++;
            }
          }
        }
        
        if (revealedCount === totalCells - gameConfig!.mines) {
          setGameState('won');
          playSound('win');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          setTimeout(() => {
            Alert.alert(
              '🎉 Parabéns!',
              `${playerName}, você venceu!\n\nTempo: ${formatTime(timer)}\nBandeiras: ${flagCount}`,
              [
                { text: 'Jogar Novamente', onPress: startNewGame },
                { text: 'Mudar Nível', onPress: () => setShowLevelModal(true) }
              ]
            );
          }, 500);
        }
      }

      return newBoard;
    });
  }, [gameState, board, firstClick, gameConfig, playerName, timer, flagCount, playSound]);

  // Handle cell long press (flag/unflag) - optimized
  const handleCellLongPress = useCallback((row: number, col: number) => {
    if (gameState !== 'playing' || board[row][col].isRevealed) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setBoard(prevBoard => {
      const newBoard = prevBoard.map(row => row.map(cell => ({ ...cell })));
      const cell = newBoard[row][col];

      if (cell.isFlagged) {
        cell.isFlagged = false;
        setFlagCount(prev => prev - 1);
      } else {
        cell.isFlagged = true;
        setFlagCount(prev => prev + 1);
      }

      return newBoard;
    });
  }, [gameState, board]);

  // Start new game - optimized
  const startNewGame = useCallback(() => {
    if (!gameConfig) return;

    const newBoard = initializeBoard(gameConfig.rows, gameConfig.cols);
    setBoard(newBoard);
    setGameState('setup');
    setTimer(0);
    setFlagCount(0);
    setFirstClick(true);
  }, [gameConfig]);

  // Handle player name submission
  const handlePlayerNameSubmit = (name: string) => {
    setPlayerName(name);
    setShowNameModal(false);
    setShowLevelModal(true);
  };

  // Handle level selection
  const handleLevelSelection = (level: GameLevel) => {
    const config: GameConfig = {
      rows: level.rows,
      cols: level.cols,
      mines: level.mines,
      name: level.name,
    };
    setGameConfig(config);
    setShowLevelModal(false);
    
    const newBoard = initializeBoard(level.rows, level.cols);
    setBoard(newBoard);
    setGameState('setup');
    setTimer(0);
    setFlagCount(0);
    setFirstClick(true);
  };

  // Format time display
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Calculate cell size based on screen and grid
  const getCellSize = (): number => {
    if (!gameConfig) return 30;
    
    const maxWidth = width - 40; // Account for padding
    const maxHeight = height * 0.6; // Use 60% of screen height
    
    const cellWidth = maxWidth / gameConfig.cols;
    const cellHeight = maxHeight / gameConfig.rows;
    
    return Math.min(cellWidth, cellHeight, 40); // Max 40px per cell
  };

  const cellSize = getCellSize();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={palette.background_darker} />
      
      <PlayerNameModal
        visible={showNameModal}
        onSubmit={handlePlayerNameSubmit}
        palette={palette}
      />

      <LevelSelectionModal
        visible={showLevelModal}
        onSelectLevel={handleLevelSelection}
        playerName={playerName}
        palette={palette}
      />

      {gameConfig && (
        <>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: palette.cardBackground }]}>
            <View style={styles.headerRow}>
              <Text style={[styles.playerName, { color: palette.textPrimary, fontFamily: FONTS.gaming }]}>
                {playerName}
              </Text>
              <Text style={[styles.levelName, { color: palette.primary, fontFamily: FONTS.gaming }]}>
                {gameConfig.name}
              </Text>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: palette.textSecondary, fontFamily: FONTS.primary }]}>
                  💣 Minas
                </Text>
                <Text style={[styles.statValue, { color: palette.textPrimary, fontFamily: FONTS.gaming }]}>
                  {gameConfig.mines - flagCount}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: palette.textSecondary, fontFamily: FONTS.primary }]}>
                  ⏱️ Tempo
                </Text>
                <Text style={[styles.statValue, { color: palette.textPrimary, fontFamily: FONTS.gaming }]}>
                  {formatTime(timer)}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: palette.textSecondary, fontFamily: FONTS.primary }]}>
                  🚩 Flags
                </Text>
                <Text style={[styles.statValue, { color: palette.textPrimary, fontFamily: FONTS.gaming }]}>
                  {flagCount}
                </Text>
              </View>
            </View>
          </View>

          {/* Game Board - Optimized rendering */}
          <ScrollView
            style={styles.gameContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            maximumZoomScale={2}
            minimumZoomScale={0.5}
            removeClippedSubviews={true}
          >
            <View style={[
              styles.board,
              {
                width: gameConfig.cols * cellSize,
                height: gameConfig.rows * cellSize,
              }
            ]}>
              {board.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.row}>
                  {row.map((cell, colIndex) => (
                    <MineCell
                      key={`${rowIndex}-${colIndex}`}
                      cell={cell}
                      onPress={() => handleCellPress(rowIndex, colIndex)}
                      onLongPress={() => handleCellLongPress(rowIndex, colIndex)}
                      size={cellSize}
                      palette={palette}
                    />
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Controls */}
          <View style={[styles.controls, { backgroundColor: palette.cardBackground }]}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: palette.primary }]}
              onPress={startNewGame}
            >
              <Text style={[styles.controlButtonText, { fontFamily: FONTS.gaming }]}>
                🔄 NOVO JOGO
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: palette.warningAccent }]}
              onPress={() => setShowLevelModal(true)}
            >
              <Text style={[styles.controlButtonText, { fontFamily: FONTS.gaming }]}>
                🎚️ NÍVEL
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  playerName: {
    fontSize: 18,
  },
  levelName: {
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 16,
  },
  gameContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: height * 0.6,
  },
  board: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 2,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 0.5,
    borderRadius: 2,
  },
  cellText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  controlButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    maxWidth: 400,
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  nameInput: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  levelButton: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  levelButtonName: {
    fontSize: 16,
  },
  levelDescription: {
    fontSize: 14,
  },
});
