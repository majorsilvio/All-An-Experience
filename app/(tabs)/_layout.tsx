import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FONTS } from '@/hooks/useFonts';
import { useThemePalette } from '@/hooks/useThemePalette';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = useThemePalette();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textSecondary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: palette.cardBackground,
            borderTopWidth: 3,
            borderTopColor: palette.brutalistBorder,
            shadowColor: palette.shadowColor,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.6,
            shadowRadius: 8,
            elevation: 20,
          },
          default: {
            backgroundColor: palette.cardBackground,
            borderTopWidth: 3,
            borderTopColor: palette.brutalistBorder,
            elevation: 20,
          },
        }),
        tabBarLabelStyle: {
          fontFamily: FONTS.gaming,
          fontSize: 7,
          letterSpacing: 0.3,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'CATEGORIAS',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="square.grid.3x3.fill" color={color} />,
        }}
      />
       <Tabs.Screen
        name="favorites"
        options={{
          title: 'FAVORITOS',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="star.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}