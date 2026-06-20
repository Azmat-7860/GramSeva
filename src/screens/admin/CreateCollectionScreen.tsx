import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing, borderRadius } from '../../constants/spacing';
import { Button, Input, Avatar } from '../../components/common';
import { useCreateCollectionMutation, useGetVillagersQuery } from '../../store/api/supabaseApi';

export function CreateCollectionScreen({ navigation }: any) {
  const villageId = 'placeholder-village-id';
  const { data: villagers = [] } = useGetVillagersQuery(villageId);
  const [createCollection, { isLoading }] = useCreateCollectionMutation();

  const [name, setName] = useState('');
  const [type, setType] = useState<'recurring' | 'one_time'>('recurring');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const toggleVillager = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const setAmount = (id: string, val: string) => {
    setAmounts((prev) => ({ ...prev, [id]: val }));
  };

  const handleCreate = async () => {
    if (!name || selectedIds.size === 0) return;
    await createCollection({
      name,
      type,
      village_id: villageId,
      members: Array.from(selectedIds).map((vid) => ({
        villager_id: vid,
        collector_id: '',
        amount_due: parseFloat(amounts[vid] || '0'),
      })),
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>New Collection</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Input label="Collection Name" placeholder="e.g. Monthly Fund" value={name} onChangeText={setName} />

        <Text style={styles.label}>Type</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'recurring' && styles.typeBtnActive]}
            onPress={() => setType('recurring')}
          >
            <Text style={[styles.typeText, type === 'recurring' && styles.typeTextActive]}>Recurring</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'one_time' && styles.typeBtnActive]}
            onPress={() => setType('one_time')}
          >
            <Text style={[styles.typeText, type === 'one_time' && styles.typeTextActive]}>One-time</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Select Villagers ({selectedIds.size})</Text>
        {villagers.map((v, i) => (
          <Animated.View key={v.id} entering={FadeInUp.delay(i * 50).duration(300)}>
            <TouchableOpacity
              style={[styles.villagerRow, selectedIds.has(v.id) && styles.villagerRowSelected]}
              onPress={() => toggleVillager(v.id)}
            >
              <Avatar name={v.name} size={36} />
              <View style={styles.villagerInfo}>
                <Text style={styles.villagerName}>{v.name}</Text>
                <Text style={styles.villagerPhone}>{v.phone}</Text>
              </View>
              {selectedIds.has(v.id) && (
                <TextInput
                  style={styles.amountInput}
                  placeholder="Amount"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={amounts[v.id] || ''}
                  onChangeText={(val) => setAmount(v.id, val)}
                />
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={`Create ${type === 'recurring' ? 'Recurring' : 'One-time'} Collection`}
          onPress={handleCreate}
          loading={isLoading}
          disabled={!name || selectedIds.size === 0}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.huge,
    paddingBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.poppins.bold,
    fontSize: 24,
    color: colors.textPrimary,
  },
  cancelText: {
    fontFamily: fonts.poppins.medium,
    fontSize: 14,
    color: colors.textMuted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },
  label: {
    fontFamily: fonts.poppins.medium,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  typeBtnActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  typeText: {
    fontFamily: fonts.poppins.medium,
    fontSize: 14,
    color: colors.textMuted,
  },
  typeTextActive: {
    color: colors.primary,
  },
  villagerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  villagerRowSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary + '30',
  },
  villagerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  villagerName: {
    fontFamily: fonts.poppins.medium,
    fontSize: 15,
    color: colors.textPrimary,
  },
  villagerPhone: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  amountInput: {
    fontFamily: fonts.jetbrainsMono.regular,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: 100,
    textAlign: 'right',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
});
