import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing, borderRadius } from '../../constants/spacing';
import { Button, Input, Avatar } from '../../components/common';
import {
  useCreateCollectionMutation,
  useGetVillagersQuery,
} from '../../store/api/supabaseApi';
import { useAppSelector } from '../../store/store';

export function CreateCollectionScreen({ navigation }: any) {
  const { villageId } = useAppSelector((state) => state.auth);
  const { data: villagers = [] } = useGetVillagersQuery(villageId ?? '');
  const [createCollection, { isLoading }] = useCreateCollectionMutation();

  const [name, setName] = useState('');
  const [type, setType] = useState<'recurring' | 'one_time'>('recurring');
  const [targetAmount, setTargetAmount] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const toggleVillager = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setAmount = useCallback((id: string, val: string) => {
    // allow only numbers
    if (/^\d*$/.test(val)) {
      setAmounts((prev) => ({ ...prev, [id]: val }));
    }
  }, []);

  const isInvalid =
    !name ||
    selectedIds.size === 0 ||
    Array.from(selectedIds).some((id) => !amounts[id]) ||
    !targetAmount;

  const handleCreate = async () => {
    if (!villageId) {
      Toast.show({ type: 'error', text1: 'Village not found' });
      return;
    }

    if (isInvalid) {
      Toast.show({
        type: 'error',
        text1: 'Please fill all required fields',
      });
      return;
    }

    try {
      await createCollection({
        name,
        type,
        village_id: villageId,
        target_amount: parseFloat(targetAmount) || 0,
        members: Array.from(selectedIds).map((vid) => ({
          villager_id: vid,
          collector_id: null,
          amount_due: parseFloat(amounts[vid] || '0'),
        })),
      }).unwrap();

      Toast.show({
        type: 'success',
        text1: `Collection "${name}" created`,
      });

      // Reset state
      setName('');
      setSelectedIds(new Set());
      setAmounts({});

      navigation.goBack();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: err?.message ?? err?.error ?? 'Failed to create collection',
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>New Collection</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Collection Name"
          placeholder="e.g. Monthly Fund"
          value={name}
          onChangeText={setName}
        />

        {/* TYPE */}
        <Text style={styles.label}>Type</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[
              styles.typeBtn,
              type === 'recurring' && styles.typeBtnActive,
            ]}
            onPress={() => setType('recurring')}
          >
            <Text
              style={[
                styles.typeText,
                type === 'recurring' && styles.typeTextActive,
              ]}
            >
              Recurring
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeBtn,
              type === 'one_time' && styles.typeBtnActive,
            ]}
            onPress={() => setType('one_time')}
          >
            <Text
              style={[
                styles.typeText,
                type === 'one_time' && styles.typeTextActive,
              ]}
            >
              One-time
            </Text>
          </TouchableOpacity>
        </View>

        {/* TARGET AMOUNT */}
        <Text style={styles.label}>Target Amount</Text>
        <TextInput
          style={styles.targetInput}
          placeholder="e.g. 50000"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={targetAmount}
          onChangeText={(val) => /^\d*$/.test(val) && setTargetAmount(val)}
        />

        {/* VILLAGERS */}
        <Text style={styles.label}>
          Select Villagers ({selectedIds.size})
        </Text>

        {villagers.length === 0 ? (
          <Text style={{ color: colors.textMuted }}>
            No villagers found
          </Text>
        ) : (
          villagers.map((v, i) => (
            <Animated.View
              key={v.id}
              entering={FadeInUp.delay(i * 50).duration(300)}
            >
              <View
                style={[
                  styles.villagerRow,
                  selectedIds.has(v.id) && styles.villagerRowSelected,
                ]}
              >
                {/* CLICKABLE AREA */}
                <TouchableOpacity
                  style={{ flexDirection: 'row', flex: 1 }}
                  onPress={() => toggleVillager(v.id)}
                >
                  <Avatar name={v.name} size={36} />
                  <View style={styles.villagerInfo}>
                    <Text style={styles.villagerName}>{v.name}</Text>
                    <Text style={styles.villagerPhone}>
                      {v.phone}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* INPUT */}
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
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Button
          title={`Create ${
            type === 'recurring' ? 'Recurring' : 'One-time'
          } Collection`}
          onPress={handleCreate}
          loading={isLoading}
          disabled={isInvalid}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

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

  scroll: { flex: 1 },

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

  typeTextActive: { color: colors.primary },

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

  targetInput: {
    fontFamily: fonts.jetbrainsMono.regular,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
    textAlign: 'center',
    fontWeight: '600',
  },

  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
});
