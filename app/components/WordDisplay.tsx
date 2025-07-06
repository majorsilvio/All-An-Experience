import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Letter } from "../types";

interface WordDisplayProps {
  word: string;
  guessedLetters: Letter[];
}

const WordDisplay: React.FC<WordDisplayProps> = ({ word, guessedLetters }) => {
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

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 20,
  },
  letter: {
    fontSize: 32,
    marginHorizontal: 5,
  },
});

export default WordDisplay;