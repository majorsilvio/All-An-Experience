import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Emoji } from '../../components/Emoji';
import { FONTS } from '../../hooks/useFonts';
import { useThemePalette } from '../../hooks/useThemePalette';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar = ({ value, onChangeText, placeholder = 'Procurar jogos...' }: SearchBarProps) => {
  const palette = useThemePalette();
  
  // Safety check for palette
  if (!palette || !palette.textPrimary) {
    console.warn('Palette is undefined in SearchBar, using fallback');
    return (
      <View style={{ 
        height: 48, 
        backgroundColor: '#2A2A2A', 
        borderRadius: 12, 
        marginVertical: 16,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Text style={{ color: '#F5F5F5' }}>Carregando busca...</Text>
      </View>
    );
  }
  
  const styles = createStyles(palette);
  
  return (
    <View style={styles.container}>
      <View style={styles.borderEffect} />
      <View style={styles.innerContainer}>
        <View style={styles.iconContainer}>
          <Emoji name="search" size={18} />
        </View>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.textSecondary}
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChangeText('')} style={styles.clearButton}>
            <View style={styles.clearButtonBg}>
              <Text style={styles.clearIcon}>✕</Text>
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const createStyles = (palette: any) => StyleSheet.create({
  container: {
    position: 'relative',
    marginVertical: 16,
  },
  borderEffect: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    backgroundColor: palette.primary,
    borderRadius: 14,
    zIndex: -1,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: palette.brutalistBorder,
    shadowColor: palette.shadowColor,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 8,
  },
  iconContainer: {
    paddingRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    color: palette.textPrimary,
    fontSize: 14,
    fontFamily: FONTS.regular,
    letterSpacing: 0.5,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonBg: {
    backgroundColor: palette.warningAccent,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.background_darker,
  },
  clearIcon: {
    color: palette.background_darker,
    fontSize: 12,
    fontWeight: 'bold',
  },
});