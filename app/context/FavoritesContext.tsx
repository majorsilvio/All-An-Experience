import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

const FAVORITES_STORAGE_KEY = '@game_favorites';

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

  // Efeito para carregar os favoritos do armazenamento ao iniciar o app
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const savedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
        if (savedFavorites !== null) {
          setFavorites(new Set(JSON.parse(savedFavorites)));
        }
      } catch (e) {
        console.error("Failed to load favorites.", e);
      } finally {
        setLoading(false);
      }
    };
    loadFavorites();
  }, []);

  const toggleFavorite = async (gameTitle: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(gameTitle)) {
      newFavorites.delete(gameTitle);
    } else {
      newFavorites.add(gameTitle);
    }
    setFavorites(newFavorites);
    try {
      // Salva a nova lista no armazenamento
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(newFavorites)));
    } catch (e) {
      console.error("Failed to save favorites.", e);
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