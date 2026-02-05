import React from 'react';
import {View, StyleSheet, Text} from 'react-native';
import Toast, {BaseToast, ErrorToast, InfoToast} from 'react-native-toast-message';
import {useTheme} from '../../core/theme/ThemeContext';
import {getColors} from '../../core/theme/colors';
import {Spacing, BorderRadius} from '../../core/constants';

/**
 * Custom Toast Component Wrapper
 */
export const ToastWrapper: React.FC = () => {
  const {theme} = useTheme();
  const colors = getColors(theme);

  const toastConfig = {
    success: (props: any) => (
      <BaseToast
        {...props}
        style={[
          styles.baseToast,
          {
            borderColor: colors.success,
            borderWidth: 1.5,
            borderLeftWidth: 1.5,
            borderRightWidth: 1.5,
            borderTopWidth: 1.5,
            borderBottomWidth: 1.5,
            backgroundColor: colors.surface,
            shadowColor: colors.black,
          },
        ]}
        contentContainerStyle={styles.contentContainer}
        text1Style={[styles.text1, {color: colors.textPrimary}]}
        text2Style={[styles.text2, {color: colors.textSecondary}]}
        renderLeadingIcon={() => (
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: colors.success + '15',
              },
            ]}>
            <Text style={[styles.iconText, {color: colors.success}]}>✓</Text>
          </View>
        )}
      />
    ),
    error: (props: any) => (
      <ErrorToast
        {...props}
        style={[
          styles.baseToast,
          {
            borderColor: colors.error,
            borderWidth: 1.5,
            borderLeftWidth: 1.5,
            borderRightWidth: 1.5,
            borderTopWidth: 1.5,
            borderBottomWidth: 1.5,
            backgroundColor: colors.surface,
            shadowColor: colors.black,
          },
        ]}
        contentContainerStyle={styles.contentContainer}
        text1Style={[styles.text1, {color: colors.textPrimary}]}
        text2Style={[styles.text2, {color: colors.textSecondary}]}
        renderLeadingIcon={() => (
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: colors.error + '15',
              },
            ]}>
            <Text style={[styles.iconText, {color: colors.error}]}>✕</Text>
          </View>
        )}
      />
    ),
    info: (props: any) => (
      <InfoToast
        {...props}
        style={[
          styles.baseToast,
          {
            borderColor: colors.info,
            borderWidth: 1.5,
            borderLeftWidth: 1.5,
            borderRightWidth: 1.5,
            borderTopWidth: 1.5,
            borderBottomWidth: 1.5,
            backgroundColor: colors.surface,
            shadowColor: colors.black,
          },
        ]}
        contentContainerStyle={styles.contentContainer}
        text1Style={[styles.text1, {color: colors.textPrimary}]}
        text2Style={[styles.text2, {color: colors.textSecondary}]}
        renderLeadingIcon={() => (
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: colors.info + '15',
              },
            ]}>
            <Text style={[styles.iconText, {color: colors.info}]}>ℹ</Text>
          </View>
        )}
      />
    ),
    warning: (props: any) => (
      <BaseToast
        {...props}
        style={[
          styles.baseToast,
          {
            borderColor: colors.warning,
            borderWidth: 1.5,
            borderLeftWidth: 1.5,
            borderRightWidth: 1.5,
            borderTopWidth: 1.5,
            borderBottomWidth: 1.5,
            backgroundColor: colors.surface,
            shadowColor: colors.black,
          },
        ]}
        contentContainerStyle={styles.contentContainer}
        text1Style={[styles.text1, {color: colors.textPrimary}]}
        text2Style={[styles.text2, {color: colors.textSecondary}]}
        renderLeadingIcon={() => (
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: colors.warning + '15',
              },
            ]}>
            <Text style={[styles.iconText, {color: colors.warning}]}>⚠</Text>
          </View>
        )}
      />
    ),
  };

  return <Toast config={toastConfig} />;
};

const styles = StyleSheet.create({
  baseToast: {
    height: 'auto',
    minHeight: 64,
    width: '92%',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.md,
  },
  contentContainer: {
    paddingHorizontal: 0,
    flex: 1,
    paddingLeft: 0,
  },
  text1: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.xs / 2,
    lineHeight: 22,
  },
  text2: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  iconText: {
    fontSize: 20,
    fontWeight: '700',
  },
});

