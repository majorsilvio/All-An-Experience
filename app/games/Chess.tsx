import { deleteChessGame, initDB, loadChessGame, saveChessGame } from '@/services/database';
import { Chess, Color, Piece, PieceSymbol, Square } from 'chess.js';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FONTS } from '../../hooks/useFonts';
import { useThemePalette } from '../../hooks/useThemePalette';

// --- CONSTANTES E COMPONENTES DE UI ---

const PIECE_EMOJI_MAP: { [c in Color]: { [p in PieceSymbol]: string } } = { w: { p: '♙', r: '♖', n: '♘', b: '♗', q: '♕', k: '♔' }, b: { p: '♟︎', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚' } };
const { width, height } = Dimensions.get('window');
const BOARD_SIZE = Math.min(width * 0.95, height * 0.6);
const SQUARE_SIZE = BOARD_SIZE / 8;
const PIECE_VALUES: {[key in PieceSymbol]: number} = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

const PromotionModal = ({ visible, onPromote, palette }: { visible: boolean; onPromote: (piece: PieceSymbol) => void; palette: any }) => {
  const styles = createModalStyles(palette);
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>PROMOVER PEÃO</Text>
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
};

const PlayerHUD = ({ time, captured, advantage, palette }: { time: number, captured: Piece[], advantage: number, palette: any }) => {
  const styles = createHUDStyles(palette);
  return (
    <View style={styles.hudContainer}>
        <View style={styles.capturedPiecesContainer}>
            {captured.map((p, i) => (
              <Text key={`${p.color}_cap_${i}`} style={[
                styles.capturedPieceEmoji,
                p.color === 'b' && { color: palette.textPrimary } 
              ]}>
                {PIECE_EMOJI_MAP[p.color][p.type]}
              </Text>
            ))}
            {advantage > 0 && <Text style={styles.advantageText}>+{advantage}</Text>}
        </View>
        <Text style={styles.playerTimer}>{formatTime(time)}</Text>
    </View>
  );
};

// ==================================
// COMPONENTE PRINCIPAL DO JOGO
// ==================================
export default function ChessScreen() {
  const palette = useThemePalette();
  const [gameState, setGameState] = useState<'loading' | 'initial_choice' | 'initial' | 'config' | 'playing' | 'gameOver'>('loading');
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

  // Proteção contra paleta não inicializada
  if (!palette) {
    return (
      <LinearGradient colors={['#1A1A1A', '#0D0D0D']} style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{color: '#BFFF00', fontSize: 16}}>Carregando...</Text>
      </LinearGradient>
    );
  }

  // Criar estilos dinâmicos
  const styles = createStyles(palette);

  // Cores dinâmicas do tabuleiro
  const getBoardColors = () => ({
    boardLight: palette.cardBackground,
    boardDark: palette.primary_darker,
    highlight: palette.neonAccent + '80', // 80 = 50% opacity em hex
    danger: palette.warningAccent
  });

  useEffect(() => {
    const initializeGame = () => {
      try {
        initDB();
        const savedGame = loadChessGame();
        if (savedGame?.fen) {
          setGameState('initial_choice');
        } else {
          setGameState('initial');
        }
      } catch (e) {
        console.error("Erro ao inicializar o xadrez:", e);
        Alert.alert("Erro de Carregamento", "Não foi possível verificar se existe um jogo salvo.");
        setGameState('initial');
      }
    };
    initializeGame();
  }, []);

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
  }, [game]);
  
  // AJUSTE FINAL: Lógica do Timer corrigida
  useEffect(() => { 
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (gameState === 'playing' && !winner && game.history().length > 0) {
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
      }
      return () => { if (timerRef.current) clearInterval(timerRef.current) };
   }, [gameState, winner, game.turn()]); // GATILHO CORRIGIDO: game.turn()

  const makeMove = (move: { from: Square; to: Square; promotion?: PieceSymbol }) => {
    try {
      const moveResult = game.move(move);
      if (moveResult) {
        setLastMove({from: moveResult.from, to: moveResult.to});
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setBoard([...game.board()]);
        updateStatus();
        updateCapturedPieces();
        saveChessGame(game.fen(), whiteTime, blackTime);
      }
    } catch (e) { /* movimento inválido */ } 
    finally {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  const handleSquarePress = (square: Square) => { 
    if (gameState !== 'playing' || winner) return;
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
      makeMove({ from: selectedSquare, to: square });
    }
  };

  const handlePromotion = (piece: PieceSymbol) => { 
    if (promotionMove) {
      makeMove({ ...promotionMove, promotion: piece });
    }
    setPromotionModalVisible(false);
    setPromotionMove(null);
  };
  
  const handleStart = () => { setGameState('config'); };
  
  const handleContinueGame = () => {
    const savedGame = loadChessGame();
    if (savedGame) {
      game.load(savedGame.fen);
      setBoard([...game.board()]);
      setWhiteTime(savedGame.whiteTime);
      setBlackTime(savedGame.blackTime);
      updateStatus();
      updateCapturedPieces();
      setGameState('playing');
    }
  };

  const handleNewGame = () => {
    deleteChessGame();
    setGameState('config');
  };
  
  const handleTimeSelect = (timeInSeconds: number) => { 
    restartGame(true);
    setWhiteTime(timeInSeconds);
    setBlackTime(timeInSeconds);
    saveChessGame(game.fen(), timeInSeconds, timeInSeconds);
  };
  
  const restartGame = (fromStart: boolean = false) => { 
    if(!fromStart) {
      deleteChessGame();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    game.reset();
    setBoard([...game.board()]);
    setWinner(null);
    setLastMove(null);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setCapturedPieces({w:[], b:[]});
    setMaterialAdvantage({w: 0, b: 0});
    setGameState(fromStart ? 'playing' : 'initial');
    setStatus('Vez das Brancas');
  };
  
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const renderContent = () => {
    const boardColors = getBoardColors();
    
    switch (gameState) {
      case 'loading': return <View style={styles.centeredView}><ActivityIndicator size="large" color={palette.primary} /></View>;
      case 'initial_choice': return (
          <View style={styles.centeredView}>
            <Pressable onPress={handleContinueGame} style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.8 }]}><Text style={styles.startButtonText}>CONTINUAR PARTIDA</Text></Pressable>
            <Pressable onPress={handleNewGame} style={({ pressed }) => [styles.timeButton, {marginTop: 20}, pressed && { opacity: 0.8 }]}><Text style={styles.timeButtonText}>NOVO JOGO</Text></Pressable>
          </View>
      );
      case 'initial': return (
          <View style={styles.centeredView}>
            <Pressable onPress={handleStart} style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.8 }]}><Text style={styles.startButtonText}>INICIAR PARTIDA</Text></Pressable>
          </View>
      );
      case 'config': return (
            <View style={styles.centeredView}>
                <Text style={styles.configTitle}>ESCOLHA O TEMPO</Text>
                <Pressable onPress={() => handleTimeSelect(180)} style={({ pressed }) => [styles.timeButton, pressed && { opacity: 0.8 }]}><Text style={styles.timeButtonText}>3 MINUTOS</Text></Pressable>
                <Pressable onPress={() => handleTimeSelect(300)} style={({ pressed }) => [styles.timeButton, pressed && { opacity: 0.8 }]}><Text style={styles.timeButtonText}>5 MINUTOS</Text></Pressable>
                <Pressable onPress={() => handleTimeSelect(600)} style={({ pressed }) => [styles.timeButton, pressed && { opacity: 0.8 }]}><Text style={styles.timeButtonText}>10 MINUTOS</Text></Pressable>
            </View>
      );
      case 'playing':
      case 'gameOver':
        return (
          <>
            <PlayerHUD time={blackTime} captured={capturedPieces.w} advantage={materialAdvantage.w} palette={palette} />
            <View style={styles.boardContainer}>
              <View style={styles.board}>
                {board.map((row, rowIndex) => row.map((p, colIndex) => {
                  const squareName = `${files[colIndex]}${ranks[rowIndex]}` as Square;
                  const isLightSquare = (rowIndex + colIndex) % 2 !== 0;
                  const isLast = lastMove?.from === squareName || lastMove?.to === squareName;
                  return (
                    <TouchableOpacity key={squareName} style={[styles.square, { backgroundColor: isLightSquare ? boardColors.boardLight : boardColors.boardDark }]} onPress={() => handleSquarePress(squareName)}>
                      {isLast && <View style={[styles.highlight, { backgroundColor: palette.primary, opacity: 0.4 }]} />}
                      {p && <Text style={styles.pieceEmoji}>{PIECE_EMOJI_MAP[p.color][p.type]}</Text>}
                      {selectedSquare === squareName && <View style={[styles.highlight, { borderWidth: 4, borderColor: boardColors.highlight }]} />}
                      {possibleMoves.includes(squareName) && (<View style={[styles.highlight, styles.possibleMoveDot]}/>)}
                    </TouchableOpacity>
                  );
                }))}
              </View>
            </View>
            <PlayerHUD time={whiteTime} captured={capturedPieces.b} advantage={materialAdvantage.b} palette={palette} />
            <View style={styles.footer}>
              <View style={styles.statusBox}><Text style={[styles.statusText, game.inCheck() && styles.checkText]}>{status}</Text></View>
              {gameState === 'gameOver' && (
                  <>
                    <Text style={styles.winnerText}>{winner}</Text>
                    <Pressable onPress={() => restartGame(false)} style={({ pressed }) => [styles.resetButton, pressed && { opacity: 0.8 }]}>
                        <Text style={styles.resetButtonText}>NOVO JOGO</Text>
                    </Pressable>
                  </>
              )}
            </View>
          </>
        );
      default: return null;
    }
  };

  return (
    <LinearGradient colors={[palette.background, palette.background_darker]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <PromotionModal visible={isPromotionModalVisible} onPromote={handlePromotion} palette={palette} />
        {renderContent()}
      </SafeAreaView>
    </LinearGradient>
  );
}

// --- ESTILOS DINÂMICOS ---
const createStyles = (palette: any) => StyleSheet.create({
  container: { flex: 1, },
  safeArea: { flex: 1, alignItems: 'center', justifyContent: 'center', },
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%'},
  startButton: { backgroundColor: palette.primary, paddingVertical: 20, paddingHorizontal: 50, borderRadius: 15, shadowColor: palette.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 8, },
  startButtonText: { color: palette.background_darker, fontSize: 20, fontFamily: FONTS.primary, letterSpacing: 2 },
  winnerText: { fontSize: 24, fontFamily: FONTS.primary, color: palette.primary, textAlign: 'center', marginBottom: 20, },
  configTitle: { fontSize: 24, fontFamily: FONTS.primary, color: palette.textPrimary, marginBottom: 40,},
  timeButton: { backgroundColor: palette.cardBackground, paddingVertical: 20, width: '80%', alignItems: 'center', borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  timeButtonText: { color: palette.textPrimary, fontFamily: FONTS.regular, fontSize: 18,},
  statusBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusText: { fontSize: 16, fontFamily: FONTS.primary, color: palette.textPrimary, textAlign: 'center', },
  checkText: { color: palette.warningAccent, },
  boardContainer: { width: BOARD_SIZE, height: BOARD_SIZE, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 20, },
  board: { width: '100%', height: '100%', flexDirection: 'row', flexWrap: 'wrap', borderRadius: 8, overflow: 'hidden' },
  square: { width: SQUARE_SIZE, height: SQUARE_SIZE, alignItems: 'center', justifyContent: 'center' },
  highlight: { width: '100%', height: '100%', position: 'absolute' },
  possibleMoveDot: { width: SQUARE_SIZE * 0.35, height: SQUARE_SIZE * 0.35, borderRadius: SQUARE_SIZE * 0.175, backgroundColor: 'rgba(0, 0, 0, 0.4)', alignSelf: 'center' },
  pieceEmoji: { fontSize: SQUARE_SIZE * 0.7, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: {width: 1, height: 2}, textShadowRadius: 3},
  footer: { flex: 1.5, width: '100%', alignItems: 'center', justifyContent: 'center',},
  resetButton: { backgroundColor: palette.cardBackground, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', },
  resetButtonText: { color: palette.textSecondary, fontFamily: FONTS.primary, fontSize: 14, letterSpacing: 1, },
});

const createModalStyles = (palette: any) => StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center'},
  modalContent: { backgroundColor: palette.cardBackground, padding: 20, borderRadius: 10, alignItems: 'center', elevation: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 18, fontFamily: FONTS.primary, marginBottom: 20, color: palette.textPrimary },
  promotionOptions: { flexDirection: 'row' },
  promotionButton: { marginHorizontal: 5, width: SQUARE_SIZE, height: SQUARE_SIZE, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.cardBackground, borderRadius: 8 },
  pieceEmoji: { fontSize: SQUARE_SIZE * 0.7, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: {width: 1, height: 2}, textShadowRadius: 3},
});

const createHUDStyles = (palette: any) => StyleSheet.create({
  hudContainer: { width: '95%', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center', flex: 1, flexDirection: 'row'},
  playerTimer: { fontFamily: FONTS.primary, fontSize: 22, color: palette.textPrimary, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, overflow: 'hidden' },
  capturedPiecesContainer: { flexDirection: 'row', flex: 1, alignItems: 'center', flexWrap: 'wrap', height: '100%' },
  capturedPieceEmoji: {
    fontSize: 18,
    marginRight: 2,
    textShadowColor: palette.primary,
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  advantageText: { marginLeft: 8, fontSize: 16, color: palette.textSecondary, fontWeight: 'bold'},
});