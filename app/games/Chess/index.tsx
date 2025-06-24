import { Chess, Color, PieceSymbol, Square } from 'chess.js';
import { Stack } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Button, Dimensions, Modal, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// ==================================
// MAPA DE PEÇAS PARA EMOJIS (CONFORME SEU PEDIDO)
// ==================================
const PIECE_EMOJI_MAP: { [color in Color]: { [piece in PieceSymbol]: string } } = {
  w: { p: '♙', r: '♖', n: '♘', b: '♗', q: '♕', k: '♔' },
  b: { p: '♟︎', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚' },
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
                <Text style={styles.pieceEmoji}>{PIECE_EMOJI_MAP['w'][p]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

// ==================================
// COMPONENTE PRINCIPAL DO JOGO
// ==================================
export default function ChessGame() {
  const game = useMemo(() => new Chess(), []);
  const [board, setBoard] = useState(game.board());
  const [status, setStatus] = useState('Vez das Brancas');
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);
  const [isPromotionModalVisible, setPromotionModalVisible] = useState(false);
  const [promotionMove, setPromotionMove] = useState<{ from: Square, to: Square } | null>(null);

  const updateStatus = useCallback(() => {
    let moveColor = game.turn() === 'w' ? 'Brancas' : 'Pretas';
    if (game.isCheckmate()) { setStatus(`XEQUE-MATE! ${moveColor === 'Brancas' ? 'Pretas' : 'Brancas'} venceram!`); return; }
    if (game.isDraw()) { setStatus('EMPATE!'); return; }
    if (game.inCheck()) { setStatus(`XEQUE! Vez das ${moveColor}.`); return; }
    setStatus(`Vez das ${moveColor}`);
  }, [game]);

  const handleSquarePress = (square: Square) => {
    if (game.isGameOver()) return;
    if (!selectedSquare) {
      const moves = game.moves({ square, verbose: true });
      if (moves.length > 0) {
        setSelectedSquare(square);
        setPossibleMoves(moves.map(m => m.to));
      }
    } else {
      const movesFromSelected = game.moves({ square: selectedSquare, verbose: true });
      const moveIntent = movesFromSelected.find(m => m.to === square);
      if (moveIntent?.flags.includes('p')) {
        setPromotionMove({ from: selectedSquare, to: square });
        setPromotionModalVisible(true);
        return;
      }
      try {
        game.move({ from: selectedSquare, to: square });
        setBoard(game.board());
        updateStatus();
      } catch (e) {}
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  const handlePromotion = (piece: PieceSymbol) => {
    if (promotionMove) {
      game.move({ ...promotionMove, promotion: piece });
      setBoard(game.board());
      updateStatus();
    }
    setPromotionModalVisible(false);
    setPromotionMove(null);
    setSelectedSquare(null);
    setPossibleMoves([]);
  };

  const restartGame = () => {
    game.reset();
    setBoard(game.board());
    updateStatus();
    setSelectedSquare(null);
    setPossibleMoves([]);
    Alert.alert("Jogo Reiniciado");
  };

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ title: 'Xadrez' }} />
      <PromotionModal visible={isPromotionModalVisible} onPromote={handlePromotion} />
      <View style={styles.infoPanel}>
        <Text style={[styles.statusText, game.inCheck() && !game.isCheckmate() && styles.checkText]}>{status}</Text>
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
              return (
                <TouchableOpacity key={squareName} style={[styles.square, { backgroundColor: isLightSquare ? '#eeeed2' : '#769656' }]} onPress={() => handleSquarePress(squareName)}>
                  {p && <Text style={styles.pieceEmoji}>{PIECE_EMOJI_MAP[p.color][p.type]}</Text>}
                  {selectedSquare === squareName && <View style={styles.selectedSquare} />}
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
      <View style={styles.controls}><Button title="Reiniciar Partida" onPress={restartGame} color="#c0392b" /></View>
    </SafeAreaView>
  );
}

// ==================================
// ESTILOS
// ==================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#312e2b', alignItems: 'center', justifyContent: 'center'},
  infoPanel: { padding: 15, borderRadius: 5, marginVertical: 15, backgroundColor: '#262421' },
  statusText: { fontSize: 20, fontWeight: 'bold', color: 'white'},
  checkText: { color: '#e74c3c' },
  boardContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  board: { width: BOARD_SIZE, height: BOARD_SIZE, flexDirection: 'row', flexWrap: 'wrap' },
  square: { width: SQUARE_SIZE, height: SQUARE_SIZE, alignItems: 'center', justifyContent: 'center' },
  selectedSquare: { width: SQUARE_SIZE, height: SQUARE_SIZE, position: 'absolute', backgroundColor: 'rgba(246, 246, 130, 0.5)' },
  possibleMoveDot: { width: SQUARE_SIZE * 0.35, height: SQUARE_SIZE * 0.35, borderRadius: SQUARE_SIZE * 0.175, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  ranksColumn: { height: BOARD_SIZE, justifyContent: 'space-around', alignItems: 'center', marginRight: 4 },
  filesRow: { width: BOARD_SIZE, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 4 },
  coordinateText: { color: '#b4b2af', fontWeight: 'bold', fontSize: 12 },
  controls: { marginVertical: 20 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center'},
  modalContent: { backgroundColor: '#312e2b', padding: 20, borderRadius: 10, alignItems: 'center', elevation: 5, borderWidth: 1, borderColor: '#4e4a47' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: 'white' },
  promotionOptions: { flexDirection: 'row' },
  promotionButton: { marginHorizontal: 5, width: SQUARE_SIZE, height: SQUARE_SIZE, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eeeed2', borderRadius: 8 },
  pieceEmoji: { fontSize: SQUARE_SIZE * 0.75, }
});