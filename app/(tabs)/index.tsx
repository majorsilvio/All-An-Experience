import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, FlatList, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { SearchBar } from '../components/SearchBar';
import { useFavorites } from '../context/FavoritesContext';

// Exportando para reutilização nas outras telas
export const PALETTE = {
  background: '#1A1A1A',
  background_darker: '#0D0D0D',
  primary: '#BFFF00',
  primary_darker: '#4CAF50',
  cardBackground: '#2A2A2A',
  textPrimary: '#F5F5F5',
  textSecondary: '#AAAAAA',
};

export const games = [
  { title: "Led Lógico", route: "/games/LogicLed", emoji: "💡", description: "Desafie sua mente", category: "Quebra-Cabeça" },
  { title: "Jogo da Memória", route: "/games/MemoryGame", emoji: "🃏", description: "Teste sua memória", category: "Quebra-Cabeça" },
  { title: "Jogo da Velha", route: "/games/TicTacToe", emoji: "⭕️", description: "Um clássico rápido", category: "Clássicos de Tabuleiro" },
  { title: "Xadrez", route: "/games/Chess", emoji: "♟️", description: "Estratégia e tática", category: "Estratégia" },
  { title: "Corredor Cósmico", route: "/games/CosmicCorridor", emoji: "🚀", description: "Desvie dos obstáculos", category: "Ação" },
  { title: "Labirinto Físico", route: "/games/Labyrinth", emoji: "🌀", description: "Controle com movimento", category: "Habilidade" },
  { title: "Quebra-Cabeça", route: "/games/Puzzle", emoji: "🧩", description: "Descubra o Enígima das imagens", category: "Quebra-Cabeça" },

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
  const favorited = isFavorite(item.title);

  const handleFavoritePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(item.title);
  }

  return (
    <Pressable onPress={() => router.push(item.route as any)} style={({ pressed }) => [styles.cardContainer, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
      <View style={styles.card}>
        <LinearGradient colors={[PALETTE.primary_darker, PALETTE.primary]} style={styles.cardImageContainer}>
          <Text style={styles.cardEmoji}>{item.emoji}</Text>
        </LinearGradient>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardDescription} numberOfLines={1}>{item.description}</Text>
        </View>
        <Pressable onPress={handleFavoritePress} style={styles.favoriteButton}>
          <Text style={{color: favorited ? PALETTE.primary : PALETTE.textSecondary, fontSize: 22}}>{favorited ? '★' : '☆'}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

const FeaturedCard = () => {
    const featuredGame = games[3];
    return (
        <Pressable onPress={() => router.push(featuredGame.route as any)} style={({ pressed }) => [ styles.featuredCardContainer, { opacity: pressed ? 0.9 : 1 } ]}>
            <LinearGradient colors={['#434343', '#000000']} style={styles.featuredCard}>
                <View style={styles.featuredTextContainer}><Text style={styles.featuredTitle}>{featuredGame.title}</Text><Text style={styles.featuredDescription}>{featuredGame.description}</Text></View>
                <Text style={styles.featuredEmoji}>{featuredGame.emoji}</Text>
            </LinearGradient>
        </Pressable>
    );
}

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { loading } = useFavorites();

  const filteredGames = useMemo(() => {
    if (!searchQuery.trim()) return games;
    return games.filter(game => game.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  if (loading) return <View style={{flex: 1, backgroundColor: PALETTE.background}} />;

  return (
    <LinearGradient colors={[PALETTE.background, PALETTE.background_darker]} style={styles.safeArea}>
      <SafeAreaView>
        <FlatList
          ListHeaderComponent={
            <View style={{paddingHorizontal: styles.container.paddingHorizontal}}>
              <View style={styles.headerContainer}><Text style={styles.headerTitle}>Biblioteca de Jogos</Text></View>
              <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
              {searchQuery.length === 0 && (<><Text style={styles.sectionTitle}>DESTAQUE</Text><FeaturedCard /></>)}
              <Text style={styles.sectionTitle}>TODOS OS JOGOS</Text>
            </View>
          }
          data={filteredGames}
          renderItem={({ item, index }) => <AnimatedGameCard item={item} index={index} />}
          keyExtractor={(item) => item.title}
          numColumns={2}
          contentContainerStyle={styles.container}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          ListEmptyComponent={() => (<View style={styles.emptyContainer}><Text style={styles.emptyText}>Nenhum jogo encontrado.</Text></View>)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const { width } = Dimensions.get('window');
const margin = 16;
const numColumns = 2;
const cardWidth = (width - (margin * (numColumns + 1))) / numColumns;
export const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingHorizontal: margin, paddingBottom: Platform.OS === 'ios' ? 120 : 80, },
  headerContainer: { paddingTop: 24, },
  headerTitle: { fontSize: 36, color: PALETTE.textPrimary, fontFamily: 'Orbitron-Bold' },
  sectionTitle: { color: PALETTE.textSecondary, fontWeight: '700', fontSize: 12, letterSpacing: 0.8, marginBottom: 12, marginTop: 24, },
  cardContainer: { width: cardWidth, marginBottom: margin, },
  card: { borderRadius: 16, backgroundColor: PALETTE.cardBackground, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', },
  cardImageContainer: { width: '100%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', },
  cardEmoji: { fontSize: cardWidth * 0.5 },
  cardTextContainer: { padding: 14, },
  cardTitle: { fontSize: 16, color: PALETTE.textPrimary, fontFamily: 'Orbitron-Bold', marginBottom: 4, },
  cardDescription: { fontSize: 13, color: PALETTE.textSecondary, fontFamily: 'Orbitron-Regular' },
  favoriteButton: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20, padding: 4, zIndex: 1, },
  featuredCardContainer: { shadowColor: PALETTE.primary, shadowOffset: { width: 0, height: 4, }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 15, },
  featuredCard: { width: '100%', height: 150, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', },
  featuredTextContainer: { flex: 1, },
  featuredTitle: { fontFamily: 'Orbitron-Bold', color: PALETTE.textPrimary, fontSize: 24, marginBottom: 8, },
  featuredDescription: { fontFamily: 'Orbitron-Regular', color: PALETTE.textSecondary, fontSize: 16, },
  featuredEmoji: { fontSize: 80, marginLeft: 16, opacity: 0.8, },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, },
  emptyText: { color: PALETTE.textSecondary, fontSize: 16, fontFamily: 'Orbitron-Bold', },
});