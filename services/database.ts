import * as SQLite from 'expo-sqlite';

// Abrindo um banco de dados SÓ para os favoritos, para manter as coisas organizadas.
const db = SQLite.openDatabaseSync('favorites_library.db');

// Função para inicializar o banco de dados. Agora é síncrona.
export const initDB = () => {
  // execSync é ótimo para rodar comandos de setup
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY NOT NULL,
      gameTitle TEXT UNIQUE NOT NULL
    );
  `);
};

// Função para buscar todos os favoritos. Agora é síncrona.
export const getFavorites = (): Set<string> => {
  const allRows = db.getAllSync<{ gameTitle: string }>('SELECT gameTitle FROM favorites');
  return new Set(allRows.map(row => row.gameTitle));
};

// Função para adicionar um favorito. Agora é síncrona.
export const addFavorite = (title: string) => {
  // runSync para comandos que não retornam dados
  db.runSync('INSERT OR IGNORE INTO favorites (gameTitle) VALUES (?)', title);
};

// Função para remover um favorito. Agora é síncrona.
export const removeFavorite = (title: string) => {
  db.runSync('DELETE FROM favorites WHERE gameTitle = ?', title);
};