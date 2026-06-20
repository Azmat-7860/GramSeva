import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing, borderRadius } from '../../constants/spacing';
import { Card, Badge, Avatar } from '../../components/common';
import { useCollectorAuth } from '../../hooks/useCollectorAuth';
import { useGetCollectionMembersQuery } from '../../store/api/supabaseApi';

type FilterType = 'all' | 'pending' | 'partial' | 'done';

export function CollectorDashboardScreen({ navigation }: any) {
  const { currentCollector } = useCollectorAuth();
  const [filter, setFilter] = useState<FilterType>('all');
  const { data: members = [] } = useGetCollectionMembersQuery('');

  const tabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'partial', label: 'Partial' },
    { key: 'done', label: 'Done' },
  ];

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
              <View style={[styles.progressFill, { width: '60%' }]} />
            </View>
            <Text style={styles.progressText}>6/10 villagers paid</Text>
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
        {[1, 2, 3].map((_, i) => (
          <Animated.View key={i} entering={FadeInUp.delay(i * 50).duration(300)}>
            <TouchableOpacity
              style={styles.assignmentRow}
              onPress={() => navigation.navigate('RecordPayment', { memberId: `member-${i}` })}
            >
              <Avatar name={`Villager ${i + 1}`} size={40} />
              <View style={styles.assignmentInfo}>
                <Text style={styles.assignmentName}>Villager {i + 1}</Text>
                <Text style={styles.assignmentAmount}>₹1,000 due</Text>
              </View>
              <Badge label="Pending" color={colors.textMuted} />
            </TouchableOpacity>
          </Animated.View>
        ))}
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
});
