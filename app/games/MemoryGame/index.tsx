import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, TouchableOpacity, View } from 'react-native';

// Cores do jogo
const COLORS = ['#ff5252', '#ffd740', '#448aff', '#69f0ae']; // Vermelho, Amarelo, Azul, Verde

// Tipo para o estado do jogo, mantido localmente
type GameState = {
  level: number;
  highScore: number;
};

export default function MemoryGameScreen() {
  // Estado inicial do jogo. O recorde (highScore) será resetado toda vez que o app fechar.
  const [gameState, setGameState] = useState<GameState>({ level: 1, highScore: 1 });
  
  // Estados para controlar a lógica do jogo
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [activeColorIndex, setActiveColorIndex] = useState<number | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [isGameOver, setIsGameOver] = useState(true);

  // Função para iniciar ou reiniciar o jogo
  const startGame = () => {
    setIsGameOver(false);
    setGameState(prev => ({ ...prev, level: 1 })); // Reseta o nível para 1
    setSequence([]);
    setPlayerSequence([]);
    // A função nextLevel será chamada logo após a atualização do estado
  };

  // Este useEffect reage ao início do jogo para chamar o primeiro nível
  useEffect(() => {
    if (isGameOver === false && sequence.length === 0) {
      nextLevel();
    }
  }, [isGameOver, sequence]);
  
  const nextLevel = () => {
    setIsPlayerTurn(false);
    setPlayerSequence([]);
    
    // Adiciona uma nova cor aleatória à sequência
    const newSequence = [...sequence, Math.floor(Math.random() * COLORS.length)];
    setSequence(newSequence);
    
    // Atualiza o placar do nível atual
    setGameState(prev => ({...prev, level: newSequence.length}));

    // Mostra a sequência de cores para o jogador
    playSequence(newSequence);
  };
  
  const playSequence = (seq: number[]) => {
    let i = 0;
    // Define um intervalo de tempo para piscar cada cor da sequência
    const interval = setInterval(() => {
      setActiveColorIndex(seq[i]);
      setTimeout(() => setActiveColorIndex(null), 300); // A cor fica ativa por 300ms
      i++;
      if (i >= seq.length) {
        clearInterval(interval);
        setIsPlayerTurn(true); // É a vez do jogador
      }
    }, 600); // Pausa de 600ms entre cada cor
  };

  const handlePlayerPress = (colorIndex: number) => {
    if (!isPlayerTurn) return; // Ignora o clique se não for a vez do jogador

    const newPlayerSequence = [...playerSequence, colorIndex];
    setPlayerSequence(newPlayerSequence);

    // Verifica se o jogador errou a sequência
    if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
      handleGameOver();
      return;
    }

    // Se o jogador acertou a sequência inteira, avança para o próximo nível
    if (newPlayerSequence.length === sequence.length) {
      setIsPlayerTurn(false);
      setTimeout(nextLevel, 1000); // Espera 1s antes de mostrar a próxima sequência
    }
  };

  const handleGameOver = () => {
    Alert.alert('Fim de Jogo!', `Você alcançou o nível ${gameState.level}.`);
    
    // Atualiza o recorde (highScore) apenas se o nível atual for maior
    const newHighScore = Math.max(gameState.level, gameState.highScore);
    setGameState(prev => ({ ...prev, highScore: newHighScore }));

    // Reseta o estado para um novo jogo
    setIsGameOver(true);
    setSequence([]);
    setPlayerSequence([]);
  };

  // A tela agora é renderizada diretamente, sem checagem de biometria
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Nível: {isGameOver ? '-' : gameState.level}</ThemedText>
        <ThemedText type="subtitle">Recorde: {gameState.highScore}</ThemedText>
      </View>
      
      {isGameOver ? (
        // Se o jogo acabou, mostra o botão de Iniciar
        <View style={styles.centered}>
            <Button title="Iniciar Jogo" onPress={startGame} />
        </View>
      ) : (
        // Se o jogo está rolando, mostra os botões coloridos
        <View style={styles.gameBoard}>
          {COLORS.map((color, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.gameButton,
                { backgroundColor: color },
                // Estilo para o botão que está piscando
                activeColorIndex === index && styles.activeButton,
              ]}
              onPress={() => handlePlayerPress(index)}
              disabled={!isPlayerTurn}
            />
          ))}
        </View>
      )}
      <ThemedText style={styles.statusText}>
        {isPlayerTurn ? 'Sua vez!' : isGameOver ? 'Pressione Iniciar' : 'Observe a sequência...'}
      </ThemedText>
    </ThemedView>
  );
}

// Estilos para a tela do jogo
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { position: 'absolute', top: 60, alignItems: 'center', zIndex: 10 },
  gameBoard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameButton: {
    width: 140,
    height: 140,
    margin: 5,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#fff'
  },
  activeButton: {
    opacity: 0.5,
    transform: [{ scale: 0.95 }],
  },
  statusText: {
    position: 'absolute',
    bottom: 80,
    fontSize: 20,
    fontWeight: 'bold',
  },
});