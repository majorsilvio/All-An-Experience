import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, FlatList, Platform, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useFonts } from '../../hooks/useFonts';
import { useThemePalette } from '../../hooks/useThemePalette';
import { SearchBar } from '../components/SearchBar';
import { createStyles, GameCard, games } from './index';

type Game = typeof games[number];

const AnimatedGameCard = ({ item, index }: { item: Game, index: number }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 100, useNativeDriver: true }).start();
  }, [fadeAnim, index]);
  return (<Animated.View style={{ opacity: fadeAnim }}><GameCard item={item} /></Animated.View>);
}

const CategorySection = ({ category, items }: { category: string, items: Game[] }) => {
  const palette = useThemePalette();
  
  // Safety check for palette
  if (!palette || !palette.neonAccent) {
    console.warn('Palette is undefined in CategorySection, skipping render');
    return null;
  }
  
  const styles = createStyles(palette);
  
  return (
    <View style={{ marginBottom: 32 }}>
      <View style={{ paddingHorizontal: styles.container.paddingHorizontal, marginBottom: 16 }}>
        <Text style={[styles.sectionTitle, { textAlign: 'left', marginTop: 0, marginBottom: 8 }]}>
          ╔═══ {category.toUpperCase()} ═══╗
        </Text>
        <View style={{ 
          height: 3, 
          backgroundColor: palette.neonAccent, 
          width: '40%',
          shadowColor: palette.neonAccent,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 6,
        }} />
      </View>
      <FlatList
        data={items}
        renderItem={({ item, index }) => <AnimatedGameCard item={item} index={index} />}
        keyExtractor={(item) => item.title}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: styles.container.paddingHorizontal }}
        ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
      />
    </View>
  );
};

export default function CategoriesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const fontsLoaded = useFonts();
  const palette = useThemePalette();
  const headerAnim = useRef(new Animated.Value(0)).current;

  // Safety check for palette
  if (!palette || !palette.textPrimary) {
    console.warn('Palette is undefined in CategoriesScreen, using fallback');
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

  const gamesByCategory = useMemo(() => {
    const filteredGames = games.filter(game => game.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return filteredGames.reduce((acc, game) => {
      const key = game.category;
      if (!acc[key]) { acc[key] = []; }
      acc[key].push(game);
      return acc;
    }, {} as Record<string, Game[]>);
  }, [searchQuery]);

  const hasResults = Object.keys(gamesByCategory).length > 0;
  const styles = createStyles(palette);

  if (!fontsLoaded) {
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
        <ScrollView contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 120 : 80 }}>
          <Animated.View style={[styles.headerContainer, { paddingHorizontal: styles.container.paddingHorizontal, opacity: headerAnim }]}>
            <View style={styles.titleWrapper}>
              <Text style={styles.headerTitle}>CATEGORIAS</Text>
              <Text style={styles.headerTitleShadow}>CATEGORIAS</Text>
            </View>
            <View style={styles.headerUnderline} />
          </Animated.View>

          <View style={{ paddingHorizontal: styles.container.paddingHorizontal }}>
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
          </View>

          {hasResults ? (
            Object.entries(gamesByCategory).map(([category, items]) => (
              <CategorySection key={category} category={category} items={items} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>NENHUM JOGO ENCONTRADO</Text>
              <View style={styles.emptyAccent} />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}