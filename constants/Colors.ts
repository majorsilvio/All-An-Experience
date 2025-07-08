/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";
export const PALETTE = {
  // Dark theme (primary)
  background: "#1A1A1A",
  background_darker: "#0D0D0D",
  primary: "#BFFF00",
  primary_darker: "#4CAF50",
  cardBackground: "#2A2A2A",
  textPrimary: "#F5F5F5",
  textPrimary_darker: "#0D0D0D",
  textSecondary: "#AAAAAA",
  textSecondary_darker: "#2A2A2A",
  BallTicTacToe: "#01c4e7",
  // Neo-Brutalismo Gamer accents
  neonAccent: "#00FFFF",
  warningAccent: "#FF3030",
  successAccent: "#39FF14",
  glitchPurple: "#B026FF",
  retroOrange: "#FF6B35",
  // Borders and shadows for brutalist design
  brutalistBorder: "#BFFF00",
  shadowColor: "rgba(191, 255, 0, 0.3)",
  
  // Light theme variants
  light: {
    background: "#F5F5F5",
    background_darker: "#E8E8E8",
    primary: "#7CB342",
    primary_darker: "#388E3C",
    cardBackground: "#FFFFFF",
    textPrimary: "#1A1A1A",
    textSecondary: "#666666",
    neonAccent: "#0091EA",
    warningAccent: "#D32F2F",
    successAccent: "#2E7D32",
    glitchPurple: "#7B1FA2",
    retroOrange: "#F57C00",
    brutalistBorder: "#7CB342",
    shadowColor: "rgba(124, 179, 66, 0.3)",
  }
};
export const Colors = {
  light: {
    text: PALETTE.textPrimary,
    background: PALETTE.background,
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    buttontext: PALETTE.textPrimary_darker,
    buttonBackground: PALETTE.primary,
  },
  dark: {
    text: PALETTE.textSecondary,
    background: PALETTE.background_darker,
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    buttontext: PALETTE.textPrimary,
    buttonBackground: PALETTE.primary_darker,
  },
};
