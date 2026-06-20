import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing } from '../../constants/spacing';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dates';
import { calculateStatus } from '../../utils/status';
import { CollectionMember, Payment } from '../../types';

interface PaymentRowProps {
  name: string;
  amountDue: number;
  totalPaid: number;
  lastPaymentDate?: string;
  isOverdue?: boolean;
  onPress?: () => void;
}

export function PaymentRow({
  name,
  amountDue,
  totalPaid,
  lastPaymentDate,
  isOverdue = false,
  onPress,
}: PaymentRowProps) {
  const status = calculateStatus(amountDue, totalPaid, isOverdue);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Avatar name={name} size={40} />
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.amounts}>
          <Text style={styles.due}>{formatCurrency(amountDue)} due</Text>
          {totalPaid > 0 && (
            <Text style={styles.paid}> · {formatCurrency(totalPaid)} paid</Text>
          )}
        </View>
        {lastPaymentDate && (
          <Text style={styles.date}>Last: {formatDate(lastPaymentDate)}</Text>
        )}
      </View>
      <Badge label={status.label} color={status.color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontFamily: fonts.poppins.medium,
    fontSize: 15,
    color: colors.textPrimary,
  },
  amounts: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  due: {
    fontFamily: fonts.jetbrainsMono.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  paid: {
    fontFamily: fonts.jetbrainsMono.regular,
    fontSize: 13,
    color: colors.secondary,
  },
  date: {
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
