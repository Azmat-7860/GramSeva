import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withDelay,
  FadeInUp,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { borderRadius, spacing, glassCard } from '../../constants/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  index?: number;
  glass?: boolean;
}

export function Card({ children, style, onPress, index = 0, glass = true }: CardProps) {
  const scale = useSharedValue(1);

  const animatedEntry = useAnimatedStyle(() => ({
    opacity: withDelay(index * 100, withSpring(1, { damping: 20 })),
    transform: [
      { translateY: withDelay(index * 100, withSpring(0, { damping: 20 })) },
    ],
  }));

  const content = (
    <Animated.View
      entering={FadeInUp.delay(index * 80).springify().damping(20)}
      style={[
        styles.card,
        glass && styles.glass,
        animatedEntry,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  glass: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.lg,
  },
});
