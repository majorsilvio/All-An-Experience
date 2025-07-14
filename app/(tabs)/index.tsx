import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, FlatList, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Emoji, FavoriteIcon } from '../../components/Emoji';
import { FONTS, useFonts } from '../../hooks/useFonts';
import { useThemePalette } from '../../hooks/useThemePalette';
import { SearchBar } from '../components/SearchBar';
import { useFavorites } from '../context/FavoritesContext';

export const games = [
  { title: "Led Lógico", route: "/games/LogicLed", emoji: "bulb", description: "Desafie sua mente", category: "Quebra-Cabeça" },
  { title: "Jogo da Memória", route: "/games/MemoryGame", emoji: "cards", description: "Teste sua memória", category: "Quebra-Cabeça" },
  { title: "Jogo da Velha", route: "/games/TicTacToe", emoji: "tic-tac-toe", description: "Um clássico rápido", category: "Clássicos de Tabuleiro" },
  { title: "Xadrez", route: "/games/Chess", emoji: "chess", description: "Estratégia e tática", category: "Estratégia" },
  { title: "Campo Minado", route: "/games/Minesweeper", emoji: "bomb", description: "Encontre as minas ocultas", category: "Quebra-Cabeça" },
  { title: "Corredor Cósmico", route: "/games/CosmicCorridor", emoji: "rocket", description: "Desvie dos obstáculos", category: "Ação" },
  { title: "Labirinto Físico", route: "/games/Labyrinth", emoji: "spiral", description: "Controle com movimento", category: "Habilidade" },
  { title: "Quebra-Cabeça", route: "/games/Puzzle", emoji: "puzzle", description: "Descubra o Enígima das imagens", category: "Quebra-Cabeça" },
  { title: "Forca", route: "/games/Strength", emoji: "hangman", description: "Adivinhe a palavra", category: "Palavras" },
  { title: "Show do Milhão", route: "/games/ShowDoMilhao", emoji: "trophy", description: "Teste seus conhecimentos e ganhe!", category: "Quiz" },
] as const;

export type Game = typeof games[number];

// Componente de Card com animação
export const AnimatedGameCard = ({ item, index }: { item: Game, index: number }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: index * 100, useNativeDriver: true }).start();
    Animated.timing(slideAnim, { toValue: 0, duration: 500, delay: index * 100, useNativeDriver: true }).start();
  }, [fadeAnim, slideAnim, index]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <GameCard item={item} />
    </Animated.View>
  );
}

export const GameCard = ({ item }: { item: Game }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const palette = useThemePalette();
  const favorited = isFavorite(item.title);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Safety check for palette
  if (!palette || !palette.textPrimary) {
    console.warn('Palette is undefined in GameCard, using fallback');
    return null;
  }

  const handleFavoritePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(item.title);
  }

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const styles = createStyles(palette);

  return (
    <Pressable 
      onPress={() => router.push(item.route as any)} 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.cardContainer}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        {/* Brutalist border effect */}
        <View style={styles.cardBorderEffect} />
        
        <LinearGradient 
          colors={[palette.primary_darker, palette.primary]} 
          style={styles.cardImageContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Emoji name={item.emoji} size={cardWidth * 0.45} />
          
          {/* Glitch effect overlay */}
          <View style={styles.glitchOverlay} />
        </LinearGradient>
        
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
            {item.title}
          </Text>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        
        <Pressable onPress={handleFavoritePress} style={styles.favoriteButton}>
          <View style={[styles.favoriteButtonBg, favorited && styles.favoriteButtonBgActive]}>
            <FavoriteIcon filled={favorited} style={{color: favorited ? palette.background : palette.textSecondary}} />
          </View>
        </Pressable>
      </Animated.View>
    </Pressable>
  );
};

const FeaturedCard = () => {
    const featuredGame = games[3];
    const palette = useThemePalette();
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Safety check for palette
    if (!palette || !palette.textPrimary) {
        console.warn('Palette is undefined in FeaturedCard, using fallback');
        return null;
    }

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.02,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    const styles = createStyles(palette);

    return (
        <Pressable onPress={() => router.push(featuredGame.route as any)} style={styles.featuredCardContainer}>
            <Animated.View style={[styles.featuredCardWrapper, { transform: [{ scale: pulseAnim }] }]}>
                {/* Brutalist border layers */}
                <View style={styles.featuredBorderLayer1} />
                <View style={styles.featuredBorderLayer2} />
                
                <LinearGradient 
                    colors={['#434343', '#000000', palette.background_darker]} 
                    style={styles.featuredCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.featuredTextContainer}>
                        <Text style={styles.featuredTitle}>{featuredGame.title}</Text>
                        <Text style={styles.featuredDescription}>{featuredGame.description}</Text>
                        <View style={styles.featuredAccent} />
                    </View>
                    
                    <View style={styles.featuredEmojiContainer}>
                        <Emoji name={featuredGame.emoji} size={80} style={{opacity: 0.9}} />
                        {/* Glitch effect for featured game */}
                        <View style={styles.featuredGlitch} />
                    </View>
                </LinearGradient>
            </Animated.View>
        </Pressable>
    );
}

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { loading } = useFavorites();
  const fontsLoaded = useFonts();
  const palette = useThemePalette();
  const headerAnim = useRef(new Animated.Value(0)).current;

  // Safety check for palette
  if (!palette || !palette.textPrimary) {
    console.warn('Palette is undefined in HomeScreen, using fallback');
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

  const filteredGames = useMemo(() => {
    if (!searchQuery.trim()) return games;
    return games.filter(game => game.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const styles = createStyles(palette);

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
      <SafeAreaView>
        <FlatList
          ListHeaderComponent={
            <View style={{paddingHorizontal: styles.container.paddingHorizontal}}>
              <Animated.View style={[styles.headerContainer, { opacity: headerAnim }]}>
                <View style={styles.titleWrapper}>
                  <Text style={styles.headerTitle}>BIBLIOTECA DE JOGOS</Text>
                  <Text style={styles.headerTitleShadow}>BIBLIOTECA DE JOGOS</Text>
                </View>
                <View style={styles.headerUnderline} />
              </Animated.View>
              <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
              {searchQuery.length === 0 && (
                <>
                  <Text style={styles.sectionTitle}>╔═══ DESTAQUE ═══╗</Text>
                  <FeaturedCard />
                </>
              )}
              <Text style={styles.sectionTitle}>╔═══ TODOS OS JOGOS ═══╗</Text>
            </View>
          }
          data={filteredGames}
          renderItem={({ item, index }) => <AnimatedGameCard item={item} index={index} />}
          keyExtractor={(item) => item.title}
          numColumns={2}
          contentContainerStyle={styles.container}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>NENHUM JOGO ENCONTRADO</Text>
              <View style={styles.emptyAccent} />
            </View>
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const { width } = Dimensions.get('window');
const margin = 16;
const numColumns = 2;
const cardWidth = (width - (margin * (numColumns + 1))) / numColumns;

const createStyles = (palette: any) => StyleSheet.create({
  safeArea: { 
    flex: 1 
  },
  container: { 
    paddingHorizontal: margin, 
    paddingBottom: Platform.OS === 'ios' ? 120 : 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: palette.primary,
    fontFamily: FONTS.gaming,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  headerContainer: { 
    paddingTop: 32,
    marginBottom: 16,
    alignItems: 'center',
  },
  titleWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  headerTitle: { 
    fontSize: 28, 
    color: palette.textPrimary, 
    fontFamily: FONTS.primary,
    letterSpacing: 2,
    textShadowColor: palette.shadowColor,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    textAlign: 'center',
    zIndex: 2,
  },
  headerTitleShadow: {
    position: 'absolute',
    fontSize: 28,
    color: palette.primary,
    fontFamily: FONTS.primary,
    letterSpacing: 2,
    textAlign: 'center',
    opacity: 0.3,
    transform: [{ translateX: 3 }, { translateY: 3 }],
    zIndex: 1,
  },
  headerUnderline: {
    height: 4,
    backgroundColor: palette.primary,
    width: '80%',
    marginTop: 12,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  sectionTitle: { 
    color: palette.neonAccent,
    fontFamily: FONTS.gaming,
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 20,
    marginTop: 28,
    textAlign: 'center',
    textShadowColor: palette.neonAccent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  
  // Card styles with Neo-Brutalism
  cardContainer: { 
    width: cardWidth, 
    marginBottom: margin,
  },
  card: { 
    borderRadius: 16,
    backgroundColor: palette.cardBackground,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: palette.brutalistBorder,
    shadowColor: palette.shadowColor,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 15,
  },
  cardBorderEffect: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    backgroundColor: palette.primary,
    zIndex: -1,
    borderRadius: 19,
  },
  cardImageContainer: { 
    width: '100%', 
    aspectRatio: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative',
  },
  glitchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.glitchPurple,
    opacity: 0.05,
  },
  cardTextContainer: { 
    padding: 12,
    backgroundColor: palette.cardBackground,
    alignItems: 'center',
    minHeight: 85,
    justifyContent: 'center',
    flex: 1,
  },
  cardTitle: { 
    fontSize: 12, 
    color: palette.textPrimary, 
    fontFamily: FONTS.gaming,
    marginBottom: 6,
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 16,
    height: 32, // Fixed height to accommodate 2 lines
    flexWrap: 'wrap',
  },
  cardDescription: { 
    fontSize: 10, 
    color: palette.textSecondary, 
    fontFamily: FONTS.regular,
    letterSpacing: 0.2,
    textAlign: 'center',
    lineHeight: 13,
    height: 26, // Fixed height to accommodate 2 lines
    flexWrap: 'wrap',
  },
  favoriteButton: { 
    position: 'absolute', 
    top: 8, 
    right: 8, 
    zIndex: 2,
  },
  favoriteButtonBg: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    padding: 6,
    borderWidth: 2,
    borderColor: palette.textSecondary,
  },
  favoriteButtonBgActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  
  // Featured card styles
  featuredCardContainer: { 
    marginBottom: 8,
  },
  featuredCardWrapper: {
    position: 'relative',
  },
  featuredBorderLayer1: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    backgroundColor: palette.primary,
    borderRadius: 20,
    zIndex: -2,
  },
  featuredBorderLayer2: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    backgroundColor: palette.neonAccent,
    borderRadius: 18,
    zIndex: -1,
  },
  featuredCard: { 
    width: '100%', 
    height: 170, 
    borderRadius: 16, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: palette.brutalistBorder,
  },
  featuredTextContainer: { 
    flex: 1,
    position: 'relative',
  },
  featuredTitle: { 
    fontFamily: FONTS.gaming,
    color: palette.textPrimary, 
    fontSize: 16, 
    marginBottom: 8,
    letterSpacing: 1,
    textShadowColor: palette.primary,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  featuredDescription: { 
    fontFamily: FONTS.regular,
    color: palette.textSecondary, 
    fontSize: 13,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  featuredAccent: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    width: 100,
    height: 4,
    backgroundColor: palette.retroOrange,
    shadowColor: palette.retroOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  featuredEmojiContainer: {
    position: 'relative',
    marginLeft: 16,
  },
  featuredGlitch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.neonAccent,
    opacity: 0.1,
    borderRadius: 40,
  },
  
  // Empty state
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 60,
    position: 'relative',
  },
  emptyText: { 
    color: palette.textSecondary, 
    fontSize: 12, 
    fontFamily: FONTS.gaming,
    letterSpacing: 1,
    textAlign: 'center',
  },
  emptyAccent: {
    width: 100,
    height: 2,
    backgroundColor: palette.warningAccent,
    marginTop: 16,
    shadowColor: palette.warningAccent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
});

// Export para outras telas
export { createStyles };

