import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveToCache = async (key: string, value: unknown) => {
  try {
    const json = JSON.stringify(value);
    await AsyncStorage.setItem(key, json);
  } catch (e) {
    console.error('Failed to save data', e);
  }
};

export const getFromCache = async <T>(key: string): Promise<T | null> => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value != null ? JSON.parse(value) : null;
  } catch (e) {
    console.error('Failed to load data', e);
    return null;
  }
};

export const removeFromCache = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to remove data', e);
  }
};
