import React from 'react';
import { DimensionValue, ScrollView, StyleSheet, Text, View } from 'react-native';

export type DynamicGridItem = {
  id: string;
  label: string;
  width: DimensionValue;
  height: number;
  backgroundColor?: string;
};

type Props = {
  data: DynamicGridItem[];
};

const DynamicGrid: React.FC<Props> = ({ data }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {data.map((item) => (
        <View
          key={item.id}
          style={[
            styles.item,
            {
              width: item.width,
              height: item.height,
              backgroundColor: item.backgroundColor || '#4caf50',
            },
          ]}
        >
          <Text style={styles.text}>{item.label}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8, // For React Native >= 0.71. If older, use margin manually
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
});

export default DynamicGrid;
