import LottieView from "lottie-react-native";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { ThemedText } from "./ThemedText";

const { width } = Dimensions.get("window");

const WinnerGrid: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <LottieView
          source={require("@/assets/animations/trophy.json")}
          autoPlay
          loop={true}
          style={{ width: 300, height: 300 }}
        />
      </View>
      <ThemedText>🎉 You Win! 🎉</ThemedText>
    </View>
  );
};

export default WinnerGrid;

const styles = StyleSheet.create({
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    width: "100%",
  },
  row: {},
  animation: {
    width: width * 0.8,
    height: width * 0.8,
  },
});
