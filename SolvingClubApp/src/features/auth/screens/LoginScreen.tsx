import React, {useState} from 'react';
import {View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, ActivityIndicator} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {supabase} from '../../../services/supabase';
import {Spacing} from '../../../core/constants';
import {useColors} from '../../../core/theme/colors';
import {Text, Button, Input} from '../../../shared/components';
import {loginSchema, validateForm} from '../../../core/validation';
import {toast} from '../../../core/utils/toast';
import {RootStackParamList} from '../../../app/navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Login Screen
 */
const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const colors = useColors();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Combine username with domain for validation and API calls
  const getFullEmail = () => {
    return username.trim() + '@solvingclub.org';
  };

  const handleLogin = async () => {
    setErrors({});

    if (!username.trim()) {
      setErrors({email: ['Username is required']});
      return;
    }

    const fullEmail = getFullEmail();

    // Validate form data
    const validation = validateForm(loginSchema, {email: fullEmail, password});
    if (!validation.success) {
      setErrors(validation.errors || {});
      return;
    }

    setLoading(true);
    try {
      const {error} = await supabase.auth.signInWithPassword({
        email: fullEmail,
        password,
      });
      if (error) {
        toast.error('Login Failed', error.message);
        setLoading(false);
        return;
      }
      toast.success('Welcome back!', "You've been successfully logged in.");
      // Navigation will be handled by auth state change
    } catch {
      toast.error('Login Failed', 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: colors.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.animationContainer}>
              {imageError ? (
                <View style={[styles.loginGif, styles.fallbackContainer, {backgroundColor: colors.primaryLight + '20'}]}>
                  <Text variant="h1" color="primary" center style={styles.fallbackEmoji}>
                    👋
                  </Text>
                </View>
              ) : (
                <View style={styles.imageWrapper}>
                  {imageLoading && (
                    <View style={[styles.loginGif, styles.loadingContainer]}>
                      <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                  )}
                  <Image
                    source={require('../../../assets/lottie/login.gif')}
                    style={[styles.loginGif, imageLoading && styles.hidden]}
                    resizeMode="contain"
                    onError={() => {
                      setImageError(true);
                      setImageLoading(false);
                    }}
                    onLoadEnd={() => {
                      setImageLoading(false);
                    }}
                  />
                </View>
              )}
            </View>
            <Text variant="h1" center style={styles.title}>
              Welcome back
            </Text>
            <Text variant="bodyLarge" color="textSecondary" center style={styles.subtitle}>
              Sign in to your Solving Club account
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="username"
              value={username}
              onChangeText={setUsername}
              keyboardType="default"
              autoCapitalize="none"
              autoComplete="username"
              error={errors.email?.[0]}
              disabled={loading}
              suffix="@solvingclub.org"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              showPasswordToggle
              error={errors.password?.[0]}
              disabled={loading}
            />

            <Button
              title={loading ? 'Logging in...' : 'Login'}
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onPress={handleLogin}
              style={styles.loginButton}
            />

            <View style={styles.footer}>
              <Button
                title="Create account"
                variant="ghost"
                size="md"
                onPress={() => navigation.navigate('Signup')}
              />
              <Button
                title="Forgot password?"
                variant="ghost"
                size="md"
                onPress={() => navigation.navigate('ForgotPassword')}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  animationContainer: {
    marginBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  loginGif: {
    width: 250,
    height: 250,
  },
  hidden: {
    opacity: 0,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  fallbackContainer: {
    width: 250,
    height: 250,
    borderRadius: 125,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackEmoji: {
    fontSize: 80,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    maxWidth: 300,
    alignSelf: 'center',
  },
  form: {
    width: '100%',
  },
  loginButton: {
    marginTop: Spacing.md,
  },
  footer: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
});

export default LoginScreen;

