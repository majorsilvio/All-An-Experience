// ===================================================================
// BANCO DE DADOS DE PERGUNTAS LOCAIS
// ===================================================================

export interface Question {
  category: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
  used?: boolean;
}

export const QUESTIONS_DATABASE: Question[] = [
  // ===================================================================
  // PERGUNTAS FÁCEIS (Níveis 1-5)
  // ===================================================================
  {
    category: "Conhecimentos Gerais",
    type: "multiple",
    difficulty: "easy",
    question: "Qual é a capital do Brasil?",
    correct_answer: "Brasília",
    incorrect_answers: ["São Paulo", "Rio de Janeiro", "Belo Horizonte"]
  },
  {
    category: "Conhecimentos Gerais", 
    type: "multiple",
    difficulty: "easy",
    question: "Quantos dias tem um ano bissexto?",
    correct_answer: "366",
    incorrect_answers: ["365", "364", "367"]
  },
  {
    category: "História",
    type: "multiple", 
    difficulty: "easy",
    question: "Em que ano o Brasil foi descoberto?",
    correct_answer: "1500",
    incorrect_answers: ["1498", "1502", "1504"]
  },
  {
    category: "Geografia",
    type: "multiple",
    difficulty: "easy", 
    question: "Qual é o maior país do mundo?",
    correct_answer: "Rússia",
    incorrect_answers: ["Canadá", "China", "Estados Unidos"]
  },
  {
    category: "Ciências",
    type: "multiple",
    difficulty: "easy",
    question: "Qual é o planeta mais próximo do Sol?",
    correct_answer: "Mercúrio", 
    incorrect_answers: ["Vênus", "Terra", "Marte"]
  },
  {
    category: "Esportes",
    type: "multiple",
    difficulty: "easy",
    question: "Quantos jogadores tem um time de futebol em campo?",
    correct_answer: "11",
    incorrect_answers: ["10", "12", "9"]
  },
  {
    category: "Matemática",
    type: "multiple",
    difficulty: "easy",
    question: "Quanto é 2 + 2?",
    correct_answer: "4",
    incorrect_answers: ["3", "5", "6"]
  },
  {
    category: "História",
    type: "multiple",
    difficulty: "easy",
    question: "Quem pintou a Mona Lisa?",
    correct_answer: "Leonardo da Vinci",
    incorrect_answers: ["Michelangelo", "Pablo Picasso", "Van Gogh"]
  },
  {
    category: "Geografia",
    type: "multiple",
    difficulty: "easy",
    question: "Em que continente fica o Egito?",
    correct_answer: "África",
    incorrect_answers: ["Ásia", "Europa", "América"]
  },
  {
    category: "Ciências",
    type: "multiple",
    difficulty: "easy",
    question: "Qual é a fórmula química da água?",
    correct_answer: "H2O",
    incorrect_answers: ["CO2", "O2", "H2SO4"]
  },

  // ===================================================================
  // PERGUNTAS MÉDIAS (Níveis 6-10)
  // ===================================================================
  {
    category: "História",
    type: "multiple",
    difficulty: "medium",
    question: "Em que ano terminou a Segunda Guerra Mundial?",
    correct_answer: "1945",
    incorrect_answers: ["1944", "1946", "1943"]
  },
  {
    category: "Geografia",
    type: "multiple",
    difficulty: "medium",
    question: "Qual é a capital da Austrália?",
    correct_answer: "Canberra",
    incorrect_answers: ["Sydney", "Melbourne", "Perth"]
  },
  {
    category: "Ciências",
    type: "multiple",
    difficulty: "medium",
    question: "Qual é o elemento químico com símbolo Au?",
    correct_answer: "Ouro",
    incorrect_answers: ["Prata", "Alumínio", "Arsênio"]
  },
  {
    category: "Literatura",
    type: "multiple",
    difficulty: "medium",
    question: "Quem escreveu 'Dom Casmurro'?",
    correct_answer: "Machado de Assis",
    incorrect_answers: ["José de Alencar", "Clarice Lispector", "Guimarães Rosa"]
  },
  {
    category: "Matemática",
    type: "multiple",
    difficulty: "medium",
    question: "Qual é a raiz quadrada de 144?",
    correct_answer: "12",
    incorrect_answers: ["10", "14", "16"]
  },
  {
    category: "História",
    type: "multiple",
    difficulty: "medium",
    question: "Quem foi o primeiro presidente do Brasil?",
    correct_answer: "Deodoro da Fonseca",
    incorrect_answers: ["Floriano Peixoto", "Getúlio Vargas", "Juscelino Kubitschek"]
  },
  {
    category: "Geografia",
    type: "multiple",
    difficulty: "medium",
    question: "Qual é o rio mais longo do mundo?",
    correct_answer: "Rio Nilo",
    incorrect_answers: ["Rio Amazonas", "Rio Mississippi", "Rio Yangtzé"]
  },
  {
    category: "Ciências",
    type: "multiple",
    difficulty: "medium",
    question: "Quantos ossos tem o corpo humano adulto?",
    correct_answer: "206",
    incorrect_answers: ["204", "208", "210"]
  },
  {
    category: "Arte",
    type: "multiple",
    difficulty: "medium",
    question: "Qual artista cortou a própria orelha?",
    correct_answer: "Vincent van Gogh",
    incorrect_answers: ["Pablo Picasso", "Salvador Dalí", "Henri Matisse"]
  },
  {
    category: "Tecnologia",
    type: "multiple",
    difficulty: "medium",
    question: "Quem fundou a Microsoft?",
    correct_answer: "Bill Gates",
    incorrect_answers: ["Steve Jobs", "Mark Zuckerberg", "Elon Musk"]
  },

  // ===================================================================
  // PERGUNTAS DIFÍCEIS (Níveis 11-15)
  // ===================================================================
  {
    category: "História",
    type: "multiple",
    difficulty: "hard",
    question: "Em que ano foi assinada a Magna Carta?",
    correct_answer: "1215",
    incorrect_answers: ["1216", "1214", "1217"]
  },
  {
    category: "Ciências",
    type: "multiple",
    difficulty: "hard",
    question: "Qual é a velocidade da luz no vácuo?",
    correct_answer: "299.792.458 m/s",
    incorrect_answers: ["300.000.000 m/s", "299.000.000 m/s", "298.792.458 m/s"]
  },
  {
    category: "Geografia",
    type: "multiple",
    difficulty: "hard",
    question: "Qual é a capital do Cazaquistão?",
    correct_answer: "Nur-Sultan",
    incorrect_answers: ["Almaty", "Shymkent", "Aktobe"]
  },
  {
    category: "Literatura",
    type: "multiple",
    difficulty: "hard",
    question: "Quem escreveu 'Ulysses'?",
    correct_answer: "James Joyce",
    incorrect_answers: ["Virginia Woolf", "T.S. Eliot", "Ezra Pound"]
  },
  {
    category: "Matemática",
    type: "multiple",
    difficulty: "hard",
    question: "Qual é o valor de π (pi) com 4 casas decimais?",
    correct_answer: "3.1416",
    incorrect_answers: ["3.1415", "3.1417", "3.1414"]
  },
  {
    category: "História",
    type: "multiple",
    difficulty: "hard",
    question: "Qual imperador romano legalizou o cristianismo?",
    correct_answer: "Constantino",
    incorrect_answers: ["Júlio César", "Augusto", "Trajano"]
  },
  {
    category: "Ciências",
    type: "multiple",
    difficulty: "hard",
    question: "Qual é a partícula subatômica descoberta por Murray Gell-Mann?",
    correct_answer: "Quark",
    incorrect_answers: ["Neutrino", "Múon", "Táquion"]
  },
  {
    category: "Arte",
    type: "multiple",
    difficulty: "hard",
    question: "Em que museu está exposta a obra 'Guernica' de Picasso?",
    correct_answer: "Museu Reina Sofía",
    incorrect_answers: ["Museu do Prado", "Louvre", "MoMA"]
  },
  {
    category: "Geografia",
    type: "multiple",
    difficulty: "hard",
    question: "Qual é o ponto mais profundo dos oceanos?",
    correct_answer: "Fossa das Marianas",
    incorrect_answers: ["Fossa de Porto Rico", "Fossa do Peru-Chile", "Fossa das Filipinas"]
  },
  {
    category: "Filosofia",
    type: "multiple",
    difficulty: "hard",
    question: "Quem escreveu 'Crítica da Razão Pura'?",
    correct_answer: "Immanuel Kant",
    incorrect_answers: ["Hegel", "Nietzsche", "Schopenhauer"]
  },

  // ===================================================================
  // PERGUNTAS ADICIONAIS PARA GARANTIR VARIEDADE
  // ===================================================================
  {
    category: "Conhecimentos Gerais",
    type: "multiple",
    difficulty: "easy",
    question: "Qual é a cor da caixa preta dos aviões?",
    correct_answer: "Laranja",
    incorrect_answers: ["Preta", "Vermelha", "Amarela"]
  },
  {
    category: "Esportes",
    type: "multiple",
    difficulty: "medium",
    question: "Em que ano o Brasil ganhou sua primeira Copa do Mundo?",
    correct_answer: "1958",
    incorrect_answers: ["1962", "1970", "1950"]
  },
  {
    category: "Tecnologia",
    type: "multiple",
    difficulty: "hard",
    question: "Qual foi o primeiro computador eletrônico digital?",
    correct_answer: "ENIAC",
    incorrect_answers: ["UNIVAC", "EDVAC", "Mark I"]
  },
  {
    category: "Música",
    type: "multiple",
    difficulty: "medium",
    question: "Quantas cordas tem um violão clássico?",
    correct_answer: "6",
    incorrect_answers: ["4", "5", "7"]
  },
  {
    category: "Cinema",
    type: "multiple",
    difficulty: "easy",
    question: "Qual filme ganhou o Oscar de Melhor Filme em 1994?",
    correct_answer: "Forrest Gump",
    incorrect_answers: ["Pulp Fiction", "O Rei Leão", "Speed"]
  }
];

// ===================================================================
// FUNÇÕES UTILITÁRIAS
// ===================================================================

export const getQuestionsByDifficulty = (difficulty: 'easy' | 'medium' | 'hard', count: number = 10): Question[] => {
  const questions = QUESTIONS_DATABASE.filter(q => q.difficulty === difficulty && !q.used);
  
  // Embaralhar as perguntas
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  
  // Retornar o número solicitado
  return shuffled.slice(0, count);
};

export const getRandomQuestion = (difficulty: 'easy' | 'medium' | 'hard'): Question | null => {
  const questions = getQuestionsByDifficulty(difficulty, 1);
  return questions.length > 0 ? questions[0] : null;
};

export const markQuestionAsUsed = (question: Question): void => {
  const index = QUESTIONS_DATABASE.findIndex(q => 
    q.question === question.question && 
    q.correct_answer === question.correct_answer
  );
  
  if (index !== -1) {
    QUESTIONS_DATABASE[index].used = true;
  }
};

export const resetAllQuestions = (): void => {
  QUESTIONS_DATABASE.forEach(q => q.used = false);
};

export const getQuestionsCount = (): { easy: number; medium: number; hard: number; total: number } => {
  const easy = QUESTIONS_DATABASE.filter(q => q.difficulty === 'easy' && !q.used).length;
  const medium = QUESTIONS_DATABASE.filter(q => q.difficulty === 'medium' && !q.used).length;
  const hard = QUESTIONS_DATABASE.filter(q => q.difficulty === 'hard' && !q.used).length;
  
  return {
    easy,
    medium,
    hard,
    total: easy + medium + hard
  };
};
