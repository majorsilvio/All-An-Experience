import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Componente para renderizar cada quadrado do tabuleiro
const Square = ({ value, onPress }: { value: 'X' | 'O' | null, onPress: () => void }) => (
  <TouchableOpacity style={styles.square} onPress={onPress}>
    <Text style={styles.squareText}>{value}</Text>
  </TouchableOpacity>
);

export default function TicTacToeGame() {
  const initialBoard = Array(9).fill(null);
  const [board, setBoard] = useState<( 'X' | 'O' | null)[]>(initialBoard);
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<'X' | 'O' | 'Empate' | null>(null);

  // Função para verificar o vencedor
  const calculateWinner = (squares: ('X' | 'O' | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Linhas
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Colunas
      [0, 4, 8], [2, 4, 6],           // Diagonais
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    // Verifica se deu empate
    if (squares.every(square => square !== null)) {
      return 'Empate';
    }
    return null;
  };

  // Efeito para verificar o vencedor a cada jogada
  useEffect(() => {
    const result = calculateWinner(board);
    if (result) {
      setWinner(result);
    }
  }, [board]);

  const handleSquarePress = (index: number) => {
    // Não faz nada se o quadrado já estiver preenchido ou se o jogo acabou
    if (board[index] || winner) {
      return;
    }
    
    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  const resetGame = () => {
    setBoard(initialBoard);
    setIsXNext(true);
    setWinner(null);
  };

  // Define a mensagem de status
  let status;
  if (winner) {
    status = winner === 'Empate' ? 'Deu Velha! (Empate)' : `Vencedor: ${winner}`;
  } else {
    status = `Próximo a jogar: ${isXNext ? 'X' : 'O'}`;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Define o título na barra de navegação */}
      <Stack.Screen options={{ title: "Jogo da Velha" }} />
      <StatusBar barStyle="dark-content" />

      <Text style={styles.status}>{status}</Text>
      
      <View style={styles.board}>
        {board.map((_, i) => (
          <Square key={i} value={board[i]} onPress={() => handleSquarePress(i)} />
        ))}
      </View>

      <View style={styles.resetButton}>
        <Button title="Reiniciar Jogo" onPress={resetGame} color="#841584" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  status: {
    marginBottom: 20,
    fontSize: 24,
    fontWeight: 'bold',
  },
  board: {
    width: 300,
    height: 300,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 3,
    borderColor: '#333',
  },
  square: {
    width: '33.333%',
    height: '33.333%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#999',
  },
  squareText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#333',
  },
  resetButton: {
      marginTop: 30,
  }
});