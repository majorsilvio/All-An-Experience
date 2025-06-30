import * as Haptics from 'expo-haptics';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// ADICIONADO: Importando as funções do nosso serviço de banco de dados
import { addFavorite, getFavorites, initDB, removeFavorite } from '@/services/database';

// Definição da interface para o nosso contexto
interface FavoritesContextType {
  favorites: Set<string>;
  toggleFavorite: (gameTitle: string) => void;
  isFavorite: (gameTitle: string) => boolean;
  loading: boolean;
}

// Criação do Contexto
const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// O componente Provedor que vai envolver a aplicação
export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState(new Set<string>());
  const [loading, setLoading] = useState(true);

  // Efeito para inicializar e carregar os dados do SQLite ao iniciar o app
  useEffect(() => {
    const setup = async () => {
      try {
        setLoading(true);
        initDB(); // Garante que a tabela exista
        const savedFavorites = await getFavorites(); // Carrega os favoritos do DB
        setFavorites(savedFavorites);
      } catch (e) {
        console.error("Failed to load favorites from database.", e);
      } finally {
        setLoading(false);
      }
    };
    setup();
  }, []); // Roda apenas uma vez

  const toggleFavorite = (gameTitle: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newFavorites = new Set(favorites);
    try {
      if (newFavorites.has(gameTitle)) {
        newFavorites.delete(gameTitle);
        removeFavorite(gameTitle); // Remove do DB
      } else {
        newFavorites.add(gameTitle);
        addFavorite(gameTitle); // Adiciona no DB
      }
      setFavorites(newFavorites);
    } catch (e) {
        console.error("Failed to update favorite in database.", e);
    }
  };
  
  const isFavorite = (gameTitle: string) => favorites.has(gameTitle);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
};

// Hook customizado para usar o contexto facilmente
export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};