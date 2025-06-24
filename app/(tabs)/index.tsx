import { LinearGradient } from 'expo-linear-gradient';
import { router } from "expo-router";
import React from "react";
import { Dimensions, FlatList, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

// 1. PALETA DE CORES PROFISSIONAL BASEADA NA SUA LOGO
const PALETTE = {
  background: '#1A1A1A',
  background_darker: '#0D0D0D',
  primary: '#BFFF00', // Verde-Limão Vibrante
  primary_darker: '#4CAF50',
  cardBackground: '#2A2A2A',
  textPrimary: '#F5F5F5',
  textSecondary: '#AAAAAA',
};

const games = [
  {
    title: "Led Lógico",
    route: "/games/LogicLed",
    emoji: "💡",
    description: "Desafie sua mente",
  },
  {
    title: "Jogo da Memória",
    route: "/games/MemoryGame",
    emoji: "🃏",
    description: "Teste sua memória",
  },
  {
    title: "Jogo da Velha",
    route: "/games/TicTacToe",
    emoji: "⭕️",
    description: "Um clássico rápido",
  },
  {
    title: "Xadrez",
    route: "/games/Chess",
    emoji: "♟️",
    description: "Estratégia e tática",
  },
] as const;

// 2. CARD COM ANIMAÇÃO SEGURA E DESIGN PROFISSIONAL
const GameCard = ({ item }: { item: typeof games[number] }) => {
  return (
    // O Pressable permite criar um efeito visual ao ser pressionado sem usar hooks complexos
    <Pressable 
      onPress={() => router.push(item.route)}
      style={({ pressed }) => [
          styles.cardContainer,
          // Aplica um efeito de escala quando o card está a ser pressionado
          { transform: [{ scale: pressed ? 0.97 : 1 }] } 
      ]}
    >
        <View style={styles.card}>
            <LinearGradient
                colors={[PALETTE.primary_darker, PALETTE.primary]}
                style={styles.cardImageContainer}
            >
                <Text style={styles.cardEmoji}>{item.emoji}</Text>
            </LinearGradient>
            <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
            </View>
        </View>
    </Pressable>
  );
};

// COMPONENTE DE DESTAQUE, ESTILO APP STORE
const FeaturedCard = () => {
    const featuredGame = games[3]; // Xadrez como destaque
    return (
        <Pressable 
            onPress={() => router.push(featuredGame.route)}
            style={({ pressed }) => [
                styles.featuredCardContainer,
                { opacity: pressed ? 0.9 : 1 }
            ]}
        >
            <LinearGradient
                colors={['#434343', '#000000']}
                style={styles.featuredCard}
            >
                <View style={styles.featuredTextContainer}>
                    <Text style={styles.featuredTitle}>{featuredGame.title}</Text>
                    <Text style={styles.featuredDescription}>{featuredGame.description}</Text>
                </View>
                <Text style={styles.featuredEmoji}>{featuredGame.emoji}</Text>
            </LinearGradient>
        </Pressable>
    );
}

// 3. TELA INICIAL TOTALMENTE REFEITA
export default function HomeScreen() {
  return (
    <LinearGradient colors={[PALETTE.background, PALETTE.background_darker]} style={styles.safeArea}>
        <SafeAreaView>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.headerContainer}>
                    <Text style={styles.headerTitle}>Biblioteca de Jogos</Text>
                </View>
                
                {/* Secção de Destaque */}
                <Text style={styles.sectionTitle}>DESTAQUE</Text>
                <FeaturedCard />

                {/* Grelha de Todos os Jogos */}
                <Text style={styles.sectionTitle}>TODOS OS JOGOS</Text>
                <FlatList
                    data={games}
                    renderItem={GameCard}
                    keyExtractor={(item) => item.title}
                    numColumns={2}
                    scrollEnabled={false}
                    // Adiciona espaçamento entre as colunas
                    columnWrapperStyle={{ justifyContent: 'space-between' }}
                />
            </ScrollView>
        </SafeAreaView>
    </LinearGradient>
  );
}

// 4. ESTILOS RESPONSIVOS E PROFISSIONAIS
const { width } = Dimensions.get('window');
const margin = 16;
const numColumns = 2;
const cardWidth = (width - (margin * (numColumns + 1))) / numColumns;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingHorizontal: margin, paddingBottom: margin },
  headerContainer: { paddingVertical: 24, paddingBottom: 24, },
  headerTitle: { fontSize: 36, color: PALETTE.textPrimary, fontFamily: 'Orbitron-Bold' },
  sectionTitle: {
    color: PALETTE.textSecondary,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 24,
  },
  cardContainer: {
    width: cardWidth,
    marginBottom: margin,
    // Sombra para dar profundidade ao card
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6, },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  card: { 
    borderRadius: 16, 
    backgroundColor: PALETTE.cardBackground, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardImageContainer: { 
    width: '100%', 
    aspectRatio: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  cardEmoji: { fontSize: cardWidth * 0.5 },
  cardTextContainer: { padding: 14, },
  cardTitle: { 
    fontSize: 16, 
    color: PALETTE.textPrimary, 
    fontFamily: 'Orbitron-Bold', 
    marginBottom: 4, 
  },
  cardDescription: { 
    fontSize: 13, 
    color: PALETTE.textSecondary, 
  },
  // Estilos do Card de Destaque
  featuredCardContainer: {
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 0, },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 15,
  },
  featuredCard: {
    width: '100%',
    height: 150,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featuredTextContainer: {
    flex: 1,
  },
  featuredTitle: {
    fontFamily: 'Orbitron-Bold',
    color: PALETTE.textPrimary,
    fontSize: 24,
    marginBottom: 8,
  },
  featuredDescription: {
    color: PALETTE.textSecondary,
    fontSize: 16,
  },
  featuredEmoji: {
    fontSize: 80,
    marginLeft: 16,
    opacity: 0.8,
  },
});

