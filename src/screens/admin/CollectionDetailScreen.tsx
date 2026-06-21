import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing, borderRadius } from '../../constants/spacing';
import { Card, Badge, Button } from '../../components/common';
import { ProgressRing, PaymentRow } from '../../components/collections';
import { useGetCollectionMembersQuery, useCloseCollectionMutation } from '../../store/api/supabaseApi';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dates';

type FilterType = 'all' | 'paid' | 'partial' | 'pending' | 'overdue';

export function CollectionDetailScreen({ route, navigation }: any) {
  const { collectionId } = route.params;
  const { data: members = [] } = useGetCollectionMembersQuery(collectionId);
  const [closeCollection, { isLoading: closing }] = useCloseCollectionMutation();
  const [filter, setFilter] = useState<FilterType>('all');

  const collection = { name: 'Collection', type: 'recurring', status: 'active', created_at: new Date().toISOString() };

  const totalDue = members.reduce((sum, m) => sum + Number(m.amount_due), 0);
  const totalPaid = 0;

  const tabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'paid', label: 'Paid' },
    { key: 'partial', label: 'Partial' },
    { key: 'pending', label: 'Pending' },
    { key: 'overdue', label: 'Overdue' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInUp.duration(400)}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Badge label={collection.status} color={collection.status === 'active' ? colors.secondary : colors.textMuted} />
          </View>

          <Text style={styles.title}>{collection.name}</Text>
          <Badge
            label={collection.type === 'recurring' ? 'Monthly' : 'One-time'}
            color={colors.primary}
          />
          <Text style={styles.date}>{formatDate(collection.created_at)}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.ringContainer}>
          <ProgressRing collected={totalPaid} total={totalDue} size={160} strokeWidth={10} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(150).duration(400)}>
          <View style={styles.totalsRow}>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Expected</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalDue)}</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Collected</Text>
              <Text style={[styles.totalValue, { color: colors.secondary }]}>{formatCurrency(totalPaid)}</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Pending</Text>
              <Text style={[styles.totalValue, { color: colors.warning }]}>{formatCurrency(totalDue - totalPaid)}</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.tabsRow}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, filter === t.key && styles.tabActive]}
              onPress={() => setFilter(t.key)}
            >
              <Text style={[styles.tabText, filter === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {members.map((member, i) => (
          <Animated.View key={member.id} entering={FadeInUp.delay(i * 50).duration(300)}>
            <PaymentRow
              name="Villager"
              amountDue={Number(member.amount_due)}
              totalPaid={0}
              onPress={() => navigation.navigate('VillagerPaymentDetail', { memberId: member.id })}
            />
          </Animated.View>
        ))}
      </ScrollView>

      {collection.status === 'active' && (
        <View style={styles.footer}>
          <Button
            title="Close Collection"
            onPress={async () => {
              try {
                await closeCollection(collectionId).unwrap();
              } catch (err: any) {
                Alert.alert('Error', err?.message ?? err?.error ?? 'Failed to close collection');
              }
            }}
            loading={closing}
            variant="danger"
            fullWidth
          />
        </View>
      )}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.huge,
    paddingBottom: spacing.sm,
  },
  backText: {
    fontFamily: fonts.poppins.medium,
    fontSize: 14,
    color: colors.primary,
  },
  title: {
    fontFamily: fonts.poppins.bold,
    fontSize: 26,
    color: colors.textPrimary,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xs,
  },
  date: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.textMuted,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  ringContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  totalItem: {
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  totalValue: {
    fontFamily: fonts.jetbrainsMono.medium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tabActive: {
    backgroundColor: colors.primary + '20',
  },
  tabText: {
    fontFamily: fonts.poppins.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
});
