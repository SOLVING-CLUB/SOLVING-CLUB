import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  View,
} from 'react-native';
import {Spacing, BorderRadius, Typography} from '../../core/constants';
import {useColors} from '../../core/theme/colors';
import {Text} from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

/**
 * Button Component
 * Follows Material Design guidelines
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  icon,
  style,
  ...props
}) => {
  const colors = useColors();
  
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.base,
      ...styles[size],
    };

    if (variant === 'primary') {
      baseStyle.backgroundColor = colors.primary;
    } else if (variant === 'secondary') {
      baseStyle.backgroundColor = colors.secondary;
    } else if (variant === 'outline') {
      baseStyle.backgroundColor = 'transparent';
      baseStyle.borderWidth = 1.5;
      baseStyle.borderColor = colors.primary;
    } else if (variant === 'ghost') {
      baseStyle.backgroundColor = 'transparent';
    }

    if (disabled) {
      baseStyle.backgroundColor = colors.border;
      baseStyle.borderColor = colors.border;
    }

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    return baseStyle;
  };

  const getTextColor = (): 'textInverse' | 'primary' | 'textTertiary' => {
    if (disabled) return 'textTertiary';
    if (variant === 'primary' || variant === 'secondary') return 'textInverse';
    return 'primary';
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'secondary' ? colors.textInverse : colors.primary}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text
            variant="button"
            color={getTextColor()}
            style={styles.text}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  },
  
  // Sizes
  sm: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 36,
  },
  md: {
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.lg,
    minHeight: 48,
  },
  lg: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    minHeight: 56,
  },
  
  text: {
    ...Typography.button,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: Spacing.xs,
  },
});

