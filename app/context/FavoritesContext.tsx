import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
// Importando nossas novas funções de banco de dados síncronas
import { addFavorite, getFavorites, initDB, removeFavorite } from '@/services/database';
import * as Haptics from 'expo-haptics';

interface FavoritesContextType {
  favorites: Set<string>;
  toggleFavorite: (gameTitle: string) => void;
  isFavorite: (gameTitle: string) => boolean;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState(new Set<string>());
  const [loading, setLoading] = useState(true);

  // Efeito para carregar os dados. O useEffect em si não pode ser síncrono.
  useEffect(() => {
    try {
      setLoading(true);
      initDB(); // Garante que a tabela exista (síncrono)
      const savedFavorites = getFavorites(); // Carrega os favoritos do DB (síncrono)
      setFavorites(savedFavorites);
    } catch (e) {
      console.error("Failed to load favorites from database.", e);
    } finally {
      setLoading(false);
    }
  }, []); // Roda apenas uma vez quando o app inicia

  // A função de alternar agora também é síncrona
  const toggleFavorite = (gameTitle: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newFavorites = new Set(favorites);
    try {
      if (newFavorites.has(gameTitle)) {
        newFavorites.delete(gameTitle);
        removeFavorite(gameTitle); // Chama a função síncrona
      } else {
        newFavorites.add(gameTitle);
        addFavorite(gameTitle); // Chama a função síncrona
      }
      // Atualiza o estado no React para a UI ser reconstruída
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

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};