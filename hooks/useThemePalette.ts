import { PALETTE } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export const useThemePalette = () => {
  const colorScheme = useColorScheme();
  
  // Garantir que sempre retorne um valor válido
  const lightPalette = {
    background: PALETTE.light?.background || '#F5F5F5',
    background_darker: PALETTE.light?.background_darker || '#E8E8E8',
    primary: PALETTE.light?.primary || '#7CB342',
    primary_darker: PALETTE.light?.primary_darker || '#388E3C',
    cardBackground: PALETTE.light?.cardBackground || '#FFFFFF',
    textPrimary: PALETTE.light?.textPrimary || '#1A1A1A',
    textSecondary: PALETTE.light?.textSecondary || '#666666',
    neonAccent: PALETTE.light?.neonAccent || '#0091EA',
    warningAccent: PALETTE.light?.warningAccent || '#D32F2F',
    successAccent: PALETTE.light?.successAccent || '#2E7D32',
    glitchPurple: PALETTE.light?.glitchPurple || '#7B1FA2',
    retroOrange: PALETTE.light?.retroOrange || '#F57C00',
    brutalistBorder: PALETTE.light?.brutalistBorder || '#7CB342',
    shadowColor: PALETTE.light?.shadowColor || 'rgba(124, 179, 66, 0.3)',
  };

  const darkPalette = {
    background: PALETTE.background || '#1A1A1A',
    background_darker: PALETTE.background_darker || '#0D0D0D',
    primary: PALETTE.primary || '#BFFF00',
    primary_darker: PALETTE.primary_darker || '#4CAF50',
    cardBackground: PALETTE.cardBackground || '#2A2A2A',
    textPrimary: PALETTE.textPrimary || '#F5F5F5',
    textSecondary: PALETTE.textSecondary || '#AAAAAA',
    neonAccent: PALETTE.neonAccent || '#00FFFF',
    warningAccent: PALETTE.warningAccent || '#FF3030',
    successAccent: PALETTE.successAccent || '#39FF14',
    glitchPurple: PALETTE.glitchPurple || '#B026FF',
    retroOrange: PALETTE.retroOrange || '#FF6B35',
    brutalistBorder: PALETTE.brutalistBorder || '#BFFF00',
    shadowColor: PALETTE.shadowColor || 'rgba(191, 255, 0, 0.3)',
  };
  
  if (colorScheme === 'light') {
    return lightPalette;
  }
  
  // Default to dark theme
  return darkPalette;
};
