import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  Alert, 
  Animated, 
  Dimensions, 
  Pressable, 
  ScrollView, 
  StatusBar, 
  StyleSheet, 
  Text, 
  TextInput,
  TouchableOpacity, 
  View 
} from 'react-native';
import WinnerAnimation from '../../components/WinnerAnimation';
import { FONTS } from '../../hooks/useFonts';
import { useThemePalette } from '../../hooks/useThemePalette';
import { DIFFICULTY_CONFIG, DifficultyLevel, WORD_SEARCH_THEMES, WordSearchTheme } from '../data/wordSearchData';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface GridCell {
  letter: string;
  row: number;
  col: number;
  isPartOfWord: boolean;
  wordIndex?: number;
  isSelected: boolean;
  isFound: boolean;
}

interface FoundWord {
  word: string;
  positions: { row: number; col: number }[];
  direction: string;
}

export default function WordSearch() {
  const palette = useThemePalette();
  
  // Safety check para garantir que o palette está carregado
  if (!palette || !palette.textPrimary || !palette.background || !palette.cardBackground || !palette.primary || 
      !palette.successAccent || !palette.warningAccent || !palette.background_darker || !palette.textSecondary) {
    console.warn('Palette is undefined or incomplete in WordSearch, using fallback');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' }}>
        <Text style={{ color: '#ffffff', fontSize: 18 }}>Carregando...</Text>
      </View>
    );
  }
  
  const styles = createStyles(palette);
  
  // Estados principais
  const [playerName, setPlayerName] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<WordSearchTheme | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null);
  const [gameState, setGameState] = useState<'name' | 'theme' | 'difficulty' | 'playing' | 'won'>('name');
  
  // Estados do jogo
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [wordsToFind, setWordsToFind] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<FoundWord[]>([]);
  const [selectedCells, setSelectedCells] = useState<{ row: number; col: number }[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  
  // Estados para seleção sequencial
  const [currentSelection, setCurrentSelection] = useState<{ row: number; col: number }[]>([]);
  const [selectedWord, setSelectedWord] = useState<string>('');
  
  // Animações
  const fadeAnim = useState(new Animated.Value(1))[0];
  const scaleAnim = useState(new Animated.Value(1))[0];

  // Effect para garantir que não haja transparência durante o jogo
  useEffect(() => {
    if (gameState === 'playing') {
      console.log('🎮 Iniciando jogo - Garantindo opacidade total');
      fadeAnim.setValue(1); // Garantir opacidade total
    }
  }, [gameState, fadeAnim]);

  // Timer effect para atualizar o tempo em tempo real
  useEffect(() => {
    let interval: any;
    
    if (gameState === 'playing' && startTime > 0 && endTime === 0) {
      interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState, startTime, endTime]);

  // Função para gerar letras aleatórias
  const getRandomLetter = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return letters[Math.floor(Math.random() * letters.length)];
  };

  // Função para verificar se uma posição é válida
  const isValidPosition = (row: number, col: number, gridSize: number) => {
    return row >= 0 && row < gridSize && col >= 0 && col < gridSize;
  };

  // Função para tentar colocar uma palavra no grid
  const tryPlaceWord = (
    grid: GridCell[][], 
    word: string, 
    gridSize: number, 
    wordIndex: number,
    attempts: number = 50
  ): boolean => {
    const directions = [
      { dr: 0, dc: 1 },   // horizontal
      { dr: 1, dc: 0 },   // vertical
      { dr: 1, dc: 1 },   // diagonal \
      { dr: 1, dc: -1 },  // diagonal /
      { dr: 0, dc: -1 },  // horizontal reversa
      { dr: -1, dc: 0 },  // vertical reversa
      { dr: -1, dc: -1 }, // diagonal \ reversa
      { dr: -1, dc: 1 }   // diagonal / reversa
    ];

    for (let attempt = 0; attempt < attempts; attempt++) {
      const direction = directions[Math.floor(Math.random() * directions.length)];
      const startRow = Math.floor(Math.random() * gridSize);
      const startCol = Math.floor(Math.random() * gridSize);

      // Verificar se a palavra cabe na direção escolhida
      let canPlace = true;
      const positions: { row: number; col: number }[] = [];

      for (let i = 0; i < word.length; i++) {
        const row = startRow + direction.dr * i;
        const col = startCol + direction.dc * i;

        if (!isValidPosition(row, col, gridSize)) {
          canPlace = false;
          break;
        }

        positions.push({ row, col });

        // Verificar se a célula está vazia ou contém a mesma letra
        if (grid[row][col].letter !== '' && grid[row][col].letter !== word[i]) {
          canPlace = false;
          break;
        }
      }

      if (canPlace) {
        // Colocar a palavra no grid
        positions.forEach((pos, i) => {
          grid[pos.row][pos.col].letter = word[i];
          grid[pos.row][pos.col].isPartOfWord = true;
          grid[pos.row][pos.col].wordIndex = wordIndex;
        });
        return true;
      }
    }

    return false;
  };

  // Função para gerar o grid do jogo
  const generateGrid = useCallback((theme: WordSearchTheme, difficulty: DifficultyLevel) => {
    const config = DIFFICULTY_CONFIG[difficulty];
    const gridSize = config.gridSize;
    const wordsCount = config.wordsCount;
    
    console.log(`Gerando grid ${gridSize}x${gridSize} para tema: ${theme.name}, dificuldade: ${difficulty}`);
    
    // Selecionar palavras aleatórias do tema e dificuldade
    const availableWords = theme.words[difficulty];
    const selectedWords = availableWords
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(wordsCount, availableWords.length));

    console.log('Palavras selecionadas:', selectedWords);

    // Inicializar grid vazio
    const newGrid: GridCell[][] = Array(gridSize).fill(null).map((_, row) =>
      Array(gridSize).fill(null).map((_, col) => ({
        letter: '',
        row,
        col,
        isPartOfWord: false,
        isSelected: false,
        isFound: false
      }))
    );

    // Tentar colocar cada palavra
    const placedWords: string[] = [];
    const maxAttempts = 100; // Aumentar tentativas
    
    selectedWords.forEach((word, index) => {
      let placed = false;
      for (let attempt = 0; attempt < maxAttempts && !placed; attempt++) {
        if (tryPlaceWord(newGrid, word, gridSize, index, 1)) {
          placedWords.push(word);
          placed = true;
          console.log(`Palavra "${word}" colocada com sucesso`);
        }
      }
      if (!placed) {
        console.warn(`Não foi possível colocar a palavra: ${word}`);
      }
    });

    console.log('Palavras finalmente colocadas:', placedWords);

    // Preencher células vazias com letras aleatórias
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (newGrid[row][col].letter === '') {
          newGrid[row][col].letter = getRandomLetter();
        }
      }
    }

    setGrid(newGrid);
    setWordsToFind(placedWords);
    setFoundWords([]);
    setSelectedCells([]);
    setIsSelecting(false);
    setCurrentSelection([]);
    setSelectedWord('');
    setEndTime(0);
    setStartTime(Date.now());
    setCurrentTime(Date.now());
  }, []);

  // Função para iniciar o jogo
  const startGame = useCallback(() => {
    if (selectedTheme && selectedDifficulty) {
      generateGrid(selectedTheme, selectedDifficulty);
      setGameState('playing');
      
      // Manter opacidade em 1 para evitar transparência
      fadeAnim.setValue(1);
    }
  }, [selectedTheme, selectedDifficulty, generateGrid, fadeAnim]);

  // Função para verificar se duas células estão em linha reta
  const areInStraightLine = useCallback((cell1: { row: number; col: number }, cell2: { row: number; col: number }) => {
    const rowDiff = Math.abs(cell1.row - cell2.row);
    const colDiff = Math.abs(cell1.col - cell2.col);
    
    // Horizontal, vertical ou diagonal
    return (rowDiff === 0 || colDiff === 0 || rowDiff === colDiff);
  }, []);

  // Função para ordenar células na direção correta
  const sortCellsInDirection = useCallback((cells: { row: number; col: number }[]) => {
    if (cells.length < 2) return cells;
    
    const first = cells[0];
    const last = cells[cells.length - 1];
    
    // Determinar direção
    const rowDirection = last.row > first.row ? 1 : last.row < first.row ? -1 : 0;
    const colDirection = last.col > first.col ? 1 : last.col < first.col ? -1 : 0;
    
    // Ordenar baseado na direção
    return [...cells].sort((a, b) => {
      if (rowDirection !== 0) {
        const rowCompare = (a.row - first.row) * rowDirection - (b.row - first.row) * rowDirection;
        if (rowCompare !== 0) return rowCompare;
      }
      if (colDirection !== 0) {
        return (a.col - first.col) * colDirection - (b.col - first.col) * colDirection;
      }
      return 0;
    });
  }, []);

  // Função para verificar se as células formam uma linha contínua
  const areCellsContinuous = useCallback((cells: { row: number; col: number }[]) => {
    if (cells.length < 2) return true;
    
    const sortedCells = sortCellsInDirection(cells);
    
    for (let i = 1; i < sortedCells.length; i++) {
      const prev = sortedCells[i - 1];
      const curr = sortedCells[i];
      
      const rowDiff = Math.abs(curr.row - prev.row);
      const colDiff = Math.abs(curr.col - prev.col);
      
      // Verificar se são adjacentes
      if (rowDiff > 1 || colDiff > 1 || (rowDiff === 0 && colDiff === 0)) {
        return false;
      }
      
      // Verificar se mantém a mesma direção
      if (i > 1) {
        const prevPrev = sortedCells[i - 2];
        const prevRowDir = prev.row - prevPrev.row;
        const prevColDir = prev.col - prevPrev.col;
        const currRowDir = curr.row - prev.row;
        const currColDir = curr.col - prev.col;
        
        if (prevRowDir !== currRowDir || prevColDir !== currColDir) {
          return false;
        }
      }
    }
    
    return true;
  }, [sortCellsInDirection]);

  // Função para verificar automaticamente se a seleção atual forma uma palavra válida
  const checkForValidWord = useCallback((cells: { row: number; col: number }[]) => {
    if (cells.length < 2) return false;

    // Verificar se as células formam uma linha contínua
    if (!areCellsContinuous(cells)) return false;

    // Ordenar células na direção correta
    const sortedCells = sortCellsInDirection(cells);

    // Extrair a palavra das células selecionadas
    const word = sortedCells.map(cell => grid[cell.row][cell.col].letter).join('');
    const reverseWord = word.split('').reverse().join('');

    console.log('Verificando palavra:', word, 'Reversa:', reverseWord);

    // Verificar se é uma palavra válida (normal ou reversa)
    const foundWord = wordsToFind.find(w => w === word || w === reverseWord);
    
    if (foundWord && !foundWords.some(fw => fw.word === foundWord)) {
      console.log('✅ PALAVRA VÁLIDA ENCONTRADA:', foundWord);
      
      // Palavra encontrada!
      const newFoundWord: FoundWord = {
        word: foundWord,
        positions: [...sortedCells],
        direction: 'found'
      };

      // Marcar células como encontradas
      const newGrid = grid.map(row => 
        row.map(cell => {
          const isInWord = sortedCells.some(sc => sc.row === cell.row && sc.col === cell.col);
          return isInWord ? { ...cell, isFound: true, isSelected: false } : { ...cell, isSelected: false };
        })
      );

      setGrid(newGrid);
      setFoundWords(prev => [...prev, newFoundWord]);
      setSelectedCells([]);
      setIsSelecting(false);
      
      // Feedback háptico e sonoro
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Verificar se todas as palavras foram encontradas
      if (foundWords.length + 1 === wordsToFind.length) {
        setEndTime(Date.now());
        setGameState('won');
        
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
      
      return true;
    }
    
    return false;
  }, [areCellsContinuous, sortCellsInDirection, grid, wordsToFind, foundWords, scaleAnim]);

  // Função para calcular células em uma linha reta entre dois pontos
  const getCellsInLine = useCallback((start: { row: number; col: number }, end: { row: number; col: number }) => {
    const cells: { row: number; col: number }[] = [];
    
    const rowDiff = end.row - start.row;
    const colDiff = end.col - start.col;
    const steps = Math.max(Math.abs(rowDiff), Math.abs(colDiff));
    
    if (steps === 0) {
      return [start];
    }
    
    const rowStep = rowDiff / steps;
    const colStep = colDiff / steps;
    
    for (let i = 0; i <= steps; i++) {
      const row = Math.round(start.row + rowStep * i);
      const col = Math.round(start.col + colStep * i);
      cells.push({ row, col });
    }
    
    return cells;
  }, []);

  // Função para encontrar palavra completa a partir de uma célula
  const findWordFromCell = useCallback((startRow: number, startCol: number) => {
    const directions = [
      [0, 1],   // horizontal direita
      [0, -1],  // horizontal esquerda
      [1, 0],   // vertical baixo
      [-1, 0],  // vertical cima
      [1, 1],   // diagonal baixo-direita
      [-1, -1], // diagonal cima-esquerda
      [1, -1],  // diagonal baixo-esquerda
      [-1, 1]   // diagonal cima-direita
    ];

    for (const [dRow, dCol] of directions) {
      for (const targetWord of wordsToFind) {
        // Verificar se já foi encontrada
        if (foundWords.some(fw => fw.word === targetWord)) continue;

        // Tentar formar a palavra na direção normal
        let cells: { row: number; col: number }[] = [];
        let valid = true;
        
        for (let i = 0; i < targetWord.length; i++) {
          const newRow = startRow + (dRow * i);
          const newCol = startCol + (dCol * i);
          
          if (newRow < 0 || newRow >= grid.length || newCol < 0 || newCol >= grid[0].length) {
            valid = false;
            break;
          }
          
          if (grid[newRow][newCol].letter !== targetWord[i]) {
            valid = false;
            break;
          }
          
          cells.push({ row: newRow, col: newCol });
        }
        
        if (valid) {
          return { word: targetWord, cells };
        }

        // Tentar formar a palavra na direção reversa
        cells = [];
        valid = true;
        const reversedWord = targetWord.split('').reverse().join('');
        
        for (let i = 0; i < reversedWord.length; i++) {
          const newRow = startRow + (dRow * i);
          const newCol = startCol + (dCol * i);
          
          if (newRow < 0 || newRow >= grid.length || newCol < 0 || newCol >= grid[0].length) {
            valid = false;
            break;
          }
          
          if (grid[newRow][newCol].letter !== reversedWord[i]) {
            valid = false;
            break;
          }
          
          cells.push({ row: newRow, col: newCol });
        }
        
        if (valid) {
          return { word: targetWord, cells };
        }
      }
    }
    
    return null;
  }, [grid, wordsToFind, foundWords]);

  // Função para lidar com toque nas células (seleção sequencial)
  const handleCellPress = useCallback((row: number, col: number) => {
    if (gameState !== 'playing') return;

    console.log('=== CÉLULA PRESSIONADA ===', row, col);

    // Verificar se a célula já foi encontrada
    const cell = grid[row][col];
    if (cell.isFound) {
      console.log('Célula já foi encontrada, ignorando');
      return;
    }

    // Verificar se a célula já está selecionada
    const isAlreadySelected = currentSelection.some(pos => pos.row === row && pos.col === col);
    
    if (isAlreadySelected) {
      // Se já estiver selecionada, remover da seleção
      const newSelection = currentSelection.filter(pos => !(pos.row === row && pos.col === col));
      setCurrentSelection(newSelection);
      
      // Atualizar palavra selecionada
      const newWord = newSelection.map(pos => grid[pos.row][pos.col].letter).join('');
      setSelectedWord(newWord);
      
      // Atualizar grid visual
      const newGrid = grid.map(gridRow =>
        gridRow.map(gridCell => ({
          ...gridCell,
          isSelected: newSelection.some(pos => pos.row === gridCell.row && pos.col === gridCell.col)
        }))
      );
      setGrid(newGrid);
      
      console.log('Célula removida da seleção. Palavra atual:', newWord);
    } else {
      // Adicionar célula à seleção atual
      const newSelection = [...currentSelection, { row, col }];
      setCurrentSelection(newSelection);
      
      // Construir palavra com as letras selecionadas
      const newWord = newSelection.map(pos => grid[pos.row][pos.col].letter).join('');
      setSelectedWord(newWord);
      
      // Atualizar grid visual
      const newGrid = grid.map(gridRow =>
        gridRow.map(gridCell => ({
          ...gridCell,
          isSelected: newSelection.some(pos => pos.row === gridCell.row && pos.col === gridCell.col)
        }))
      );
      setGrid(newGrid);
      
      console.log('Palavra sendo formada:', newWord);
      
      // Verificar se a seleção atual forma uma palavra válida
      const isValidWord = validateSelectedWord(newSelection, newWord);
      
      if (isValidWord) {
        console.log('✅ PALAVRA COMPLETA ENCONTRADA:', newWord.toUpperCase());
        
        // Feedback háptico de sucesso
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Marcar palavra como encontrada
        setTimeout(() => {
          const foundWordData: FoundWord = {
            word: newWord.toUpperCase(),
            positions: [...newSelection],
            direction: 'found'
          };

          // Marcar células como encontradas
          const finalGrid = grid.map(gridRow => 
            gridRow.map(gridCell => {
              const isInWord = newSelection.some(pos => pos.row === gridCell.row && pos.col === gridCell.col);
              return isInWord ? { ...gridCell, isFound: true, isSelected: false } : { ...gridCell, isSelected: false };
            })
          );

          setGrid(finalGrid);
          setFoundWords(prev => [...prev, foundWordData]);
          setCurrentSelection([]);
          setSelectedWord('');
          
          console.log('Palavras encontradas:', foundWords.length + 1, 'de', wordsToFind.length);
          
          // Verificar se todas as palavras foram encontradas (vitória)
          if (foundWords.length + 1 === wordsToFind.length) {
            console.log('🎉 TODAS AS PALAVRAS ENCONTRADAS! JOGADOR VENCEU!');
            setTimeout(() => {
              setEndTime(Date.now());
              setGameState('won');
              
              // Animação de vitória
              Animated.sequence([
                Animated.timing(scaleAnim, {
                  toValue: 1.2,
                  duration: 300,
                  useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                  toValue: 1,
                  duration: 300,
                  useNativeDriver: true,
                }),
              ]).start();
              
              // Feedback háptico de vitória
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }, 500);
          }
        }, 300);
      } else {
        // Feedback háptico suave para seleção
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [gameState, grid, currentSelection, wordsToFind, foundWords, scaleAnim]);

  // Função para validar se a palavra selecionada é válida e completa
  const validateSelectedWord = useCallback((selection: { row: number; col: number }[], word: string) => {
    // Verificar se a palavra já foi encontrada
    if (foundWords.some(fw => fw.word === word.toUpperCase())) {
      console.log('Palavra já foi encontrada anteriormente:', word);
      return false;
    }

    // Verificar se a palavra está na lista de palavras para encontrar
    const targetWord = wordsToFind.find(w => w === word.toUpperCase());
    if (!targetWord) {
      console.log('Palavra não está na lista de palavras para encontrar:', word);
      return false;
    }

    // Verificar se todas as letras da palavra foram selecionadas
    if (word.length !== targetWord.length) {
      console.log('Palavra incompleta. Selecionado:', word.length, 'Necessário:', targetWord.length);
      return false;
    }

    // Verificar se as células selecionadas formam uma linha contínua
    if (!areCellsContinuous(selection)) {
      console.log('Células não formam uma linha contínua');
      return false;
    }

    // Verificar se a sequência de letras corresponde exatamente à palavra (normal ou reversa)
    const sortedCells = sortCellsInDirection(selection);
    const forwardWord = sortedCells.map(cell => grid[cell.row][cell.col].letter).join('');
    const reverseWord = forwardWord.split('').reverse().join('');

    if (forwardWord.toUpperCase() === targetWord || reverseWord.toUpperCase() === targetWord) {
      console.log('✅ Palavra válida encontrada:', targetWord, '(formada por:', forwardWord, ')');
      return true;
    }

    console.log('Palavra não corresponde. Formada:', forwardWord, 'Esperada:', targetWord);
    return false;
  }, [foundWords, wordsToFind, areCellsContinuous, sortCellsInDirection, grid]);

  // Função para limpar seleção atual
  const clearSelection = useCallback(() => {
    setCurrentSelection([]);
    setSelectedWord('');
    
    // Limpar seleção visual do grid
    const clearedGrid = grid.map(row =>
      row.map(cell => ({ ...cell, isSelected: false }))
    );
    setGrid(clearedGrid);
    
    console.log('Seleção limpa');
  }, [grid]);

  const resetGame = useCallback(() => {
    setPlayerName('');
    setSelectedTheme(null);
    setSelectedDifficulty(null);
    setGameState('name');
    setGrid([]);
    setWordsToFind([]);
    setFoundWords([]);
    setSelectedCells([]);
    setIsSelecting(false);
  }, []);

  // Renderização das telas
  const renderPlayerNameInput = () => (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={[palette.background || '#1a1a1a', palette.background_darker || palette.background || '#111111']}
        style={styles.container}
      >
        <View style={styles.nameInputContainer}>
          <Text style={[styles.title, { color: palette.textPrimary }]}>
            🔤 Caça Palavras
          </Text>
          
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            Digite seu nome para começar:
          </Text>
          
          <TextInput
            style={[
              styles.nameInput,
              {
                backgroundColor: palette.cardBackground,
                color: palette.textPrimary,
                borderColor: palette.primary,
              }
            ]}
            placeholder="Seu nome aqui..."
            placeholderTextColor={palette.textSecondary}
            value={playerName}
            onChangeText={setPlayerName}
            maxLength={20}
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus={true}
          />
          
          <Pressable
            style={[
              styles.continueButton,
              {
                backgroundColor: playerName.trim().length >= 2 ? palette.primary : palette.textSecondary,
              }
            ]}
            onPress={() => {
              if (playerName.trim().length >= 2) {
                setGameState('theme');
                Haptics.selectionAsync();
              } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              }
            }}
            disabled={playerName.trim().length < 2}
          >
            <Text style={[
              styles.continueButtonText,
              { 
                color: playerName.trim().length >= 2 ? palette.background : palette.background,
                opacity: playerName.trim().length >= 2 ? 1 : 0.7
              }
            ]}>
              Continuar
            </Text>
          </Pressable>
          
          <Text style={[styles.nameHint, { color: palette.textSecondary }]}>
            ✨ Mínimo 2 caracteres
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderThemeSelection = () => (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={[palette.background || '#1a1a1a', palette.background_darker || palette.background || '#111111']}
        style={styles.container}
      >
        <Pressable
          style={styles.backButton}
          onPress={() => setGameState('name')}
        >
          <Text style={[styles.backButtonText, { color: palette.primary }]}>← Alterar Nome</Text>
        </Pressable>
        
        <Text style={[styles.title, { color: palette.textPrimary, marginTop: 80 }]}>
          Olá, {playerName}! 👋
        </Text>
        
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
          Escolha um Tema
        </Text>
        
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {WORD_SEARCH_THEMES.map((theme, index) => (
            <Pressable
              key={index}
              style={[
                styles.themeCard,
                { backgroundColor: palette.cardBackground }
              ]}
              onPress={() => {
                setSelectedTheme(theme);
                setGameState('difficulty');
                Haptics.selectionAsync();
              }}
            >
              <Text style={styles.themeEmoji}>{theme.emoji}</Text>
              <Text style={[styles.themeName, { color: palette.textPrimary }]}>
                {theme.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </LinearGradient>
    </Animated.View>
  );

  const renderDifficultySelection = () => (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={[palette.background || '#1a1a1a', palette.background_darker || palette.background || '#111111']}
        style={styles.container}
      >
        <Pressable
          style={styles.backButton}
          onPress={() => setGameState('theme')}
        >
          <Text style={[styles.backButtonText, { color: palette.primary }]}>← Voltar</Text>
        </Pressable>
        
        <Text style={[styles.title, { color: palette.textPrimary, marginTop: 80 }]}>
          Tema: {selectedTheme?.name} {selectedTheme?.emoji}
        </Text>
        
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
          Escolha a Dificuldade
        </Text>
        
        <View style={styles.difficultyContainer}>
          {(Object.keys(DIFFICULTY_CONFIG) as DifficultyLevel[]).map((level) => {
            const config = DIFFICULTY_CONFIG[level];
            return (
              <Pressable
                key={level}
                style={[
                  styles.difficultyCard,
                  { 
                    backgroundColor: palette.cardBackground,
                    borderColor: config.color 
                  }
                ]}
                onPress={() => {
                  setSelectedDifficulty(level);
                  Haptics.selectionAsync();
                  // Pequeno delay para permitir que o estado seja atualizado antes de iniciar o jogo
                  setTimeout(() => {
                    generateGrid(selectedTheme!, level);
                    setGameState('playing');
                    
                    // Manter opacidade em 1 para evitar transparência
                    fadeAnim.setValue(1);
                  }, 100);
                }}
              >
                <Text style={styles.difficultyEmoji}>{config.emoji}</Text>
                <Text style={[styles.difficultyName, { color: palette.textPrimary }]}>
                  {config.name}
                </Text>
                <Text style={[styles.difficultyInfo, { color: palette.textSecondary }]}>
                  {config.gridSize}x{config.gridSize}
                </Text>
                <Text style={[styles.difficultyInfo, { color: palette.textSecondary }]}>
                  {config.wordsCount} palavras
                </Text>
              </Pressable>
            );
          })}
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderGame = () => {
    if (!selectedDifficulty) return null;
    
    const config = DIFFICULTY_CONFIG[selectedDifficulty];
    
    // Calcular tamanho da célula considerando o espaço disponível na tela
    const horizontalPadding = 40; // 20px de cada lado
    const gridPadding = 20; // padding interno do container da grid
    const cellMargin = 2; // margin de 1px de cada lado da célula (total 2px)
    
    // Espaço disponível para a grid
    const availableWidth = screenWidth - horizontalPadding - gridPadding;
    const availableHeight = screenHeight * 0.4; // 40% da altura da tela para a grid
    
    // Calcular tamanho baseado na largura e altura disponível
    const cellSizeFromWidth = (availableWidth - (config.gridSize * cellMargin)) / config.gridSize;
    const cellSizeFromHeight = (availableHeight - (config.gridSize * cellMargin)) / config.gridSize;
    
    // Usar o menor valor para garantir que caiba na tela, mas com tamanho mínimo para legibilidade
    const minCellSize = 18; // tamanho mínimo para garantir legibilidade
    const maxCellSize = 40; // tamanho máximo para não ficar muito grande
    const cellSize = Math.max(minCellSize, Math.floor(Math.min(cellSizeFromWidth, cellSizeFromHeight, maxCellSize)));
    
    // Debug info para verificar os cálculos
    console.log(`📏 Grid ${config.gridSize}x${config.gridSize}: cellSize=${cellSize}px, totalWidth=${(cellSize * config.gridSize) + (config.gridSize * cellMargin)}px`);
    
    const gameTime = endTime ? Math.floor((endTime - startTime) / 1000) : (startTime > 0 ? Math.floor((currentTime - startTime) / 1000) : 0);
    
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={[palette.background || '#1a1a1a', palette.background_darker || palette.background || '#111111']}
          style={styles.container}
        >
          {/* Header do jogo */}
          <View style={styles.gameHeader}>
            <Pressable
              style={styles.backButton}
              onPress={resetGame}
            >
              <Text style={[styles.backButtonText, { color: palette.primary }]}>← Menu</Text>
            </Pressable>
            
            <View style={styles.gameInfo}>
              <Text style={[styles.gameInfoText, { color: palette.primary, fontWeight: 'bold' }]}>
                👤 {playerName}
              </Text>
              <Text style={[styles.gameInfoText, { color: palette.textSecondary }]}>
                {selectedTheme?.name} {selectedTheme?.emoji} | {config.name}
              </Text>
              <Text style={[styles.gameInfoText, { color: palette.textSecondary }]}>
                Tempo: {Math.floor(gameTime / 60)}:{(gameTime % 60).toString().padStart(2, '0')}
              </Text>
            </View>

            {/* Botão para limpar seleção */}
            {currentSelection.length > 0 && (
              <Pressable
                style={[styles.clearButton, { backgroundColor: palette.warningAccent }]}
                onPress={clearSelection}
              >
                <Text style={[styles.clearButtonText, { color: palette.background }]}>✕</Text>
              </Pressable>
            )}
          </View>

          <ScrollView 
            style={styles.gameScrollView}
            contentContainerStyle={styles.gameScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Lista de palavras */}
            <View style={styles.wordsContainer}>
              <Text style={[styles.wordsTitle, { color: palette.textPrimary }]}>
                Palavras para encontrar:
              </Text>
              <View style={styles.wordsList}>
                {wordsToFind.map((word, index) => {
                  const isFound = foundWords.some(fw => fw.word === word);
                  return (
                    <Text
                      key={index}
                      style={[
                        styles.wordItem,
                        {
                          color: isFound ? palette.successAccent : palette.textPrimary,
                          textDecorationLine: isFound ? 'line-through' : 'none',
                          backgroundColor: isFound ? palette.successAccent + '20' : palette.cardBackground,
                          borderWidth: 1,
                          borderColor: isFound ? palette.successAccent : palette.textSecondary,
                          borderRadius: 5,
                        }
                      ]}
                    >
                      {isFound ? '✓ ' : ''}{word}
                    </Text>
                  );
                })}
              </View>
              
              {/* Status da seleção atual */}
              {currentSelection.length > 0 && selectedWord && (
                <View style={[styles.selectionStatus, { backgroundColor: palette.cardBackground, borderColor: palette.primary }]}>
                  <Text style={[styles.selectionStatusText, { color: palette.primary }]}>
                    Palavra sendo formada: "{selectedWord}"
                  </Text>
                  <Text style={[styles.selectionStatusHint, { color: palette.textSecondary }]}>
                    {selectedWord.length} letras selecionadas
                  </Text>
                  {wordsToFind.includes(selectedWord.toUpperCase()) && (
                    <Text style={[styles.selectionStatusValidWord, { color: palette.successAccent }]}>
                      ✓ Palavra válida! Continue clicando...
                    </Text>
                  )}
                </View>
              )}
              
              {/* Palavra formada atual */}
              {currentSelection.length > 0 && (
                <View style={[styles.currentWordDisplay, { backgroundColor: palette.primary }]}>
                  <Text style={[styles.currentWordText, { color: palette.background }]}>
                    {selectedWord || 'Selecionando...'}
                  </Text>
                </View>
              )}
              
              {/* Debug info */}
              {__DEV__ && (
                <View style={{ margin: 10, padding: 10, backgroundColor: palette.cardBackground, borderRadius: 5 }}>
                  <Text style={{ color: palette.textPrimary, fontSize: 12 }}>
                    Debug: {currentSelection.length} células selecionadas
                  </Text>
                  <Text style={{ color: palette.textPrimary, fontSize: 12 }}>
                    Palavra atual: "{selectedWord}" ({selectedWord.length} letras)
                  </Text>
                  <Text style={{ color: palette.textPrimary, fontSize: 12 }}>
                    Palavras restantes: {wordsToFind.length - foundWords.length}
                  </Text>
                </View>
              )}
            </View>

            {/* Grid do jogo */}
            <View style={[
              styles.gridContainer, 
              { 
                width: (cellSize * config.gridSize) + (config.gridSize * cellMargin) + 20,
                maxWidth: screenWidth - 20
              }
            ]}>
              {grid.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.gridRow}>
                  {row.map((cell, colIndex) => {
                    const isInCurrentSelection = currentSelection.some(pos => pos.row === rowIndex && pos.col === colIndex);
                    const isCurrentWordValid = selectedWord && wordsToFind.includes(selectedWord.toUpperCase());
                    
                    return (
                      <Pressable
                        key={`${rowIndex}-${colIndex}`}
                        style={[
                          styles.gridCell,
                          {
                            width: cellSize,
                            height: cellSize,
                            backgroundColor: cell.isFound
                              ? palette.successAccent
                              : isInCurrentSelection
                              ? (isCurrentWordValid ? palette.successAccent : palette.primary)
                              : palette.cardBackground,
                            borderColor: isInCurrentSelection 
                              ? (isCurrentWordValid ? palette.successAccent : palette.primary)
                              : palette.textSecondary,
                            borderWidth: isInCurrentSelection ? 2 : 1
                          }
                        ]}
                        onPress={() => handleCellPress(rowIndex, colIndex)}
                      >
                        <Text
                          style={[
                            styles.cellLetter,
                            {
                              color: (cell.isFound || isInCurrentSelection)
                                ? palette.background
                                : palette.textPrimary,
                              fontSize: Math.min(Math.max(cellSize * 0.45, 10), cellSize - 4),
                              fontWeight: isInCurrentSelection ? 'bold' : 'normal'
                            }
                          ]}
                        >
                          {cell.letter}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Progresso */}
            <View style={styles.progressContainer}>
              <Text style={[styles.progressText, { color: palette.textPrimary }]}>
                Encontradas: {foundWords.length} / {wordsToFind.length}
              </Text>
              <View style={[styles.progressBar, { backgroundColor: palette.textSecondary }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: palette.primary,
                      width: `${(foundWords.length / wordsToFind.length) * 100}%`
                    }
                  ]}
                />
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderWinScreen = () => {
    const gameTime = Math.floor((endTime - startTime) / 1000);
    const minutes = Math.floor(gameTime / 60);
    const seconds = gameTime % 60;
    
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={[palette.background || '#1a1a1a', palette.background_darker || palette.background || '#111111']}
          style={styles.container}
        >
          <WinnerAnimation />
          
          <View style={styles.winContainer}>
            <Text style={[styles.winTitle, { color: palette.successAccent }]}>
              Parabéns, {playerName}! 🎉
            </Text>
            
            <Text style={[styles.winSubtitle, { color: palette.textPrimary }]}>
              Você encontrou todas as {foundWords.length} palavras do nível!
            </Text>
            
            <View style={styles.winStats}>
              <Text style={[styles.winStat, { color: palette.primary }]}>
                👤 Jogador: {playerName}
              </Text>
              <Text style={[styles.winStat, { color: palette.textSecondary }]}>
                🎯 Tema: {selectedTheme?.name} {selectedTheme?.emoji}
              </Text>
              <Text style={[styles.winStat, { color: palette.textSecondary }]}>
                ⚡ Dificuldade: {selectedDifficulty && DIFFICULTY_CONFIG[selectedDifficulty].name}
              </Text>
              <Text style={[styles.winStat, { color: palette.textSecondary }]}>
                ⏱️ Tempo: {minutes}:{seconds.toString().padStart(2, '0')}
              </Text>
              <Text style={[styles.winStat, { color: palette.textSecondary }]}>
                📝 Palavras encontradas: {foundWords.length}
              </Text>
              <Text style={[styles.winStat, { color: palette.successAccent }]}>
                🏆 Nível completo!
              </Text>
            </View>
            
            <View style={styles.winButtons}>
              <Pressable
                style={[styles.winButton, { backgroundColor: palette.primary }]}
                onPress={startGame}
              >
                <Text style={[styles.winButtonText, { color: palette.background }]}>
                  Jogar Novamente
                </Text>
              </Pressable>
              
              <Pressable
                style={[styles.winButton, { backgroundColor: palette.cardBackground }]}
                onPress={resetGame}
              >
                <Text style={[styles.winButtonText, { color: palette.textPrimary }]}>
                  Menu Principal
                </Text>
              </Pressable>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  // Renderização principal
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={palette.background_darker} />
      {gameState === 'name' && renderPlayerNameInput()}
      {gameState === 'theme' && renderThemeSelection()}
      {gameState === 'difficulty' && renderDifficultySelection()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'won' && renderWinScreen()}
    </>
  );
}

const createStyles = (palette: any) => StyleSheet.create({
  // Todos os estilos agora usam palette.background em vez de 'transparent' para evitar problemas de renderização
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.primary,
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: FONTS.primary,
    textAlign: 'center',
    marginBottom: 30,
  },
  themeCard: {
    padding: 20,
    marginVertical: 8,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: palette.shadowColor || '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  themeEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  themeName: {
    fontSize: 20,
    fontFamily: FONTS.primary,
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  difficultyCard: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
    minWidth: 100,
    elevation: 3,
    shadowColor: palette.shadowColor || '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  difficultyEmoji: {
    fontSize: 30,
    marginBottom: 10,
  },
  difficultyName: {
    fontSize: 16,
    fontFamily: FONTS.primary,
    marginBottom: 5,
  },
  difficultyInfo: {
    fontSize: 12,
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: FONTS.primary,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  gameInfo: {
    flex: 1,
    alignItems: 'center',
  },
  gameInfoText: {
    fontSize: 14,
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: palette.shadowColor || '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  clearButtonText: {
    fontSize: 18,
    fontFamily: FONTS.primary,
    fontWeight: 'bold',
  },
  gameScrollView: {
    flex: 1,
    backgroundColor: palette.background,
  },
  gameScrollContent: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  wordsContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  wordsTitle: {
    fontSize: 16,
    fontFamily: FONTS.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  wordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  wordItem: {
    fontSize: 14,
    fontFamily: FONTS.primary,
    margin: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  selectionStatus: {
    marginTop: 15,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  selectionStatusText: {
    fontSize: 16,
    fontFamily: FONTS.primary,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  selectionStatusHint: {
    fontSize: 12,
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
  selectionStatusValidWord: {
    fontSize: 14,
    fontFamily: FONTS.primary,
    textAlign: 'center',
    marginTop: 5,
    fontWeight: 'bold',
  },
  currentWordDisplay: {
    marginTop: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  currentWordText: {
    fontSize: 16,
    fontFamily: FONTS.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  gridContainer: {
    alignSelf: 'center',
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridCell: {
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
  },
  cellLetter: {
    fontFamily: FONTS.primary,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 20,
    paddingHorizontal: 40,
    width: '100%',
  },
  progressText: {
    fontSize: 16,
    fontFamily: FONTS.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  winContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  winTitle: {
    fontSize: 32,
    fontFamily: FONTS.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  winSubtitle: {
    fontSize: 18,
    fontFamily: FONTS.primary,
    textAlign: 'center',
    marginBottom: 30,
  },
  winStats: {
    alignItems: 'center',
    marginBottom: 40,
  },
  winStat: {
    fontSize: 16,
    fontFamily: FONTS.primary,
    marginVertical: 2,
  },
  winButtons: {
    gap: 15,
  },
  winButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  winButtonText: {
    fontSize: 16,
    fontFamily: FONTS.primary,
  },
  // Estilos para a tela de entrada do nome
  nameInputContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  nameInput: {
    width: '100%',
    maxWidth: 300,
    height: 50,
    borderWidth: 2,
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 18,
    fontFamily: FONTS.primary,
    textAlign: 'center',
    marginVertical: 20,
  },
  continueButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
    minWidth: 150,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontFamily: FONTS.primary,
    fontWeight: 'bold',
  },
  nameHint: {
    fontSize: 14,
    fontFamily: FONTS.primary,
    marginTop: 10,
    textAlign: 'center',
  },
});
