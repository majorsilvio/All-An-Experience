import * as SQLite from 'expo-sqlite';

// Abre um único banco de dados para todo o aplicativo
const db = SQLite.openDatabaseSync('games_library.db');

/**
 * Inicializa o banco de dados, criando TODAS as tabelas necessárias.
 * Esta função deve ser chamada uma vez quando o aplicativo é iniciado.
 */
export const initDB = () => {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    -- Tabela para os jogos favoritados
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY NOT NULL,
      gameTitle TEXT UNIQUE NOT NULL
    );

    -- NOVA TABELA: Para salvar o estado dos jogos
    CREATE TABLE IF NOT EXISTS saved_games (
      id TEXT PRIMARY KEY NOT NULL, -- Ex: 'chess'
      fen TEXT NOT NULL,
      whiteTime INTEGER NOT NULL,
      blackTime INTEGER NOT NULL,
      lastPlayed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

// ===============================================
// Funções para a tabela 'favorites'
// ===============================================

export const getFavorites = (): Set<string> => {
  const allRows = db.getAllSync<{ gameTitle: string }>('SELECT gameTitle FROM favorites');
  return new Set(allRows.map(row => row.gameTitle));
};

export const addFavorite = (title: string) => {
  db.runSync('INSERT OR IGNORE INTO favorites (gameTitle) VALUES (?)', title);
};

export const removeFavorite = (title: string) => {
  db.runSync('DELETE FROM favorites WHERE gameTitle = ?', title);
};


// ===============================================
// Funções para a tabela 'saved_games' (Xadrez)
// ===============================================

/**
 * Salva ou atualiza o estado atual do jogo de xadrez.
 * O 'id' é fixo como 'chess' para ter apenas um slot de save.
 */
export const saveChessGame = (fen: string, whiteTime: number, blackTime: number) => {
  db.runSync(
    'INSERT OR REPLACE INTO saved_games (id, fen, whiteTime, blackTime) VALUES (?, ?, ?, ?)',
    'chess',
    fen,
    whiteTime,
    blackTime
  );
};

/**
 * Carrega o estado do jogo de xadrez salvo, se existir.
 * @returns O objeto do jogo salvo ou null se não houver jogo.
 */
export const loadChessGame = (): { fen: string, whiteTime: number, blackTime: number } | null => {
  const result = db.getFirstSync<{ fen: string, whiteTime: number, blackTime: number }>(
    "SELECT fen, whiteTime, blackTime FROM saved_games WHERE id = 'chess'"
  );
  return result;
};

/**
 * Deleta o jogo de xadrez salvo. Útil ao iniciar uma "Nova Partida".
 */
export const deleteChessGame = () => {
  db.runSync("DELETE FROM saved_games WHERE id = 'chess'");
};