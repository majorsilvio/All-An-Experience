import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Button,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    Dimensions,
} from "react-native";
import { 
  GestureHandlerRootView, 
  PinchGestureHandler, 
  PanGestureHandler,
  State 
} from 'react-native-gesture-handler';
import { FONTS } from '../../hooks/useFonts';
import { useThemePalette } from '../../hooks/useThemePalette';
import HangmanDrawing from "../components/HangmanDrawing";
import Keyboard from "../components/Keyboard";
import WordDisplay from "../components/WordDisplay";
import { words } from "../data/words";
import { Letter } from "../types";

type WordItem = {
  word: string;
  hint: string;
};

export default function App() {
  const palette = useThemePalette();
  const [playerName, setPlayerName] = useState<string>("");
  const [nameConfirmed, setNameConfirmed] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<'normal' | 'survival'>('normal');
  const [modeSelected, setModeSelected] = useState<boolean>(false);
  const [currentWord, setCurrentWord] = useState<WordItem>({ word: "", hint: "" });
  const [guessedLetters, setGuessedLetters] = useState<Letter[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState<number>(0);
  const [time, setTime] = useState<number>(0);
  const [maxTime, setMaxTime] = useState<number>(60);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [wordsCompleted, setWordsCompleted] = useState<number>(0);
  const [totalTimeBonus, setTotalTimeBonus] = useState<number>(0);
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const [allWordsCompleted, setAllWordsCompleted] = useState<boolean>(false);
  const maxGuesses = 6;

  // Animated value para a barra de progresso
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Estados para zoom e pan
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  
  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);

  const pinchRef = useRef(null);
  const panRef = useRef(null);

  // Proteção contra paleta não inicializada
  if (!palette) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A1A'}}>
        <Text style={{color: '#BFFF00', fontSize: 16}}>Carregando...</Text>
      </View>
    );
  }

  // Criar estilos dinâmicos
  const styles = createStyles(palette);

  useEffect(() => {
    if (nameConfirmed && modeSelected) {
      startNewGame();
    }
  }, [nameConfirmed, modeSelected]);

  useEffect(() => {
    if (!nameConfirmed || !modeSelected || gameOver) return;

    if (time >= maxTime) {
      setGameOver(true);
      // Não mostrar alert aqui, vamos mostrar uma tela personalizada
      return;
    }

    const timer = setInterval(() => setTime((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [time, nameConfirmed, modeSelected, gameOver]);

  // Atualiza a animação da barra sempre que o tempo muda
  useEffect(() => {
    const progress = time / maxTime;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [time, maxTime]);

  const startNewGame = () => {
    // Reset zoom primeiro
    resetTransform();
    
    let randomWord: WordItem;
    
    if (gameMode === 'survival') {
      // No modo sobrevivência, verificar se ainda há palavras disponíveis
      const availableWords = words.filter(word => !usedWords.includes(word.word));
      
      if (availableWords.length === 0) {
        // Todas as palavras foram completadas!
        setAllWordsCompleted(true);
        return;
      }
      
      randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
      // Adicionar a palavra à lista de palavras usadas
      setUsedWords(prev => [...prev, randomWord.word]);
    } else {
      // Modo normal: palavra aleatória qualquer
      randomWord = words[Math.floor(Math.random() * words.length)];
    }
    
    setCurrentWord(randomWord);
    setGuessedLetters([]);
    setWrongGuesses(0);
    
    if (gameMode === 'normal') {
      setTime(0);
      setMaxTime(getTimeForWord(randomWord.word));
      setWordsCompleted(0);
      setTotalTimeBonus(0);
    } else {
      // Modo sobrevivência: apenas no início do jogo resetar completamente
      if (wordsCompleted === 0 && time === 0) {
        // Primeira vez jogando modo sobrevivência
        setTime(0);
        setMaxTime(7);
        setTotalTimeBonus(0);
      }
      // Para palavras subsequentes, manter o tempo atual e maxTime com bônus
    }
    
    setGameOver(false);
  };

  const resetGame = () => {
    // Reset zoom e transformações primeiro
    resetTransform();
    
    setNameConfirmed(false);
    setModeSelected(false);
    setGameMode('normal');
    setWordsCompleted(0);
    setTotalTimeBonus(0);
    setTime(0);
    setMaxTime(60);
    setGameOver(false);
    setGuessedLetters([]);
    setWrongGuesses(0);
    setCurrentWord({ word: "", hint: "" });
    setUsedWords([]);
    setAllWordsCompleted(false);
  };

  const getTimeForWord = (word: string) => {
    const length = word.length;
    if (length <= 4) return 30;
    if (length <= 7) return 60;
    return 90;
  };

  const handleGuess = (letter: Letter) => {
    if (guessedLetters.includes(letter) || gameOver) return;
    setGuessedLetters((prev) => [...prev, letter]);

    if (!currentWord.word.includes(letter)) {
      const newWrongGuesses = wrongGuesses + 1;
      setWrongGuesses(newWrongGuesses);
      if (newWrongGuesses >= maxGuesses) {
        setGameOver(true);
        // Não mostrar alert aqui, vamos mostrar uma tela personalizada
      }
    } else {
      // Letra correta! No modo sobrevivência, adicionar tempo bônus
      if (gameMode === 'survival') {
        const timeBonus = Math.ceil(currentWord.word.length / 2); // Bônus baseado no tamanho da palavra
        setMaxTime((prev) => prev + timeBonus);
        setTotalTimeBonus((prev) => prev + timeBonus);
      }
      
      const allGuessed = currentWord.word
        .split("")
        .every((l) => guessedLetters.includes(l) || l === letter);
      
      if (allGuessed) {
        if (gameMode === 'survival') {
          // Modo sobrevivência: continuar para próxima palavra
          const newWordsCompleted = wordsCompleted + 1;
          setWordsCompleted(newWordsCompleted);
          
          // Bônus extra por completar a palavra
          const completionBonus = 5;
          const letterBonus = Math.ceil(currentWord.word.length / 2);
          const totalWordBonus = letterBonus + completionBonus;
          
          setMaxTime((prev) => prev + completionBonus);
          setTotalTimeBonus((prev) => prev + completionBonus);
          
          Alert.alert(
            "Palavra completa!",
            `+${totalWordBonus}s de bônus! Palavras: ${newWordsCompleted}`,
            [{ text: "Próxima palavra", onPress: startNewGame }]
          );
        } else {
          // Modo normal: fim do jogo
          setGameOver(true);
          Alert.alert(
            "Parabéns!",
            `${playerName}, você venceu em ${time} segundo${time !== 1 ? "s" : ""}!`,
            [{ text: "Jogar novamente", onPress: () => resetGame() }]
          );
        }
      }
    }
  };

  // Handlers para zoom
  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: scale } }],
    { useNativeDriver: false }
  );

  const onPinchStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      lastScale.current *= event.nativeEvent.scale;
      lastScale.current = Math.min(Math.max(lastScale.current, 0.5), 3);
      scale.setValue(lastScale.current);
    }
  };

  // Handlers para pan (arrastar)
  const onPanGestureEvent = Animated.event(
    [{ 
      nativeEvent: { 
        translationX: translateX,
        translationY: translateY 
      } 
    }],
    { useNativeDriver: false }
  );

  const onPanStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      lastTranslateX.current += event.nativeEvent.translationX;
      lastTranslateY.current += event.nativeEvent.translationY;
      
      translateX.setValue(lastTranslateX.current);
      translateY.setValue(lastTranslateY.current);
    }
  };

  // Função para resetar zoom e posição
  const resetTransform = () => {
    lastScale.current = 1;
    lastTranslateX.current = 0;
    lastTranslateY.current = 0;
    
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 300, useNativeDriver: false }),
      Animated.timing(translateX, { toValue: 0, duration: 300, useNativeDriver: false }),
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: false })
    ]).start();
  };

  // Largura total da barra
  const progressBarWidth = 300;

  // Cor da barra: vermelho se <= 10 segundos restantes, senão verde-limão
  const timeRemaining = maxTime - time;
  const progressBarColor = timeRemaining <= 10 ? palette.warningAccent : palette.primary;

  // Barra aumenta com o tempo (de 0 até largura total)
  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, progressBarWidth],
  });

  if (!nameConfirmed) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: palette.background }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <SafeAreaView style={styles.container}>
              <Text style={styles.title}>Jogo da Forca</Text>
              <Text style={styles.subtitle}>Digite seu nome para começar:</Text>
              <TextInput
                style={styles.input}
                placeholder="Seu nome"
                placeholderTextColor={palette.textSecondary}
                value={playerName}
                onChangeText={setPlayerName}
              />
              <Button
                title="Começar jogo"
                onPress={() => {
                  if (playerName.trim()) {
                    setNameConfirmed(true);
                  } else {
                    Alert.alert("Atenção", "Por favor, digite seu nome.");
                  }
                }}
                color={palette.primary}
              />
            </SafeAreaView>
          </ScrollView>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    );
  }

  if (!modeSelected) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: palette.background }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <SafeAreaView style={styles.container}>
              <Text style={styles.title}>Escolha o Modo</Text>
              <Text style={styles.subtitle}>Olá, {playerName}! 👋</Text>
            
            <View style={styles.modeContainer}>
              <View style={styles.modeCard}>
                <Text style={styles.modeTitle}>🎯 Modo Normal</Text>
                <Text style={styles.modeDescription}>
                  Complete uma palavra dentro do tempo limite.
                  Tempo baseado no tamanho da palavra.
                </Text>
                <Button
                  title="Jogar Normal"
                  onPress={() => {
                    setGameMode('normal');
                    setModeSelected(true);
                  }}
                  color={palette.primary}
                />
              </View>

              <View style={styles.modeCard}>
                <Text style={styles.modeTitle}>⚡ Modo Sobrevivência</Text>
                <Text style={styles.modeDescription}>
                  Complete quantas palavras conseguir!
                  Ganhe tempo extra a cada letra acertada.
                </Text>
                <Text style={styles.modeBonusInfo}>
                  💡 Bônus: +tempo por letra correta + bônus de conclusão
                </Text>
                <Text style={styles.modeBonusInfo}>
                  🎯 Desafio: {words.length} palavras únicas para completar!
                </Text>
                <Button
                  title="Sobreviver"
                  onPress={() => {
                    setGameMode('survival');
                    setModeSelected(true);
                  }}
                  color={palette.neonAccent}
                />
              </View>
            </View>
            
            <Button
              title="← Alterar Nome"
              onPress={() => {
                setNameConfirmed(false);
                setPlayerName('');
              }}
              color={palette.textSecondary}
            />
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
      </GestureHandlerRootView>
    );
  }

  // Tela de parabéns por completar todas as palavras
  if (allWordsCompleted) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: palette.background }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <SafeAreaView style={styles.container}>
              <Text style={[styles.title, { color: palette.primary, fontSize: 28 }]}>
                🏆 PARABÉNS! 🏆
              </Text>
              
              <View style={styles.victoryContainer}>
                <Text style={styles.victoryTitle}>
                  {playerName}, você é um MESTRE das palavras!
                </Text>
                
                <Text style={styles.victoryStats}>
                  ✨ Conquista Épica Desbloqueada! ✨
                </Text>
                
                <Text style={styles.victoryDescription}>
                  Você completou TODAS as {words.length} palavras do modo sobrevivência!
                </Text>
                
                <Text style={styles.victoryDescription}>
                  📊 Estatísticas Finais:
                </Text>
                
                <View style={styles.statsContainer}>
                  <Text style={styles.statItem}>🎯 Palavras Completadas: {words.length}</Text>
                  <Text style={styles.statItem}>⚡ Tempo Total Bônus: {totalTimeBonus}s</Text>
                  <Text style={styles.statItem}>🏃‍♂️ Tempo Final: {time}s</Text>
                </View>
                
                <Text style={styles.victoryMessage}>
                  Você provou ser um verdadeiro campeão da forca!
                  Poucos jogadores conseguem essa façanha. 🎉
                </Text>
              </View>
              
              <View style={styles.victoryButtons}>
                <Button
                  title="🎮 Jogar Novamente"
                  onPress={resetGame}
                  color={palette.primary}
                />
                <Button
                  title="🏠 Menu Principal"
                  onPress={resetGame}
                  color={palette.neonAccent}
                />
              </View>
            </SafeAreaView>
          </ScrollView>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    );
  }

  // Tela personalizada de derrota
  if (gameOver) {
    const isTimeOut = time >= maxTime;
    const isSurvivalMode = gameMode === 'survival';
    
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: palette.background }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <SafeAreaView style={styles.container}>
              <Text style={[styles.title, { color: palette.warningAccent, fontSize: 28 }]}>
                {isSurvivalMode ? "💀 FIM DA SOBREVIVÊNCIA 💀" : "⏰ GAME OVER ⏰"}
              </Text>
              
              <View style={styles.defeatContainer}>
                <Text style={styles.defeatTitle}>
                  {isSurvivalMode 
                    ? `${playerName}, sua jornada chegou ao fim!`
                    : `${playerName}, que pena! Não foi dessa vez.`
                  }
                </Text>
                
                <Text style={styles.defeatReason}>
                  {isTimeOut 
                    ? "⏰ O tempo esgotou!"
                    : "❌ Muitos erros cometidos!"
                  }
                </Text>
                
                <Text style={styles.defeatWordReveal}>
                  🔍 A palavra era: <Text style={styles.revealedWord}>{currentWord.word}</Text>
                </Text>
                
                <Text style={styles.defeatHint}>
                  💡 Dica: {currentWord.hint}
                </Text>
                
                {isSurvivalMode && (
                  <View style={styles.survivalStatsContainer}>
                    <Text style={styles.survivalStatsTitle}>
                      📊 Sua Performance:
                    </Text>
                    <Text style={styles.survivalStat}>
                      🎯 Palavras Completadas: <Text style={styles.statValue}>{wordsCompleted}</Text>
                    </Text>
                    <Text style={styles.survivalStat}>
                      ⚡ Tempo Bônus Conquistado: <Text style={styles.statValue}>{totalTimeBonus}s</Text>
                    </Text>
                    <Text style={styles.survivalStat}>
                      🏃‍♂️ Tempo de Sobrevivência: <Text style={styles.statValue}>{time}s</Text>
                    </Text>
                    <Text style={styles.survivalStat}>
                      📈 Progresso: <Text style={styles.statValue}>{wordsCompleted}/{words.length}</Text>
                    </Text>
                  </View>
                )}
                
                <Text style={styles.encouragementMessage}>
                  {isSurvivalMode 
                    ? wordsCompleted > 0 
                      ? `Parabéns por sobreviver a ${wordsCompleted} palavra${wordsCompleted !== 1 ? 's' : ''}! 💪`
                      : "Todo campeão começou com uma primeira tentativa! 🌟"
                    : "Não desista! A prática leva à perfeição! 🎯"
                  }
                </Text>
              </View>
              
              <View style={styles.defeatButtons}>
                <Button
                  title="🔄 Tentar Novamente"
                  onPress={() => {
                    if (isSurvivalMode) {
                      resetGame(); // Volta ao menu para escolher modo novamente
                    } else {
                      setGameOver(false);
                      startNewGame(); // Nova palavra no modo normal
                    }
                  }}
                  color={palette.primary}
                />
                <Button
                  title="🏠 Menu Principal"
                  onPress={resetGame}
                  color={palette.textSecondary}
                />
              </View>
            </SafeAreaView>
          </ScrollView>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: palette.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>Jogo da Forca</Text>
          <Text style={styles.subtitle}>Jogador: {playerName}</Text>
          {gameMode === 'survival' && (
            <Text style={[styles.subtitle, { color: palette.neonAccent }]}>
              ⚡ Modo Sobrevivência - Palavras: {wordsCompleted}/{words.length}
            </Text>
          )}
          <Text style={styles.subtitle}>
            Erros: {wrongGuesses} / {maxGuesses}
          </Text>
          <Text style={styles.subtitle}>
            ⏱️ Tempo: {time}s / {maxTime}s
          </Text>

          <View style={[styles.progressBarBackground, { width: progressBarWidth }]}>
            <Animated.View
              style={[styles.progressBarFill, { width: animatedWidth, backgroundColor: progressBarColor }]}
            />
          </View>

          <View style={styles.controlsContainer}>
            <Button
              title="🔍 Reset Zoom"
              onPress={resetTransform}
              color={palette.neonAccent}
            />
            <Button
              title="🏠 Menu"
              onPress={resetGame}
              color={palette.textSecondary}
            />
          </View>

          <View style={styles.gameContainer}>
            <PanGestureHandler
              ref={panRef}
              onGestureEvent={onPanGestureEvent}
              onHandlerStateChange={onPanStateChange}
              simultaneousHandlers={pinchRef}
              minPointers={1}
              maxPointers={1}
            >
              <Animated.View style={styles.panContainer}>
                <PinchGestureHandler
                  ref={pinchRef}
                  onGestureEvent={onPinchGestureEvent}
                  onHandlerStateChange={onPinchStateChange}
                  simultaneousHandlers={panRef}
                >
                  <Animated.View 
                    style={[
                      styles.gameContent,
                      {
                        transform: [
                          { scale: scale },
                          { translateX: translateX },
                          { translateY: translateY }
                        ]
                      }
                    ]}
                  >
                    <HangmanDrawing wrongGuesses={wrongGuesses} />
                    <Text style={styles.hint}>💡 Dica: {currentWord.hint}</Text>
                    <WordDisplay word={currentWord.word} guessedLetters={guessedLetters} />
                    <Keyboard onPress={handleGuess} guessedLetters={guessedLetters} />
                  </Animated.View>
                </PinchGestureHandler>
              </Animated.View>
            </PanGestureHandler>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}

const createStyles = (palette: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 10,
    backgroundColor: palette.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    fontFamily: FONTS.primary,
    color: palette.primary,
  },
  subtitle: {
    fontSize: 18,
    marginTop: 10,
    marginBottom: 10,
    fontFamily: FONTS.regular,
    color: palette.textPrimary,
  },
  hint: {
    fontSize: 20,
    marginVertical: 12,
    fontStyle: "italic",
    fontFamily: FONTS.regular,
    color: palette.neonAccent,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  modeContainer: {
    width: '100%',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  modeCard: {
    backgroundColor: palette.background_darker,
    borderRadius: 15,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: palette.neonAccent,
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: FONTS.primary,
    color: palette.primary,
  },
  modeDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: FONTS.regular,
    color: palette.textPrimary,
    opacity: 0.9,
  },
  modeBonusInfo: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: FONTS.regular,
    color: palette.neonAccent,
    opacity: 0.8,
  },
  input: {
    width: "80%",
    padding: 10,
    borderColor: palette.neonAccent,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    fontFamily: FONTS.regular,
    color: palette.textPrimary,
    backgroundColor: palette.background_darker,
  },
  progressBarBackground: {
    height: 20,
    backgroundColor: "#444",
    borderRadius: 10,
    marginTop: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
  },
  gameContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  panContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: 700,
    minWidth: '100%',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  victoryContainer: {
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  victoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: FONTS.primary,
    color: palette.primary,
  },
  victoryStats: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: FONTS.primary,
    color: palette.neonAccent,
  },
  victoryDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: FONTS.regular,
    color: palette.textPrimary,
    lineHeight: 22,
  },
  statsContainer: {
    backgroundColor: palette.background_darker,
    borderRadius: 10,
    padding: 15,
    marginVertical: 15,
    width: '100%',
    borderWidth: 1,
    borderColor: palette.neonAccent,
  },
  statItem: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 5,
    fontFamily: FONTS.regular,
    color: palette.textPrimary,
  },
  victoryMessage: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 15,
    fontFamily: FONTS.regular,
    color: palette.textSecondary,
    lineHeight: 20,
  },
  victoryButtons: {
    flexDirection: 'column',
    gap: 15,
    width: '80%',
    marginTop: 20,
  },
  defeatContainer: {
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  defeatTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: FONTS.primary,
    color: palette.textPrimary,
  },
  defeatReason: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: FONTS.primary,
    color: palette.warningAccent,
  },
  defeatWordReveal: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: FONTS.regular,
    color: palette.textPrimary,
  },
  revealedWord: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: FONTS.primary,
    color: palette.primary,
  },
  defeatHint: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
    fontFamily: FONTS.regular,
    color: palette.textSecondary,
    lineHeight: 20,
  },
  survivalStatsContainer: {
    backgroundColor: palette.background_darker,
    borderRadius: 10,
    padding: 15,
    marginVertical: 15,
    width: '100%',
    borderWidth: 1,
    borderColor: palette.warningAccent,
  },
  survivalStatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: FONTS.primary,
    color: palette.primary,
  },
  survivalStat: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 3,
    fontFamily: FONTS.regular,
    color: palette.textPrimary,
  },
  statValue: {
    fontWeight: 'bold',
    color: palette.neonAccent,
  },
  encouragementMessage: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 15,
    fontFamily: FONTS.regular,
    color: palette.primary,
    lineHeight: 20,
  },
  defeatButtons: {
    flexDirection: 'column',
    gap: 15,
    width: '80%',
    marginTop: 20,
  },
});
