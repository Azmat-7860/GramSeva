import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { borderRadius, spacing } from '../../constants/spacing';

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({
  label,
  color = colors.primary,
  textColor = colors.white,
  size = 'sm',
  style,
}: BadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color + '20',
          borderColor: color,
          paddingHorizontal: size === 'sm' ? spacing.sm : spacing.md,
          paddingVertical: size === 'sm' ? 2 : spacing.xs,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: textColor,
            fontSize: size === 'sm' ? 11 : 13,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: fonts.poppins.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
