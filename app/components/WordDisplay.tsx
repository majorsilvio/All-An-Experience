import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../hooks/useFonts";
import { useThemePalette } from "../../hooks/useThemePalette";
import { Letter } from "../types";

interface WordDisplayProps {
  word: string;
  guessedLetters: Letter[];
}

const WordDisplay: React.FC<WordDisplayProps> = ({ word, guessedLetters }) => {
  const palette = useThemePalette();
  const styles = createStyles(palette);

  return (
    <View style={styles.container}>
      {word.split("").map((letter, index) => (
        <Text key={index} style={styles.letter}>
          {guessedLetters.includes(letter) ? letter : "_"}
        </Text>
      ))}
    </View>
  );
};

const createStyles = (palette: any) => StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 20,
  },
  letter: {
    fontSize: 32,
    marginHorizontal: 5,
    fontFamily: FONTS.primary,
    color: palette.textPrimary,
  },
});

export default WordDisplay;