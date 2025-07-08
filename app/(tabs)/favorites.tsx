import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { FavoriteIcon } from '../../components/Emoji';
import { FONTS, useFonts } from '../../hooks/useFonts';
import { useThemePalette } from '../../hooks/useThemePalette';
import { SearchBar } from '../components/SearchBar';
import { useFavorites } from '../context/FavoritesContext';
import { createStyles, GameCard, games } from './index';

export default function FavoritesScreen() {
  const { favorites, loading } = useFavorites();
  const [searchQuery, setSearchQuery] = useState('');
  const fontsLoaded = useFonts();
  const palette = useThemePalette();
  const headerAnim = useRef(new Animated.Value(0)).current;

  // Safety check for palette
  if (!palette || !palette.textPrimary) {
    console.warn('Palette is undefined in FavoritesScreen, using fallback');
    return (
      <View style={{ flex: 1, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#F5F5F5', fontSize: 16 }}>Carregando tema...</Text>
      </View>
    );
  }

  useEffect(() => {
    if (fontsLoaded) {
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }
  }, [fontsLoaded]);

  const filteredFavorites = useMemo(() => {
    const favoriteGames = games.filter(game => favorites.has(game.title));
    if (!searchQuery.trim()) return favoriteGames;
    return favoriteGames.filter(game => game.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [favorites, searchQuery]);

  const styles = createStyles(palette);
  const localStyles = createLocalStyles(palette);

  if (loading || !fontsLoaded) {
    return (
      <LinearGradient colors={[palette.background, palette.background_darker]} style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>INICIALIZANDO...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[palette.background, palette.background_darker]} style={styles.safeArea}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { flex: 1 }]}>
          <Animated.View style={[styles.headerContainer, { opacity: headerAnim }]}>
            <View style={styles.titleWrapper}>
              <Text style={styles.headerTitle}>FAVORITOS</Text>
              <Text style={styles.headerTitleShadow}>FAVORITOS</Text>
            </View>
            <View style={styles.headerUnderline} />
          </Animated.View>
          
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
                      {favorites.size === 0 ? 'SEM JOGOS FAVORITOS' : 'NENHUM JOGO ENCONTRADO'}
                    </Text>
                    {favorites.size === 0 &&
                      <>
                        <Text style={localStyles.emptySubText}>
                          Clique na estrela <FavoriteIcon filled={false} size={16} style={{color: palette.textSecondary}} /> para adicionar um jogo aqui.
                        </Text>
                        <Pressable onPress={() => router.replace('/(tabs)/' as any)} style={localStyles.ctaButton}>
                            <Text style={localStyles.ctaButtonText}>{'>>>'} EXPLORAR JOGOS {'<<<'}</Text>
                        </Pressable>
                      </>
                    }
                    <View style={localStyles.emptyAccent} />
                </View>
              )}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const createLocalStyles = (palette: any) => StyleSheet.create({
    emptyContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingBottom: 50, 
        paddingHorizontal: 20,
        position: 'relative',
    },
    emptyText: { 
        color: palette.textPrimary, 
        fontSize: 14, 
        textAlign: 'center', 
        fontFamily: FONTS.gaming,
        letterSpacing: 1,
        marginBottom: 16,
    },
    emptySubText: { 
        color: palette.textSecondary, 
        fontSize: 11, 
        marginTop: 8, 
        textAlign: 'center', 
        fontFamily: FONTS.regular,
        letterSpacing: 0.3,
        marginBottom: 24,
        lineHeight: 16,
    },
    ctaButton: { 
        backgroundColor: palette.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 8,
        borderWidth: 3,
        borderColor: palette.background_darker,
        shadowColor: palette.shadowColor,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 12,
    },
    ctaButtonText: { 
        color: palette.background_darker, 
        fontFamily: FONTS.gaming,
        fontSize: 10,
        letterSpacing: 0.8,
        textAlign: 'center',
    },
    emptyAccent: {
        width: 120,
        height: 3,
        backgroundColor: palette.warningAccent,
        marginTop: 24,
        shadowColor: palette.warningAccent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
    },
});