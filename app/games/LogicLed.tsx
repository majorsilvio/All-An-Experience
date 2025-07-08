import {
  Alert,
  Dimensions,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import DynamicGrid from "@/components/DynamicGrid";
import CircleComponent from "@/components/Icons/Circle";
import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import WinnerAnimation from "@/components/WinnerAnimation";
import LogicTable from "@/constants/LogicTable";
import { useThemeColor } from "@/hooks/useThemeColor";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { IconSymbol } from "@/components/ui/IconSymbol";
import * as SQLite from "expo-sqlite";
import { FONTS } from "../../hooks/useFonts";
import { useThemePalette } from "../../hooks/useThemePalette";

/**
 * Renders the HomeScreen component which represents the main game interface.
 * The game consists of a grid of cells that can be toggled between two states.
 * The goal is to turn off all cells in the grid.
 *
 * @param {number} level - The level of the game indicating initial random toggles.
 * @param {number} difficulty - The size of the grid, determining the number of rows and columns.
 *
 * @returns A view component displaying the game grid and a winner animation on victory.
 */

export default function LogicLed() {
  const palette = useThemePalette();
  const [level, setLevel] = useState(1);
  const [difficulty, setDifficulty] = useState(1);
  const [data, setData] = useState<boolean[][]>([]);
  const [highChanges, setHighChanges] = useState(0);
  const [changes, setChanges] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [gameState, setGameState] = useState<"WINNER" | "PLAYING" | "NEW_GAME">(
    "NEW_GAME"
  );
  const db = useMemo(() => SQLite.openDatabaseSync("ledLogic.db"), []);

  // Proteção contra paleta não inicializada
  if (!palette) {
    return (
      <ThemedView style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ThemedText style={{fontSize: 16}}>Carregando...</ThemedText>
      </ThemedView>
    );
  }

  // Criar estilos dinâmicos
  const styles = createStyles(palette);

  const setupDatabase = useCallback(() => {
    try {
      // Create table if it doesn't exist
      console.log("Database setup completed.");
      db.runSync(
        "CREATE TABLE IF NOT EXISTS led_logic_most_changes (id INTEGER PRIMARY KEY, highScore INTEGER NOT NULL, level INTEGER NOT NULL, difficulty INTEGER NOT NULL);"
      );

      db.runSync(
        "CREATE TABLE IF NOT EXISTS led_logic_restart (id INTEGER PRIMARY KEY, state VARCHAR NOT NULL);"
      );

      const result = db.getFirstSync<{ count: number }>(
        "SELECT COUNT(id) as count FROM led_logic_most_changes;"
      );

      if (result && result.count === 0) {
        db.runSync(
          "INSERT INTO led_logic_most_changes (highScore, difficulty, level) VALUES (1, ?, ?);",
          [difficulty, level]
        );
      }
    } catch (error) {
      console.error("Database setup error:", error);
    }
  }, [db, difficulty, level]);

  const saveHighChanges = useCallback(
    (score: number) => {
      db.runSync(
        "UPDATE led_logic_most_changes SET highScore = ? WHERE difficulty = ? and level = ?;",
        [score, difficulty, level]
      );
    },
    [db]
  );

  const getHighChanges = useCallback((): number => {
    const result = db.getFirstSync<{ highScore: number }>(
      "SELECT highScore FROM led_logic_most_changes"
    );

    return result?.highScore ?? 1;
  }, [db]);

  const saveRestartState = useCallback(
    (state: string) => {
      //verificar se ja existe um jogo salvo
      const result = db.getFirstSync<{ count: number }>(
        "SELECT COUNT(id) as count FROM led_logic_restart;"
      );
      if (result && result.count === 0) {
        db.runSync("INSERT INTO led_logic_restart (id,state) VALUES (1,?);", [
          state,
        ]);
      } else {
        db.runSync("UPDATE led_logic_restart SET state = ? WHERE id = 1;", [
          state,
        ]);
      }
    },
    [db]
  );

  const getRestartState = useCallback(() => {
    const result = db.getFirstSync<{ state: string }>(
      "SELECT state FROM led_logic_restart where id = 1;"
    );
    return result?.state ? JSON.parse(result.state) : [];
  }, [db]);
  const changeCell = (row: number, col: number) =>
    setData((prevData) => {
      const newData = [...prevData];
      const directions = [
        [0, 0], // Current cell
        [-1, 0], // Top
        [1, 0], // Bottom
        [0, -1], // Left
        [0, 1], // Right
      ];

      directions.forEach(([dRow, dCol]) => {
        const newRow = row + dRow;
        const newCol = col + dCol;
        if (newData[newRow]?.[newCol] !== undefined) {
          newData[newRow][newCol] = !newData[newRow][newCol];
        }
      });

      if (gameState === "PLAYING") {
        setChanges((prevChanges) => prevChanges + 1);
      }

      if (
        newData.flat().every((cell) => !cell) &&
        newData.length > 0 &&
        gameState === "PLAYING"
      ) {
        setGameState("WINNER");
        if (changes > highChanges) {
          saveHighChanges(changes);
        }
      }
      return newData;
    });

  const newGame = async () => {
    const gridSize = difficulty + 2;
    setData(LogicTable(gridSize));

    const levelRandomChanges = level * (difficulty / 0.5);
    const sortCells = (gridSize: number, before: { row: any; col: any }) => {
      const sorted = {
        row: Math.floor(Math.random() * gridSize),
        col: Math.floor(Math.random() * gridSize),
      };
      if (sorted.row === before.row && sorted.col === before.col) {
        return sortCells(gridSize, before);
      }
      return sorted;
    };

    let sortedBefore = {
      row: -1,
      col: -1,
    };

    for (let i = 0; i < levelRandomChanges; i++) {
      const sorted = sortCells(gridSize, sortedBefore);
      sortedBefore = sorted;
      changeCell(sorted.row, sorted.col);
    }
    setGameState("PLAYING");

    return;
  };

  function handleChange(text: string): void {
    if (text === "") {
      setDifficulty(1);
    } else {
      setDifficulty(parseInt(text));
    }
  }

  const ledOffColor = useThemeColor({ light: "black", dark: "white" }, "icon");
  const headerColor = useThemeColor({}, "background");

  async function initialize() {
    try {
      setIsLoading(true);
      const hightChangesFromDb = getHighChanges();
      setHighChanges(hightChangesFromDb);
      setChanges(0);
      await newGame();
    } catch (error) {
      console.error("Falha na inicialização do jogo:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados do jogo.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (gameState === "PLAYING") {
      saveRestartState(JSON.stringify(data));
    }
  }, [gameState]);

  useEffect(() => {
    setupDatabase();
  }, [setupDatabase]);
  return (
    <ThemedView style={styles.container}>
      {gameState !== "NEW_GAME" && (
        <>
          <View
            style={[
              styles.header,
              { paddingTop: 100, backgroundColor: headerColor },
            ]}
          >
            <View style={styles.scoreContainer}>
              <ThemedText style={[styles.scoreLabel]}>DIFICULDADE</ThemedText>
              <ThemedText style={styles.scoreText}>{difficulty}</ThemedText>
            </View>
          </View>
          <View style={[styles.header, { backgroundColor: headerColor }]}>
            <View style={styles.scoreContainer}>
              <ThemedText style={styles.scoreLabel}>NÍVEL</ThemedText>
              <ThemedText style={styles.scoreText}>{level}</ThemedText>
            </View>
            <View style={styles.scoreContainer}>
              <ThemedText style={[styles.scoreLabel, { fontSize: 10 }]}>
                RECOMEÇAR
              </ThemedText>
              <Pressable
                onPress={() => {
                  setData(getRestartState());
                }}
                style={({ pressed }) => [
                  styles.scoreText,
                  { opacity: pressed ? 0.5 : 1 },
                ]}
              >
                <IconSymbol
                  style={styles.scoreText}
                  name="restart"
                  size={24}
                  color="yellow"
                />
              </Pressable>
            </View>
            <View style={styles.scoreContainer}>
              <ThemedText style={styles.scoreLabel}>JOGADAS</ThemedText>
              <ThemedText
                style={
                  changes > highChanges
                    ? [styles.scoreText, { color: "red" }]
                    : styles.scoreText
                }
              >
                {changes}
              </ThemedText>
            </View>
          </View>
        </>
      )}
      {gameState === "PLAYING" ? (
        <View>
          <DynamicGrid
            contentContainerStyle={{ paddingTop: 70 }}
            data={data}
            cellSize={80}
            renderItem={(item, row, col) => {
              return (
                <TouchableOpacity
                  key={`grid-item-${col}-${row}`}
                  style={[styles.item, { padding: 4 }]}
                  onPress={() => changeCell(row, col)}
                >
                  <CircleComponent
                    size={46}
                    stroke={"black"}
                    strokeOpacity={0.5}
                    fill={item ? "yellow" : ledOffColor}
                  />
                </TouchableOpacity>
              );
            }}
          />
        </View>
      ) : (
        <ThemedView style={styles.gameActionsContainer}>
          {gameState === "WINNER" && <WinnerAnimation />}
          {gameState === "NEW_GAME" && (
            //form input number to change level
            <View style={styles.container}>
              <ThemedText>Dificuldade:</ThemedText>
              <TextInput
                onChangeText={handleChange}
                keyboardType="numeric"
                maxLength={1}
                style={styles.input}
                placeholder={difficulty.toString()}
              />
            </View>
          )}
          <ThemedView style={[styles.gameActions]}>
            {gameState === "WINNER" && (
              <View style={styles.titleContainer}>
                <ThemedButton
                  onPress={() => {
                    setLevel(level + 1);
                    initialize();
                  }}
                  textStyle={{ textAlign: "center" }}
                  text={"PROXIMO NÍVEL"}
                />
              </View>
            )}
            <View style={styles.titleContainer}>
              <ThemedButton
                onPress={initialize}
                textStyle={{ textAlign: "center" }}
                text={gameState === "WINNER" ? "NOVO JOGO" : "INICIAR"}
              />
              <ThemedButton
                textStyle={{ textAlign: "center" }}
                onPress={() => {
                  if (gameState === "WINNER") {
                    setGameState("NEW_GAME");
                  } else {
                    router.push("/");
                  }
                }}
                text={gameState === "WINNER" ? "DIFICULDADE" : "VOLTAR"}
              />
            </View>
          </ThemedView>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const { width, height } = Dimensions.get("window");

const createStyles = (palette: any) => StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: 10,
    gap: 10,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width,
    height,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.textSecondary,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    fontFamily: FONTS.regular,
    width: width * 0.8,
    textAlign: "center",
    backgroundColor: palette.cardBackground,
    color: palette.textPrimary,
  },
  gameActions: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    display: "flex",
    flexDirection: "row",
    gap: 8,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  gameActionsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    paddingTop: 5,
    paddingBottom: 10,
  },
  scoreContainer: {
    alignItems: "center",
    minHeight: 56,
    justifyContent: "center",
    flex: 1,
  },
  scoreLabel: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    letterSpacing: 2,
    flex: 1,
  },
  scoreText: {
    flex: 1,
    fontSize: 32,
    fontFamily: FONTS.primary,
  },
});
