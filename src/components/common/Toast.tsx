import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ToastMessage, { BaseToastProps } from 'react-native-toast-message';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing, borderRadius } from '../../constants/spacing';

const toastConfig = {
  success: (props: BaseToastProps) => (
    <View style={[styles.base, { borderLeftColor: colors.secondary }]}>
      <Text style={styles.title}>Success</Text>
      <Text style={styles.message}>{props.text1}</Text>
    </View>
  ),
  error: (props: BaseToastProps) => (
    <View style={[styles.base, { borderLeftColor: colors.danger }]}>
      <Text style={styles.title}>Error</Text>
      <Text style={styles.message}>{props.text1}</Text>
    </View>
  ),
  info: (props: BaseToastProps) => (
    <View style={[styles.base, { borderLeftColor: colors.primary }]}>
      <Text style={styles.title}>Info</Text>
      <Text style={styles.message}>{props.text1}</Text>
    </View>
  ),
  warning: (props: BaseToastProps) => (
    <View style={[styles.base, { borderLeftColor: colors.warning }]}>
      <Text style={styles.title}>Warning</Text>
      <Text style={styles.message}>{props.text1}</Text>
    </View>
  ),
};

const styles = StyleSheet.create({
  base: {
    width: '90%',
    backgroundColor: colors.background,
    borderLeftWidth: 4,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontFamily: fonts.poppins.semibold,
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  message: {
    fontFamily: fonts.inter.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
});

export function Toast() {
  return <ToastMessage config={toastConfig} />;
}

export { default as ToastMessage } from 'react-native-toast-message';
