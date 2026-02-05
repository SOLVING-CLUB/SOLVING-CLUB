import React from 'react';
import {Text as RNText, TextProps as RNTextProps, StyleSheet} from 'react-native';
import {Typography} from '../../core/constants';
import {useColors} from '../../core/theme/colors';

type TextVariant = keyof typeof Typography;
type ColorKey = 'primary' | 'secondary' | 'textPrimary' | 'textSecondary' | 'textTertiary' | 'textInverse' | 'success' | 'warning' | 'error' | 'info';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: ColorKey;
  center?: boolean;
}

/**
 * Typography Component
 * Consistent text styling across the app with theme support
 */
export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'textPrimary',
  center = false,
  style,
  children,
  ...props
}) => {
  const colors = useColors();
  
  const colorMap: Record<ColorKey, string> = {
    primary: colors.primary,
    secondary: colors.secondary,
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
    textTertiary: colors.textTertiary,
    textInverse: colors.textInverse,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
  };

  return (
    <RNText
      style={[
        Typography[variant],
        {color: colorMap[color]},
        center && styles.center,
        style,
      ]}
      {...props}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
});

