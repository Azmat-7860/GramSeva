import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing, glassCard } from '../../constants/spacing';
import { Card } from '../../components/common';
import { CollectionCard } from '../../components/collections';
import { AmbientMesh } from '../../components/three/AmbientMesh';
import { AnimatedCounter } from '../../components/charts';
import { useGetCollectionsQuery, useGetVillagersQuery } from '../../store/api/supabaseApi';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { clearSession } from '../../store/slices/authSlice';
import { formatCurrency } from '../../utils/currency';

interface AdminDashboardScreenProps {
  navigation: any;
}

export function AdminDashboardScreen({ navigation }: AdminDashboardScreenProps) {
  const dispatch = useAppDispatch();
  const { email, villageId, villageName } = useAppSelector((state) => state.auth);

  const { data: collections = [] } = useGetCollectionsQuery(villageId ?? '');
  const { data: villagers = [] } = useGetVillagersQuery(villageId ?? '');

  const totalCollected = 0; // would compute from payments
  const totalPending = 0;

  return (
    <View style={styles.container}>
      <AmbientMesh />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInUp.duration(600)}>
          <View style={styles.header}>
            <View>
              <Text style={styles.villageName}>{villageName ?? 'GramSeva'}</Text>
              <Text style={styles.adminEmail}>{email}</Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={() => dispatch(clearSession())}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(600)}>
          <View style={styles.statsRow}>
            <Card glass style={styles.statCard}>
              <Text style={styles.statLabel}>Collected</Text>
              <AnimatedCounter value={totalCollected} style={styles.statValue} />
            </Card>
            <Card glass style={styles.statCard}>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                {formatCurrency(totalPending)}
              </Text>
            </Card>
            <Card glass style={styles.statCard}>
              <Text style={styles.statLabel}>Collections</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {collections.length}
              </Text>
            </Card>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <Text style={styles.sectionTitle}>Active Collections</Text>
          {collections
            .filter((c) => c.status === 'active')
            .map((collection, index) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                collected={0}
                total={0}
                index={index}
                onPress={() =>
                  navigation.navigate('CollectionDetail', { collectionId: collection.id })
                }
              />
            ))}
          {collections.filter((c) => c.status === 'active').length === 0 && (
            <Card glass>
              <Text style={styles.emptyText}>No active collections. Tap + to create one.</Text>
            </Card>
          )}
        </Animated.View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateCollection')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
    paddingBottom: 100,
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
  adminEmail: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
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
  emptyText: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    fontFamily: fonts.poppins.regular,
    fontSize: 28,
    color: colors.white,
    marginTop: -2,
  },
});
