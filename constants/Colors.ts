/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// A CORREÇÃO É GARANTIR QUE "EXPORT" ESTEJA AQUI
export const PALETTE = {
  background: '#1A1A1A',
  background_darker: '#0D0D0D',
  primary: '#BFFF00',
  primary_darker: '#4CAF50',
  cardBackground: '#2A2A2A',
  textPrimary: '#F5F5F5',
  textSecondary: '#AAAAAA',
};
