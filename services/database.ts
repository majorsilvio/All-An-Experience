import * as SQLite from 'expo-sqlite';

// Abre o banco de dados com nome estável
const db = SQLite.openDatabaseSync('chess_db.db');

/**
 * Inicializa o banco de dados criando as tabelas necessárias
 */
export const initDB = () => {
  try {
    // Configuração para melhor performance (fora da transação)
    db.execSync('PRAGMA journal_mode = WAL;');
    
    db.withTransactionSync(() => {
      // Tabela para salvar o estado do jogo de xadrez
      db.execSync(`
        CREATE TABLE IF NOT EXISTS chess_games (
          id TEXT PRIMARY KEY NOT NULL DEFAULT 'current_game',
          fen TEXT NOT NULL,
          whiteTime INTEGER NOT NULL,
          blackTime INTEGER NOT NULL,
          lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Tabela para os favoritos
      db.execSync(`
        CREATE TABLE IF NOT EXISTS favorites (
          id INTEGER PRIMARY KEY NOT NULL,
          gameTitle TEXT UNIQUE NOT NULL
        );
      `);
    });
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
    throw error;
  }
};

/**
 * Salva o estado atual do jogo de xadrez
 */
export const saveChessGame = (fen: string, whiteTime: number, blackTime: number) => {
  try {
    db.withTransactionSync(() => {
      db.runSync(
        `INSERT OR REPLACE INTO chess_games 
        (id, fen, whiteTime, blackTime) 
        VALUES (?, ?, ?, ?)`,
        'current_game',
        fen,
        whiteTime,
        blackTime
      );
    });
  } catch (error) {
    console.error('Erro ao salvar jogo:', error);
    throw error;
  }
};

/**
 * Carrega o jogo salvo do banco de dados
 */
export const loadChessGame = (): { 
  fen: string, 
  whiteTime: number, 
  blackTime: number 
} | null => {
  try {
    const result = db.getFirstSync<{ 
      fen: string, 
      whiteTime: number, 
      blackTime: number 
    }>(
      `SELECT fen, whiteTime, blackTime 
       FROM chess_games 
       WHERE id = 'current_game'`
    );
    
    return result || null;
  } catch (error) {
    console.error('Erro ao carregar jogo:', error);
    return null;
  }
};

/**
 * Remove o jogo salvo do banco de dados
 */
export const deleteChessGame = () => {
  try {
    db.withTransactionSync(() => {
      db.runSync(
        `DELETE FROM chess_games 
         WHERE id = 'current_game'`
      );
    });
  } catch (error) {
    console.error('Erro ao deletar jogo:', error);
    throw error;
  }
};

/**
 * Obtém todos os favoritos
 */
export const getFavorites = (): Set<string> => {
  try {
    const allRows = db.getAllSync<{ gameTitle: string }>(
      'SELECT gameTitle FROM favorites'
    );
    return new Set(allRows.map(row => row.gameTitle));
  } catch (error) {
    console.error('Erro ao carregar favoritos:', error);
    return new Set();
  }
};

/**
 * Adiciona um jogo aos favoritos
 */
export const addFavorite = (title: string) => {
  try {
    db.withTransactionSync(() => {
      db.runSync(
        'INSERT OR IGNORE INTO favorites (gameTitle) VALUES (?)',
        title
      );
    });
  } catch (error) {
    console.error('Erro ao adicionar favorito:', error);
    throw error;
  }
};

/**
 * Remove um jogo dos favoritos
 */
export const removeFavorite = (title: string) => {
  try {
    db.withTransactionSync(() => {
      db.runSync(
        'DELETE FROM favorites WHERE gameTitle = ?',
        title
      );
    });
  } catch (error) {
    console.error('Erro ao remover favorito:', error);
    throw error;
  }
};