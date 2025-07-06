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
} from "react-native";
import HangmanDrawing from "../components/HangmanDrawing";
import Keyboard from "../components/Keyboard";
import WordDisplay from "../components/WordDisplay";
import { words } from "../data/words";
import { Letter } from "../types";

const PALETTE = {
  background: "#1A1A1A",
  background_darker: "#0D0D0D",
  primary: "#BFFF00", // Verde-Limão Vibrante
  secondary: "#00FFFF", // Ciano
  textPrimary: "#F5F5F5",
  textSecondary: "#AAAAAA",
};

type WordItem = {
  word: string;
  hint: string;
};

export default function App() {
  const [playerName, setPlayerName] = useState<string>("");
  const [nameConfirmed, setNameConfirmed] = useState<boolean>(false);
  const [currentWord, setCurrentWord] = useState<WordItem>({ word: "", hint: "" });
  const [guessedLetters, setGuessedLetters] = useState<Letter[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState<number>(0);
  const [time, setTime] = useState<number>(0);
  const [maxTime, setMaxTime] = useState<number>(60);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const maxGuesses = 6;

  // Animated value para a barra de progresso
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (nameConfirmed) {
      startNewGame();
    }
  }, [nameConfirmed]);

  useEffect(() => {
    if (!nameConfirmed || gameOver) return;

    if (time >= maxTime) {
      setGameOver(true);
      Alert.alert(
        "Tempo esgotado!",
        `${playerName}, você perdeu! A palavra era: ${currentWord.word}`,
        [{ text: "Jogar novamente", onPress: startNewGame }]
      );
      return;
    }

    const timer = setInterval(() => setTime((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [time, nameConfirmed, gameOver]);

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
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(randomWord);
    setGuessedLetters([]);
    setWrongGuesses(0);
    setTime(0);
    setMaxTime(getTimeForWord(randomWord.word));
    setGameOver(false);
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
        Alert.alert(
          "Você perdeu!",
          `${playerName}, a palavra era: ${currentWord.word}`,
          [{ text: "Jogar novamente", onPress: startNewGame }]
        );
      }
    } else {
      const allGuessed = currentWord.word
        .split("")
        .every((l) => guessedLetters.includes(l) || l === letter);
      if (allGuessed) {
        setGameOver(true);
        Alert.alert(
          "Parabéns!",
          `${playerName}, você venceu em ${time} segundo${time !== 1 ? "s" : ""}!`,
          [{ text: "Jogar novamente", onPress: startNewGame }]
        );
      }
    }
  };

  // Largura total da barra
  const progressBarWidth = 300;

  // Cor da barra: vermelho se <= 10 segundos restantes, senão verde-limão
  const timeRemaining = maxTime - time;
  const progressBarColor = timeRemaining <= 10 ? "#f44336" : PALETTE.primary;

  // Barra aumenta com o tempo (de 0 até largura total)
  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, progressBarWidth],
  });

  if (!nameConfirmed) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: PALETTE.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Jogo da Forca</Text>
            <Text style={styles.subtitle}>Digite seu nome para começar:</Text>
            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor={PALETTE.textSecondary}
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
              color={PALETTE.primary}
            />
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: PALETTE.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>Jogo da Forca</Text>
          <Text style={styles.subtitle}>Jogador: {playerName}</Text>
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

          <HangmanDrawing wrongGuesses={wrongGuesses} />
          <Text style={styles.hint}>💡 Dica: {currentWord.hint}</Text>
          <WordDisplay word={currentWord.word} guessedLetters={guessedLetters} />
          <Keyboard onPress={handleGuess} guessedLetters={guessedLetters} />
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 50,
    backgroundColor: PALETTE.background,
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
    color: PALETTE.primary,
  },
  subtitle: {
    fontSize: 18,
    marginTop: 10,
    marginBottom: 10,
    color: PALETTE.textPrimary,
  },
  hint: {
    fontSize: 20,
    marginVertical: 12,
    fontStyle: "italic",
    color: PALETTE.secondary,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  input: {
    width: "80%",
    padding: 10,
    borderColor: PALETTE.secondary,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    color: PALETTE.textPrimary,
    backgroundColor: PALETTE.background_darker,
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
});
