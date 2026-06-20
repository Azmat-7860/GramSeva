import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

function FloatingOrb() {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-40, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    translateX.value = withRepeat(
      withTiming(30, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    scale.value = withRepeat(
      withTiming(1.15, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  return <Animated.View style={[styles.orb, orbStyle]} />;
}

function PulseRings() {
  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);

  useEffect(() => {
    pulse1.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    pulse2.value = withRepeat(
      withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const ring1Style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse1.value, [0, 0.5, 1], [0.06, 0.12, 0.06]),
    transform: [
      { scale: interpolate(pulse1.value, [0, 1], [1, 1.4]) },
    ],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse2.value, [0, 0.5, 1], [0.04, 0.08, 0.04]),
    transform: [
      { scale: interpolate(pulse2.value, [0, 1], [1, 1.6]) },
    ],
  }));

  return (
    <>
      <Animated.View style={[styles.ring, ring1Style]} />
      <Animated.View style={[styles.ringLg, ring2Style]} />
    </>
  );
}

export function AmbientMesh() {
  return (
    <View style={styles.container} pointerEvents="none">
      <PulseRings />
      <FloatingOrb />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    top: '10%',
    right: '-15%',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  ring: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: colors.primary + '25',
    position: 'absolute',
  },
  ringLg: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: colors.secondary + '15',
    position: 'absolute',
  },
});
