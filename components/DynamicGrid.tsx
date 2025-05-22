import React from "react";
import { ScrollView, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { ThemedText } from "./ThemedText";

type Props<T> = {
  data: T[];
  style?: StyleProp<ViewStyle>;
  renderItem?: (
    item: T,
    id: number
  ) => React.ReactElement | React.ReactElement[];
};

function DynamicGrid<T extends any>({ data, renderItem, style }: Props<T>) {
  return (
    <ScrollView contentContainerStyle={[styles.container, style]}>
      {data.map((item, id) => (
        <ScrollView key={id} contentContainerStyle={[styles.container, styles.item]}>
          {renderItem ? (
            renderItem(item, id)
          ) : (
            <ThemedText style={styles.text}>{item as string}</ThemedText>
          )}
        </ScrollView>
      ))}
    </ScrollView>
  );
}

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
