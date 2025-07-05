import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { FavoriteIcon } from '../../components/Emoji';
import { SearchBar } from '../components/SearchBar';
import { useFavorites } from '../context/FavoritesContext';
import { GameCard, games, PALETTE, styles } from './index';

export default function FavoritesScreen() {
  const { favorites, loading } = useFavorites();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFavorites = useMemo(() => {
    const favoriteGames = games.filter(game => favorites.has(game.title));
    if (!searchQuery.trim()) return favoriteGames;
    return favoriteGames.filter(game => game.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [favorites, searchQuery]);

  if (loading) return <View style={{flex: 1, backgroundColor: PALETTE.background}} />;

  return (
    <LinearGradient colors={[PALETTE.background, PALETTE.background_darker]} style={styles.safeArea}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { flex: 1 }]}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Favoritos</Text>
          </View>
          
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
          
          <FlatList
              data={filteredFavorites}
              renderItem={({ item }) => <GameCard item={item} />}
              keyExtractor={(item) => item.title}
              numColumns={2}
              contentContainerStyle={{ flexGrow: 1 }}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              ListEmptyComponent={() => (
                <View style={localStyles.emptyContainer}>
                    <Text style={localStyles.emptyText}>
                      {favorites.size === 0 ? 'Sem jogos favoritos.' : 'Nenhum jogo encontrado.'}
                    </Text>
                    {favorites.size === 0 &&
                      <>
                        <Text style={localStyles.emptySubText}>
                          Clique na estrela <FavoriteIcon filled={false} size={16} style={{color: PALETTE.textSecondary}} /> para adicionar um jogo aqui.
                        </Text>
                        <Pressable onPress={() => router.replace('/(tabs)/')} style={localStyles.ctaButton}>
                            <Text style={localStyles.ctaButtonText}>Explorar Jogos</Text>
                        </Pressable>
                      </>
                    }
                </View>
              )}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const localStyles = StyleSheet.create({
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 50, paddingHorizontal: 20, },
    emptyText: { color: PALETTE.textPrimary, fontSize: 18, textAlign: 'center', fontFamily: 'Orbitron-Bold', },
    emptySubText: { color: PALETTE.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center', fontFamily: 'Orbitron-Regular' },
    ctaButton: { marginTop: 24, backgroundColor: PALETTE.primary, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 50, },
    ctaButtonText: { color: PALETTE.background_darker, fontFamily: 'Orbitron-Bold', fontSize: 16, }
});