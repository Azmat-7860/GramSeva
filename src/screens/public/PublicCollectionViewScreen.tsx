import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing } from '../../constants/spacing';
import { Card, Button } from '../../components/common';
import { ProgressRing } from '../../components/collections';
import { supabase } from '../../store/supabaseClient';
import { useGetCollectionsQuery } from '../../store/api/supabaseApi';
import { useAppSelector } from '../../store/store';
import { formatCurrency } from '../../utils/currency';
import { useFocusEffect } from '@react-navigation/native';

export function PublicCollectionViewScreen({ navigation }: any) {
  const { villageId, villageName } = useAppSelector((state) => state.auth);
  const { data: collections = [] } = useGetCollectionsQuery(villageId ?? '', { skip: !villageId });

  const activeCollections = collections.filter((c) => c.status === 'active');

  const [aggregates, setAggregates] = React.useState<Record<string, any>>({});

  useFocusEffect(
    React.useCallback(() => {
      if (!villageId) return;
      activeCollections.forEach(async (c) => {
        const { data } = await supabase.functions.invoke('public-aggregate', {
          body: { village_id: villageId, collection_id: c.id },
        });
        if (data) {
          setAggregates((prev) => ({ ...prev, [c.id]: data }));
        }
      });
    }, [villageId, activeCollections.length])
  );

  const villageDisplay = villageName ?? 'GramSeva Village';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInUp.duration(400)}>
          <Text style={styles.villageName}>{villageDisplay}</Text>
          <Text style={styles.subtitle}>Community Fund Collections</Text>
        </Animated.View>

        {activeCollections.length === 0 && (
          <Text style={styles.emptyText}>No active collections to display.</Text>
        )}

        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          {activeCollections.map((c) => {
            const agg = aggregates[c.id];
            const collected = agg?.total_collected ?? 0;
            const total = agg?.total_due ?? 0;
            const members = agg?.member_count ?? 0;

            return (
              <Card glass key={c.id} style={{ marginBottom: spacing.lg }}>
                <View style={styles.collectionHeader}>
                  <View style={styles.collectionInfo}>
                    <Text style={styles.collectionName}>{c.name}</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{c.type === 'recurring' ? 'Monthly' : 'One-time'}</Text>
                    </View>
                  </View>
                  <ProgressRing collected={collected} total={total} size={80} strokeWidth={6} />
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Total Due</Text>
                    <Text style={styles.statValue}>{formatCurrency(total)}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Collected</Text>
                    <Text style={[styles.statValue, { color: colors.secondary }]}>{formatCurrency(collected)}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Members</Text>
                    <Text style={styles.statValue}>{members}</Text>
                  </View>
                </View>
              </Card>
            );
          })}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.checkSection}>
          <Card glass>
            <Text style={styles.checkTitle}>Check Your Payments</Text>
            <Text style={styles.checkText}>
              Enter your phone number to view your personal payment history.
            </Text>
            <Button
              title="Check My Payments"
              onPress={() => navigation.navigate('VillagerHistory')}
              fullWidth
            />
          </Card>
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
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },
  villageName: {
    fontFamily: fonts.poppins.bold,
    fontSize: 28,
    color: colors.textPrimary,
    paddingTop: spacing.huge,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xxl,
  },
  emptyText: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  collectionInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  collectionName: {
    fontFamily: fonts.poppins.semibold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderRadius: 100,
  },
  badgeText: {
    fontFamily: fonts.poppins.medium,
    fontSize: 10,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontFamily: fonts.jetbrainsMono.regular,
    fontSize: 15,
    color: colors.textPrimary,
  },
  checkSection: {
    marginTop: spacing.xl,
  },
  checkTitle: {
    fontFamily: fonts.poppins.semibold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  checkText: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
});
