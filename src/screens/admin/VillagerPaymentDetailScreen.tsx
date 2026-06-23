import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing } from '../../constants/spacing';
import { Card, Badge, Button } from '../../components/common';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dates';
import {
  useGetCollectionMemberDetailQuery,
  useGetPaymentsForCollectionQuery,
} from '../../store/api/supabaseApi';
import { supabase } from '../../store/supabaseClient';

export function VillagerPaymentDetailScreen({ route, navigation }: any) {
  const { memberId, villagerId } = route.params;
  const [resolvedMemberId, setResolvedMemberId] = useState<string | null>(memberId ?? null);

  useEffect(() => {
    if (villagerId && !memberId) {
      (async () => {
        const { data } = await supabase
          .from('collection_members')
          .select('id')
          .eq('villager_id', villagerId)
          .limit(1)
          .single();
        if (data) setResolvedMemberId(data.id);
      })();
    }
  }, [villagerId, memberId]);

  const { data: member } = useGetCollectionMemberDetailQuery(resolvedMemberId ?? '', { skip: !resolvedMemberId });
  const { data: payments = [] } = useGetPaymentsForCollectionQuery(resolvedMemberId ?? '', { skip: !resolvedMemberId });

  const villagerData: { name: string; phone: string } | null =
    (member?.villagers as any) ?? null;
  const collectionData: { name: string } | null =
    (member?.collections as any) ?? null;

  const amountDue = Number(member?.amount_due ?? 0);
  const totalPaid = useMemo(
    () => payments.reduce((s, p) => s + Number(p.amount_paid), 0),
    [payments]
  );
  const balance = amountDue - totalPaid;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Animated.View entering={FadeInUp.duration(400)}>
          <Text style={styles.title}>{villagerData?.name ?? 'Villager'}</Text>
          {collectionData && (
            <Text style={styles.collectionName}>{collectionData.name}</Text>
          )}
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Total Due</Text>
              <Text style={styles.balanceValue}>{formatCurrency(amountDue)}</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Total Paid</Text>
              <Text style={[styles.balanceValue, { color: colors.secondary }]}>{formatCurrency(totalPaid)}</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Balance</Text>
              <Text style={[styles.balanceValue, { color: balance > 0 ? colors.warning : colors.secondary }]}>
                {formatCurrency(Math.max(0, balance))}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          <Card glass>
            {payments.length === 0 ? (
              <Text style={styles.emptyText}>No payments recorded yet.</Text>
            ) : (
              payments.map((p, i) => (
                <View key={p.id} style={styles.historyItem}>
                  <View style={styles.historyLeft}>
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
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(150).duration(400)}>
          <Text style={styles.sectionTitle}>Carry-Forward Dues</Text>
          <Card glass>
            <Text style={styles.emptyText}>No carry-forward dues.</Text>
          </Card>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Record Payment"
          onPress={() => resolvedMemberId && navigation.navigate('RecordPayment', { memberId: resolvedMemberId })}
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
    paddingBottom: 100,
    paddingHorizontal: spacing.xl,
  },
  backBtn: {
    paddingTop: spacing.huge,
    marginBottom: spacing.lg,
  },
  backText: {
    fontFamily: fonts.poppins.medium,
    fontSize: 14,
    color: colors.primary,
  },
  title: {
    fontFamily: fonts.poppins.bold,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  collectionName: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.primary,
    marginBottom: spacing.xl,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  balanceValue: {
    fontFamily: fonts.jetbrainsMono.medium,
    fontSize: 18,
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontFamily: fonts.poppins.semibold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  historyLeft: {
    gap: spacing.xs,
  },
  historyDate: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  historyAmount: {
    fontFamily: fonts.jetbrainsMono.medium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
});
