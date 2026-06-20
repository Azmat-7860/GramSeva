import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing, borderRadius } from '../../constants/spacing';
import { AmbientMesh } from '../../components/three/AmbientMesh';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withTiming(1, {
      duration: 1200,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
    logoOpacity.value = withTiming(1, { duration: 800 });

    taglineOpacity.value = withDelay(
      600,
      withTiming(1, { duration: 600 })
    );

    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <AmbientMesh />
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoEmoji}>G</Text>
        </View>
        <Text style={styles.title}>GramSeva</Text>
      </Animated.View>
      <Animated.Text style={[styles.tagline, taglineStyle]}>
        Village Fund Collection & Ledger
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary + '20',
    borderWidth: 2,
    borderColor: colors.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoEmoji: {
    fontSize: 40,
    fontFamily: fonts.poppins.bold,
    color: colors.primary,
  },
  title: {
    fontFamily: fonts.poppins.bold,
    fontSize: 36,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.md,
    letterSpacing: 0.5,
  },
});
