import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing, borderRadius } from '../../constants/spacing';
import { Button, Input, Avatar } from '../../components/common';
import { useCreateCollectionMutation, useGetVillagersQuery } from '../../store/api/supabaseApi';
import Toast from 'react-native-toast-message';
import { useAppSelector } from '../../store/store';

const collectionSchema = z.object({
  name: z.string().min(1, 'Collection name is required'),
  type: z.enum(['recurring', 'one_time']),
  members: z.array(z.object({
    villager_id: z.string(),
    amount_due: z.number().min(1, 'Amount must be greater than 0'),
  })).min(1, 'Select at least one villager'),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

export function CreateCollectionScreen({ navigation }: any) {
  const { villageId } = useAppSelector((state) => state.auth);
  const { data: villagers = [] } = useGetVillagersQuery(villageId ?? '');
  const [createCollection, { isLoading }] = useCreateCollectionMutation();

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: '',
      type: 'recurring',
      members: [],
    },
  });

  const selectedMembers = watch('members');

  const toggleVillager = (id: string) => {
    const exists = selectedMembers.find((m) => m.villager_id === id);
    if (exists) {
      setValue('members', selectedMembers.filter((m) => m.villager_id !== id), { shouldValidate: true });
    } else {
      setValue('members', [...selectedMembers, { villager_id: id, amount_due: 0 }], { shouldValidate: true });
    }
  };

  const setAmount = (id: string, val: string) => {
    const num = parseFloat(val) || 0;
    setValue('members', selectedMembers.map((m) =>
      m.villager_id === id ? { ...m, amount_due: num } : m
    ), { shouldValidate: true });
  };

  const onSubmit = async (data: CollectionFormData) => {
    if (!villageId) return;
    try {
      await createCollection({
        name: data.name,
        type: data.type,
        village_id: villageId,
        members: data.members.map((m) => ({
          villager_id: m.villager_id,
          collector_id: '',
          amount_due: m.amount_due,
        })),
      }).unwrap();
      navigation.goBack();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.message ?? err?.error ?? 'Failed to create collection' });
    }
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
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Collection Name"
              placeholder="e.g. Monthly Fund"
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="type"
          render={({ field: { onChange, value } }) => (
            <>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, value === 'recurring' && styles.typeBtnActive]}
                  onPress={() => onChange('recurring')}
                >
                  <Text style={[styles.typeText, value === 'recurring' && styles.typeTextActive]}>Recurring</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, value === 'one_time' && styles.typeBtnActive]}
                  onPress={() => onChange('one_time')}
                >
                  <Text style={[styles.typeText, value === 'one_time' && styles.typeTextActive]}>One-time</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        />

        <Text style={styles.label}>Select Villagers ({selectedMembers.length})</Text>
        {errors.members && (
          <Text style={styles.errorText}>{errors.members.message}</Text>
        )}
                {villagers.map((v, i) => {
          const selected = selectedMembers.find((m) => m.villager_id === v.id);
          return (
            <Animated.View key={v.id} entering={FadeInUp.delay(i * 50).duration(300)}>
              <TouchableOpacity
                style={[styles.villagerRow, selected && styles.villagerRowSelected]}
                onPress={() => toggleVillager(v.id)}
                activeOpacity={0.7}
              >
                <Avatar name={v.name} size={36} />
                <View style={styles.villagerInfo}>
                  <Text style={styles.villagerName}>{v.name}</Text>
                  <Text style={styles.villagerPhone}>{v.phone}</Text>
                </View>
                {selected && (
                  <View onStartShouldSetResponder={() => true}>
                    <TextInput
                      style={styles.amountInput}
                      placeholder="Amount"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      value={String(selected.amount_due || '')}
                      onChangeText={(val) => setAmount(v.id, val)}
                    />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Create Collection"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
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
  errorText: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
});
