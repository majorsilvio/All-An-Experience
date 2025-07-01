import LottieView from "lottie-react-native";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";

const { width } = Dimensions.get("window");

const WinnerGrid: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <LottieView
          source={require("@/assets/animations/trophy.json")}
          autoPlay
          loop={true}
          style={styles.animation}
        />
      </View>
    </View>
  );
};

export default WinnerGrid;

const styles = StyleSheet.create({
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  row: {},
  animation: {
    width: width * 0.8,
    height: width * 0.8,
  },
});
