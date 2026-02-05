import React, {useState} from 'react';
import {View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, ActivityIndicator} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {supabase} from '../../../services/supabase';
import {Spacing} from '../../../core/constants';
import {useColors} from '../../../core/theme/colors';
import {Text, Button, Input} from '../../../shared/components';
import {forgotPasswordSchema, validateForm} from '../../../core/validation';
import {toast} from '../../../core/utils/toast';
import {RootStackParamList} from '../../../app/navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Forgot Password Screen
 */
const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const colors = useColors();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Combine username with domain for validation and API calls
  const getFullEmail = () => {
    return username.trim() + '@solvingclub.org';
  };

  const handleSubmit = async () => {
    setErrors({});

    if (!username.trim()) {
      setErrors({email: ['Username is required']});
      return;
    }

    const fullEmail = getFullEmail();

    const validation = validateForm(forgotPasswordSchema, {email: fullEmail});
    if (!validation.success) {
      setErrors(validation.errors || {});
      return;
    }

    setLoading(true);
    try {
      // For React Native, we need to handle the redirect URL differently
      // You'll need to configure this in your Supabase dashboard
      const {error} = await supabase.auth.resetPasswordForEmail(fullEmail, {
        redirectTo: 'solvingclub://reset-password', // Deep link for mobile
      });
      if (error) {
        toast.error('Reset Failed', error.message);
        setLoading(false);
        return;
      }
      toast.success('Reset Link Sent', 'Check your email for password reset instructions.');
      setSent(true);
    } catch {
      toast.error('Reset Failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text variant="h1" center style={styles.title}>
                Check your email
              </Text>
              <Text variant="bodyLarge" color="textSecondary" center style={styles.subtitle}>
                We've sent password reset instructions to your email address
              </Text>
            </View>

            <View style={[styles.messageBox, {backgroundColor: colors.success + '20'}]}>
              <Text variant="body" color="textSecondary" center>
                If an account with that email exists, you'll receive password reset instructions
                shortly.
              </Text>
            </View>

            <View style={styles.actions}>
              <Button
                title="Back to Login"
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => navigation.navigate('Login')}
              />
              <Button
                title="Try Different Email"
                variant="outline"
                size="lg"
                fullWidth
                onPress={() => setSent(false)}
                style={styles.secondaryButton}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

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
              Forgot password
            </Text>
            <Text variant="bodyLarge" color="textSecondary" center style={styles.subtitle}>
              Enter your email address and we'll send you a reset link
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

            <Button
              title={loading ? 'Sending...' : 'Send reset link'}
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onPress={handleSubmit}
              style={styles.submitButton}
            />

            <View style={styles.footer}>
              <Button
                title="Back to Login"
                variant="ghost"
                size="md"
                onPress={() => navigation.navigate('Login')}
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
  messageBox: {
    padding: Spacing.md,
    borderRadius: Spacing.md,
    marginBottom: Spacing.lg,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  actions: {
    marginTop: Spacing.lg,
  },
  secondaryButton: {
    marginTop: Spacing.md,
  },
  footer: {
    marginTop: Spacing.lg,
  },
});

export default ForgotPasswordScreen;

