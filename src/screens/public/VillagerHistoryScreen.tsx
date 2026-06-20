import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing } from '../../constants/spacing';
import { Card, Input, Button, Badge } from '../../components/common';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dates';

export function VillagerHistoryScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleSendOtp = () => {
    if (phone.length >= 10) setOtpSent(true);
  };

  const handleVerify = () => {
    if (otp.length === 6) setVerified(true);
  };

  if (!verified) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Check Your Payments</Text>
          <Text style={styles.subtitle}>
            Enter your registered phone number to view your payment history.
          </Text>

          <Input
            label="Phone Number"
            placeholder="10-digit phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
          />

          {!otpSent ? (
            <Button title="Send OTP" onPress={handleSendOtp} disabled={phone.length < 10} fullWidth />
          ) : (
            <>
              <Input
                label="Enter OTP"
                placeholder="000000"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
              <Button title="Verify" onPress={handleVerify} disabled={otp.length < 6} fullWidth />
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => { setVerified(false); setOtpSent(false); }}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Your Payment History</Text>

        <Card glass>
          <Text style={styles.historyTitle}>Monthly Fund</Text>
          <View style={styles.historyItem}>
            <View>
              <Text style={styles.historyDate}>Jun 2026</Text>
              <Text style={styles.historyStatus}>Paid</Text>
            </View>
            <Text style={styles.historyAmount}>₹1,000</Text>
          </View>
          <View style={styles.historyItem}>
            <View>
              <Text style={styles.historyDate}>May 2026</Text>
              <Text style={[styles.historyStatus, { color: colors.warning }]}>Partial</Text>
            </View>
            <Text style={styles.historyAmount}>₹500</Text>
          </View>
          <View style={styles.historyItem}>
            <View>
              <Text style={styles.historyDate}>Apr 2026</Text>
              <Text style={[styles.historyStatus, { color: colors.danger }]}>Pending</Text>
            </View>
            <Text style={styles.historyAmount}>₹0</Text>
          </View>
        </Card>

        <Card glass>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Due</Text>
            <Text style={styles.totalValue}>₹3,000</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={[styles.totalValue, { color: colors.secondary }]}>₹1,500</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Balance</Text>
            <Text style={[styles.totalValue, { color: colors.warning }]}>₹1,500</Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },
  backText: {
    fontFamily: fonts.poppins.medium,
    fontSize: 14,
    color: colors.primary,
    paddingTop: spacing.huge,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.poppins.bold,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xxl,
    lineHeight: 20,
  },
  historyTitle: {
    fontFamily: fonts.poppins.semibold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  historyDate: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  historyStatus: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.secondary,
    marginTop: 2,
  },
  historyAmount: {
    fontFamily: fonts.jetbrainsMono.medium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  totalLabel: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  totalValue: {
    fontFamily: fonts.jetbrainsMono.medium,
    fontSize: 16,
    color: colors.textPrimary,
  },
});
