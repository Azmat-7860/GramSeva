import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing } from '../../constants/spacing';
import { Card, Badge, Button } from '../../components/common';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dates';

export function VillagerPaymentDetailScreen({ route, navigation }: any) {
  const { memberId } = route.params;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Animated.View entering={FadeInUp.duration(400)}>
          <Text style={styles.title}>Villager Name</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Total Due</Text>
              <Text style={styles.balanceValue}>{formatCurrency(1000)}</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Total Paid</Text>
              <Text style={[styles.balanceValue, { color: colors.secondary }]}>{formatCurrency(500)}</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Balance</Text>
              <Text style={[styles.balanceValue, { color: colors.warning }]}>{formatCurrency(500)}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          <Card glass>
            <Text style={styles.emptyText}>No payments recorded yet.</Text>
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
        <Button title="Record Payment" onPress={() => {}} fullWidth />
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
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
});
