import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { formatCurrency } from '../../utils/currency';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  collected: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  style?: ViewStyle;
}

export function ProgressRing({
  collected,
  total,
  size = 120,
  strokeWidth = 8,
  label,
  style,
}: ProgressRingProps) {
  const progress = total > 0 ? collected / total : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 1500 });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const percentage = Math.round(progress * 100);

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={colors.primary} />
            <Stop offset="100%" stopColor={colors.secondary} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[styles.centerContent, { width: size - strokeWidth * 4 }]}>
        <Text style={styles.percentage}>{percentage}%</Text>
        <Text style={styles.amount}>{formatCurrency(collected)}</Text>
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  percentage: {
    fontFamily: fonts.jetbrainsMono.medium,
    fontSize: 18,
    color: colors.textPrimary,
  },
  amount: {
    fontFamily: fonts.jetbrainsMono.regular,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  label: {
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
});
