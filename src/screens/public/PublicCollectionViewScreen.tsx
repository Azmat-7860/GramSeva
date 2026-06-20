import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing } from '../../constants/spacing';
import { Card, Button, Badge } from '../../components/common';
import { ProgressRing } from '../../components/collections';

export function PublicCollectionViewScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInUp.duration(400)}>
          <Text style={styles.villageName}>GramSeva Village</Text>
          <Text style={styles.subtitle}>Community Fund Collections</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <Card glass>
            <View style={styles.collectionHeader}>
              <View style={styles.collectionInfo}>
                <Text style={styles.collectionName}>Monthly Fund</Text>
                <Badge label="Active" color={colors.secondary} />
              </View>
              <ProgressRing collected={15000} total={50000} size={80} strokeWidth={6} />
            </View>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Total Due</Text>
                <Text style={styles.statValue}>₹50,000</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Collected</Text>
                <Text style={[styles.statValue, { color: colors.secondary }]}>₹15,000</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Members</Text>
                <Text style={styles.statValue}>25</Text>
              </View>
            </View>
          </Card>

          <Card glass>
            <View style={styles.collectionHeader}>
              <View style={styles.collectionInfo}>
                <Text style={styles.collectionName}>School Fund</Text>
                <Badge label="Active" color={colors.secondary} />
              </View>
              <ProgressRing collected={8000} total={20000} size={80} strokeWidth={6} />
            </View>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Total Due</Text>
                <Text style={styles.statValue}>₹20,000</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Collected</Text>
                <Text style={[styles.statValue, { color: colors.secondary }]}>₹8,000</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Members</Text>
                <Text style={styles.statValue}>15</Text>
              </View>
            </View>
          </Card>
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
