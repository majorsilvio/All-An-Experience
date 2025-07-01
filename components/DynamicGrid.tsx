import React from 'react';
import { ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

type Props<T> = {
  data: T[][];
  cellSize?: number;
  renderItem?: (item: T, rowIndex: number, colIndex: number) => React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

const DynamicGrid = <T,>({ data, cellSize = 100, renderItem , contentContainerStyle}: Props<T>) => {
  const rows = data.length;
  const columns = Math.max(...data.map(row => row.length));

  return (
    <ScrollView horizontal contentContainerStyle={contentContainerStyle}>
      <ScrollView contentContainerStyle={{ width: columns * cellSize, height: rows * cellSize }}>
        <View style={{ flexDirection: 'column' }}>
          {data.map((row, rowIdx) => (
            <View key={`row-${rowIdx}`} style={{ flexDirection: 'row' }}>
              {Array.from({ length: columns }).map((_, colIdx) => {
                const item = row[colIdx];

                return (
                  <View
                    key={`cell-${rowIdx}-${colIdx}`}
                    style={[styles.cell, { width: cellSize, height: cellSize }]}
                  >
                    {item !== undefined
                      ? renderItem
                        ? renderItem(item, rowIdx, colIdx)
                        : <Text>{`${item}`}</Text>
                      : null}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  cell: {
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DynamicGrid;
