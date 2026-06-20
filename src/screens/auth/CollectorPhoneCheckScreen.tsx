import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing } from '../../constants/spacing';
import { Button, Input } from '../../components/common';
import { useCollectorAuth } from '../../hooks/useCollectorAuth';
import { AmbientMesh } from '../../components/three/AmbientMesh';

interface CollectorPhoneCheckScreenProps {
  navigation: any;
}

export function CollectorPhoneCheckScreen({ navigation }: CollectorPhoneCheckScreenProps) {
  const { verifyCollector } = useCollectorAuth();
  const [checking, setChecking] = useState(true);
  const [found, setFound] = useState(false);
  const [collectorName, setCollectorName] = useState('');
  const [phone, setPhone] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualMode, setManualMode] = useState(false);

  useEffect(() => {
    checkPhone();
  }, []);

  const checkPhone = async () => {
    setChecking(false);
    setManualMode(true);
  };

  const handleManualCheck = async () => {
    if (manualPhone.length < 10) return;
    setChecking(true);
    const collector = await verifyCollector(manualPhone);
    if (collector) {
      setFound(true);
      setCollectorName(collector.name);
      setPhone(manualPhone);
    } else {
      setFound(false);
    }
    setChecking(false);
  };

  if (checking) {
    return (
      <View style={styles.container}>
        <AmbientMesh />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.checkingText}>Checking your number...</Text>
      </View>
    );
  }

  if (!found && manualMode) {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
          <Text style={styles.title}>Enter Your Number</Text>
          <Text style={styles.message}>
            Enter the phone number registered with your collector account.
          </Text>
          <Input
            label="Phone Number"
            placeholder="10-digit phone number"
            value={manualPhone}
            onChangeText={setManualPhone}
            keyboardType="phone-pad"
            maxLength={10}
          />
          <Button
            title="Check"
            onPress={handleManualCheck}
            disabled={manualPhone.length < 10}
            fullWidth
          />
          <Button title="Not a collector?" onPress={() => setFound(false)} variant="ghost" />
        </Animated.View>
      </View>
    );
  }

  if (!found) {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
          <Text style={styles.icon}>!</Text>
          <Text style={styles.title}>Not Found</Text>
          <Text style={styles.message}>
            You are not added as a collector. Contact your admin.
          </Text>
          <Button title="Try Another Number" onPress={() => setManualMode(true)} variant="ghost" />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.name}>{collectorName}</Text>
        <Text style={styles.phone}>{phone}</Text>
        <Button
          title="Enter PIN"
          onPress={() => navigation.navigate('CollectorPIN', { phone, collectorName })}
          fullWidth
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  checkingText: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
  icon: {
    fontSize: 48,
    fontFamily: fonts.poppins.bold,
    color: colors.warning,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.poppins.bold,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  name: {
    fontFamily: fonts.poppins.semibold,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  phone: {
    fontFamily: fonts.jetbrainsMono.regular,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xxxl,
  },
  message: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 22,
  },
});
