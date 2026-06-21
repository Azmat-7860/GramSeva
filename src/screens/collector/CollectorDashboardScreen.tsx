import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing, borderRadius } from '../../constants/spacing';
import { Card, Badge, Avatar } from '../../components/common';
import { useCollectorAuth } from '../../hooks/useCollectorAuth';
import { useGetCollectorAssignmentsQuery, useGetPaymentsByVillageQuery } from '../../store/api/supabaseApi';
import { formatCurrency } from '../../utils/currency';

type FilterType = 'all' | 'pending' | 'partial' | 'done';

export function CollectorDashboardScreen({ navigation }: any) {
  const { currentCollector } = useCollectorAuth();
  const [filter, setFilter] = useState<FilterType>('all');

  const { data: assignments = [] } = useGetCollectorAssignmentsQuery(
    currentCollector?.id ?? '',
    { skip: !currentCollector?.id }
  );

  const tabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'partial', label: 'Partial' },
    { key: 'done', label: 'Done' },
  ];

  const paymentMap = useMemo(() => {
    const map: Record<string, number> = {};
    assignments.forEach((a: any) => {
      a.payments?.forEach((p: any) => {
        map[a.id] = (map[a.id] || 0) + Number(p.amount_paid);
      });
    });
    return map;
  }, [assignments]);

  const totalVillagers = assignments.length;
  const paidCount = assignments.filter((a: any) => (paymentMap[a.id] || 0) >= Number(a.amount_due)).length;
  const progressPct = totalVillagers > 0 ? Math.round((paidCount / totalVillagers) * 100) : 0;

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a: any) => {
      const paid = paymentMap[a.id] || 0;
      const due = Number(a.amount_due);
      switch (filter) {
        case 'done': return paid >= due;
        case 'partial': return paid > 0 && paid < due;
        case 'pending': return paid === 0;
        default: return true;
      }
    });
  }, [assignments, paymentMap, filter]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInUp.duration(400)}>
          <Text style={styles.greeting}>Collecting for</Text>
          <Text style={styles.villageName}>GramSeva Village</Text>
          {currentCollector && (
            <View style={styles.collectorInfo}>
              <Avatar name={currentCollector.name} size={36} />
              <Text style={styles.collectorName}>{currentCollector.name}</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <Card glass style={styles.progressCard}>
            <Text style={styles.progressTitle}>Your Progress</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
            <Text style={styles.progressText}>{paidCount}/{totalVillagers} villagers paid</Text>
          </Card>
        </Animated.View>

        <View style={styles.tabsRow}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, filter === t.key && styles.tabActive]}
              onPress={() => setFilter(t.key)}
            >
              <Text style={[styles.tabText, filter === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>My Assignments</Text>
        {filteredAssignments.map((member: any, i: number) => {
          const paid = paymentMap[member.id] || 0;
          const due = Number(member.amount_due);
          const villagerName = member.villagers?.name ?? 'Villager';
          const collectionName = member.collections?.name ?? 'Collection';
          const statusLabel = paid >= due ? 'Done' : paid > 0 ? 'Partial' : 'Pending';
          const statusColor = paid >= due ? colors.secondary : paid > 0 ? colors.warning : colors.textMuted;
          return (
            <Animated.View key={member.id} entering={FadeInUp.delay(i * 50).duration(300)}>
              <TouchableOpacity
                style={styles.assignmentRow}
                onPress={() => navigation.navigate('RecordPayment', { memberId: member.id })}
              >
                <Avatar name={villagerName} size={40} />
                <View style={styles.assignmentInfo}>
                  <Text style={styles.assignmentName}>{villagerName}</Text>
                  <Text style={styles.assignmentAmount}>{formatCurrency(due)} due</Text>
                  {collectionName && <Text style={styles.collectionLabel}>{collectionName}</Text>}
                </View>
                <Badge label={statusLabel} color={statusColor} />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
        {filteredAssignments.length === 0 && (
          <Card glass>
            <Text style={styles.emptyText}>No assignments match this filter.</Text>
          </Card>
        )}
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
  greeting: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textMuted,
    paddingTop: spacing.huge,
  },
  villageName: {
    fontFamily: fonts.poppins.bold,
    fontSize: 26,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  collectorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  collectorName: {
    fontFamily: fonts.poppins.medium,
    fontSize: 15,
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  progressCard: {
    marginBottom: spacing.xxl,
  },
  progressTitle: {
    fontFamily: fonts.poppins.medium,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  tabsRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
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
  sectionTitle: {
    fontFamily: fonts.poppins.semibold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  assignmentInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  assignmentName: {
    fontFamily: fonts.poppins.medium,
    fontSize: 15,
    color: colors.textPrimary,
  },
  assignmentAmount: {
    fontFamily: fonts.jetbrainsMono.regular,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  collectionLabel: {
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
  },
  emptyText: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
});
