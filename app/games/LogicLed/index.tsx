import { Image } from "expo-image";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import DynamicGrid from "@/components/DynamicGrid";
import CircleComponent from "@/components/Icons/Circle";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedView } from "@/components/ThemedView";
import WinnerAnimation from "@/components/WinnerAnimation";
import LogicTable from "@/constants/LogicTable";
import { Button } from "@react-navigation/elements";
import { router } from "expo-router";
import { useEffect, useState } from "react";

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

export default function LogicLed({
  level = 10,
  difficulty = 5,
}: {
  level: number;
  difficulty: number;
}) {
  const [data, setData] = useState<boolean[][]>(LogicTable(difficulty));
  const [gameState, setGameState] = useState<"WINNER" | "PLAYING" | "LOSER">(
    "PLAYING"
  );
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

      if (newData.flat().every((cell) => !cell) && newData.length > 0) {
        setGameState("WINNER");
      }

      return newData;
    });

  useEffect(() => {}, [data]);

  const newGame = () => {
    for (let i = 0; i < level; i++) {
      const row = Math.floor(Math.random() * difficulty);
      const col = Math.floor(Math.random() * difficulty);
      // console.log(row + 1, col + 1);
      changeCell(row, col);
    }
    setGameState("PLAYING");
  };

  useEffect(() => {
    newGame();
    return () => {};
  }, []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      contentContainerStyle={{ height: "80%" }}
      headerImage={
        <Image
          source={require("@/assets/images/LedLogico.png")}
          style={styles.reactLogo}
        />
      }
    >
      {gameState !== "WINNER" ? (
        <DynamicGrid
          data={data}
          style={{ height: "80%" }}
          renderItem={(row, index) => {
            return row.map((item, col) => (
              <TouchableOpacity
                key={`grid-item-${index}-${col}`}
                style={[styles.item, { padding: 8 }]}
                onPress={() => changeCell(index, col)}
              >
                <CircleComponent
                  size={46}
                  stroke={"black"}
                  strokeOpacity={0.5}
                  fill={item ? "yellow" : "black"}
                />
              </TouchableOpacity>
            ));
          }}
        />
      ) : (
        <View
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "80%",
          }}
        >
          <WinnerAnimation />
        </View>
      )}
      <ThemedView style={styles.stepContainer}>
        <Button
          onPress={() => {
            setData(LogicTable(difficulty));
            newGame();
          }}
        >
          New Game
        </Button>
        <Button onPress={() => router.push('/')}>Tela Inicial</Button>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  stepContainer: {
    gap: 8,
    flex: 1,
  },
  reactLogo: {
    height: "100%",
    width: "100%",
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  bottomBar: {
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ccc",
  },
});
