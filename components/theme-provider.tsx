'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored === 'dark') {
      setThemeState('dark');
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      // Default to light — explicitly remove dark class and force white bg
      setThemeState('light');
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      document.documentElement.style.backgroundColor = '#ffffff';
      document.body.style.backgroundColor = '#ffffff';
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.style.colorScheme = newTheme;
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.backgroundColor = '#ffffff';
      document.body.style.backgroundColor = '#ffffff';
    }
  };

  // Always render children — but suppress any dark appearance before mount
  // by keeping html without .dark class (set in layout) and forcing white bg inline
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div
        style={!mounted ? { backgroundColor: '#ffffff', minHeight: '100vh' } : undefined}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
