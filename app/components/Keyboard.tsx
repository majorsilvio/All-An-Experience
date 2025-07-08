import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { FONTS } from "../../hooks/useFonts";
import { useThemePalette } from "../../hooks/useThemePalette";
import { Letter } from "../types";

interface KeyboardProps {
  onPress: (letter: Letter) => void;
  guessedLetters: Letter[];
}

const alphabet: Letter[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const Keyboard: React.FC<KeyboardProps> = ({ onPress, guessedLetters }) => {
  const palette = useThemePalette();
  const styles = createStyles(palette);

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

const createStyles = (palette: any) => StyleSheet.create({
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
    backgroundColor: palette.primary,
  },
  keyDisabled: {
    backgroundColor: palette.background_darker,
    opacity: 0.4,
  },
  keyText: {
    fontSize: 16,
    fontFamily: FONTS.primary,
  },
  textEnabled: {
    color: palette.background_darker,
  },
  textDisabled: {
    color: palette.textSecondary,
  },
});

export default Keyboard;
