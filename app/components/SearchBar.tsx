import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { PALETTE } from '../(tabs)';
import { Emoji } from '../../components/Emoji';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar = ({ value, onChangeText, placeholder = 'Procurar jogos...' }: SearchBarProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Emoji name="search" size={20} />
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={PALETTE.textSecondary}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} style={styles.clearButton}>
          <Text style={styles.clearIcon}>✕</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    paddingRight: 8,
  },
  icon: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    height: 48,
    color: PALETTE.textPrimary,
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
  clearIcon: {
    color: PALETTE.textSecondary,
    fontSize: 16,
  },
});