import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';
import { fonts } from '../../constants/fonts';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/currency';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  style?: TextStyle;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  style,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, { duration });
    const interval = setInterval(() => {
      const current = animatedValue.value;
      if (Math.abs(current - value) < 1) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.round(current));
      }
    }, 50);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <Text style={[styles.text, style]}>
      {formatCurrency(displayValue)}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: fonts.jetbrainsMono.medium,
    fontSize: 24,
    color: colors.textPrimary,
  },
});
