import React from 'react';
import {StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ThemeProvider, useTheme} from '../core/theme/ThemeContext';
import {useColors} from '../core/theme/colors';
import {AuthProvider} from '../core/hooks/useAuth';
import {ToastWrapper} from '../shared/components/CustomToast';
import RootNavigator from './navigation/RootNavigator';

/**
 * App Content with Theme
 */
const AppContent: React.FC = () => {
  const colors = useColors();
  const {theme} = useTheme();

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
        <SafeAreaView
          style={[styles.safeArea, {backgroundColor: colors.background}]}
          edges={['top', 'bottom', 'left', 'right']}>
          <RootNavigator />
          <ToastWrapper />
        </SafeAreaView>
    </View>
  );
};

/**
 * Main App Component
 */
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});

export default App;
