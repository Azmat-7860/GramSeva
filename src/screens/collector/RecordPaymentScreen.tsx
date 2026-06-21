import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing, borderRadius } from '../../constants/spacing';
import { Avatar, Button, Badge, Card } from '../../components/common';
import Toast from 'react-native-toast-message';
import { formatCurrency } from '../../utils/currency';
import { getCurrentMonthLabel } from '../../utils/dates';
import { useSMS } from '../../hooks/useSMS';
import {
  useGetCollectionMemberDetailQuery,
  useGetPaymentsForCollectionQuery,
  useRecordPaymentMutation,
} from '../../store/api/supabaseApi';
import { useAppSelector } from '../../store/store';
import * as Haptics from 'expo-haptics';

export function RecordPaymentScreen({ route, navigation }: any) {
  const { memberId } = route.params;
  const collector = useAppSelector((s) => s.collector.currentCollector);
  const { sendSMS, generateReminderMessage } = useSMS();

  const [amount, setAmount] = React.useState('');
  const [note, setNote] = React.useState('');

  const { data: member, isLoading: loadingMember } = useGetCollectionMemberDetailQuery(memberId);
  const { data: payments = [] } = useGetPaymentsForCollectionQuery(memberId);
  const [recordPayment, { isLoading: saving }] = useRecordPaymentMutation();

  const villagerData: { name: string; phone: string } | null =
    (member?.villagers as any) ?? null;
  const collectionData: { name: string } | null =
    (member?.collections as any) ?? null;

  const amountDue = Number(member?.amount_due ?? 0);
  const amountPaid = useMemo(
    () => payments.reduce((s, p) => s + Number(p.amount_paid), 0),
    [payments]
  );
  const remaining = amountDue - amountPaid;
  const enteredAmount = parseFloat(amount || '0');

  const statusType =
    enteredAmount === 0
      ? 'pending'
      : enteredAmount >= remaining
      ? 'full'
      : 'partial';

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: colors.textMuted },
    partial: { label: 'Partial', color: colors.warning },
    full: { label: 'Full Payment', color: colors.secondary },
  };

  const paymentType =
    enteredAmount === 0 ? 'partial' : enteredAmount >= remaining ? 'full' : 'partial';

  const handleSubmit = useCallback(async () => {
    if (!amount || enteredAmount <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      await recordPayment({
        collection_member_id: memberId,
        amount_paid: enteredAmount,
        payment_type: paymentType,
        month_label: getCurrentMonthLabel(),
        note: note || undefined,
        recorded_by: collector?.id ?? undefined,
      }).unwrap();

      const msg = generateReminderMessage(
        villagerData?.name ?? 'Villager',
        enteredAmount,
        collectionData?.name ?? 'Collection',
        Math.max(0, remaining - enteredAmount),
        collector?.name ?? 'Collector'
      );

      await sendSMS({
        phoneNumber: villagerData?.phone ?? '',
        message: msg,
      });

      navigation.goBack();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.message ?? err?.error ?? 'Failed to record payment' });
    }
  }, [
    amount, enteredAmount, memberId, paymentType, note, collector,
    recordPayment, villagerData, collectionData, remaining, sendSMS,
    generateReminderMessage, navigation,
  ]);

  if (loadingMember) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Animated.View entering={FadeInUp.duration(400)}>
          <View style={styles.villagerHeader}>
            <Avatar name={villagerData?.name ?? 'Villager'} size={56} />
            <View style={styles.villagerInfo}>
              <Text style={styles.villagerName}>{villagerData?.name ?? 'Unknown'}</Text>
              <Text style={styles.villagerPhone}>{villagerData?.phone ?? ''}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <Card glass style={styles.amountCard}>
            <View style={styles.amountRow}>
              <View>
                <Text style={styles.amountLabel}>Amount Due</Text>
                <Text style={styles.amountValue}>{formatCurrency(amountDue)}</Text>
              </View>
              <View>
                <Text style={styles.amountLabel}>Paid So Far</Text>
                <Text style={[styles.amountValue, { color: colors.secondary }]}>{formatCurrency(amountPaid)}</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(150).duration(400)}>
          <Text style={styles.inputLabel}>Enter Amount</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
          </View>
          {enteredAmount > 0 && (
            <Animated.View entering={FadeInUp.duration(200)}>
              <Badge
                label={statusLabels[statusType].label}
                color={statusLabels[statusType].color}
                size="md"
                style={styles.statusBadge}
              />
              {statusType === 'partial' && (
                <Text style={styles.remainingText}>
                  Remaining after this: {formatCurrency(remaining - enteredAmount)}
                </Text>
              )}
            </Animated.View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <Text style={styles.inputLabel}>Note (optional)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
        </Animated.View>

        {enteredAmount > 0 && (
          <Animated.View entering={FadeInUp.delay(250).duration(400)}>
            <Card glass style={styles.smsPreview}>
              <Text style={styles.smsLabel}>SMS Preview</Text>
              <Text style={styles.smsText}>
                Dear {villagerData?.name ?? 'Villager'}, ₹{enteredAmount} received for{' '}
                {collectionData?.name ?? 'Collection'}. Remaining: ₹
                {Math.max(0, remaining - enteredAmount)}. - {collector?.name ?? 'Collector'}
              </Text>
            </Card>
          </Animated.View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Confirm & Send SMS"
          onPress={handleSubmit}
          loading={saving}
          disabled={!amount || enteredAmount <= 0}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingText: {
    fontFamily: fonts.inter.regular,
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    paddingTop: 100,
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
  villagerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  villagerInfo: {
    marginLeft: spacing.lg,
  },
  villagerName: {
    fontFamily: fonts.poppins.semibold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  villagerPhone: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  amountCard: {
    marginBottom: spacing.xxl,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  amountLabel: {
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  amountValue: {
    fontFamily: fonts.jetbrainsMono.medium,
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  inputLabel: {
    fontFamily: fonts.poppins.medium,
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  currencySymbol: {
    fontFamily: fonts.jetbrainsMono.medium,
    fontSize: 28,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontFamily: fonts.jetbrainsMono.medium,
    fontSize: 28,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  remainingText: {
    fontFamily: fonts.jetbrainsMono.regular,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  noteInput: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.xl,
  },
  smsPreview: {
    marginBottom: spacing.xl,
  },
  smsLabel: {
    fontFamily: fonts.poppins.medium,
    fontSize: 12,
    color: colors.secondary,
    marginBottom: spacing.sm,
  },
  smsText: {
    fontFamily: fonts.inter.regular,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
});
