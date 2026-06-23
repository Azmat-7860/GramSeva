import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { CollectionCard } from '../../components/collections/CollectionCard';
import { AmbientMesh } from '../../components/three/AmbientMesh';
import { AnimatedCounter } from '../../components/charts/AnimatedCounter';
import { Avatar } from '../../components/common/Avatar';
import { useCollectorAuth } from '../../hooks/useCollectorAuth';
import { useGetCollectorAssignmentsQuery } from '../../store/api/supabaseApi';
import { formatCurrency } from '../../utils/currency';

export function CollectorDashboardScreen({ navigation }: any) {
  const { currentCollector, logout } = useCollectorAuth();

  const { data: assignments = [], isLoading } = useGetCollectorAssignmentsQuery(
    currentCollector?.id ?? '',
    { skip: !currentCollector?.id }
  );

  // Group assignments by collection
  const collections = useMemo(() => {
    const map: Record<string, {
      id: string;
      name: string;
      type: string;
      status: string;
      village_id: string;
      target_amount: number;
      created_at: string;
      members: any[];
    }> = {};

    assignments.forEach((a: any) => {
      const col = a.collections;
      if (!col) return;
      if (!map[col.id]) {
        map[col.id] = {
          id: col.id,
          name: col.name,
          type: col.type ?? 'recurring',
          status: col.status ?? 'active',
          village_id: col.village_id ?? '',
          target_amount: col.target_amount ?? 0,
          created_at: col.created_at ?? '',
          members: [],
        };
      }
      map[col.id].members.push(a);
    });

    return Object.values(map);
  }, [assignments]);

  // Per collection: total collected and total due
  const collectionStats = useMemo(() => {
    const stats: Record<string, { collected: number; total: number }> = {};
    collections.forEach((col) => {
      let collected = 0;
      let total = 0;
      col.members.forEach((m: any) => {
        total += Number(m.amount_due ?? 0);
        (m.payments ?? []).forEach((p: any) => {
          collected += Number(p.amount_paid ?? 0);
        });
      });
      stats[col.id] = { collected, total: col.target_amount > 0 ? col.target_amount : total };
    });
    return stats;
  }, [collections]);

  // Overall totals
  const totalCollected = useMemo(
    () => Object.values(collectionStats).reduce((s, c) => s + c.collected, 0),
    [collectionStats]
  );

  const pendingCollectionCount = useMemo(
    () => Object.values(collectionStats).filter((c) => c.collected < c.total).length,
    [collectionStats]
  );

  const activeCollections = collections.filter((c) => c.status === 'active');
  const closedCollections = collections.filter((c) => c.status === 'closed');

  const villageName = (currentCollector as any)?.villages?.name ?? 'GramSeva Village';

  return (
    <View style={styles.container}>
      <AmbientMesh />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* ── HEADER ── */}
        <Animated.View entering={FadeInUp.duration(600)}>
          <View style={styles.header}>
            <View>
              <Text style={styles.villageName}>{villageName}</Text>
              {currentCollector && (
                <View style={styles.collectorRow}>
                  <Avatar name={currentCollector.name} size={22} />
                  <Text style={styles.collectorName}>{currentCollector.name}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── STATS ROW ── */}
        <Animated.View entering={FadeInUp.delay(100).duration(600)}>
          <View style={styles.statsRow}>
            <Card glass style={styles.statCard}>
              <Text style={styles.statLabel}>Collections</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {collections.length}
              </Text>
            </Card>

            <Card glass style={styles.statCard}>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                {pendingCollectionCount}
              </Text>
            </Card>
          </View>
        </Animated.View>

        {/* ── ACTIVE COLLECTIONS ── */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <Text style={styles.sectionTitle}>
            My Collections <Text style={styles.sectionSub}>[ {formatCurrency(totalCollected)} collected ]</Text>
          </Text>

          {isLoading && (
            <Card glass>
              <Text style={styles.emptyText}>Loading...</Text>
            </Card>
          )}

          {!isLoading && activeCollections.length === 0 && (
            <Card glass>
              <Text style={styles.emptyText}>
                No active collections assigned to you yet.
              </Text>
            </Card>
          )}

          {!isLoading && activeCollections.map((collection, index) => (
            <CollectionCard
              key={collection.id}
              collection={collection as any}
              collected={collectionStats[collection.id]?.collected ?? 0}
              total={collectionStats[collection.id]?.total ?? 0}
              index={index}
              onPress={() =>
                navigation.navigate('CollectorCollectionDetail', {
                  collectionId: collection.id,
                  collectionName: collection.name,
                })
              }
            />
          ))}
        </Animated.View>

        {/* ── CLOSED COLLECTIONS ── */}
        {closedCollections.length > 0 && (
          <Animated.View entering={FadeInUp.delay(300).duration(600)}>
            <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>
              Closed Collections
            </Text>
            {closedCollections.map((collection, index) => (
              <CollectionCard
                key={collection.id}
                collection={collection as any}
                collected={collectionStats[collection.id]?.collected ?? 0}
                total={collectionStats[collection.id]?.total ?? 0}
                index={index}
                onPress={() =>
                  navigation.navigate('CollectorCollectionDetail', {
                    collectionId: collection.id,
                    collectionName: collection.name,
                  })
                }
              />
            ))}
          </Animated.View>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.huge,
    paddingBottom: spacing.xl,
  },
  villageName: {
    fontFamily: fonts.poppins.bold,
    fontSize: 24,
    color: colors.textPrimary,
  },
  collectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: spacing.sm,
  },
  collectorName: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  logoutBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger + '40',
  },
  logoutText: {
    fontFamily: fonts.poppins.medium,
    fontSize: 12,
    color: colors.danger,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.xl,
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
    fontSize: 16,
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontFamily: fonts.poppins.semibold,
    fontSize: 18,
    color: colors.textPrimary,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionSub: {
    fontFamily: fonts.inter.regular,
    fontSize: 16,
    color: colors.secondary,
    fontWeight: '500',
  },
  emptyText: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
});
