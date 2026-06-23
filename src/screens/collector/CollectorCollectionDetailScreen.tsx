import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing, borderRadius } from '../../constants/spacing';
import { Badge, Card } from '../../components/common';
import { ProgressRing, PaymentRow } from '../../components/collections';
import { AnimatedCounter } from '../../components/charts/AnimatedCounter';
import {
  useGetCollectionQuery,
  useGetCollectionMembersWithVillagersQuery,
  useGetPaymentsByCollectionQuery,
} from '../../store/api/supabaseApi';
import { formatCurrency } from '../../utils/currency';
import { useAppSelector } from '../../store/store';

type FilterType = 'all' | 'paid' | 'partial' | 'pending';

export function CollectorCollectionDetailScreen({ route, navigation }: any) {
  const { collectionId, collectionName } = route.params;
  const currentCollector = useAppSelector((s) => s.collector.currentCollector);

  const { data: collection } = useGetCollectionQuery(collectionId);
  const { data: members = [] } =
    useGetCollectionMembersWithVillagersQuery(collectionId);
  const { data: payments = [] } =
    useGetPaymentsByCollectionQuery(collectionId);

  const [filter, setFilter] = useState<FilterType>('all');

  const totalDue = useMemo(
    () => collection?.target_amount ?? members.reduce((sum, m: any) => sum + Number(m.amount_due), 0),
    [collection?.target_amount, members]
  );

  const totalPaid = useMemo(
    () => payments.reduce((sum, p) => sum + Number(p.amount_paid), 0),
    [payments]
  );

  const myCollected = useMemo(
    () => payments
      .filter((p: any) => p.recorded_by === currentCollector?.id)
      .reduce((sum, p) => sum + Number(p.amount_paid), 0),
    [payments, currentCollector?.id]
  );

  const paymentMap = useMemo(() => {
    const map: Record<string, number> = {};
    payments.forEach((p) => {
      map[p.collection_member_id] =
        (map[p.collection_member_id] || 0) + Number(p.amount_paid);
    });
    return map;
  }, [payments]);

  const lastPaymentInfo = useMemo(() => {
    const info: Record<string, { date: string; collectorName: string | null }> = {};
    payments.forEach((p: any) => {
      const existing = info[p.collection_member_id];
      if (!existing || p.paid_at > existing.date) {
        info[p.collection_member_id] = {
          date: p.paid_at,
          collectorName: p.collectors?.name ?? null,
        };
      }
    });
    return info;
  }, [payments]);

  const filteredMembers = useMemo(() => {
    return members.filter((m: any) => {
      const paid = paymentMap[m.id] || 0;
      const due = Number(m.amount_due);
      switch (filter) {
        case 'paid':
          return paid >= due;
        case 'partial':
          return paid > 0 && paid < due;
        case 'pending':
          return paid === 0;
        default:
          return true;
      }
    });
  }, [members, paymentMap, filter]);

  const tabs: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: members.length },
    { key: 'paid', label: 'Paid', count: members.filter((m: any) => (paymentMap[m.id] || 0) >= Number(m.amount_due)).length },
    { key: 'partial', label: 'Partial', count: members.filter((m: any) => {
      const paid = paymentMap[m.id] || 0;
      return paid > 0 && paid < Number(m.amount_due);
    }).length },
    { key: 'pending', label: 'Pending', count: members.filter((m: any) => (paymentMap[m.id] || 0) === 0).length },
  ];

  const handleShare = async () => {
    const today = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
    const name = collectionName ?? collection?.name ?? 'Collection';

    const lines = members.map((m: any) => {
      const paid = paymentMap[m.id] || 0;
      const due = Number(m.amount_due);
      const status = paid >= due ? '✅ Paid' : paid > 0 ? '🟡 Partial' : '❌ Not paid';
      return `${m.villagers?.name ?? 'Unknown'} — ${status}`;
    });
    // const lines = members.map((m: any) => {
    //   const paid = paymentMap[m.id] || 0;
    //   const due = Number(m.amount_due);
    //   const status = paid >= due ? '✅ Paid' : paid > 0 ? '🟡 Partial' : '❌ Not paid';
    //   return `${m.villagers?.name ?? 'Unknown'} — ${status} (${formatCurrency(paid)}/${formatCurrency(due)})`;
    // });

    const summary = [
      `📅 ${today}`,
      `📍 ${name}`,
      '',
      ...lines,
      '',
      `───`,
      `💰 Total Collected: ${formatCurrency(totalPaid)}`,
      `📊 Total Pending: ${formatCurrency(Math.max(0, totalDue - totalPaid))}`,
    ].join('\n');

    try {
      await Share.share({ message: summary });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HEADER */}
        <Animated.View entering={FadeInUp.duration(400)}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>

            <View style={styles.headerActions}>
            </View>
          </View>

          <Text style={styles.title}>
            {collectionName ?? collection?.name ?? 'Collection'}
          </Text>

          <View style={styles.badgesRow}>
            {collection?.type && (
              <Badge
                label={collection.type === 'recurring' ? 'Recurring' : 'One-time'}
                color={colors.primary}
              />
            )}
            <Badge
              label={collection?.status ?? 'active'}
              color={
                (collection?.status ?? 'active') === 'active'
                  ? colors.secondary
                  : colors.textMuted
              }
            />
          </View>
        </Animated.View>

        {/* PROGRESS RING */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <View style={styles.ringContainer}>
            <ProgressRing
              collected={totalPaid}
              total={totalDue}
              size={180}
              strokeWidth={12}
            />
          </View>
        </Animated.View>

        {/* STATS ROW */}
        <Animated.View entering={FadeInUp.delay(150).duration(400)}>
          <View style={styles.statsRow}>
            <Card glass style={styles.statCard}>
              <Text style={styles.statLabel}>Expected</Text>
              <Text style={styles.statValue}>{formatCurrency(totalDue)}</Text>
            </Card>

            <Card glass style={styles.statCard}>
              <Text style={styles.statLabel}>Collected</Text>
              <AnimatedCounter value={totalPaid} style={{ ...styles.statValue, color: colors.secondary }} />
            </Card>

            <Card glass style={styles.statCard}>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                {formatCurrency(Math.max(0, totalDue - totalPaid))}
              </Text>
            </Card>
          </View>
        </Animated.View>

        {/* FILTER TABS */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <View style={styles.tabsRow}>
            {tabs.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.tab,
                  filter === t.key && styles.tabActive,
                ]}
                onPress={() => setFilter(t.key)}
              >
                <Text
                  style={[
                    styles.tabText,
                    filter === t.key && styles.tabTextActive,
                  ]}
                >
                  {t.label}
                </Text>
                <View style={[
                  styles.tabCount,
                  filter === t.key && styles.tabCountActive,
                ]}>
                  <Text style={[
                    styles.tabCountText,
                    filter === t.key && styles.tabCountTextActive,
                  ]}>
                    {t.count}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* SECTION HEADER */}
        <Animated.View entering={FadeInUp.delay(250).duration(400)}>
          <Text style={styles.sectionTitle}>
            {filter === 'all' ? 'All Villagers' : `${tabs.find(t => t.key === filter)?.label ?? ''} Villagers`}
            {filteredMembers.length > 0 && (
              <Text style={styles.sectionCount}> · {filteredMembers.length}</Text>
            )}
          </Text>
        </Animated.View>

        {/* MEMBERS LIST */}
        {filteredMembers.length === 0 ? (
          <Animated.View entering={FadeInUp.delay(300).duration(400)}>
            <Card glass>
              <Text style={styles.emptyText}>
                No {filter === 'all' ? '' : filter} villagers found.
              </Text>
            </Card>
          </Animated.View>
        ) : (
          filteredMembers.map((member: any, i: number) => {
            const paid = paymentMap[member.id] || 0;
            const lastInfo = lastPaymentInfo[member.id];

            return (
              <Animated.View
                key={member.id}
                entering={FadeInUp.delay(300 + i * 50).duration(300)}
              >
                <PaymentRow
                  name={member.villagers?.name ?? 'Unknown'}
                  amountDue={Number(member.amount_due)}
                  totalPaid={paid}
                  lastPaymentDate={lastInfo?.date}
                  collectorName={lastInfo?.collectorName ?? undefined}
                  onPress={() =>
                    navigation.navigate('RecordPayment', {
                      memberId: member.id,
                    })
                  }
                />
              </Animated.View>
            );
          })
        )}

        {/* BOTTOM SPACING */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* TOTALS FOOTER */}
      {members.length > 0 && (
        <Animated.View entering={FadeInUp.duration(400)}>
          <View style={styles.footer}>
            <View style={styles.footerStat}>
              <Text style={styles.footerLabel}>Villagers</Text>
              <Text style={styles.footerValue}>
                {Object.keys(paymentMap).filter(
                  (id) => (paymentMap[id] || 0) >= Number(members.find((m: any) => m.id === id)?.amount_due ?? 0)
                ).length}
                <Text style={styles.footerMuted}>/{members.length}</Text>
              </Text>
            </View>
            <View style={styles.footerDivider} />
            <View style={styles.footerStat}>
              <Text style={styles.footerLabel}>My Collection</Text>
              <Text style={[styles.footerValue, { color: colors.secondary }]}>
                {formatCurrency(myCollected)}
              </Text>
            </View>
            <View style={styles.footerDivider} />
            <TouchableOpacity onPress={handleShare} style={styles.footerShareBtn} activeOpacity={0.6}>
              <MaterialCommunityIcons name="share-variant" size={18} color={colors.primary} />
              <Text style={styles.footerShareText}>Share</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  title: {
    fontFamily: fonts.poppins.bold,
    fontSize: 28,
    color: colors.textPrimary,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },

  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },

  ringContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },

  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },

  statLabel: {
    fontFamily: fonts.inter.regular,
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },

  statValue: {
    fontFamily: fonts.jetbrainsMono.medium,
    fontSize: 15,
    color: colors.textPrimary,
  },

  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },

  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: spacing.xs,
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

  tabCount: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },

  tabCountActive: {
    backgroundColor: colors.primary + '30',
  },

  tabCountText: {
    fontFamily: fonts.jetbrainsMono.regular,
    fontSize: 10,
    color: colors.textMuted,
  },

  tabCountTextActive: {
    color: colors.primary,
  },

  sectionTitle: {
    fontFamily: fonts.poppins.semibold,
    fontSize: 16,
    color: colors.textPrimary,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },

  sectionCount: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textMuted,
  },

  emptyText: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },

  bottomSpacer: {
    height: spacing.huge,
  },

  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: colors.background,
  },

  footerStat: {
    flex: 1,
    alignItems: 'center',
  },

  footerLabel: {
    fontFamily: fonts.inter.regular,
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },

  footerValue: {
    fontFamily: fonts.jetbrainsMono.medium,
    fontSize: 14,
    color: colors.textPrimary,
  },

  footerMuted: {
    color: colors.textMuted,
    fontSize: 12,
  },

  footerDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: spacing.xs,
  },

  footerShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },

  footerShareText: {
    fontFamily: fonts.poppins.medium,
    fontSize: 13,
    color: colors.primary,
  },
});
