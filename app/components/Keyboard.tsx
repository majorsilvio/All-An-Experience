import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Letter } from "../types";

interface KeyboardProps {
  onPress: (letter: Letter) => void;
  guessedLetters: Letter[];
}

const PALETTE = {
  background: "#1A1A1A",
  background_darker: "#0D0D0D",
  primary: "#BFFF00", // Verde-Limão Vibrante
  secondary: "#00FFFF", // Ciano
  textPrimary: "#F5F5F5",
  textSecondary: "#AAAAAA",
};

const alphabet: Letter[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const Keyboard: React.FC<KeyboardProps> = ({ onPress, guessedLetters }) => {
  return (
    <View style={styles.keyboard}>
      {alphabet.map((letter) => {
        const isGuessed = guessedLetters.includes(letter);
        return (
          <TouchableOpacity
            key={letter}
            style={[
              styles.key,
              isGuessed ? styles.keyDisabled : styles.keyEnabled,
            ]}
            onPress={() => onPress(letter)}
            disabled={isGuessed}
          >
            <Text
              style={[
                styles.keyText,
                isGuessed ? styles.textDisabled : styles.textEnabled,
              ]}
            >
              {letter}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  keyboard: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 10,
    marginTop: 20,
  },
  key: {
    width: 44,
    height: 44,
    borderRadius: 8,
    margin: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  keyEnabled: {
    backgroundColor: PALETTE.primary,
  },
  keyDisabled: {
    backgroundColor: PALETTE.background_darker,
    opacity: 0.4,
  },
  keyText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  textEnabled: {
    color: PALETTE.background_darker,
  },
  textDisabled: {
    color: PALETTE.textSecondary,
  },
});

export default Keyboard;
