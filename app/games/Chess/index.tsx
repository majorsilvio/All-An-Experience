import { Chess, Color, PieceSymbol, Square } from 'chess.js';
import { Stack, router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Dimensions, Modal, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ==================================
// TIPOS E CONSTANTES
// ==================================
type PlayerMode = '1P' | '2P';
type PlayerColor = 'w' | 'b';
type Difficulty = 'easy' | 'medium';
type GameState = 'setup' | 'playing' | 'gameOver';

// ==================================
// COMPONENTE PARA RENDERIZAR PEÇAS EM SVG
// ==================================
const PIECE_SVG_PATHS: { [key in PieceSymbol]: string[] } = {
  p: ['M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38-1.95 1.12-3.28 3.2-3.28 5.62h9c0-2.42-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z'],
  n: ['M22 8c0-1.105-.895-2-2-2-1.105 0-2 .895-2 2v4l-3-3-1 2 2 2-3 4.5s-1.5-1.5-1.5-2.5c0-1.5-1.5-2.5-1.5-2.5-2.5 0-2.45 2.5-2.5 2.5-1 0-1.5 1.5-1.5 1.5s.5 1.5 1.5 1.5c.5 0 1-.5 1-1.5 0 0 .5-1 1.5-1s1.5 1 1.5 1l-2.5 2.5-2 2h14l.5-1.5.5-2 .5-1 .5-1z'],
  b: ['M22.5 14.5c-2.03 0-3.41.8-4.5 2.55-1.09-1.75-2.47-2.55-4.5-2.55-2.03 0-3.41.8-4.5 2.55-1.09-1.75-2.47-2.55-4.5-2.55C2.5 14.5 2 15 2 15.5s.5.5 1.5.5h18c1 0 1.5-.5 1.5-1.5s-.5-1-1.5-1zM18 12.5c0-1.5-1-2.5-2.5-2.5S13 11 13 12.5s1 2.5 2.5 2.5 2.5-1 2.5-2.5zM12 11.5c0-1.5-1-2.5-2.5-2.5S7 10 7 11.5 8 14 9.5 14s2.5-1 2.5-2.5z'],
  r: ['M9 36V10h27v26H9z M12 13v11h3v-4h3v4h3v-4h3v4h3V13H12z'],
  q: ['M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm11 0a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm11 0a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM12.5 7l-3 4.5h23l-3-4.5zM12.5 13.5l-3 4.5h23l-3-4.5zM12.5 19.5l-3 4.5h23l-3-4.5zM12.5 25.5l-3 4.5h23l-3-4.5z'],
  k: ['M22.5 11.63V6h-2v5.63c-2.14-1.2-4.82-1.63-7.5-1.63s-5.36.43-7.5 1.63V6h-2v5.63c3.54 1.53 5.46 4.37 5.46 7.87 0 1.07.1 2.1.28 3.06-.51.24-1.04.53-1.58.88-2.61 1.69-3.66 3.6-3.66 5.54h22c0-1.94-1.05-3.85-3.66-5.54-.54-.35-1.07-.64-1.58-.88.18-.96.28-1.99.28-3.06 0-3.5-1.92-6.34-5.46-7.87zM22.5 30c-2.75 0-5-2.25-5-5s2.25-5 5-5 5 2.25 5 5-2.25 5-5 5zm-10 0c-2.75 0-5-2.25-5-5s2.25-5 5-5 5 2.25 5 5-2.25 5-5 5z'],
};

// ALTERAÇÃO 1: Renomeamos o componente de "Piece" para "ChessPiece"
const ChessPiece = ({ type, color }: { type: PieceSymbol, color: Color }) => {
  const fillColor = color === 'w' ? '#FFFFFF' : '#312E2B';
  const strokeColor = color === 'w' ? '#312E2B' : '#FFFFFF';
  return (
    <Svg height="85%" width="85%" viewBox="0 0 45 45">
      {PIECE_SVG_PATHS[type].map((d, i) => (
        <Path key={i} d={d} stroke={strokeColor} strokeWidth={1.5} strokeLinejoin="round" fill={fillColor} />
      ))}
    </Svg>
  );
};


// ==================================
// OUTROS COMPONENTES E CONSTANTES
// ==================================
const { width } = Dimensions.get('window');
const BOARD_CONTAINER_SIZE = width * 0.95;
const COORDINATE_SIZE = BOARD_CONTAINER_SIZE * 0.07;
const BOARD_SIZE = BOARD_CONTAINER_SIZE - COORDINATE_SIZE;
const SQUARE_SIZE = BOARD_SIZE / 8;

const PromotionModal = ({ visible, onPromote }: { visible: boolean; onPromote: (piece: PieceSymbol) => void }) => (
  <Modal transparent visible={visible} animationType="fade">
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Promover para:</Text>
        <View style={styles.promotionOptions}>
          {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map((p) => (
            <TouchableOpacity key={p} style={styles.promotionButton} onPress={() => onPromote(p)}>
              {/* ALTERAÇÃO 2: Usamos o novo nome do componente aqui */}
              <ChessPiece type={p} color="w" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  </Modal>
);

// ==================================
// COMPONENTE PRINCIPAL
// ==================================

export default function ChessGame() {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [playerMode, setPlayerMode] = useState<PlayerMode>('2P');
  const [playerColor, setPlayerColor] = useState<PlayerColor>('w');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const game = useMemo(() => new Chess(), []);
  const [board, setBoard] = useState(game.board());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square, to: Square } | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [isPromotionModalVisible, setPromotionModalVisible] = useState(false);
  const [promotionMove, setPromotionMove] = useState<{ from: Square, to: Square } | null>(null);

  const updateGameState = useCallback(() => { 
    setBoard(game.board());
    if (game.isGameOver()) {
      let reason = '';
      if (game.isCheckmate()) reason = `Xeque-mate! Vencedor: ${game.turn() === 'w' ? 'Pretas' : 'Brancas'}`;
      else if (game.isStalemate()) reason = 'Empate por Afogamento!';
      else if (game.isThreefoldRepetition()) reason = 'Empate por Repetição!';
      else if (game.isDraw()) reason = 'Empate!';
      setWinner(reason);
      setGameState('gameOver');
    }
  }, [game]);
  const makeAIMove = useCallback(() => { 
    if (playerMode === '1P' && game.turn() !== playerColor && !game.isGameOver()) {
      setTimeout(() => {
        const moves = game.moves({ verbose: true });
        if (moves.length === 0) return;
        let bestMove = moves[Math.floor(Math.random() * moves.length)];
        if (difficulty === 'medium') {
          const captureMoves = moves.filter(m => m.flags.includes('c'));
          if (captureMoves.length > 0) {
            bestMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
          }
        }
        game.move(bestMove.san);
        setLastMove({ from: bestMove.from, to: bestMove.to });
        updateGameState();
      }, 600);
    }
  }, [game, playerMode, playerColor, difficulty, updateGameState]);
  useEffect(() => { 
    if (gameState === 'playing' && game.turn() !== playerColor) {
      makeAIMove();
    }
  }, [board, gameState, playerColor, makeAIMove]);
  const handleSquarePress = (square: Square) => { 
    if (game.isGameOver() || (playerMode === '1P' && game.turn() !== playerColor)) return;
    if (selectedSquare) {
      const movesFromSelected = game.moves({ square: selectedSquare, verbose: true });
      const isPromotion = movesFromSelected.some(m => m.to === square && m.flags.includes('p'));
      if (isPromotion) {
        setPromotionMove({ from: selectedSquare, to: square });
        setPromotionModalVisible(true);
      } else {
        const move = game.move({ from: selectedSquare, to: square });
        if (move) {
          setLastMove({ from: move.from, to: move.to });
          updateGameState();
        }
      }
      setSelectedSquare(null);
      setPossibleMoves([]);
    } else {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setPossibleMoves(moves.map(m => m.to));
      }
    }
  };
  const handlePromotion = (piece: PieceSymbol) => { 
    if (promotionMove) {
      const move = game.move({ ...promotionMove, promotion: piece });
      if (move) {
        setLastMove({ from: move.from, to: move.to });
        updateGameState();
      }
    }
    setPromotionModalVisible(false);
    setPromotionMove(null);
  };
  const startGame = () => { 
    game.reset();
    setLastMove(null);
    setWinner(null);
    updateGameState();
    setGameState('playing');
    if (playerMode === '1P' && playerColor === 'b') {
      makeAIMove();
    }
  };
  const resetGameToSetup = () => {
    game.reset();
    setGameState('setup');
  };
  
  if (gameState !== 'playing') {
    const isSetup = gameState === 'setup';
    return (
        <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Stack.Screen options={{ title: isSetup ? 'Configurar Jogo' : 'Fim de Jogo' }} />
        <Text style={styles.title}>{isSetup ? 'Novo Jogo de Xadrez' : 'Fim de Jogo!'}</Text>
        {isSetup ? (
            <>
            <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>Modo:</Text>
                <View style={styles.buttonRow}><Button title="1 Jogador (vs IA)" onPress={()=>setPlayerMode('1P')} color={playerMode==='1P'?'#81b64c':'#7f8c8d'} /><Button title="2 Jogadores" onPress={()=>setPlayerMode('2P')} color={playerMode==='2P'?'#81b64c':'#7f8c8d'} /></View>
            </View>
            {playerMode === '1P' && (
                <>
                <View style={styles.optionGroup}><Text style={styles.optionLabel}>Sua Cor:</Text><View style={styles.buttonRow}><Button title="Brancas" onPress={()=>setPlayerColor('w')} color={playerColor==='w'?'#81b64c':'#7f8c8d'} /><Button title="Pretas" onPress={()=>setPlayerColor('b')} color={playerColor==='b'?'#81b64c':'#7f8c8d'} /></View></View>
                <View style={styles.optionGroup}><Text style={styles.optionLabel}>Dificuldade da IA:</Text><View style={styles.buttonRow}><Button title="Fácil" onPress={()=>setDifficulty('easy')} color={difficulty==='easy'?'#81b64c':'#7f8c8d'} /><Button title="Médio" onPress={()=>setDifficulty('medium')} color={difficulty==='medium'?'#f39c12':'#7f8c8d'} /></View></View>
                </>
            )}
            <Button title="Iniciar Jogo" onPress={startGame} />
            </>
        ) : (
            <>
            <Text style={styles.winnerText}>{winner}</Text>
            <Button title="Jogar Novamente" onPress={resetGameToSetup} />
            <View style={{marginTop: 20}}><Button title="Voltar ao Menu Principal" onPress={()=>router.back()} color="#c0392b" /></View>
            </>
        )}
        </SafeAreaView>
    );
  }

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ title: 'Xadrez' }} />
      <PromotionModal visible={isPromotionModalVisible} onPromote={handlePromotion} />
      <View style={styles.infoPanel}>
        <Text style={styles.turnText}>Vez de: {game.turn() === 'w' ? 'Brancas' : 'Pretas'}</Text>
        {game.inCheck() && <Text style={styles.checkText}>XEQUE!</Text>}
      </View>
      <View style={styles.boardContainer}>
        <View style={styles.ranksColumn}>
          {ranks.map(rank => <Text key={rank} style={styles.coordinateText}>{rank}</Text>)}
        </View>
        <View>
          <View style={styles.board}>
            {board.map((row, rowIndex) => row.map((p, colIndex) => {
              const squareName = `${files[colIndex]}${ranks[rowIndex]}` as Square;
              const isLightSquare = (rowIndex + colIndex) % 2 !== 0;
              const isLastMove = (lastMove?.from === squareName) || (lastMove?.to === squareName);
              const isSelected = selectedSquare === squareName;
              return (
                <TouchableOpacity key={squareName} style={[styles.square, { backgroundColor: isLightSquare ? '#eeeed2' : '#769656' }, isSelected && styles.selectedSquare, isLastMove && styles.lastMoveSquare]} onPress={() => handleSquarePress(squareName)}>
                  {/* ALTERAÇÃO 3: Usamos o novo nome do componente aqui */}
                  {p && <ChessPiece type={p.type} color={p.color} />}
                  {possibleMoves.includes(squareName) && <View style={styles.possibleMoveDot} />}
                </TouchableOpacity>
              );
            }))}
          </View>
          <View style={styles.filesRow}>
            {files.map(file => <Text key={file} style={styles.coordinateText}>{file}</Text>)}
          </View>
        </View>
      </View>
      <View>
        <Button title="Reiniciar Partida" onPress={resetGameToSetup} color="#c0392b" />
      </View>
    </SafeAreaView>
  );
}

// ==================================
// ESTILOS
// ==================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#312e2b', alignItems: 'center', justifyContent: 'space-around'},
  title: { fontSize: 28, fontWeight: 'bold', color: 'white'},
  winnerText: { fontSize: 22, color: '#99c667', textAlign: 'center', marginVertical: 20},
  optionGroup: { marginBottom: 20, alignItems: 'center', width: '90%'},
  optionLabel: { fontSize: 18, color: 'white', marginBottom: 10},
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%'},
  infoPanel: { padding: 10, alignItems: 'center' },
  turnText: { fontSize: 20, fontWeight: 'bold', color: 'white'},
  checkText: { color: '#e74c3c', fontSize: 18, fontWeight: 'bold', marginTop: 5},
  
  boardContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  board: { width: BOARD_SIZE, height: BOARD_SIZE, flexDirection: 'row', flexWrap: 'wrap' },
  square: { width: SQUARE_SIZE, height: SQUARE_SIZE, alignItems: 'center', justifyContent: 'center' },
  selectedSquare: { backgroundColor: 'rgba(246, 246, 130, 0.6)' },
  lastMoveSquare: { borderWidth: 3, borderColor: 'rgba(170, 162, 58, 0.8)' },
  possibleMoveDot: { position: 'absolute', width: SQUARE_SIZE * 0.3, height: SQUARE_SIZE * 0.3, backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: SQUARE_SIZE * 0.15 },
  ranksColumn: { height: BOARD_SIZE, justifyContent: 'space-around', alignItems: 'center', marginRight: 4 },
  filesRow: { width: BOARD_SIZE, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 4 },
  coordinateText: { color: '#b4b2af', fontWeight: 'bold', fontSize: 12 },

  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center'},
  modalContent: { backgroundColor: '#312e2b', padding: 20, borderRadius: 10, alignItems: 'center', elevation: 5, borderWidth: 1, borderColor: '#4e4a47' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: 'white' },
  promotionOptions: { flexDirection: 'row' },
  promotionButton: { marginHorizontal: 5, width: SQUARE_SIZE, height: SQUARE_SIZE, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eeeed2', borderRadius: 8 },
});