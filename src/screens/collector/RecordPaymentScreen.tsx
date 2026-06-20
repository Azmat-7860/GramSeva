import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing, borderRadius } from '../../constants/spacing';
import { Avatar, Button, Badge, Card } from '../../components/common';
import { formatCurrency } from '../../utils/currency';
import { useSMS } from '../../hooks/useSMS';
import * as Haptics from 'expo-haptics';

export function RecordPaymentScreen({ route, navigation }: any) {
  const { memberId } = route.params;
  const { sendSMS, generateReminderMessage } = useSMS();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const amountDue = 1000;
  const amountPaid = 0;
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

  const handleSubmit = async () => {
    if (!amount || enteredAmount <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSending(true);

    const msg = generateReminderMessage(
      'Villager Name',
      enteredAmount,
      'Monthly Fund',
      Math.max(0, remaining - enteredAmount),
      'Collector Name'
    );

    await sendSMS({ phoneNumber: '9876543210', message: msg });
    setSending(false);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Animated.View entering={FadeInUp.duration(400)}>
          <View style={styles.villagerHeader}>
            <Avatar name="Villager Name" size={56} />
            <View style={styles.villagerInfo}>
              <Text style={styles.villagerName}>Villager Name</Text>
              <Text style={styles.villagerPhone}>9876543210</Text>
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

        <Animated.View entering={FadeInUp.delay(250).duration(400)}>
          <Card glass style={styles.smsPreview}>
            <Text style={styles.smsLabel}>SMS Preview</Text>
            <Text style={styles.smsText}>
              Dear Villager Name, ₹{enteredAmount || 0} received for Monthly Fund. Remaining: ₹
              {Math.max(0, remaining - enteredAmount)}. - Collector Name
            </Text>
          </Card>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Confirm & Send SMS"
          onPress={handleSubmit}
          loading={sending}
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
