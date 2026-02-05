import React, {useState, useEffect, useRef} from 'react';
import {View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Image} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {supabase} from '../../../services/supabase';
import {Spacing} from '../../../core/constants';
import {useColors} from '../../../core/theme/colors';
import {Text, Button, Input} from '../../../shared/components';
import SignupSuccessScreen from './SignupSuccessScreen';
import {signupSchema, validateForm, validatePassword} from '../../../core/validation';
import {toast} from '../../../core/utils/toast';
import {RootStackParamList} from '../../../app/navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type UsernameAvailability = 'idle' | 'checking' | 'available' | 'unavailable';

/**
 * Signup Screen
 */
const SignupScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const colors = useColors();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [usernameAvailability, setUsernameAvailability] = useState<UsernameAvailability>('idle');
  const [showSuccess, setShowSuccess] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Combine username with domain for validation and API calls
  const getFullEmail = () => {
    return username.trim() + '@solvingclub.org';
  };

  const passwordValidation = validatePassword(password);

  // Check username availability with debounce
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmedUsername = username.trim();

    // Reset if empty
    if (!trimmedUsername) {
      setUsernameAvailability('idle');
      return;
    }

    // Basic validation - only check if username has valid characters
    if (trimmedUsername.length < 2) {
      setUsernameAvailability('idle');
      return;
    }

    // Set checking state immediately
    setUsernameAvailability('checking');

    // Debounce the check
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const fullEmail = trimmedUsername + '@solvingclub.org';

        // Check profiles table
        const {data: profileData, error: profileError} = await supabase
          .from('profiles')
          .select('email')
          .eq('email', fullEmail)
          .limit(1);

        if (profileError) {
          console.error('Error checking email in profiles:', profileError);
        }

        // Check auth users (if we have access)
        // Note: This might require RLS policies or admin access
        // For now, we'll rely on profiles table and auth signup error
        const emailExists = profileData && profileData.length > 0;

        if (emailExists) {
          setUsernameAvailability('unavailable');
        } else {
          setUsernameAvailability('available');
        }
      } catch (error) {
        console.error('Error checking username availability:', error);
        setUsernameAvailability('idle');
      }
    }, 500); // 500ms debounce

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [username]);

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
      // Check if email already exists
      const {data: existingUsers, error: checkError} = await supabase
        .from('profiles')
        .select('email')
        .eq('email', fullEmail)
        .limit(1);

      if (checkError) {
        console.error('Error checking email:', checkError);
      }

      if (existingUsers && existingUsers.length > 0) {
        setErrors({email: ['This email is already registered. Please use a different email or login instead.']});
        toast.error('Email Already Exists', 'This email address is already registered. Please login or use a different email.');
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
        // Check for duplicate email error
        if (
          authError.message?.toLowerCase().includes('already registered') ||
          authError.message?.toLowerCase().includes('user already exists') ||
          authError.message?.toLowerCase().includes('email already') ||
          authError.code === 'signup_disabled' ||
          authError.message?.includes('User already registered')
        ) {
          setErrors({email: ['This email is already registered. Please use a different email or login instead.']});
          toast.error('Email Already Exists', 'This email address is already registered. Please login or use a different email.');
        } else {
          toast.error('Signup Failed', authError.message || 'An error occurred during signup. Please try again.');
        }
        setLoading(false);
        return;
      }

      if (authData.user) {
        const {error: profileError} = await supabase
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

        if (profileError) {
          toast.warning('Profile Setup Incomplete', 'Your account was created, but profile setup failed. You can complete it later.');
        }
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
              Create your account
            </Text>
            <Text variant="bodyLarge" color="textSecondary" center style={styles.subtitle}>
              Join Solving Club
            </Text>
          </View>

          <View style={styles.form}>
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
                  // Clear email errors when typing
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
                    <View style={styles.availabilityRow}>
                      <Text variant="bodySmall" color="success" style={styles.availabilityText}>
                        ✓ Username is available
                      </Text>
                    </View>
                  )}
                  {usernameAvailability === 'unavailable' && (
                    <View style={styles.availabilityRow}>
                      <Text variant="bodySmall" color="error" style={styles.availabilityText}>
                        ✕ Username is already taken
                      </Text>
                    </View>
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
              style={styles.signupButton}
            />

            <View style={styles.footer}>
              <Button
                title="Already have an account? Login"
                variant="ghost"
                size="md"
                onPress={() => navigation.navigate('Login')}
              />
            </View>
          </View>
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
  form: {
    width: '100%',
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
  signupButton: {
    marginTop: Spacing.md,
  },
  footer: {
    marginTop: Spacing.lg,
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
});

export default SignupScreen;

