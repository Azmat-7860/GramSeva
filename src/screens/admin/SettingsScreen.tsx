import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing } from '../../constants/spacing';
import { Card, Input, Button } from '../../components/common';

export function SettingsScreen({ navigation }: any) {
  const [villageName, setVillageName] = useState('GramSeva Village');
  const [dailyCap, setDailyCap] = useState('50');
  const adminEmail = 'admin@village.com';

  const handleSave = () => {
    // would persist to Supabase
  };

  const handleDeleteVillage = () => {
    Alert.alert(
      'Delete Village',
      'This action cannot be undone. All data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Settings</Text>

        <Animated.View entering={FadeInUp.duration(300)}>
          <Text style={styles.sectionTitle}>General</Text>
          <Card glass>
            <Input label="Village Name" value={villageName} onChangeText={setVillageName} />
            <Input label="Admin Email" value={adminEmail} editable={false} />
            <Input
              label="Daily SMS Cap"
              value={dailyCap}
              onChangeText={setDailyCap}
              keyboardType="number-pad"
            />
            <Button title="Save Changes" onPress={handleSave} fullWidth />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(300)}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          <Card glass>
            <Text style={styles.mutedText}>Reminder time: 9:00 AM daily</Text>
            <Text style={styles.mutedText}>SMS reminders for pending payments</Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(300)}>
          <Text style={[styles.sectionTitle, { color: colors.danger }]}>Danger Zone</Text>
          <Card glass>
            <Text style={styles.dangerText}>
              Deleting your village will remove all collections, villagers, and payment records.
            </Text>
            <Button title="Delete Village" onPress={handleDeleteVillage} variant="danger" fullWidth />
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
  title: {
    fontFamily: fonts.poppins.bold,
    fontSize: 24,
    color: colors.textPrimary,
    paddingTop: spacing.huge,
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontFamily: fonts.poppins.semibold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  mutedText: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  dangerText: {
    fontFamily: fonts.inter.regular,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
});
