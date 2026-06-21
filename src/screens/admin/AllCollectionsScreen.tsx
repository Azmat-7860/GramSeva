import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing } from '../../constants/spacing';
import { Card, Badge } from '../../components/common';
import { CollectionCard } from '../../components/collections';
import { useGetCollectionsQuery, useGetDashboardStatsQuery } from '../../store/api/supabaseApi';
import { useAppSelector } from '../../store/store';

type FilterType = 'all' | 'active' | 'closed';

interface AllCollectionsScreenProps {
  navigation: any;
}

export function AllCollectionsScreen({ navigation }: AllCollectionsScreenProps) {
  const { villageId } = useAppSelector((state) => state.auth);
  const [filter, setFilter] = useState<FilterType>('all');

  const { data: collections = [] } = useGetCollectionsQuery(villageId ?? '');
  const { data: stats } = useGetDashboardStatsQuery(villageId ?? '', { skip: !villageId });

  const statsMap = useMemo(() => {
    const map: Record<string, { collected: number; total: number }> = {};
    stats?.collectionStats?.forEach((s: any) => { map[s.id] = s; });
    return map;
  }, [stats]);

  const filteredCollections = useMemo(() => {
    switch (filter) {
      case 'active':
        return collections.filter((c) => c.status === 'active');
      case 'closed':
        return collections.filter((c) => c.status === 'closed');
      default:
        return collections;
    }
  }, [collections, filter]);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'closed', label: 'Closed' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInUp.duration(400)}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>All Collections</Text>
            <View style={{ width: 60 }} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <View style={styles.filterRow}>
            {filters.map((f) => (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
              >
                <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <Text style={styles.countText}>
            {filteredCollections.length} collection{filteredCollections.length !== 1 ? 's' : ''}
          </Text>
          {filteredCollections.length === 0 ? (
            <Card glass>
              <Text style={styles.emptyText}>No collections found.</Text>
            </Card>
          ) : (
            filteredCollections.map((collection, index) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                collected={statsMap[collection.id]?.collected ?? 0}
                total={statsMap[collection.id]?.total ?? 0}
                index={index}
                onPress={() =>
                  navigation.navigate('CollectionDetail', { collectionId: collection.id })
                }
              />
            ))
          )}
        </Animated.View>
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
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  backText: {
    fontFamily: fonts.poppins.medium,
    fontSize: 14,
    color: colors.primary,
  },
  title: {
    fontFamily: fonts.poppins.semibold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.textMuted + '40',
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontFamily: fonts.poppins.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  filterTextActive: {
    color: colors.white,
  },
  countText: {
    fontFamily: fonts.poppins.medium,
    fontSize: 14,
    color: colors.textMuted,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
});
