import React from "react";
import {
    ScrollView,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle
} from "react-native";
import { ThemedText } from "./ThemedText";

export type DynamicGridItem = {
  id: string;
  text?: string;
  style?: StyleProp<ViewStyle>;
  render?: () => React.ReactElement;
};

type Props = {
  data: DynamicGridItem[];
};

const DynamicGrid: React.FC<Props> = ({ data }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {data.map((item) => (
        <View key={item.id} style={[styles.item, item.style]}>
          {item.render ? (
            item.render()
          ) : (
            <ThemedText style={styles.text}>{item.text}</ThemedText>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    width: "100%",
  },
  text: {
    color: "#fff",
    fontSize: 16,
  },
});

export default DynamicGrid;
