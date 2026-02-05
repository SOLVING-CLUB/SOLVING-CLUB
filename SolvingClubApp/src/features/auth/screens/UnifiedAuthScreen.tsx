import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {supabase} from '../../../services/supabase';
import {Spacing} from '../../../core/constants';
import {useColors} from '../../../core/theme/colors';
import {Text, Button, Input} from '../../../shared/components';
import SignupSuccessScreen from './SignupSuccessScreen';
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  validateForm,
  validatePassword,
} from '../../../core/validation';
import {toast} from '../../../core/utils/toast';
import {RootStackParamList} from '../../../app/navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type AuthMode = 'login' | 'signup' | 'forgotPassword';

type UsernameAvailability = 'idle' | 'checking' | 'available' | 'unavailable';

/**
 * Unified Auth Screen with animated form switching
 */
const UnifiedAuthScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const colors = useColors();
  const [mode, setMode] = useState<AuthMode>('login');
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Signup state
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usernameAvailability, setUsernameAvailability] = useState<UsernameAvailability>('idle');
  const [showSuccess, setShowSuccess] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Forgot password state
  const [sent, setSent] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Combine username with domain
  const getFullEmail = () => {
    return username.trim() + '@solvingclub.org';
  };

  const passwordValidation = validatePassword(password);

  // Animate form change
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -20,
        duration: 150,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset and animate in
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [mode]);

  // Check username availability (for signup)
  useEffect(() => {
    if (mode !== 'signup') {
      setUsernameAvailability('idle');
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmedUsername = username.trim();

    if (!trimmedUsername || trimmedUsername.length < 2) {
      setUsernameAvailability('idle');
      return;
    }

    setUsernameAvailability('checking');

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const fullEmail = trimmedUsername + '@solvingclub.org';
        const {data: profileData} = await supabase
          .from('profiles')
          .select('email')
          .eq('email', fullEmail)
          .limit(1);

        const emailExists = profileData && profileData.length > 0;
        setUsernameAvailability(emailExists ? 'unavailable' : 'available');
      } catch (error) {
        console.error('Error checking username availability:', error);
        setUsernameAvailability('idle');
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [username, mode]);

  const handleLogin = async () => {
    setErrors({});

    if (!username.trim()) {
      setErrors({email: ['Username is required']});
      return;
    }

    const fullEmail = getFullEmail();
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
    } catch {
      toast.error('Login Failed', 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setErrors({});

    if (!username.trim()) {
      setErrors({email: ['Username is required']});
      return;
    }

    const fullEmail = getFullEmail();
    const validation = validateForm(signupSchema, {
      email: fullEmail,
      password,
      confirmPassword,
      fullName,
    });
    if (!validation.success) {
      setErrors(validation.errors || {});
      return;
    }

    setLoading(true);
    try {
      const {data: existingUsers} = await supabase
        .from('profiles')
        .select('email')
        .eq('email', fullEmail)
        .limit(1);

      if (existingUsers && existingUsers.length > 0) {
        setErrors({email: ['This email is already registered.']});
        toast.error('Email Already Exists', 'Please login or use a different email.');
        setLoading(false);
        return;
      }

      const {data: authData, error: authError} = await supabase.auth.signUp({
        email: fullEmail,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) {
        if (
          authError.message?.toLowerCase().includes('already registered') ||
          authError.message?.toLowerCase().includes('user already exists')
        ) {
          setErrors({email: ['This email is already registered.']});
          toast.error('Email Already Exists', 'Please login or use a different email.');
        } else {
          toast.error('Signup Failed', authError.message || 'An error occurred during signup.');
        }
        setLoading(false);
        return;
      }

      if (authData.user) {
        await supabase
          .from('profiles')
          .upsert(
            {
              id: authData.user.id,
              full_name: fullName,
              email: fullEmail,
            } as any,
            {
              onConflict: 'id',
            },
          );
      }

      toast.success('Account Created!', 'Please check your email to confirm your account.');
      setShowSuccess(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      toast.error('Signup Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
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
      const {error} = await supabase.auth.resetPasswordForEmail(fullEmail, {
        redirectTo: 'solvingclub://reset-password',
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

  const renderForm = () => {
    if (mode === 'login') {
      return (
        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{translateY: slideAnim}],
            },
          ]}>
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
            style={styles.submitButton}
          />

          <View style={styles.footer}>
            <Button
              title="Create account"
              variant="ghost"
              size="md"
              onPress={() => setMode('signup')}
            />
            <Button
              title="Forgot password?"
              variant="ghost"
              size="md"
              onPress={() => setMode('forgotPassword')}
            />
          </View>
        </Animated.View>
      );
    }

    if (mode === 'signup') {
      return (
        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{translateY: slideAnim}],
            },
          ]}>
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            error={errors.fullName?.[0]}
            disabled={loading}
          />

          <View>
            <Input
              label="Email"
              placeholder="username"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (errors.email) {
                  const newErrors = {...errors};
                  delete newErrors.email;
                  setErrors(newErrors);
                }
              }}
              keyboardType="default"
              autoCapitalize="none"
              autoComplete="username"
              error={errors.email?.[0]}
              disabled={loading}
              suffix="@solvingclub.org"
            />
            {username.trim().length >= 2 && (
              <View style={styles.availabilityContainer}>
                {usernameAvailability === 'checking' && (
                  <View style={styles.availabilityRow}>
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                    <Text variant="bodySmall" color="textSecondary" style={styles.availabilityText}>
                      Checking availability...
                    </Text>
                  </View>
                )}
                {usernameAvailability === 'available' && (
                  <Text variant="bodySmall" color="success" style={styles.availabilityText}>
                    ✓ Username is available
                  </Text>
                )}
                {usernameAvailability === 'unavailable' && (
                  <Text variant="bodySmall" color="error" style={styles.availabilityText}>
                    ✕ Username is already taken
                  </Text>
                )}
              </View>
            )}
          </View>

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

          {password.length > 0 && (
            <View style={[styles.passwordRequirements, {backgroundColor: colors.divider}]}>
              <Text variant="bodySmall" color="textSecondary" style={styles.requirementsTitle}>
                Password requirements:
              </Text>
              {passwordValidation.errors.map((error, index) => (
                <Text key={index} variant="bodySmall" color="error" style={styles.requirement}>
                  • {error}
                </Text>
              ))}
              {passwordValidation.isValid && (
                <Text variant="bodySmall" color="success" style={styles.requirement}>
                  ✓ Password meets all requirements
                </Text>
              )}
            </View>
          )}

          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            showPasswordToggle
            error={errors.confirmPassword?.[0] || (confirmPassword && password !== confirmPassword ? "Passwords don't match" : undefined)}
            disabled={loading}
          />

          <Button
            title={loading ? 'Creating...' : 'Create account'}
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={!passwordValidation.isValid || usernameAvailability === 'unavailable' || usernameAvailability === 'checking'}
            onPress={handleSignup}
            style={styles.submitButton}
          />

          <View style={styles.footer}>
            <Button
              title="Already have an account? Login"
              variant="ghost"
              size="md"
              onPress={() => setMode('login')}
            />
          </View>
        </Animated.View>
      );
    }

    if (mode === 'forgotPassword') {
      if (sent) {
        return (
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{translateY: slideAnim}],
              },
            ]}>
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
                onPress={() => {
                  setSent(false);
                  setMode('login');
                }}
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
          </Animated.View>
        );
      }

      return (
        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{translateY: slideAnim}],
            },
          ]}>
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
            onPress={handleForgotPassword}
            style={styles.submitButton}
          />

          <View style={styles.footer}>
            <Button
              title="Back to Login"
              variant="ghost"
              size="md"
              onPress={() => setMode('login')}
            />
          </View>
        </Animated.View>
      );
    }

    return null;
  };

  const getTitle = () => {
    switch (mode) {
      case 'login':
        return 'Welcome back';
      case 'signup':
        return 'Create your account';
      case 'forgotPassword':
        return 'Forgot password';
      default:
        return '';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login':
        return 'Sign in to your Solving Club account';
      case 'signup':
        return 'Join Solving Club';
      case 'forgotPassword':
        return "Enter your email address and we'll send you a reset link";
      default:
        return '';
    }
  };

  return (
    <>
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
                {getTitle()}
              </Text>
              <Text variant="bodyLarge" color="textSecondary" center style={styles.subtitle}>
                {getSubtitle()}
              </Text>
            </View>

            {renderForm()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SignupSuccessScreen
        visible={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </>
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
  formContainer: {
    width: '100%',
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  footer: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  passwordRequirements: {
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    borderRadius: Spacing.sm,
  },
  requirementsTitle: {
    marginBottom: Spacing.xs,
  },
  requirement: {
    marginTop: Spacing.xs / 2,
  },
  availabilityContainer: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  availabilityText: {
    marginLeft: Spacing.xs / 2,
  },
  messageBox: {
    padding: Spacing.md,
    borderRadius: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actions: {
    marginTop: Spacing.lg,
  },
  secondaryButton: {
    marginTop: Spacing.md,
  },
});

export default UnifiedAuthScreen;

