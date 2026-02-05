import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Spacing} from '../../core/constants';
import {useColors} from '../../core/theme/colors';
import {Text, Button} from '../../shared/components';
import {useAuth} from '../../core/hooks/useAuth';
import {RootStackParamList} from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

/**
 * Home Screen
 */
const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const colors = useColors();
  const {user, signOut} = useAuth();

  const handleGetStarted = () => {
    navigation.navigate('Hello');
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.content}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={[styles.logoContainer, {backgroundColor: colors.primaryLight + '20'}]}>
            <Text variant="h1" color="primary" center style={styles.logoEmoji}>
              🤝
            </Text>
          </View>

          <Text variant="h1" center style={styles.title}>
            Solving Club
          </Text>

          <Text variant="bodyLarge" color="textSecondary" center style={styles.subtitle}>
            Build. Learn. Grow Together.
          </Text>

          {user && (
            <Text variant="body" color="textSecondary" center style={styles.userInfo}>
              Welcome, {user.email}
            </Text>
          )}
        </View>

        {/* CTA Section */}
        <View style={styles.ctaContainer}>
          <Button
            title="Get Started"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleGetStarted}
          />

          {user && (
            <Button
              title="📄 View Documents & Quotations"
              variant="outline"
              size="lg"
              fullWidth
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('DocumentsList')}
            />
          )}

          <Button
            title="Learn More"
            variant="outline"
            size="lg"
            fullWidth
            style={styles.secondaryButton}
            onPress={() => console.log('Learn more pressed!')}
          />

          {user && (
            <Button
              title="Logout"
              variant="ghost"
              size="md"
              fullWidth
              onPress={handleLogout}
              style={styles.logoutButton}
            />
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="bodySmall" color="textTertiary" center>
            Version 1.0.0
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoEmoji: {
    fontSize: 60,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    maxWidth: 280,
  },
  ctaContainer: {
    paddingBottom: Spacing.lg,
  },
  secondaryButton: {
    marginTop: Spacing.md,
  },
  footer: {
    paddingBottom: Spacing.md,
  },
  userInfo: {
    marginTop: Spacing.sm,
  },
  logoutButton: {
    marginTop: Spacing.md,
  },
});

export default HomeScreen;

