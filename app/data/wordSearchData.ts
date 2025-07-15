export interface WordSearchTheme {
  name: string;
  emoji: string;
  words: {
    easy: string[];
    medium: string[];
    hard: string[];
  };
}

export const WORD_SEARCH_THEMES: WordSearchTheme[] = [
  {
    name: 'Animais',
    emoji: '🐾',
    words: {
      easy: ['GATO', 'CAO', 'PATO', 'RATO', 'URSO', 'LEAO'],
      medium: ['ELEFANTE', 'GIRAFA', 'MACACO', 'TIGRE', 'ZEBRA', 'COBRA', 'CAVALO'],
      hard: ['RINOCERONTE', 'HIPOPOTAMO', 'CROCODILO', 'TUBARAO', 'BORBOLETA', 'FORMIGA', 'FLAMINGO']
    }
  },
  {
    name: 'Frutas',
    emoji: '🍎',
    words: {
      easy: ['MACA', 'UVA', 'PERA', 'KIWI', 'LIMA'],
      medium: ['BANANA', 'LARANJA', 'MORANGO', 'PESSEGO', 'MELANCIA', 'ABACAXI'],
      hard: ['FRAMBOESA', 'TANGERINA', 'BLUEBERRY', 'MARACUJA', 'GOIABA', 'PITANGA', 'JABUTICABA']
    }
  },
  {
    name: 'Cores',
    emoji: '🎨',
    words: {
      easy: ['AZUL', 'ROSA', 'ROXO', 'VERDE', 'PRETO'],
      medium: ['AMARELO', 'LARANJA', 'VIOLETA', 'MARROM', 'BRANCO', 'CINZA'],
      hard: ['TURQUESA', 'MAGENTA', 'CARMESIM', 'DOURADO', 'PRATEADO', 'BORDEAUX', 'ESMERALDA']
    }
  },
  {
    name: 'Esportes',
    emoji: '⚽',
    words: {
      easy: ['BOXE', 'JUDO', 'SURF', 'GOLF', 'TENIS'],
      medium: ['FUTEBOL', 'BASQUETE', 'VOLEI', 'NATACAO', 'CORRIDA', 'CICLISMO'],
      hard: ['BASQUETEBOL', 'HANDEBOL', 'ATLETISMO', 'GINASTICA', 'BADMINTON', 'WATERPOLO', 'ESCALADA']
    }
  },
  {
    name: 'Países',
    emoji: '🌍',
    words: {
      easy: ['BRASIL', 'PERU', 'CHILE', 'CHINA', 'INDIA'],
      medium: ['ARGENTINA', 'ALEMANHA', 'PORTUGAL', 'ESPANHA', 'ITALIA', 'FRANCA'],
      hard: ['DINAMARCA', 'AUSTRALIA', 'MADAGASCAR', 'TAILANDIA', 'SINGAPURA', 'VENEZUELA', 'FINLANDIA']
    }
  },
  {
    name: 'Profissões',
    emoji: '👨‍💼',
    words: {
      easy: ['CHEF', 'JUIZ', 'PILOTO', 'DENTISTA', 'MUSICO'],
      medium: ['MEDICO', 'ENFERMEIRO', 'PROFESSOR', 'BOMBEIRO', 'POLICIAL', 'ARQUITETO'],
      hard: ['ENGENHEIRO', 'VETERINARIO', 'FISIOTERAPEUTA', 'PSICOLOGO', 'ADVOGADO', 'CONTADOR', 'JORNALISTA']
    }
  }
];

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export const DIFFICULTY_CONFIG = {
  easy: {
    name: 'Fácil',
    gridSize: 10,
    wordsCount: 5,
    emoji: '😊',
    color: '#4CAF50'
  },
  medium: {
    name: 'Médio',
    gridSize: 12,
    wordsCount: 6,
    emoji: '🤔',
    color: '#FF9800'
  },
  hard: {
    name: 'Difícil',
    gridSize: 15,
    wordsCount: 7,
    emoji: '😤',
    color: '#F44336'
  }
};
