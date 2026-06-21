import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSequence,
  useSharedValue,
  FadeInUp,
  FadeOutDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing, borderRadius } from '../../constants/spacing';
import { useCollectorAuth } from '../../hooks/useCollectorAuth';

interface CollectorPINScreenProps {
  route: any;
  navigation: any;
}

const PIN_LENGTH = 4;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function CollectorPINScreen({ route }: CollectorPINScreenProps) {
  const { verifyPin } = useCollectorAuth();
  const [pin, setPin] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const handleDigit = useCallback(
    async (digit: string) => {
      if (pin.length >= PIN_LENGTH || loading) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newPin = [...pin, digit];
      setPin(newPin);

      if (newPin.length === PIN_LENGTH) {
        setLoading(true);
        const isValid = await verifyPin(newPin.join(''));
        setLoading(false);

        if (!isValid) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          shakeX.value = withSequence(
            withTiming(-20, { duration: 50 }),
            withTiming(20, { duration: 50 }),
            withTiming(-10, { duration: 50 }),
            withTiming(10, { duration: 50 }),
            withTiming(0, { duration: 50 })
          );
          setError(true);
          setTimeout(() => {
            setPin([]);
            setError(false);
          }, 600);
        }
        // if isValid — AppNavigator auto-switches to CollectorStack via Redux
      }
    },
    [pin, verifyPin, shakeX, loading]
  );

  const handleDelete = useCallback(() => {
    if (loading) return;
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  }, [loading]);

  const renderDots = () => (
    <View style={styles.dotsRow}>
      {Array.from({ length: PIN_LENGTH }).map((_, i) => (
        <Animated.View
          key={i}
          entering={FadeInUp.duration(150)}
          style={[
            styles.dot,
            {
              backgroundColor: i < pin.length ? colors.primary : 'transparent',
              borderColor: i < pin.length ? colors.primary : colors.textMuted,
            },
          ]}
        />
      ))}
    </View>
  );

  const renderNumpad = () => {
    const digits = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'DEL'],
    ];

    return (
      <View style={styles.numpad}>
        {digits.map((row, ri) => (
          <View key={ri} style={styles.numpadRow}>
            {row.map((d, di) => {
              if (d === '') return <View key={di} style={styles.numpadKey} />;
              if (d === 'DEL') {
                return (
                  <AnimatedTouchable
                    key={di}
                    style={styles.numpadKey}
                    onPress={handleDelete}
                    entering={FadeInUp.duration(200)}
                  >
                    <Text style={styles.numpadKeyText}>⌫</Text>
                  </AnimatedTouchable>
                );
              }
              return (
                <AnimatedTouchable
                  key={di}
                  style={styles.numpadKey}
                  onPress={() => handleDigit(d)}
                  entering={FadeInUp.duration(200)}
                >
                  <Text style={styles.numpadKeyText}>{d}</Text>
                </AnimatedTouchable>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter PIN</Text>
      <Text style={styles.subtitle}>Enter your 4-digit collector PIN</Text>

      <Animated.View style={[styles.dotsContainer, shakeStyle]}>
        {renderDots()}
      </Animated.View>

      {error && (
        <Animated.Text
          entering={FadeInUp.duration(200)}
          exiting={FadeOutDown.duration(200)}
          style={styles.errorText}
        >
          Wrong PIN. Try again.
        </Animated.Text>
      )}

      {loading && (
        <Text style={styles.loadingText}>Verifying...</Text>
      )}

      {renderNumpad()}

      <Text style={styles.forgotText}>
        Contact your admin to reset PIN
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    paddingTop: 80,
  },
  title: {
    fontFamily: fonts.poppins.bold,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xxxl,
  },
  dotsContainer: {
    marginBottom: spacing.xxl,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  numpad: {
    width: '80%',
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  numpadKey: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numpadKeyText: {
    fontFamily: fonts.poppins.medium,
    fontSize: 28,
    color: colors.textPrimary,
  },
  errorText: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.danger,
    marginBottom: spacing.lg,
  },
  loadingText: {
    fontFamily: fonts.inter.regular,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  forgotText: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
});
// import React, { useState, useCallback } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// import Animated, {
//   useAnimatedStyle,
//   withTiming,
//   withSequence,
//   useSharedValue,
//   FadeInUp,
//   FadeOutDown,
// } from 'react-native-reanimated';
// import * as Haptics from 'expo-haptics';
// import { colors } from '../../constants/colors';
// import { fonts } from '../../constants/fonts';
// import { spacing, borderRadius } from '../../constants/spacing';
// import { useCollectorAuth } from '../../hooks/useCollectorAuth';

// interface CollectorPINScreenProps {
//   route: any;
//   navigation: any;
// }

// const PIN_LENGTH = 4;

// const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// export function CollectorPINScreen({ route, navigation }: CollectorPINScreenProps) {
//   const { phone } = route.params;
//   const { verifyPin } = useCollectorAuth();
//   const [pin, setPin] = useState<string[]>([]);
//   const [error, setError] = useState(false);
//   const shakeX = useSharedValue(0);

//   const shakeStyle = useAnimatedStyle(() => ({
//     transform: [{ translateX: shakeX.value }],
//   }));

//   const handleDigit = useCallback(
//     async (digit: string) => {
//       if (pin.length >= PIN_LENGTH) return;
//       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//       const newPin = [...pin, digit];
//       setPin(newPin);

//       if (newPin.length === PIN_LENGTH) {
//         const isValid = await verifyPin(newPin.join(''));
//         if (isValid) {
//           navigation.replace('CollectorDashboard');
//         } else {
//           Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
//           shakeX.value = withSequence(
//             withTiming(-20, { duration: 50 }),
//             withTiming(20, { duration: 50 }),
//             withTiming(-10, { duration: 50 }),
//             withTiming(10, { duration: 50 }),
//             withTiming(0, { duration: 50 })
//           );
//           setError(true);
//           setTimeout(() => {
//             setPin([]);
//             setError(false);
//           }, 500);
//         }
//       }
//     },
//     [pin, verifyPin, navigation, shakeX]
//   );

//   const handleDelete = useCallback(() => {
//     setPin((prev) => prev.slice(0, -1));
//     setError(false);
//   }, []);

//   const renderDots = () => {
//     return (
//       <View style={styles.dotsRow}>
//         {Array.from({ length: PIN_LENGTH }).map((_, i) => (
//           <Animated.View
//             key={i}
//             entering={FadeInUp.duration(150)}
//             style={[
//               styles.dot,
//               {
//                 backgroundColor: i < pin.length ? colors.primary : 'transparent',
//                 borderColor: i < pin.length ? colors.primary : colors.textMuted,
//               },
//             ]}
//           />
//         ))}
//       </View>
//     );
//   };

//   const renderNumpad = () => {
//     const digits = [
//       ['1', '2', '3'],
//       ['4', '5', '6'],
//       ['7', '8', '9'],
//       ['', '0', 'DEL'],
//     ];

//     return (
//       <View style={styles.numpad}>
//         {digits.map((row, ri) => (
//           <View key={ri} style={styles.numpadRow}>
//             {row.map((d, di) => {
//               if (d === '') return <View key={di} style={styles.numpadKey} />;
//               if (d === 'DEL') {
//                 return (
//                   <AnimatedTouchable
//                     key={di}
//                     style={styles.numpadKey}
//                     onPress={handleDelete}
//                     entering={FadeInUp.duration(200)}
//                   >
//                     <Text style={styles.numpadKeyText}>⌫</Text>
//                   </AnimatedTouchable>
//                 );
//               }
//               return (
//                 <AnimatedTouchable
//                   key={di}
//                   style={styles.numpadKey}
//                   onPress={() => handleDigit(d)}
//                   entering={FadeInUp.duration(200)}
//                 >
//                   <Text style={styles.numpadKeyText}>{d}</Text>
//                 </AnimatedTouchable>
//               );
//             })}
//           </View>
//         ))}
//       </View>
//     );
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Enter PIN</Text>
//       <Text style={styles.subtitle}>Enter your 4-digit collector PIN</Text>

//       <Animated.View style={[styles.dotsContainer, shakeStyle]}>
//         {renderDots()}
//       </Animated.View>

//       {error && (
//         <Animated.Text
//           entering={FadeInUp.duration(200)}
//           exiting={FadeOutDown.duration(200)}
//           style={styles.errorText}
//         >
//           Wrong PIN. Try again.
//         </Animated.Text>
//       )}

//       {renderNumpad()}

//       <Text style={styles.forgotText}>
//         Contact your admin to reset PIN
//       </Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.background,
//     alignItems: 'center',
//     paddingTop: 80,
//   },
//   title: {
//     fontFamily: fonts.poppins.bold,
//     fontSize: 28,
//     color: colors.textPrimary,
//     marginBottom: spacing.xs,
//   },
//   subtitle: {
//     fontFamily: fonts.inter.regular,
//     fontSize: 14,
//     color: colors.textMuted,
//     marginBottom: spacing.xxxl,
//   },
//   dotsContainer: {
//     marginBottom: spacing.xxl,
//   },
//   dotsRow: {
//     flexDirection: 'row',
//     gap: spacing.lg,
//   },
//   dot: {
//     width: 20,
//     height: 20,
//     borderRadius: 10,
//     borderWidth: 2,
//   },
//   numpad: {
//     width: '80%',
//   },
//   numpadRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginBottom: spacing.md,
//   },
//   numpadKey: {
//     width: 72,
//     height: 72,
//     borderRadius: borderRadius.full,
//     backgroundColor: 'rgba(255,255,255,0.07)',
//     borderWidth: 1,
//     borderColor: 'rgba(255,255,255,0.12)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   numpadKeyText: {
//     fontFamily: fonts.poppins.medium,
//     fontSize: 28,
//     color: colors.textPrimary,
//   },
//   errorText: {
//     fontFamily: fonts.inter.regular,
//     fontSize: 14,
//     color: colors.danger,
//     marginBottom: spacing.lg,
//   },
//   forgotText: {
//     fontFamily: fonts.inter.regular,
//     fontSize: 12,
//     color: colors.textMuted,
//     marginTop: spacing.xl,
//   },
// });
