import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, FlatList, Platform, SafeAreaView, ScrollView, Text, View } from "react-native";
import { SearchBar } from '../components/SearchBar';
import { GameCard, games, styles as globalStyles, PALETTE } from './index';

type Game = typeof games[number];

const AnimatedGameCard = ({ item, index }: { item: Game, index: number }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 100, useNativeDriver: true }).start();
  }, [fadeAnim, index]);
  return (<Animated.View style={{ opacity: fadeAnim }}><GameCard item={item} /></Animated.View>);
}

const CategorySection = ({ category, items }: { category: string, items: Game[] }) => (
  <View style={{ marginBottom: 24 }}>
    <Text style={[globalStyles.sectionTitle, { paddingHorizontal: globalStyles.container.paddingHorizontal }]}>
      {category.toUpperCase()}
    </Text>
    <FlatList
      data={items}
      renderItem={({ item, index }) => <AnimatedGameCard item={item} index={index} />}
      keyExtractor={(item) => item.title}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: globalStyles.container.paddingHorizontal }}
      ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
    />
  </View>
);

export default function CategoriesScreen() {
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <LinearGradient colors={[PALETTE.background, PALETTE.background_darker]} style={globalStyles.safeArea}>
      <SafeAreaView>
        <ScrollView contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 120 : 80 }}>
          <View style={[globalStyles.headerContainer, { paddingHorizontal: globalStyles.container.paddingHorizontal }]}>
            <Text style={globalStyles.headerTitle}>Categorias</Text>
          </View>

          <View style={{ paddingHorizontal: globalStyles.container.paddingHorizontal }}>
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
          </View>

          {hasResults ? (
            Object.entries(gamesByCategory).map(([category, items]) => (
              <CategorySection key={category} category={category} items={items} />
            ))
          ) : (
            <View style={globalStyles.emptyContainer}>
              <Text style={globalStyles.emptyText}>Nenhum jogo encontrado.</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}