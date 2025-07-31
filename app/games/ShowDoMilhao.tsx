import { FONTS } from '@/hooks/useFonts';
import { useThemePalette } from '@/hooks/useThemePalette';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as SQLite from 'expo-sqlite';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { QUESTIONS_DATABASE, getRandomQuestion, markQuestionAsUsed, resetAllQuestions, type Question } from '../data/questions';

// ===================================================================
// TIPOS E INTERFACES
// ===================================================================

interface GameStats {
  id?: number;
  playerName: string;
  finalScore: number;
  questionsAnswered: number;
  timeSpent: number;
  highestLevel: number;
  date: string;
}

interface LifeLine {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  used: boolean;
  description: string;
}

// ===================================================================
// CONSTANTES
// ===================================================================

const PRIZE_LEVELS = [
  { level: 1, prize: 1000, safe: false },
  { level: 2, prize: 2000, safe: false },
  { level: 3, prize: 3000, safe: false },
  { level: 4, prize: 5000, safe: false },
  { level: 5, prize: 10000, safe: true }, // Primeira parada segura
  { level: 6, prize: 20000, safe: false },
  { level: 7, prize: 50000, safe: false },
  { level: 8, prize: 100000, safe: false },
  { level: 9, prize: 200000, safe: false },
  { level: 10, prize: 500000, safe: true }, // Segunda parada segura
  { level: 11, prize: 750000, safe: false },
  { level: 12, prize: 1000000, safe: false },
  { level: 13, prize: 2000000, safe: false },
  { level: 14, prize: 5000000, safe: false },
  { level: 15, prize: 10000000, safe: true }, // Prêmio máximo
];

const CATEGORIES = [
  'Todas as Categorias',
  'Conhecimentos Gerais',
  'História',
  'Geografia', 
  'Ciências',
  'Esportes',
  'Matemática',
  'Literatura',
  'Arte',
  'Tecnologia',
  'Música',
  'Cinema',
  'Filosofia'
];

// ===================================================================
// SERVIÇO DE BANCO DE DADOS
// ===================================================================

class DatabaseService {
  private static db: SQLite.SQLiteDatabase | null = null;

  static async init() {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync('millionaire.db');
      await this.createTables();
    }
    return this.db;
  }

  static async createTables() {
    if (!this.db) return;

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS game_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playerName TEXT NOT NULL,
        finalScore INTEGER NOT NULL,
        questionsAnswered INTEGER NOT NULL,
        timeSpent INTEGER NOT NULL,
        highestLevel INTEGER NOT NULL,
        date TEXT NOT NULL
      );
    `);
  }

  static async saveGameStats(stats: GameStats) {
    if (!this.db) await this.init();
    
    await this.db!.runAsync(
      'INSERT INTO game_stats (playerName, finalScore, questionsAnswered, timeSpent, highestLevel, date) VALUES (?, ?, ?, ?, ?, ?)',
      [stats.playerName, stats.finalScore, stats.questionsAnswered, stats.timeSpent, stats.highestLevel, stats.date]
    );
  }

  static async getTopScores(limit: number = 10): Promise<GameStats[]> {
    if (!this.db) await this.init();
    
    const result = await this.db!.getAllAsync(
      'SELECT * FROM game_stats ORDER BY finalScore DESC, highestLevel DESC LIMIT ?',
      [limit]
    );
    
    return result as GameStats[];
  }

  static async getBestScore(): Promise<GameStats | null> {
    if (!this.db) await this.init();
    
    const result = await this.db!.getAllAsync(
      'SELECT * FROM game_stats ORDER BY finalScore DESC, highestLevel DESC LIMIT 1'
    );
    
    return result.length > 0 ? result[0] as GameStats : null;
  }
}

// ===================================================================
// COMPONENTE PRINCIPAL
// ===================================================================

export default function ShowDoMilhao() {
  // Hook da paleta de cores
  const palette = useThemePalette();
  
  // Estados do jogo
  const [gameState, setGameState] = useState<'menu' | 'setup' | 'playing' | 'finished' | 'stats'>('menu');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [playerName, setPlayerName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas as Categorias');
  const [tempPlayerName, setTempPlayerName] = useState('');

  // Lifelines
  const [lifelines, setLifelines] = useState<LifeLine[]>([
    { name: '50:50', icon: 'remove-circle', used: false, description: 'Remove duas opções incorretas' },
    { name: 'Pular', icon: 'play-skip-forward', used: false, description: 'Pula a pergunta atual' },
    { name: 'Dica', icon: 'bulb', used: false, description: 'Mostra uma dica sobre a resposta' },
  ]);

  // Estados visuais
  const [eliminatedAnswers, setEliminatedAnswers] = useState<string[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [topScores, setTopScores] = useState<GameStats[]>([]);
  const [bestScore, setBestScore] = useState<GameStats | null>(null);

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const correctAnswerBlinkAnim = useRef(new Animated.Value(1)).current;

  // Timer
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ===================================================================
  // EFEITOS E INICIALIZAÇÃO
  // ===================================================================

  useEffect(() => {
    DatabaseService.init();
    loadBestScore();
    loadPlayerName(); // Carregar o nome salvo
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      handleTimeUp();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, gameState]);

  // ===================================================================
  // FUNÇÕES AUXILIARES
  // ===================================================================

  const playGameOverSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/game-over.wav')
      );
      await sound.playAsync();
      
      // Limpar o som após tocar
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Erro ao tocar som de game over:', error);
    }
  };

  const playSuccessSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/Sucessed.mp3')
      );
      await sound.playAsync();
      
      // Limpar o som após tocar
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Erro ao tocar som de sucesso:', error);
    }
  };

  const blinkCorrectAnswer = () => {
    Animated.sequence([
      Animated.timing(correctAnswerBlinkAnim, {
        toValue: 0.3,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(correctAnswerBlinkAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(correctAnswerBlinkAnim, {
        toValue: 0.3,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(correctAnswerBlinkAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(correctAnswerBlinkAnim, {
        toValue: 0.3,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(correctAnswerBlinkAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const savePlayerName = async (name: string) => {
    try {
      await AsyncStorage.setItem('@millionaire_player_name', name);
    } catch (error) {
      console.log('Erro ao salvar nome do jogador:', error);
    }
  };

  const loadPlayerName = async () => {
    try {
      const savedName = await AsyncStorage.getItem('@millionaire_player_name');
      if (savedName) {
        setPlayerName(savedName);
        setTempPlayerName(savedName);
      }
    } catch (error) {
      console.log('Erro ao carregar nome do jogador:', error);
    }
  };

  const loadBestScore = async () => {
    try {
      const best = await DatabaseService.getBestScore();
      setBestScore(best);
    } catch (error) {
      console.error('Erro ao carregar melhor pontuação:', error);
    }
  };

  const formatPrize = (prize: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(prize);
  };

  const getFilteredQuestion = (difficulty: 'easy' | 'medium' | 'hard'): Question | null => {
    if (selectedCategory === 'Todas as Categorias') {
      return getRandomQuestion(difficulty);
    }
    
    // Filtrar por categoria específica
    const categoryQuestions = QUESTIONS_DATABASE.filter(q => 
      q.difficulty === difficulty && 
      q.category === selectedCategory && 
      !q.used
    );
    
    if (categoryQuestions.length === 0) {
      // Se não há perguntas na categoria, usar qualquer categoria
      return getRandomQuestion(difficulty);
    }
    
    const randomIndex = Math.floor(Math.random() * categoryQuestions.length);
    return categoryQuestions[randomIndex];
  };

  // ===================================================================
  // FUNÇÕES DO JOGO
  // ===================================================================

  const startGame = () => {
    if (!playerName.trim()) {
      Alert.alert('Atenção', 'Por favor, configure seu nome primeiro!');
      setGameState('setup');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setGameState('playing');
      setCurrentLevel(1);
      setGameStartTime(Date.now());
      
      // Resetar todas as perguntas para uso
      resetAllQuestions();
      
      // Carregar primeira pergunta
      loadNextQuestion(1);
      
      // Resetar lifelines
      setLifelines(prev => prev.map(ll => ({ ...ll, used: false })));
      setEliminatedAnswers([]);
      
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível iniciar o jogo.');
    }
  };

  const loadNextQuestion = (level: number) => {
    const difficulty = level <= 5 ? 'easy' : level <= 10 ? 'medium' : 'hard';
    
    const randomQuestion = getFilteredQuestion(difficulty);
    
    if (!randomQuestion) {
      Alert.alert('Erro', 'Não há mais perguntas disponíveis!');
      return;
    }

    markQuestionAsUsed(randomQuestion);
    setCurrentQuestion(randomQuestion);
    
    // Embaralhar respostas apenas uma vez quando a pergunta carrega
    const allAnswers = [
      randomQuestion.correct_answer,
      ...randomQuestion.incorrect_answers
    ].sort(() => Math.random() - 0.5);
    setShuffledAnswers(allAnswers);
    
    setSelectedAnswer(null);
    setTimeLeft(30);
    setEliminatedAnswers([]);
    setIsAnswering(false);
    
    // Resetar animação de piscar
    correctAnswerBlinkAnim.setValue(1);
    
    // Animação de entrada
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const handleAnswer = async (answer: string) => {
    if (isAnswering || !currentQuestion) return;

    setIsAnswering(true);
    setSelectedAnswer(answer);
    
    // Para o timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Feedback tátil
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Aguarda 2 segundos para mostrar o resultado
    setTimeout(() => {
      if (answer === currentQuestion.correct_answer) {
        handleCorrectAnswer();
      } else {
        handleIncorrectAnswer();
      }
    }, 2000);
  };

  const handleCorrectAnswer = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Tocar som de sucesso
    await playSuccessSound();
    
    if (currentLevel === 15) {
      // Jogador ganhou o jogo completo!
      endGame(true);
    } else {
      // Próxima pergunta
      setTimeout(() => {
        setCurrentLevel(prev => prev + 1);
        loadNextQuestion(currentLevel + 1);
      }, 1000);
    }
  };

  const handleIncorrectAnswer = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    
    // Tocar som de game over
    await playGameOverSound();
    
    // Fazer a resposta correta piscar
    blinkCorrectAnswer();
    
    // Aguardar um pouco para mostrar a resposta correta piscando antes de terminar o jogo
    setTimeout(() => {
      endGame(false);
    }, 2000);
  };

  const handleTimeUp = () => {
    if (gameState === 'playing') {
      Alert.alert('Tempo Esgotado!', 'O tempo acabou!', [
        { text: 'OK', onPress: () => endGame(false) }
      ]);
    }
  };

  const endGame = async (won: boolean) => {
    const timeSpent = Math.floor((Date.now() - gameStartTime) / 1000);
    let finalScore = 0;
    
    if (won) {
      // Se ganhou, recebe o prêmio do nível atual
      const currentPrize = PRIZE_LEVELS.find(p => p.level === currentLevel)?.prize || 0;
      finalScore = currentPrize;
    } else {
      // Se perdeu, recebe o último prêmio seguro antes do nível atual
      const safeLevel = PRIZE_LEVELS
        .filter(p => p.safe && p.level < currentLevel)
        .sort((a, b) => b.level - a.level)[0];
      finalScore = safeLevel?.prize || 0;
    }
    
    // Salvar estatísticas
    const stats: GameStats = {
      playerName,
      finalScore,
      questionsAnswered: currentLevel - 1,
      timeSpent,
      highestLevel: currentLevel,
      date: new Date().toISOString(),
    };

    try {
      await DatabaseService.saveGameStats(stats);
      await loadBestScore();
    } catch (error) {
      console.error('Erro ao salvar estatísticas:', error);
    }

    setGameState('finished');
    
    const message = won 
      ? `🎉 Parabéns! Você ganhou ${formatPrize(finalScore)}!`
      : `😔 Que pena! Sua pontuação final: ${formatPrize(finalScore)}`;
    
    Alert.alert(won ? 'Vitória!' : 'Fim de Jogo', message);
  };

  // ===================================================================
  // LIFELINES
  // ===================================================================

  const use5050 = () => {
    if (!currentQuestion || lifelines[0].used) return;

    const incorrectAnswers = shuffledAnswers.filter(answer => 
      answer !== currentQuestion.correct_answer
    );
    
    // Remove 2 respostas incorretas aleatoriamente
    const toEliminate = incorrectAnswers.sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminatedAnswers(toEliminate);
    
    // Marca lifeline como usada
    setLifelines(prev => prev.map((ll, index) => 
      index === 0 ? { ...ll, used: true } : ll
    ));

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const useSkip = () => {
    if (lifelines[1].used) return;

    setLifelines(prev => prev.map((ll, index) => 
      index === 1 ? { ...ll, used: true } : ll
    ));

    loadNextQuestion(currentLevel);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const useHint = () => {
    if (!currentQuestion || lifelines[2].used) return;

    setLifelines(prev => prev.map((ll, index) => 
      index === 2 ? { ...ll, used: true } : ll
    ));

    Alert.alert(
      '💡 Dica',
      `A resposta correta é: ${currentQuestion.correct_answer}`,
      [{ text: 'OK' }]
    );

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // ===================================================================
  // FUNÇÕES DE INTERFACE
  // ===================================================================

  const showTopScores = async () => {
    try {
      const scores = await DatabaseService.getTopScores();
      setTopScores(scores);
      setShowStats(true);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as estatísticas.');
    }
  };

  const startSetup = () => {
    setTempPlayerName(playerName);
    setGameState('setup');
  };

  const confirmSetup = async () => {
    if (!tempPlayerName.trim()) {
      Alert.alert('Atenção', 'Por favor, digite seu nome!');
      return;
    }
    setPlayerName(tempPlayerName);
    await savePlayerName(tempPlayerName); // Salvar o nome
    setGameState('menu');
  };

  // ===================================================================
  // COMPONENTES DE RENDERIZAÇÃO
  // ===================================================================

  const renderMenu = () => (
    <LinearGradient colors={[palette.background, palette.background_darker]} style={styles.container}>
      <View style={styles.menuContainer}>
        <Text style={[styles.gameTitle, { color: palette.primary }]}>🏆 Show do Milhão</Text>
        
        {bestScore && (
          <View style={[styles.recordContainer, { backgroundColor: palette.cardBackground, borderColor: palette.primary }]}>
            <Text style={[styles.recordTitle, { color: palette.primary }]}>🥇 RECORDE ATUAL</Text>
            <Text style={[styles.recordPlayer, { color: palette.textPrimary }]}>{bestScore.playerName}</Text>
            <Text style={[styles.recordScore, { color: palette.primary }]}>{formatPrize(bestScore.finalScore)}</Text>
          </View>
        )}

        <View style={styles.menuButtons}>
          <TouchableOpacity style={[styles.menuButton, { backgroundColor: palette.cardBackground, borderColor: palette.primary }]} onPress={startSetup}>
            <Ionicons name="settings" size={24} color={palette.primary} />
            <Text style={[styles.menuButtonText, { color: palette.textPrimary }]}>
              {playerName ? 'Alterar Configurações' : 'Configurar Jogo'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuButton, styles.playButton, { backgroundColor: palette.primary }]} 
            onPress={startGame}
          >
            <Ionicons name="play" size={24} color={palette.background} />
            <Text style={[styles.menuButtonText, styles.playButtonText, { color: palette.background }]}>
              {playerName ? `Jogar como ${playerName}` : 'Configure seu nome primeiro'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuButton, { backgroundColor: palette.cardBackground, borderColor: palette.primary }]} onPress={showTopScores}>
            <Ionicons name="trophy" size={24} color={palette.primary} />
            <Text style={[styles.menuButtonText, { color: palette.textPrimary }]}>Recordes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );

  const renderSetup = () => (
    <LinearGradient colors={[palette.background, palette.background_darker]} style={styles.container}>
      <View style={styles.setupContainer}>
        <Text style={[styles.setupTitle, { color: palette.primary }]}>⚙️ Configuração do Jogo</Text>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: palette.textPrimary }]}>Nome do Jogador:</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: palette.cardBackground, color: palette.textPrimary, borderColor: palette.primary }]}
            value={tempPlayerName}
            onChangeText={setTempPlayerName}
            placeholder="Digite seu nome"
            placeholderTextColor={palette.textSecondary}
            maxLength={20}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: palette.textPrimary }]}>Categoria das Perguntas:</Text>
          <ScrollView style={styles.categoryScrollView} showsVerticalScrollIndicator={false}>
            {CATEGORIES.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryButton,
                  { backgroundColor: palette.cardBackground },
                  selectedCategory === category && { backgroundColor: palette.primary, borderColor: palette.primary }
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  { color: palette.textPrimary },
                  selectedCategory === category && { color: palette.background, fontWeight: 'bold' }
                ]}>
                  {category}
                </Text>
                {selectedCategory === category && (
                  <Ionicons name="checkmark" size={20} color={palette.background} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.setupButtons}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: palette.cardBackground, borderColor: palette.textSecondary }]} onPress={() => setGameState('menu')}>
            <Text style={[styles.backButtonText, { color: palette.textPrimary }]}>Voltar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.confirmButton, { backgroundColor: palette.primary }]} onPress={confirmSetup}>
            <Text style={[styles.confirmButtonText, { color: palette.background }]}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );

  const renderQuestion = () => {
    if (!currentQuestion || shuffledAnswers.length === 0) return null;

    return (
      <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}>
        <View style={styles.questionHeader}>
          <Text style={[styles.questionLevel, { color: palette.primary }]}>Pergunta {currentLevel}</Text>
          <View style={styles.timerContainer}>
            <Ionicons name="time" size={20} color={palette.primary} />
            <Text style={[styles.timerText, { color: palette.textPrimary }, timeLeft <= 10 && { color: palette.warningAccent }]}>
              {timeLeft}s
            </Text>
          </View>
        </View>
        
        <Text style={[styles.questionText, { color: palette.textPrimary }]}>{currentQuestion.question}</Text>
        
        <View style={styles.answersContainer}>
          {shuffledAnswers.map((answer: string, index: number) => {
            const isSelected = selectedAnswer === answer;
            const isCorrect = answer === currentQuestion.correct_answer;
            const isEliminated = eliminatedAnswers.includes(answer);
            const isIncorrect = selectedAnswer && !isCorrect && isSelected;
            const shouldBlink = isCorrect && selectedAnswer && selectedAnswer !== answer;
            
            return (
              <Animated.View
                key={index}
                style={[
                  { opacity: shouldBlink ? correctAnswerBlinkAnim : 1 }
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.answerButton,
                    { backgroundColor: palette.cardBackground },
                    isSelected && { borderColor: palette.primary, backgroundColor: palette.cardBackground },
                    isSelected && isCorrect && { backgroundColor: palette.successAccent, borderColor: palette.successAccent },
                    isIncorrect && { backgroundColor: palette.warningAccent, borderColor: palette.warningAccent },
                    isEliminated && { opacity: 0.3, backgroundColor: palette.background_darker },
                    shouldBlink && { backgroundColor: palette.successAccent, borderColor: palette.successAccent },
                  ]}
                  onPress={() => handleAnswer(answer)}
                  disabled={isAnswering || isEliminated}
                >
                  <Text style={[
                    styles.answerText,
                    { color: palette.textPrimary },
                    isEliminated && { textDecorationLine: 'line-through' },
                    (isSelected && isCorrect || shouldBlink) && { color: palette.background, fontWeight: 'bold' },
                  ]}>
                    {String.fromCharCode(65 + index)}) {answer}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>
    );
  };

  const renderPrizeList = () => (
    <View style={styles.prizeListContainer}>
      <Text style={styles.prizeListTitle}>Prêmios</Text>
      <ScrollView style={styles.prizeList} showsVerticalScrollIndicator={false}>
        {PRIZE_LEVELS.slice().reverse().map((level) => (
          <View
            key={level.level}
            style={[
              styles.prizeItem,
              currentLevel === level.level && [styles.currentPrizeItem, { backgroundColor: palette.primary }],
              level.safe && [styles.safePrizeItem, { borderLeftColor: palette.successAccent }],
            ]}
          >
            <Text style={[
              styles.prizeLevel,
              currentLevel === level.level && [styles.currentPrizeLevel, { color: palette.background }]
            ]}>
              {level.level}
            </Text>
            <Text style={[
              styles.prizeAmount,
              currentLevel === level.level && [styles.currentPrizeAmount, { color: palette.background }]
            ]}>
              {formatPrize(level.prize)}
            </Text>
            {level.safe && (
              <Ionicons 
                name="shield-checkmark" 
                size={16} 
                color={palette.primary} 
                style={styles.safeIcon}
              />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderLifelines = () => (
    <View style={styles.lifelinesContainer}>
      {lifelines.map((lifeline, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.lifelineButton, lifeline.used && styles.usedLifeline]}
          onPress={() => {
            if (index === 0) use5050();
            else if (index === 1) useSkip();
            else if (index === 2) useHint();
          }}
          disabled={lifeline.used || isAnswering}
        >
          <Ionicons
            name={lifeline.icon}
            size={24}
            color={lifeline.used ? palette.textSecondary : palette.primary}
          />
          <Text style={[
            styles.lifelineText,
            { color: lifeline.used ? palette.textSecondary : palette.primary }
          ]}>
            {lifeline.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderGame = () => (
    <LinearGradient colors={[palette.background, palette.background_darker]} style={styles.container}>
      <View style={styles.gameContainer}>
        <View style={styles.gameHeader}>
          <TouchableOpacity
            style={styles.quitButton}
            onPress={() => {
              Alert.alert(
                'Sair do Jogo',
                'Tem certeza que deseja sair? Seu progresso será perdido.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Sair', onPress: () => setGameState('menu') }
                ]
              );
            }}
          >
            <Ionicons name="close" size={24} color={palette.primary} />
          </TouchableOpacity>
          
          <Text style={[styles.playerName, { color: palette.textPrimary }]}>{playerName}</Text>
          
          <Text style={[styles.currentPrize, { color: palette.primary }]}>
            {formatPrize(PRIZE_LEVELS.find(p => p.level === currentLevel)?.prize || 0)}
          </Text>
        </View>

        {renderLifelines()}
        {renderQuestion()}
        {renderPrizeList()}
      </View>
    </LinearGradient>
  );

  const renderFinished = () => {
    const timeSpent = Math.floor((Date.now() - gameStartTime) / 1000);
    let finalScore = 0;
    
    // Calcular pontuação final baseada na lógica correta
    const safeLevel = PRIZE_LEVELS
      .filter(p => p.safe && p.level < currentLevel)
      .sort((a, b) => b.level - a.level)[0];
    finalScore = safeLevel?.prize || 0;
    
    return (
      <LinearGradient colors={[palette.background, palette.background_darker]} style={styles.container}>
        <View style={styles.finishedContainer}>
          <Text style={[styles.finishedTitle, { color: palette.primary }]}>🎯 Jogo Finalizado!</Text>
          <Text style={[styles.finishedPlayer, { color: palette.textPrimary }]}>{playerName}</Text>
          <Text style={[styles.finishedScore, { color: palette.primary }]}>{formatPrize(finalScore)}</Text>
          <Text style={[styles.finishedLevel, { color: palette.textPrimary }]}>Chegou até o Nível {currentLevel}</Text>
          
          <View style={styles.finishedButtons}>
            <TouchableOpacity style={[styles.playAgainButton, { backgroundColor: palette.primary }]} onPress={() => setGameState('menu')}>
              <Text style={[styles.playAgainButtonText, { color: palette.background }]}>Jogar Novamente</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.viewStatsButton, { backgroundColor: palette.cardBackground, borderColor: palette.primary }]} onPress={showTopScores}>
              <Text style={[styles.viewStatsButtonText, { color: palette.textPrimary }]}>Ver Recordes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  };

  const renderStats = () => (
    <Modal
      visible={showStats}
      transparent
      animationType="slide"
      onRequestClose={() => setShowStats(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.statsModal, { backgroundColor: palette.background, borderColor: palette.primary }]}>
          <View style={styles.statsHeader}>
            <Text style={[styles.statsTitle, { color: palette.primary }]}>🏆 Top 10 Recordes</Text>
            <TouchableOpacity onPress={() => setShowStats(false)}>
              <Ionicons name="close" size={24} color={palette.primary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.statsList}>
            {topScores.length === 0 ? (
              <Text style={[styles.noStatsText, { color: palette.textPrimary }]}>Nenhum recorde ainda!</Text>
            ) : (
              topScores.map((score, index) => (
                <View key={score.id || index} style={[styles.statsItem, { backgroundColor: palette.cardBackground }]}>
                  <View style={styles.statsRank}>
                    <Text style={[styles.statsRankText, { color: palette.primary }]}>{index + 1}º</Text>
                  </View>
                  <View style={styles.statsInfo}>
                    <Text style={[styles.statsPlayerName, { color: palette.textPrimary }]}>{score.playerName}</Text>
                    <Text style={[styles.statsScore, { color: palette.primary }]}>{formatPrize(score.finalScore)}</Text>
                    <Text style={[styles.statsLevel, { color: palette.textSecondary }]}>Nível {score.highestLevel}</Text>
                  </View>
                  <Text style={[styles.statsDate, { color: palette.textSecondary }]}>
                    {new Date(score.date).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ===================================================================
  // ESTILOS DINÂMICOS
  // ===================================================================

  const createStyles = () => {
    const { width, height } = Dimensions.get('window');
    
    return StyleSheet.create({
    container: {
      flex: 1,
    },
    
    // Menu Styles
    menuContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    gameTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 40,
      fontFamily: FONTS.gaming,
    },
    recordContainer: {
      padding: 20,
      borderRadius: 15,
      marginBottom: 30,
      alignItems: 'center',
      borderWidth: 2,
    },
    recordTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    recordPlayer: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    recordScore: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    menuButtons: {
      width: '100%',
      maxWidth: 300,
    },
    menuButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 15,
      borderRadius: 10,
      marginVertical: 10,
      borderWidth: 1,
    },
    menuButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 10,
    },
    playButton: {
      // Será sobrescritto pelos estilos inline
    },
    playButtonText: {
      // Será sobrescritto pelos estilos inline
    },

    // Setup Styles
    setupContainer: {
      flex: 1,
      padding: 20,
      justifyContent: 'center',
    },
    setupTitle: {
      fontSize: 24,
      textAlign: 'center',
      marginBottom: 30,
      fontWeight: 'bold',
    },
    inputGroup: {
      marginBottom: 25,
    },
    inputLabel: {
      fontSize: 16,
      marginBottom: 10,
      fontWeight: 'bold',
    },
    textInput: {
      padding: 15,
      borderRadius: 10,
      fontSize: 16,
      borderWidth: 1,
    },
    categoryScrollView: {
      maxHeight: 200,
    },
    categoryButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginVertical: 2,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    categoryButtonText: {
      fontSize: 14,
    },
    setupButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 30,
    },
    backButton: {
      flex: 1,
      padding: 15,
      borderRadius: 10,
      marginRight: 10,
      borderWidth: 1,
    },
    backButtonText: {
      textAlign: 'center',
      fontSize: 16,
      fontWeight: 'bold',
    },
    confirmButton: {
      flex: 1,
      padding: 15,
      borderRadius: 10,
      marginLeft: 10,
    },
    confirmButtonText: {
      textAlign: 'center',
      fontSize: 16,
      fontWeight: 'bold',
    },

    // Game Styles
    gameContainer: {
      flex: 1,
      padding: 10,
    },
    gameHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    quitButton: {
      padding: 10,
    },
    playerName: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    currentPrize: {
      fontSize: 18,
      fontWeight: 'bold',
    },

    // Lifelines
    lifelinesContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 20,
    },
    lifelineButton: {
      alignItems: 'center',
      padding: 10,
      borderRadius: 8,
      backgroundColor: palette.cardBackground,
      minWidth: 80,
    },
    usedLifeline: {
      opacity: 0.5,
    },
    lifelineText: {
      fontSize: 12,
      marginTop: 5,
      fontWeight: 'bold',
    },

    // Question Styles
    questionContainer: {
      flex: 1,
      marginBottom: 20,
    },
    questionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    questionLevel: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    timerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    timerText: {
      fontSize: 16,
      marginLeft: 5,
      fontWeight: 'bold',
    },
    questionText: {
      fontSize: 18,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 24,
      fontWeight: '500',
    },
    answersContainer: {
      flex: 1,
    },
    answerButton: {
      padding: 15,
      marginVertical: 5,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    answerText: {
      fontSize: 16,
      fontWeight: '500',
    },

    // Prize List
    prizeListContainer: {
      width: '100%',
      maxHeight: 200,
    },
    prizeListTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 10,
      color: palette.primary,
    },
    prizeList: {
      maxHeight: 180,
    },
    prizeItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 8,
      marginVertical: 1,
      backgroundColor: palette.cardBackground,
      borderRadius: 5,
    },
    currentPrizeItem: {
      backgroundColor: palette.primary,
    },
    safePrizeItem: {
      borderLeftWidth: 3,
      borderLeftColor: palette.successAccent,
    },
    prizeLevel: {
      color: palette.textPrimary,
      fontSize: 14,
      fontWeight: 'bold',
      minWidth: 30,
    },
    currentPrizeLevel: {
      color: palette.background,
    },
    prizeAmount: {
      color: palette.textPrimary,
      fontSize: 14,
      fontWeight: 'bold',
      flex: 1,
      textAlign: 'right',
    },
    currentPrizeAmount: {
      color: palette.background,
    },
    safeIcon: {
      marginLeft: 5,
    },

    // Finished Screen
    finishedContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    finishedTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
    },
    finishedPlayer: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    finishedScore: {
      fontSize: 32,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    finishedLevel: {
      fontSize: 16,
      marginBottom: 30,
    },
    finishedButtons: {
      width: '100%',
      maxWidth: 300,
    },
    playAgainButton: {
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
    },
    playAgainButtonText: {
      textAlign: 'center',
      fontSize: 16,
      fontWeight: 'bold',
    },
    viewStatsButton: {
      padding: 15,
      borderRadius: 10,
      borderWidth: 1,
    },
    viewStatsButtonText: {
      textAlign: 'center',
      fontSize: 16,
      fontWeight: 'bold',
    },

    // Stats Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    statsModal: {
      borderRadius: 15,
      padding: 20,
      width: width * 0.9,
      maxHeight: height * 0.8,
      borderWidth: 2,
    },
    statsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    statsTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    statsList: {
      maxHeight: height * 0.6,
    },
    noStatsText: {
      fontSize: 16,
      textAlign: 'center',
      marginTop: 20,
    },
    statsItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
    },
    statsRank: {
      width: 40,
      alignItems: 'center',
    },
    statsRankText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    statsInfo: {
      flex: 1,
      marginLeft: 15,
    },
    statsPlayerName: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    statsScore: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    statsLevel: {
      fontSize: 12,
    },
    statsDate: {
      fontSize: 12,
    },
  });
};

  const styles = createStyles();

  // ===================================================================
  // RENDER PRINCIPAL
  // ===================================================================

  return (
    <View style={{ flex: 1 }}>
      {gameState === 'menu' && renderMenu()}
      {gameState === 'setup' && renderSetup()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'finished' && renderFinished()}
      {renderStats()}
    </View>
  );
}