import React from 'react';
import { Text, TextStyle } from 'react-native';

interface EmojiProps {
  name: string;
  size?: number;
  style?: TextStyle;
}

// Mapeamento de nomes para códigos unicode dos emojis
const EMOJI_MAP: Record<string, string> = {
  // Jogos e entretenimento
  'game': '🎮',
  'chess': '♟️',
  'puzzle': '🧩',
  'tic-tac-toe': '⭕',
  'rocket': '🚀',
  'spiral': '🌀',
  'bulb': '💡',
  'cards': '🃏',
  'hangman': '🤔',
  'bomb': '💣',
  
  // Símbolos e interface
  'heart': '❤️',
  'star': '⭐',
  'star-outline': '☆',
  'star-filled': '★',
  'lock': '🔒',
  'search': '🔍',
  'trophy': '🏆',
  
  // Números e contadores
  'one': '1️⃣',
  'two': '2️⃣',
  'three': '3️⃣',
  'four': '4️⃣',
  'five': '5️⃣',
  'six': '6️⃣',
  'seven': '7️⃣',
  'eight': '8️⃣',
  'nine': '9️⃣',
  'zero': '0️⃣',
  
  // Expressões e feedback
  'smile': '😀',
  'laugh': '😂',
  'cool': '😎',
  'thinking': '🤔',
  'party': '🥳',
  'sad': '😢',
  'angry': '😠',
  
  // Cores (usando círculos coloridos)
  'red': '🔴',
  'blue': '🔵',
  'green': '🟢',
  'yellow': '🟡',
  'purple': '🟣',
  'orange': '🟠',
  'black': '⚫',
  'white': '⚪',
  
  // Direções e navegação
  'up': '⬆️',
  'down': '⬇️',
  'left': '⬅️',
  'right': '➡️',
  'check': '✅',
  'cross': '❌',
  'warning': '⚠️',
  'info': 'ℹ️',
  
  // Extras para jogos
  'fire': '🔥',
  'crown': '👑',
  'gem': '💎',
  'coin': '🪙',
  'target': '🎯',
  'dice': '🎲',
  'music': '🎵',
  'sound': '🔊',
  'mute': '🔇',
};

export const Emoji: React.FC<EmojiProps> = ({ name, size = 24, style }) => {
  const emoji = EMOJI_MAP[name] || name; // Se não encontrar no mapa, usa o próprio name como fallback
  
  return (
    <Text 
      style={[
        {
          fontSize: size,
          // Força o uso da fonte do sistema para emojis
          fontFamily: 'System',
          // Garante que o emoji seja renderizado corretamente
          textAlign: 'center',
          includeFontPadding: false,
        },
        style
      ]}
      // Evita quebra de linha
      numberOfLines={1}
      // Remove espaçamento extra
      allowFontScaling={false}
    >
      {emoji}
    </Text>
  );
};

// Componente específico para corações (vidas)
export const HeartIcon: React.FC<{ size?: number; filled?: boolean; style?: TextStyle }> = ({ 
  size = 24, 
  filled = true, 
  style 
}) => (
  <Emoji 
    name={filled ? 'heart' : '🤍'} 
    size={size} 
    style={style} 
  />
);

// Componente específico para estrelas
export const StarIcon: React.FC<{ size?: number; filled?: boolean; style?: TextStyle }> = ({ 
  size = 24, 
  filled = false, 
  style 
}) => (
  <Emoji 
    name={filled ? 'star-filled' : 'star-outline'} 
    size={size} 
    style={style} 
  />
);

// Componente específico para ícone de favorito
export const FavoriteIcon: React.FC<{ size?: number; filled?: boolean; style?: TextStyle }> = ({ 
  size = 22, 
  filled = false, 
  style 
}) => (
  <Text 
    style={[
      {
        fontSize: size,
        fontFamily: 'System',
        textAlign: 'center',
        includeFontPadding: false,
      },
      style
    ]}
    numberOfLines={1}
    allowFontScaling={false}
  >
    {filled ? '★' : '☆'}
  </Text>
);

export default Emoji;
