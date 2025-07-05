import * as SQLite from 'expo-sqlite';

// Abre o banco de dados com nome estável
const db = SQLite.openDatabaseSync('chess_db.db');

/**
 * Inicializa o banco de dados criando as tabelas necessárias
 */
export const initDB = () => {
  try {
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

                  // Tabela para os recordes do Quebra-Cabeça
            db.execSync(`
                CREATE TABLE IF NOT EXISTS puzzle_records (
                    difficulty INTEGER PRIMARY KEY NOT NULL,
                    time INTEGER NOT NULL,
                    moves INTEGER NOT NULL
                );
            `);

      // Labyrinth Score
      db.execSync(`
        CREATE TABLE IF NOT EXISTS labyrinth_levels (
          level_index INTEGER PRIMARY KEY NOT NULL,
          is_unlocked INTEGER NOT NULL,
          stars_collected INTEGER NOT NULL DEFAULT 0
        );
      `);

      // Cosmic Corridor Score
      db.execSync(`
        CREATE TABLE IF NOT EXISTS cosmic_corridor_scores (
          id INTEGER PRIMARY KEY NOT NULL,
          highScore INTEGER NOT NULL
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
export const loadChessGame = (): { fen: string, whiteTime: number, blackTime: number } | null => {
  try {
    const result = db.getFirstSync<{ fen: string, whiteTime: number, blackTime: number }>(
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

/**
 * Cosmic Corridor High Score
 */
export const getCosmicCorridorHighScore = (): number => {
  const initialRecord = db.getFirstSync<{ count: number }>('SELECT COUNT(id) as count FROM cosmic_corridor_scores;');
  if (initialRecord?.count === 0) {
    db.runSync('INSERT INTO cosmic_corridor_scores (id, highScore) VALUES (1, 0);');
    return 0;
  }
  const result = db.getFirstSync<{ highScore: number }>("SELECT highScore FROM cosmic_corridor_scores WHERE id = 1");
  return result?.highScore ?? 0;
}

export const saveCosmicCorridorHighScore = (score: number) => {
  db.runSync("UPDATE cosmic_corridor_scores SET highScore = ? WHERE id = 1", score);
}

/**
 * Labyrinth Levels
 */
export const loadLabyrinthLevels = (): { level_index: number, is_unlocked: 1 | 0, stars_collected: number }[] => {
  // Corrigido: contar level_index e não id
  const countResult = db.getFirstSync<{ count: number }>('SELECT COUNT(level_index) as count FROM labyrinth_levels;');

  if (countResult?.count === 0) {
    db.withTransactionSync(() => {
      db.runSync('INSERT INTO labyrinth_levels (level_index, is_unlocked, stars_collected) VALUES (0, 1, 0);');
      for (let i = 1; i < 15; i++) {
        db.runSync('INSERT INTO labyrinth_levels (level_index, is_unlocked, stars_collected) VALUES (?, 0, 0);', i);
      }
    });
  }

  return db.getAllSync('SELECT * FROM labyrinth_levels ORDER BY level_index ASC');
};

/**
 * Atualiza o número de estrelas de um nível, apenas se for maior que o recorde anterior.
 */
export const updateLabyrinthLevelStars = (levelIndex: number, newStars: number) => {
  db.runSync(
    'UPDATE labyrinth_levels SET stars_collected = ? WHERE level_index = ? AND stars_collected < ?',
    [newStars, levelIndex, newStars]
  );
};

/**
 * Desbloqueia o próximo nível.
 */
export const unlockLabyrinthLevel = (levelIndex: number) => {
  db.runSync('UPDATE labyrinth_levels SET is_unlocked = 1 WHERE level_index = ?', levelIndex);
};

// --- Funções do Quebra-Cabeça (NOVO) ---

/**
 * Carrega os recordes do quebra-cabeça do banco de dados.
 */
export const loadPuzzleRecords = (): Record<number, { time: number, moves: number }> => {
    try {
        const allRows = db.getAllSync<{ difficulty: number, time: number, moves: number }>(
            'SELECT * FROM puzzle_records'
        );
        const records: Record<number, { time: number, moves: number }> = {};
        for (const row of allRows) {
            records[row.difficulty] = { time: row.time, moves: row.moves };
        }
        return records;
    } catch (error) {
        console.error('Erro ao carregar recordes do quebra-cabeça:', error);
        return {};
    }
};

/**
 * Salva um novo recorde para uma dificuldade específica do quebra-cabeça.
 */
export const savePuzzleRecord = (difficulty: number, time: number, moves: number) => {
    try {
        db.withTransactionSync(() => {
            db.runSync(
                'INSERT OR REPLACE INTO puzzle_records (difficulty, time, moves) VALUES (?, ?, ?)',
                difficulty, time, moves
            );
        });
    } catch (error) {
        console.error('Erro ao salvar recorde do quebra-cabeça:', error);
        throw error;
    }
};