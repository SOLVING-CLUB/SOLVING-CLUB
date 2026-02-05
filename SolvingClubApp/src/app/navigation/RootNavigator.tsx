import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './types';
import {useAuth} from '../../core/hooks/useAuth';
import {useColors} from '../../core/theme/colors';
import {View, ActivityIndicator, StyleSheet} from 'react-native';

// Auth Screens
import UnifiedAuthScreen from '../../features/auth/screens/UnifiedAuthScreen';

// App Screens
import HomeScreen from '../screens/HomeScreen';
import HelloScreen from '../screens/HelloScreen';

// Documents Screens
import DocumentsListScreen from '../../features/documents/screens/DocumentsListScreen';
import DocumentViewerScreen from '../../features/documents/screens/DocumentViewerScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root Navigator with Auth Guards
 */
const RootNavigator: React.FC = () => {
  const {user, loading} = useAuth();
  const colors = useColors();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, {backgroundColor: colors.background}]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: colors.background},
          animation: 'slide_from_right',
        }}>
        {!user ? (
          // Auth Stack - Unified screen with animated form switching
          <>
            <Stack.Screen name="Login" component={UnifiedAuthScreen} />
          </>
        ) : (
          // App Stack
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen
              name="Hello"
              component={HelloScreen}
              options={{
                headerShown: true,
                headerTitle: 'Hello',
                headerTintColor: colors.primary,
                headerStyle: {backgroundColor: colors.background},
              }}
            />
            <Stack.Screen name="Dashboard" component={HomeScreen} />
            <Stack.Screen
              name="DocumentsList"
              component={DocumentsListScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="DocumentViewer"
              component={DocumentViewerScreen}
              options={{
                headerShown: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RootNavigator;

