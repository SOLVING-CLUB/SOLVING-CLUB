import React, {useEffect, useRef, useState} from 'react';
import {View, StyleSheet, ViewStyle, ActivityIndicator, Animated} from 'react-native';
import {useColors} from '../../core/theme/colors';

interface LottieAnimationProps {
  source: any; // Lottie JSON source (require() for local files or object for inline JSON)
  style?: ViewStyle;
  autoPlay?: boolean;
  loop?: boolean;
  speed?: number;
  width?: number;
  height?: number;
}

// Try to import Lottie, but handle gracefully if native module isn't linked
let LottieView: any = null;
try {
  LottieView = require('lottie-react-native').default;
} catch (error) {
  console.warn('Lottie native module not available. Using fallback animation.');
}

/**
 * Reusable Lottie Animation Component
 * Supports both local files (require()) and inline JSON
 * Falls back to a simple animated view if Lottie isn't available
 */
export const LottieAnimation: React.FC<LottieAnimationProps> = ({
  source,
  style,
  autoPlay = true,
  loop = true,
  speed = 1,
  width = 200,
  height = 200,
}) => {
  const animationRef = useRef<any>(null);
  const colors = useColors();
  const [isReady, setIsReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (source) {
      setIsReady(true);
    }
  }, [source]);

  useEffect(() => {
    if (autoPlay && animationRef.current && isReady && LottieView) {
      animationRef.current.play();
    }
  }, [autoPlay, isReady]);

  // Fallback animation if Lottie isn't available
  useEffect(() => {
    if (!LottieView && autoPlay) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [autoPlay, fadeAnim]);

  if (!source || !isReady) {
    return (
      <View style={[styles.container, {width, height}, style]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // If Lottie isn't available, show a fallback animated view
  if (!LottieView) {
    return (
      <View style={[styles.container, {width, height}, style]}>
        <Animated.View
          style={[
            styles.fallbackContainer,
            {
              width: width * 0.6,
              height: height * 0.6,
              backgroundColor: colors.primary + '20',
              opacity: fadeAnim,
            },
          ]}>
          <View style={[styles.fallbackIcon, {backgroundColor: colors.primary}]} />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {width, height}, style]}>
      <LottieView
        ref={animationRef}
        source={source}
        autoPlay={autoPlay}
        loop={loop}
        speed={speed}
        style={styles.animation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  fallbackIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
