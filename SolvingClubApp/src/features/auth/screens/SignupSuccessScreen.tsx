import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Modal, Animated} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Spacing} from '../../../core/constants';
import {useColors} from '../../../core/theme/colors';
import {Text, Button, LottieAnimation} from '../../../shared/components';
import {handshakeAnimation} from '../../../assets/lottie/animations';
import {RootStackParamList} from '../../../app/navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SignupSuccessScreenProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Signup Success Screen with Handshake Animation
 */
const SignupSuccessScreen: React.FC<SignupSuccessScreenProps> = ({
  visible,
  onClose,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const colors = useColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible]);

  const handleContinue = () => {
    onClose();
    navigation.navigate('Login');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}>
      <View style={[styles.overlay, {backgroundColor: colors.overlay}]}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              opacity: fadeAnim,
              transform: [{scale: scaleAnim}],
            },
          ]}>
          <View style={styles.content}>
            <View style={styles.animationContainer}>
              <LottieAnimation
                source={handshakeAnimation}
                width={200}
                height={200}
                autoPlay
                loop
              />
            </View>

            <Text variant="h1" center style={styles.title}>
              Welcome to Solving Club!
            </Text>

            <Text variant="bodyLarge" color="textSecondary" center style={styles.message}>
              Your account has been created successfully. We're excited to have you on board!
            </Text>

            <View style={styles.actions}>
              <Button
                title="Continue to Login"
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleContinue}
                style={styles.button}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Spacing.lg,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  content: {
    alignItems: 'center',
  },
  animationContainer: {
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.md,
  },
  message: {
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  actions: {
    width: '100%',
  },
  button: {
    marginTop: Spacing.md,
  },
});

export default SignupSuccessScreen;

