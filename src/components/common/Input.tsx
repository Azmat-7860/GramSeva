import React, { useRef, useState } from 'react';
import {
  TextInput,
  Text,
  View,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { borderRadius, spacing } from '../../constants/spacing';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  containerStyle,
  style,
  ...rest
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const glowOpacity = useSharedValue(0);

  const handleFocus = () => {
    setIsFocused(true);
    glowOpacity.value = withTiming(1, { duration: 200 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    glowOpacity.value = withTiming(0, { duration: 200 });
  };

  const glowStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? colors.danger
      : isFocused
      ? colors.primary
      : colors.surfaceBorder,
    shadowColor: error ? colors.danger : colors.primary,
    shadowOpacity: glowOpacity.value * 0.3,
    shadowRadius: 8,
    elevation: glowOpacity.value * 4,
  }));

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View style={[styles.inputWrapper, glowStyle]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
      </Animated.View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fonts.poppins.medium,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  input: {
    fontFamily: fonts.inter.regular,
    fontSize: 16,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  error: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
