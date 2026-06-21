import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing } from '../../constants/spacing';
import { Card, Input, Button, Badge } from '../../components/common';
import Toast from 'react-native-toast-message';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dates';
import { useGetVillagerHistoryQuery } from '../../store/api/supabaseApi';
import { supabase } from '../../store/supabaseClient';

export function VillagerHistoryScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const { data: history = [], isLoading: loadingHistory } = useGetVillagerHistoryQuery(phone, {
    skip: !verified || phone.length < 10,
  });

  const handleSendOtp = async () => {
    if (phone.length < 10) return;
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setSending(false);
    if (error) {
      Toast.show({ type: 'error', text1: error.message });
      return;
    }
    setOtpSent(true);
  };

  const handleVerify = async () => {
    if (otp.length < 6) return;
    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
    setVerifying(false);
    if (error) {
      Toast.show({ type: 'error', text1: 'Invalid OTP. Please check and try again.' });
      return;
    }
    setVerified(true);
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
            <Button title="Send OTP" onPress={handleSendOtp} loading={sending} disabled={phone.length < 10} fullWidth />
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
              <Button title="Verify" onPress={handleVerify} loading={verifying} disabled={otp.length < 6} fullWidth />
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  const totalDue = useMemo(
    () => history.reduce((s: number, h: any) => s + Number(h.amount_due), 0),
    [history]
  );
  const totalPaid = useMemo(
    () => history.reduce((s: number, h: any) => {
      const payments = h.payments ?? [];
      return s + payments.reduce((ps: number, p: any) => ps + Number(p.amount_paid), 0);
    }, 0),
    [history]
  );

  if (loadingHistory) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading your history...</Text>
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

        {history.length === 0 && (
          <Card glass>
            <Text style={styles.emptyText}>No payment history found for this number.</Text>
          </Card>
        )}

        {history.map((member: any) => {
          const collName = member.collections?.name ?? 'Collection';
          const payments = member.payments ?? [];
          return (
            <Card glass key={member.id} style={{ marginBottom: spacing.lg }}>
              <Text style={styles.historyTitle}>{collName}</Text>
              {payments.length === 0 ? (
                <Text style={styles.emptyText}>No payments recorded yet.</Text>
              ) : (
                payments.map((p: any) => (
                  <View key={p.id} style={styles.historyItem}>
                    <View>
                      <Text style={styles.historyDate}>{formatDate(p.paid_at)}</Text>
                      <Badge label={p.payment_type} color={
                        p.payment_type === 'full' ? colors.secondary :
                        p.payment_type === 'partial' ? colors.warning : colors.primary
                      } size="sm" />
                    </View>
                    <Text style={styles.historyAmount}>{formatCurrency(Number(p.amount_paid))}</Text>
                  </View>
                ))
              )}
            </Card>
          );
        })}

        <Card glass>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Due</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalDue)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={[styles.totalValue, { color: colors.secondary }]}>{formatCurrency(totalPaid)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Balance</Text>
            <Text style={[styles.totalValue, { color: totalDue > totalPaid ? colors.warning : colors.secondary }]}>
              {formatCurrency(Math.max(0, totalDue - totalPaid))}
            </Text>
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
  loadingText: {
    fontFamily: fonts.inter.regular,
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
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
    marginBottom: spacing.xs,
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
