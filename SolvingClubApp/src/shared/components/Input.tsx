import React, {useState} from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {Spacing, BorderRadius, Typography} from '../../core/constants';
import {useColors} from '../../core/theme/colors';
import {Text} from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
  containerStyle?: object;
  disabled?: boolean;
  suffix?: string;
}

/**
 * Input Component with label and error handling
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  showPasswordToggle = false,
  containerStyle,
  style,
  secureTextEntry,
  disabled,
  suffix,
  ...props
}) => {
  const colors = useColors();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = secureTextEntry || showPasswordToggle;
  const hasSuffix = !!suffix;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
      )}
      <View style={styles.inputWrapper}>
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                backgroundColor: colors.surface,
                borderColor: error ? colors.error : colors.border,
              },
              isPassword ? styles.inputWithIcon : undefined,
              disabled ? {backgroundColor: colors.divider, opacity: 0.6} : undefined,
              style,
            ]}
            placeholderTextColor={colors.textTertiary}
            secureTextEntry={isPassword && !isPasswordVisible}
            editable={!disabled}
            {...props}
          />
          {hasSuffix && (
            <Text variant="body" color="textSecondary" style={styles.suffixText}>
              {suffix}
            </Text>
          )}
        </View>
        {isPassword && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            <Text variant="body" color="textSecondary">
              {isPasswordVisible ? '👁️' : '👁️‍🗨️'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text variant="bodySmall" color="error" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    position: 'relative',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    ...Typography.body,
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    minHeight: 48,
    flex: 1,
  },
  inputWithIcon: {
    paddingRight: 48,
  },
  suffixText: {
    marginLeft: Spacing.sm,
    ...Typography.body,
  },
  iconButton: {
    position: 'absolute',
    right: Spacing.sm,
    top: '50%',
    transform: [{translateY: -12}],
    padding: Spacing.xs,
  },
  error: {
    marginTop: Spacing.xs,
  },
});

