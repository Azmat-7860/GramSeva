import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { ProgressRing } from './ProgressRing';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing } from '../../constants/spacing';
import { Collection } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dates';

interface CollectionCardProps {
  collection: Collection;
  collected: number;
  total: number;
  onPress: () => void;
  index?: number;
}

export function CollectionCard({
  collection,
  collected,
  total: _total,
  onPress,
  index = 0,
}: CollectionCardProps) {
  const total = collection.target_amount ?? _total;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card index={index}>
        <View style={styles.row}>
          <ProgressRing
            collected={collected}
            total={total}
            size={80}
            strokeWidth={6}
          />
          <View style={styles.info}>
            <Text style={styles.name}>{collection.name}</Text>
            <Badge
              label={collection.type === 'recurring' ? 'Monthly' : 'One-time'}
              color={colors.secondary}
            />
            <Badge
              label={collection.status}
              color={collection.status === 'active' ? colors.secondary : colors.textMuted}
              style={styles.statusBadge}
            />
            <Text style={styles.date}>{formatDate(collection.created_at)}</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Collected</Text>
            <Text style={styles.statValue}>{formatCurrency(collected)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{formatCurrency(total)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {formatCurrency(Math.max(0, total - collected))}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  name: {
    fontFamily: fonts.poppins.semibold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statusBadge: {
    marginTop: spacing.xs,
  },
  date: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
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
  },
  statValue: {
    fontFamily: fonts.jetbrainsMono.regular,
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: 2,
  },
});
