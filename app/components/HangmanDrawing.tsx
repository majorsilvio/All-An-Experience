import React from "react";
import { View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";

interface HangmanDrawingProps {
  wrongGuesses: number;
}

const HangmanDrawing: React.FC<HangmanDrawingProps> = ({ wrongGuesses }) => {
  return (
    <View style={{ alignItems: "center", marginVertical: 20 }}>
      <Svg height="200" width="120">
        {/* Forca */}
        <Line x1="10" y1="190" x2="110" y2="190" stroke="black" strokeWidth="4" />
        <Line x1="30" y1="190" x2="30" y2="20" stroke="black" strokeWidth="4" />
        <Line x1="30" y1="20" x2="80" y2="20" stroke="black" strokeWidth="4" />
        <Line x1="80" y1="20" x2="80" y2="40" stroke="black" strokeWidth="4" />

        {/* Cabeça */}
        {wrongGuesses > 0 && <Circle cx="80" cy="55" r="15" stroke="black" strokeWidth="4" fill="none" />}
        {/* Corpo */}
        {wrongGuesses > 1 && <Line x1="80" y1="70" x2="80" y2="110" stroke="black" strokeWidth="4" />}
        {/* Braço esquerdo */}
        {wrongGuesses > 2 && <Line x1="80" y1="80" x2="60" y2="100" stroke="black" strokeWidth="4" />}
        {/* Braço direito */}
        {wrongGuesses > 3 && <Line x1="80" y1="80" x2="100" y2="100" stroke="black" strokeWidth="4" />}
        {/* Perna esquerda */}
        {wrongGuesses > 4 && <Line x1="80" y1="110" x2="60" y2="140" stroke="black" strokeWidth="4" />}
        {/* Perna direita */}
        {wrongGuesses > 5 && <Line x1="80" y1="110" x2="100" y2="140" stroke="black" strokeWidth="4" />}
      </Svg>
    </View>
  );
};

export default HangmanDrawing;