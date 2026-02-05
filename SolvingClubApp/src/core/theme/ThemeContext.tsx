import React, {createContext, useContext, useState, useEffect} from 'react';
import {useColorScheme} from 'react-native';

interface ThemeContextType {
  theme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<'light' | 'dark'>(
    systemColorScheme === 'dark' ? 'dark' : 'light'
  );

  // Always sync with system theme
  useEffect(() => {
    setTheme(systemColorScheme === 'dark' ? 'dark' : 'light');
  }, [systemColorScheme]);

  return (
    <ThemeContext.Provider value={{theme}}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

