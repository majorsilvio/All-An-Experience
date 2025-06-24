import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { router } from "expo-router";
import { Dimensions, FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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

// TIPO CORRIGIDO AQUI: A correção de 'typeof games[0]' para 'typeof games[number]' é a chave.
const GameCard = ({ item }: { item: typeof games[number] }) => {
  return (
    <TouchableOpacity onPress={() => router.push(item.route)} style={styles.cardContainer}>
      <ThemedView style={styles.card}>
        <View style={styles.cardImageContainer}>
            <Text style={styles.cardEmoji}>{item.emoji}</Text>
        </View>
        <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <ThemedText style={styles.cardDescription}>{item.description}</ThemedText>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const today = new Date();
  const dateString = today.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerContainer}>
            <ThemedText style={styles.headerSubtitle}>{dateString.toUpperCase()}</ThemedText>
            <Text style={styles.headerTitle}>Jogos</Text>
        </View>
        <FlatList
          data={games}
          renderItem={GameCard}
          keyExtractor={(item) => item.title}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.row}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const cardMargin = 16;
const cardWidth = (width - (cardMargin * 3)) / 2;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  container: { paddingHorizontal: cardMargin },
  headerContainer: { paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#333', marginBottom: cardMargin },
  headerSubtitle: { color: '#888', fontWeight: '700', fontSize: 12 },
  headerTitle: { fontSize: 40, color: '#FFF', fontFamily: 'Orbitron-Bold' },
  row: { justifyContent: "space-between" },
  cardContainer: { width: cardWidth, marginBottom: cardMargin },
  card: { borderRadius: 16, backgroundColor: '#1e1e1e', overflow: 'hidden' },
  cardImageContainer: { backgroundColor: '#333', width: '100%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  cardEmoji: { fontSize: cardWidth * 0.5 },
  cardTextContainer: { padding: 12 },
  cardTitle: { fontSize: 18, color: '#FFF', fontFamily: 'Orbitron-Bold', marginBottom: 4 },
  cardDescription: { fontSize: 14, color: '#888' },
});