import { Chess, Color, Piece, PieceSymbol, Square } from 'chess.js';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, Modal, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 1. PALETA DE CORES PROFISSIONAL E COMPLETA
const PALETTE = {
  background: '#262421',
  background_darker: '#201E1B',
  primary: '#BFFF00',
  secondary: '#00FFFF',
  cardBackground: '#3A3835',
  textPrimary: '#F5F5F5',
  textSecondary: '#9E9E9E',
  boardLight: '#EBECD0',
  boardDark: '#779556',
  highlight: 'rgba(235, 97, 80, 0.5)',
  danger: '#FF4757',
};

// ==================================
// MAPA DE PEÇAS PARA EMOJIS (CONFORME SEU PEDIDO)
// ==================================
const PIECE_EMOJI_MAP: { [color in Color]: { [piece in PieceSymbol]: string } } = {
  w: { p: '♙', r: '♖', n: '♘', b: '♗', q: '♕', k: '♔' },
  b: { p: '♟︎', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚' },
};


// ==================================
// COMPONENTES DE UI
// ==================================
const { width, height } = Dimensions.get('window');
const BOARD_SIZE = Math.min(width * 0.95, height * 0.6);
const SQUARE_SIZE = BOARD_SIZE / 8;

const PromotionModal = ({ visible, onPromote }: { visible: boolean; onPromote: (piece: PieceSymbol) => void }) => (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalContainer}><View style={styles.modalContent}><Text style={styles.modalTitle}>PROMOVER PEÃO</Text><View style={styles.promotionOptions}>
        {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map((p) => (<TouchableOpacity key={p} style={styles.promotionButton} onPress={() => onPromote(p)}><Text style={styles.pieceEmoji}>{PIECE_EMOJI_MAP['w'][p]}</Text></TouchableOpacity>))}
      </View></View></View>
    </Modal>
);

const PlayerHUD = ({ time, captured, advantage }: { time: number, captured: Piece[], advantage: number }) => (
    <View style={styles.hudContainer}>
        <View style={styles.capturedPiecesContainer}>
            {captured.map((p, i) => <Text key={`${p.color}_cap_${i}`} style={styles.capturedPieceEmoji}>{PIECE_EMOJI_MAP[p.color][p.type]}</Text>)}
            {advantage > 0 && <Text style={styles.advantageText}>+{advantage}</Text>}
        </View>
        <Text style={styles.playerTimer}>{formatTime(time)}</Text>
    </View>
);

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

// ==================================
// COMPONENTE PRINCIPAL DO JOGO
// ==================================
export default function ChessGame() {
  const [gameState, setGameState] = useState<'initial' | 'config' | 'playing' | 'gameOver'>('initial');
  const [winner, setWinner] = useState<string | null>(null);

  const game = useMemo(() => new Chess(), []);
  const [board, setBoard] = useState(game.board());
  const [status, setStatus] = useState('Aguardando início...');
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{from: Square, to: Square} | null>(null);
  const [capturedPieces, setCapturedPieces] = useState<{w: Piece[], b: Piece[]}>({w:[], b:[]});
  const [materialAdvantage, setMaterialAdvantage] = useState({w:0, b:0});
  const [isPromotionModalVisible, setPromotionModalVisible] = useState(false);
  const [promotionMove, setPromotionMove] = useState<{ from: Square, to: Square } | null>(null);

  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const PIECE_VALUES: {[key in PieceSymbol]: number} = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

  const updateStatus = useCallback(() => { 
    let moveColor = game.turn() === 'w' ? 'Brancas' : 'Pretas';
    if (game.isCheckmate()) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); setWinner(`XEQUE-MATE! Vitória das ${moveColor === 'w' ? 'Pretas' : 'Brancas'}`); setGameState('gameOver'); return; }
    if (game.isDraw()) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); setWinner('EMPATE!'); setGameState('gameOver'); return; }
    if (game.inCheck()) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setStatus(`XEQUE! Vez das ${moveColor}.`); return; }
    setStatus(`Vez das ${moveColor}`);
  }, [game]);

  const updateCapturedPieces = useCallback(() => {
    const history = game.history({verbose: true});
    const whiteCaptured: Piece[] = [];
    const blackCaptured: Piece[] = [];
    let whiteScore = 0; let blackScore = 0;
    history.forEach(move => {
        if(move.captured) {
            const capturedPiece: Piece = { type: move.captured, color: move.color === 'w' ? 'b' : 'w' };
            if(capturedPiece.color === 'b') { whiteCaptured.push(capturedPiece); whiteScore += PIECE_VALUES[capturedPiece.type]; }
            else { blackCaptured.push(capturedPiece); blackScore += PIECE_VALUES[capturedPiece.type]; }
        }
    });
    setCapturedPieces({w: whiteCaptured, b: blackCaptured});
    setMaterialAdvantage({w: whiteScore > blackScore ? whiteScore - blackScore : 0, b: blackScore > whiteScore ? blackScore - whiteScore : 0});
  }, [game, PIECE_VALUES]);
  
  useEffect(() => { 
    if (gameState === 'playing' && !game.isGameOver()) {
        timerRef.current = setInterval(() => {
          if (game.turn() === 'w') {
            setWhiteTime(t => {
              if (t <= 1) { clearInterval(timerRef.current!); setWinner("Tempo esgotado! Vitória das Pretas"); setGameState('gameOver'); return 0; }
              return t - 1;
            });
          } else {
            setBlackTime(t => {
              if (t <= 1) { clearInterval(timerRef.current!); setWinner("Tempo esgotado! Vitória das Brancas"); setGameState('gameOver'); return 0; }
              return t - 1;
            });
          }
        }, 1000);
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
      }
      return () => { if (timerRef.current) clearInterval(timerRef.current) };
   }, [gameState, game]);

  const handleSquarePress = (square: Square) => { 
    if (gameState !== 'playing') return;
    if (!selectedSquare) {
        const moves = game.moves({ square, verbose: true });
        if (moves.length > 0 && game.get(square)?.color === game.turn()) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedSquare(square);
          setPossibleMoves(moves.map(m => m.to));
        }
      } else {
        const moveIntent = game.moves({ square: selectedSquare, verbose: true }).find(m => m.to === square);
        if (moveIntent?.flags.includes('p')) {
          setPromotionMove({ from: selectedSquare, to: square });
          setPromotionModalVisible(true);
          return;
        }
        try {
          const moveResult = game.move({ from: selectedSquare, to: square });
          if (moveResult) {
            setLastMove({from: moveResult.from, to: moveResult.to});
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setBoard([...game.board()]);
            updateStatus();
            updateCapturedPieces();
          }
        } catch (e) {}
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
  };

  const handlePromotion = (piece: PieceSymbol) => { 
    if (promotionMove) {
        game.move({ ...promotionMove, promotion: piece });
        setBoard([...game.board()]); updateStatus(); updateCapturedPieces();
    }
    setPromotionModalVisible(false); setPromotionMove(null); setSelectedSquare(null); setPossibleMoves([]);
  };

  const handleStart = async () => { 
    try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
            Alert.alert("Autenticação não disponível", "O seu dispositivo não suporta ou não tem biometria configurada.");
            setGameState('config');
            return;
        }

        const authResult = await LocalAuthentication.authenticateAsync({
            promptMessage: "Autentique para iniciar a partida",
            cancelLabel: "Cancelar",
            disableDeviceFallback: false,
        });

        if (authResult.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setGameState('config');
        } else {
            Alert.alert("Autenticação Falhou", "Não foi possível verificar a sua identidade.");
        }
    } catch (error) {
        console.error(error);
        Alert.alert("Erro", "Ocorreu um erro durante a autenticação.");
    }
  };

  const handleTimeSelect = (timeInSeconds: number) => { 
    setWhiteTime(timeInSeconds);
    setBlackTime(timeInSeconds);
    restartGame(true);
  };

  const restartGame = (fromStart: boolean = false) => { 
    if(!fromStart) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    game.reset();
    setBoard([...game.board()]);
    setWinner(null);
    setLastMove(null);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setCapturedPieces({w:[], b:[]});
    setMaterialAdvantage({w: 0, b: 0});
    if(fromStart) {
        setGameState('playing');
    } else {
        setGameState('initial');
    }
    setStatus('Vez das Brancas');
  };
  
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const renderContent = () => {
    switch (gameState) {
      case 'playing':
      case 'gameOver':
        return (
          <>
            <PlayerHUD time={blackTime} captured={capturedPieces.w} advantage={materialAdvantage.w} />
            <View style={styles.boardContainer}>
              <View style={styles.board}>
                {board.map((row, rowIndex) => row.map((p, colIndex) => {
                  const squareName = `${files[colIndex]}${ranks[rowIndex]}` as Square;
                  const isLightSquare = (rowIndex + colIndex) % 2 !== 0;
                  const isLast = lastMove?.from === squareName || lastMove?.to === squareName;
                  return (
                    <TouchableOpacity key={squareName} style={[styles.square, { backgroundColor: isLightSquare ? PALETTE.boardLight : PALETTE.boardDark }]} onPress={() => handleSquarePress(squareName)}>
                      {isLast && <View style={[styles.highlight, { backgroundColor: PALETTE.primary, opacity: 0.4 }]} />}
                      {p && <Text style={styles.pieceEmoji}>{PIECE_EMOJI_MAP[p.color][p.type]}</Text>}
                      {selectedSquare === squareName && <View style={[styles.highlight, { borderWidth: 4, borderColor: PALETTE.highlight }]} />}
                      {possibleMoves.includes(squareName) && (<View style={[styles.highlight, styles.possibleMoveDot]}/>)}
                    </TouchableOpacity>
                  );
                }))}
              </View>
            </View>
            <PlayerHUD time={whiteTime} captured={capturedPieces.b} advantage={materialAdvantage.b} />
            <View style={styles.footer}>
                <View style={styles.statusBox}>
                     <Text style={[styles.statusText, game.inCheck() && styles.checkText]}>{status}</Text>
                </View>
                {gameState === 'gameOver' && (
                    <>
                        <Text style={styles.winnerText}>{winner}</Text>
                        <Pressable onPress={() => restartGame(false)} style={({ pressed }) => [styles.resetButton, pressed && { opacity: 0.8 }]}>
                            <Text style={styles.resetButtonText}>NOVA PARTIDA</Text>
                        </Pressable>
                    </>
                )}
            </View>
          </>
        );

      case 'config':
        return (
            <View style={styles.centeredView}>
                <Text style={styles.configTitle}>ESCOLHA O TEMPO</Text>
                <Pressable onPress={() => handleTimeSelect(120)} style={({ pressed }) => [styles.timeButton, pressed && { opacity: 0.8 }]}><Text style={styles.timeButtonText}>2 MINUTOS</Text></Pressable>
                <Pressable onPress={() => handleTimeSelect(300)} style={({ pressed }) => [styles.timeButton, pressed && { opacity: 0.8 }]}><Text style={styles.timeButtonText}>5 MINUTOS</Text></Pressable>
                <Pressable onPress={() => handleTimeSelect(600)} style={({ pressed }) => [styles.timeButton, pressed && { opacity: 0.8 }]}><Text style={styles.timeButtonText}>10 MINUTOS</Text></Pressable>
            </View>
        );
      case 'initial':
      default:
        return (
            <View style={styles.centeredView}>
                <Pressable onPress={handleStart} style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.8 }]}>
                    <Text style={styles.startButtonText}>INICIAR PARTIDA</Text>
                </Pressable>
            </View>
        );
    }
  };

  return (
    <LinearGradient colors={[PALETTE.background, PALETTE.background_darker]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: "Xadrez", headerStyle: { backgroundColor: PALETTE.background_darker }, headerTintColor: PALETTE.textPrimary, headerTitleStyle: { fontFamily: 'Orbitron-Bold' } }} />
        <StatusBar barStyle="light-content" />
        <PromotionModal visible={isPromotionModalVisible} onPromote={handlePromotion} />
        {renderContent()}
      </SafeAreaView>
    </LinearGradient>
  );
}

// ==================================
// ESTILOS
// ==================================
const styles = StyleSheet.create({
  container: { flex: 1, },
  safeArea: { flex: 1, alignItems: 'center', justifyContent: 'center', },
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%'},
  startButton: { backgroundColor: PALETTE.primary, paddingVertical: 20, paddingHorizontal: 50, borderRadius: 15, shadowColor: PALETTE.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 8, },
  startButtonText: { color: PALETTE.background_darker, fontSize: 20, fontFamily: 'Orbitron-Bold', letterSpacing: 2 },
  winnerText: { fontSize: 24, fontFamily: 'Orbitron-Bold', color: PALETTE.primary, textAlign: 'center', marginBottom: 20, },
  configTitle: { fontSize: 24, fontFamily: 'Orbitron-Bold', color: PALETTE.textPrimary, marginBottom: 40,},
  timeButton: { backgroundColor: PALETTE.cardBackground, paddingVertical: 20, width: '80%', alignItems: 'center', borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  timeButtonText: { color: PALETTE.textPrimary, fontFamily: 'Orbitron-Regular', fontSize: 18,},
  
  hudContainer: { width: '95%', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center', flex: 1, flexDirection: 'row'},
  playerTimer: { fontFamily: 'Orbitron-Bold', fontSize: 22, color: PALETTE.textPrimary, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, overflow: 'hidden' },
  capturedPiecesContainer: { flexDirection: 'row', flex: 1, alignItems: 'center', flexWrap: 'wrap' },
  capturedPieceEmoji: { fontSize: 18, marginRight: 2 },
  advantageText: { marginLeft: 8, fontSize: 16, color: PALETTE.textSecondary, fontWeight: 'bold'},
  
  statusBox: { flex: 2, alignItems: 'center' },
  statusText: { fontSize: 16, fontFamily: 'Orbitron-Bold', color: PALETTE.textPrimary, textAlign: 'center', },
  checkText: { color: PALETTE.danger, },
  
  boardContainer: { width: BOARD_SIZE, height: BOARD_SIZE, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 20, },
  board: { width: '100%', height: '100%', flexDirection: 'row', flexWrap: 'wrap', borderRadius: 8, overflow: 'hidden' },
  square: { width: SQUARE_SIZE, height: SQUARE_SIZE, alignItems: 'center', justifyContent: 'center' },
  highlight: { width: '100%', height: '100%', position: 'absolute' },
  possibleMoveDot: { width: SQUARE_SIZE * 0.35, height: SQUARE_SIZE * 0.35, borderRadius: SQUARE_SIZE * 0.175, backgroundColor: 'rgba(0, 0, 0, 0.4)', alignSelf: 'center' },
  pieceEmoji: { fontSize: SQUARE_SIZE * 0.7, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: {width: 1, height: 2}, textShadowRadius: 3},

  footer: { alignItems: 'center', justifyContent: 'center', position: 'absolute', bottom: '15%' },
  resetButton: { backgroundColor: PALETTE.cardBackground, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', },
  resetButtonText: { color: PALETTE.textSecondary, fontFamily: 'Orbitron-Bold', fontSize: 14, letterSpacing: 1, },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center'},
  modalContent: { backgroundColor: PALETTE.cardBackground, padding: 20, borderRadius: 10, alignItems: 'center', elevation: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 18, fontFamily: 'Orbitron-Bold', marginBottom: 20, color: PALETTE.textPrimary },
  promotionOptions: { flexDirection: 'row' },
  promotionButton: { marginHorizontal: 5, width: SQUARE_SIZE, height: SQUARE_SIZE, justifyContent: 'center', alignItems: 'center', backgroundColor: PALETTE.boardLight, borderRadius: 8 },
});
