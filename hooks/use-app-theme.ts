import { useEffect, useState } from 'react';
import { useColorScheme } from './use-color-scheme';

type Theme = 'light' | 'dark';
type Listener = (theme: Theme) => void;

// Estado global simple en memoria
let currentTheme: Theme | null = null;
const listeners = new Set<Listener>();

export const themeStore = {
  getTheme: () => currentTheme,
  setTheme: (theme: Theme) => {
    currentTheme = theme;
    listeners.forEach((listener) => listener(theme));
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useAppTheme() {
  const systemScheme = useColorScheme();

  const [theme, setThemeState] = useState<Theme>(() => {
    if (currentTheme) return currentTheme;
    return systemScheme === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    // Sincronizar con el sistema inicialmente si no hay una selección manual previa
    if (!currentTheme && systemScheme) {
      themeStore.setTheme(systemScheme === 'light' ? 'light' : 'dark');
    }
  }, [systemScheme]);

  useEffect(() => {
    const unsubscribe = themeStore.subscribe((newTheme) => {
      setThemeState(newTheme);
    });
    // Establecer estado inicial correcto
    if (currentTheme && currentTheme !== theme) {
      setThemeState(currentTheme);
    }
    return unsubscribe;
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    themeStore.setTheme(nextTheme);
  };

  return { theme, toggleTheme };
}
